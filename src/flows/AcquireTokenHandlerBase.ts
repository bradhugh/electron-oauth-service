import { AdalErrorCode } from "../AdalErrorCode";
import { AdalServiceError } from "../AdalServiceError";
import { AuthenticationResult } from "../AuthenticationResult";
import { AuthenticationResultEx } from "../AuthenticationResultEx";
import { AdalErrorMessage } from "../Constants";
import { Authenticator, AuthorityType } from "../instance/Authenticator";
import { InstanceDiscovery } from "../instance/InstanceDiscovery";
import { ICacheQueryData } from "../internal/cache/CacheQueryData";
import { TokenSubjectType } from "../internal/cache/TokenCacheKey";
import { CallState } from "../internal/CallState";
import { ClientKey } from "../internal/clientcreds/ClientKey";
import { AdalIdHelper } from "../internal/helpers/AdalIdHelper";
import { AdalHttpClient } from "../internal/http/AdalHttpClient";
import { OAuthGrantType, OAuthParameter, OAuthValue } from "../internal/oauth2/OAuthConstants";
import { TokenResponse } from "../internal/oauth2/TokenResponse";
import { PlatformInformation } from "../internal/platform/PlatformInformation";
import { IRequestData } from "../internal/RequestData";
import { DictionaryRequestParameters, IRequestParameters } from "../internal/RequestParameters";
import { TokenCache } from "../TokenCache";
import { TokenCacheNotificationArgs } from "../TokenCacheNotificationArgs";
import { UserIdentifierType } from "../UserIdentifier";
import { Utils } from "../Utils";
import { BrokerParameter } from "./BrokerParameter";

export abstract class AcquireTokenHandlerBase {

    public static createCallState(correlationId: string): CallState {
        correlationId = (correlationId !== Utils.guidEmpty) ? correlationId : Utils.newGuid();
        return new CallState(correlationId);
    }

    protected static nullResource: string = "null_resource_as_optional";

    public callState: CallState;

    protected supportADFS: boolean;
    protected authenticator: Authenticator;
    protected resource: string;
    protected clientKey: ClientKey;
    protected resultEx: AuthenticationResultEx;
    protected tokenSubjectType: TokenSubjectType;
    protected uniqueId: string;
    protected displayableId: string;
    protected loadFromCache: boolean = false;
    protected storeToCache: boolean = false;
    protected platformInformation = new PlatformInformation();
    protected brokerParameters: Map<string, string> = null;
    protected userIdentifierType: UserIdentifierType;

    private tokenCache: TokenCache;
    private cacheQueryData: ICacheQueryData = {
        assertionHash: null,
        authority: null,
        clientId: null,
        displayableId: null,
        extendedLifeTimeEnabled: false,
        resource: null,
        subjectType: TokenSubjectType.User,
        uniqueId: null,
    };

    private client: AdalHttpClient = null;

    protected constructor(requestData: IRequestData) {
        this.authenticator = requestData.authenticator;
        this.callState = AcquireTokenHandlerBase.createCallState(requestData.correlationId !== Utils.guidEmpty
            ? requestData.correlationId
            : this.authenticator.correlationId);
        this.tokenCache = requestData.tokenCache;

        if (!requestData.resource) {
            throw new Error("requestData.resource must be set");
        }

        this.resource = requestData.resource !== AcquireTokenHandlerBase.nullResource ? requestData.resource : null;
        this.clientKey = requestData.clientKey;
        this.tokenSubjectType = requestData.subjectType;

        this.loadFromCache = !!this.tokenCache;
        this.storeToCache = !!this.tokenCache;
        this.supportADFS = false;

        this.brokerParameters = new Map<string, string>();
        this.brokerParameters.set(BrokerParameter.authority, requestData.authenticator.authority);
        this.brokerParameters.set(BrokerParameter.resource, requestData.resource);
        this.brokerParameters.set(BrokerParameter.clientId, requestData.clientKey.clientId);
        this.brokerParameters.set(BrokerParameter.correlationId, this.callState.correlationId);
        this.brokerParameters.set(BrokerParameter.clientVersion, AdalIdHelper.getClientVersion());

        this.resultEx = null;

        this.cacheQueryData.extendedLifeTimeEnabled = requestData.extendedLifeTimeEnabled;

        let msg = `ADAL ${this.platformInformation.getProductName()} ` +
            `with assembly version '${AdalIdHelper.getAdalVersion()}', ` +
            `file version '${AdalIdHelper.getAssemblyFileVersion()}' and ` +
            `informational version '${AdalIdHelper.getAssemblyInformationalVersion()}' is running...`;

        this.callState.logger.info(msg);

        msg = "=== Token Acquisition started: \n\t" +
            `Authentication Target: ${TokenSubjectType[requestData.subjectType]}\n\t`;

        if (InstanceDiscovery.isWhitelisted(requestData.authenticator.getAuthorityHost())) {
            msg += `, Authority Host: ${requestData.authenticator.getAuthorityHost()}`;
        }
        this.callState.logger.info(msg);

        const piiMsg = `=== Token Acquisition started:\n\t` +
            `Authority: ${requestData.authenticator.authority}\n\t` +
            `Resource: ${requestData.resource}\n\t` +
            `ClientId: ${requestData.clientKey.clientId}\n\t` +
            `CacheType: ? ${this.tokenCache ? ` (${this.tokenCache.count} items)` : "null" }\n\t` +
            `Authentication Target: ${TokenSubjectType[requestData.subjectType]}\n\t`;
        this.callState.logger.infoPii(piiMsg);
    }

    public async runAsync(): Promise<AuthenticationResult> {
        let notifiedBeforeAccessCache = false;
        let extendedLifetimeResultEx: AuthenticationResultEx = null;

        try {
            this.callState.logger.info("preRunAsync");
            await this.preRunAsync();

            this.callState.logger.info(`Load from cache? ${this.loadFromCache}`);
            if (this.loadFromCache) {
                this.callState.logger.verbose("Loading from cache.");

                this.cacheQueryData.authority = this.authenticator.authority;
                this.cacheQueryData.resource = this.resource;
                this.cacheQueryData.clientId = this.clientKey.clientId;
                this.cacheQueryData.subjectType = this.tokenSubjectType;
                this.cacheQueryData.uniqueId = this.uniqueId;
                this.cacheQueryData.displayableId = this.displayableId;

                this.notifyBeforeAccessCache();
                notifiedBeforeAccessCache = true;
                this.resultEx = await this.tokenCache.loadFromCacheAsync(this.cacheQueryData, this.callState);
                extendedLifetimeResultEx = this.resultEx;

                if (this.resultEx && this.resultEx.result &&
                    ((!this.resultEx.result.accessToken && !this.resultEx.refreshToken) ||
                    (this.resultEx.result.extendedLifeTimeToken && this.resultEx.refreshToken))) {

                    this.resultEx = await this.refreshAccessTokenAsync(this.resultEx);
                    if (this.resultEx && !this.resultEx.error) {
                        notifiedBeforeAccessCache = await this.storeResultExToCacheAsync(notifiedBeforeAccessCache);
                    }
                }
            }

            this.callState.logger.info(
                `After cache and refresh: ${this.resultEx ? JSON.stringify(this.resultEx) : "null"}`);

            if (!this.resultEx || this.resultEx.error) {
                this.callState.logger.info("preTokenRequestAsync");
                await this.preTokenRequestAsync();

                this.callState.logger.info("sendTokenRequestAsync");
                await this.sendTokenRequestAsync();

                if (this.resultEx && this.resultEx.error) {
                    throw this.resultEx.error;
                }

                await this.postTokenRequestAsync(this.resultEx);
                notifiedBeforeAccessCache = await this.storeResultExToCacheAsync(notifiedBeforeAccessCache);
            }

            await this.postRunAsync(this.resultEx.result);
            return this.resultEx.result;
        } catch (error) {
            this.callState.logger.errorExPii(error);
            if (this.client != null && this.client.resiliency && extendedLifetimeResultEx != null) {
                const msg = "Refreshing AT failed either due to one of these :- Internal Server Error," +
                            "Gateway Timeout and Service Unavailable. " +
                            "Hence returning back stale AT";
                this.callState.logger.info(msg);

                return extendedLifetimeResultEx.result;
            }
        } finally {
            if (notifiedBeforeAccessCache) {
                this.notifyAfterAccessCache();
            }
        }
    }

    protected abstract addAditionalRequestParameters(requestParameters: DictionaryRequestParameters): void;

    protected preTokenRequestAsync(): Promise<void> {
        return Promise.resolve();
    }

    protected async updateAuthorityAsync(updatedAuthority: string): Promise<void> {
        if (this.authenticator.authority !== updatedAuthority) {
            await this.authenticator.updateAuthorityAsync(updatedAuthority, this.callState);
            this.validateAuthorityType();
        }
    }

    protected async postTokenRequestAsync(resultEx: AuthenticationResultEx): Promise<void> {
        // if broker returned Authority update Authentiator
        if (resultEx.result.authority) {
            await this.updateAuthorityAsync(resultEx.result.authority);
        }

        this.authenticator.updateTenantId(resultEx.result.tenantId);

        resultEx.result.authority = this.authenticator.authority;
    }

    protected postRunAsync(result: AuthenticationResult): Promise<void> {
        this.logReturnedToken(result);

        return Promise.resolve();
    }

    protected async preRunAsync(): Promise<void> {
        await this.authenticator.updateFromTemplateAsync(this.callState);
        this.validateAuthorityType();
    }

    protected validateAuthorityType(): void {
        if (!this.supportADFS && this.authenticator.authorityType === AuthorityType.ADFS) {
            throw new Error(`Invalid Authority Type Template ${this.authenticator.authority}`);
        }
    }

    protected async sendTokenRequestAsync(): Promise<AuthenticationResultEx> {
        const requestParameters = new DictionaryRequestParameters(this.resource, this.clientKey);
        this.addAditionalRequestParameters(requestParameters);
        return await this.sendHttpMessageAsync(requestParameters);
    }

    protected async sendTokenRequestByRefreshTokenAsync(refreshToken: string): Promise<AuthenticationResultEx> {
        const requestParameters = new DictionaryRequestParameters(this.resource, this.clientKey);
        requestParameters.set(OAuthParameter.grantType, OAuthGrantType.refreshToken);
        requestParameters.set(OAuthParameter.refreshToken, refreshToken);
        requestParameters.set(OAuthParameter.scope, OAuthValue.scopeOpenId);

        const result: AuthenticationResultEx = await this.sendHttpMessageAsync(requestParameters);

        if (result.refreshToken == null) {
            result.refreshToken = refreshToken;

            const msg = "Refresh token was missing from the token refresh response, " +
                "so the refresh token in the request is returned instead";
            this.callState.logger.verbose(msg);
        }

        return result;
    }

    private logReturnedToken(result: AuthenticationResult): void {
        if (result.accessToken) {
            // TODO: for now, just log the AT CryptographyHelper.CreateSha256Hash(result.AccessToken);
            const accessTokenHash = result.accessToken;

            // tslint:disable-next-line: max-line-length
            const msg = `=== Token Acquisition finished successfully. An access token was returned: Expiration Time: ${result.expiresOn}`;
            this.callState.logger.info(msg);

            const userId = result.userInfo != null ? result.userInfo.uniqueId : "null";
            const piiMsg = msg + `Access Token Hash: ${accessTokenHash}\n\t User id: ${userId}`;
            this.callState.logger.infoPii(piiMsg);
        }
    }

    private async sendHttpMessageAsync(requestParameters: IRequestParameters): Promise<AuthenticationResultEx> {
        this.client = new AdalHttpClient(this.authenticator.tokenUri, this.callState);
        this.client.client.bodyParameters = requestParameters;

        const tokenResponse: TokenResponse = await this.client.getResponseAsync<TokenResponse>();
        return tokenResponse.getResult();
    }

    private async storeResultExToCacheAsync(notifiedBeforeAccessCache: boolean): Promise<boolean> {
        if (this.storeToCache) {
            if (!notifiedBeforeAccessCache) {
                this.notifyBeforeAccessCache();
                notifiedBeforeAccessCache = true;
            }

            await this.tokenCache.storeToCacheAsync(this.resultEx, this.authenticator.authority, this.resource,
                this.clientKey.clientId, this.tokenSubjectType, this.callState);
        }

        return notifiedBeforeAccessCache;
    }

    private async refreshAccessTokenAsync(result: AuthenticationResultEx): Promise<AuthenticationResultEx> {
        let newResultEx: AuthenticationResultEx = null;

        if (this.resource) {
            const msg = "Refreshing access token...";
            this.callState.logger.verbose(msg);

            try {
                newResultEx = await this.sendTokenRequestByRefreshTokenAsync(result.refreshToken);
                this.authenticator.updateTenantId(result.result.tenantId);

                newResultEx.result.authority = this.authenticator.authority;

                if (!newResultEx.result.idToken) {
                    // If Id token is not returned by token endpoint when refresh token is redeemed,
                    // we should copy tenant and user information from the cached token.
                    newResultEx.result.updateTenantAndUserInfo(result.result.tenantId, result.result.idToken,
                        result.result.userInfo);
                }
            } catch (error) {
                if (!(error instanceof AdalServiceError)) {
                    throw error;
                }

                const serviceError: AdalServiceError = error as AdalServiceError;
                if (serviceError && serviceError.errorCode === "invalid_request") {
                    throw new AdalServiceError(
                        AdalErrorCode.failedToRefreshToken,
                        AdalErrorMessage.failedToRefreshToken + ". " + serviceError.message,
                        serviceError.serviceErrorCodes,
                        serviceError);
                }

                newResultEx = new AuthenticationResultEx();
                newResultEx.error = error;
            }
        }

        return newResultEx;
    }

    private notifyBeforeAccessCache(): void {
        const args = new TokenCacheNotificationArgs();
        args.tokenCache = this.tokenCache;
        args.resource = this.resource;
        args.clientId = this.clientKey.clientId;
        args.uniqueId = this.uniqueId;
        args.displayableId = this.displayableId;

        this.tokenCache.onBeforeAccess(args);
    }

    private notifyAfterAccessCache(): void {
        const args = new TokenCacheNotificationArgs();
        args.tokenCache = this.tokenCache;
        args.resource = this.resource;
        args.clientId = this.clientKey.clientId;
        args.uniqueId = this.uniqueId;
        args.displayableId = this.displayableId;

        this.tokenCache.onAfterAccess(args);
    }
}
