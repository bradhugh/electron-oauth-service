import { AdalError } from "../../AdalError";
import { AdalErrorCode } from "../../AdalErrorCode";
import { AdalServiceError } from "../../AdalServiceError";
import { AuthenticationResultEx } from "../../AuthenticationResultEx";
import { AdalErrorMessage } from "../../Constants";
import { AcquireTokenHandlerBase } from "../../flows/AcquireTokenHandlerBase";
import { BrokerParameter } from "../../flows/BrokerParameter";
import { EncodingHelper } from "../../helpers/EncodingHelper";
import { UserIdentifier, UserIdentifierType } from "../../UserIdentifier";
import { Utils } from "../../Utils";
import { AuthorizationResult, AuthorizationStatus } from "../AuthorizationResult";
import { AdalIdHelper } from "../helpers/AdalIdHelper";
import { OAuthError, OAuthGrantType, OAuthParameter, OAuthResponseType } from "../oauth2/OAuthConstants";
import { IPlatformParameters } from "../platform/IPlatformParameters";
import { IWebUI } from "../platform/IWebUI";
import { IRequestData } from "../RequestData";
import { DictionaryRequestParameters, IRequestParameters } from "../RequestParameters";

export class AcquireTokenInteractiveHandler extends AcquireTokenHandlerBase {

    private static replaceHost(original: string, newHost: string): string {
        const ub = new URL(original);
        ub.host = newHost;
        return ub.href;
    }

    public authorizationResult: AuthorizationResult;

    private redirectUri: URL;

    private redirectUriRequestParameter: string;

    private authorizationParameters: IPlatformParameters;

    private extraQueryParameters: string;

    private webUi: IWebUI;

    private userId: UserIdentifier;

    private claims: string;

    constructor(
        requestData: IRequestData,
        redirectUri: URL,
        parameters: IPlatformParameters,
        userId: UserIdentifier,
        extraQueryParameters: string,
        webUI: IWebUI,
        claims: string) {

        super(requestData);

        this.redirectUri = this.platformInformation.validateRedirectUri(redirectUri, this.callState);

        if (this.redirectUri.hash) {
            throw new Error(AdalErrorMessage.redirectUriContainsFragment);
        }

        this.authorizationParameters = parameters;

        this.redirectUriRequestParameter =
            this.platformInformation.getRedirectUriAsString(this.redirectUri, this.callState);

        if (userId == null) {
            throw new Error(AdalErrorMessage.specifyAnyUser);
        }

        this.userId = userId;

        if (extraQueryParameters && extraQueryParameters[0] === "&") {
            extraQueryParameters = extraQueryParameters.substring(1);
        }

        this.extraQueryParameters = extraQueryParameters;
        this.webUi = webUI;
        this.uniqueId = userId.uniqueId;
        this.displayableId = userId.displayableId;
        this.userIdentifierType = userId.type;
        this.supportADFS = true;

        if (claims) {
            this.loadFromCache = false;

            const msg = "Claims present. Skip cache lookup.";
            this.callState.logger.verbose(msg);

            this.claims = claims;
            this.brokerParameters.set(BrokerParameter.claims, claims);
        } else {
            this.loadFromCache = (requestData.tokenCache
                && parameters
                && this.platformInformation.getCacheLoadPolicy(parameters));
        }

        this.brokerParameters.set(BrokerParameter.force, "NO");
        if (userId !== UserIdentifier.anyUser) {
            this.brokerParameters.set(BrokerParameter.username, userId.id);
        } else {
            this.brokerParameters.set(BrokerParameter.username, "");
        }
        this.brokerParameters.set(BrokerParameter.usernameType, UserIdentifierType[userId.type]);

        this.brokerParameters.set(BrokerParameter.redirectUri, this.redirectUri.href);
        this.brokerParameters.set(BrokerParameter.extraQp, extraQueryParameters);
    }

    public async AcquireAuthorizationAsync(): Promise<void> {
        const authorizationUri: URL = this.createAuthorizationUri();
        this.authorizationResult = await this.webUi.acquireAuthorizationAsync(
            authorizationUri,
            this.redirectUri,
            this.callState);
    }

    public async createAuthorizationUriAsync(correlationId: string): Promise<URL> {
        this.callState.correlationId = correlationId;
        await this.authenticator.updateFromTemplateAsync(this.callState);
        return this.createAuthorizationUri();
    }

    protected async preTokenRequestAsync(): Promise<void> {
        await super.preTokenRequestAsync();

        // We do not have async interactive API in .NET, so we call this synchronous method instead.
        await this.AcquireAuthorizationAsync();
        this.verifyAuthorizationResult();

        if (this.authorizationResult.cloudInstanceHost) {
            const updatedAuthority = AcquireTokenInteractiveHandler.replaceHost(
                this.authenticator.authority,
                this.authorizationResult.cloudInstanceHost);

            await this.updateAuthorityAsync(updatedAuthority);
        }
    }

    protected addAditionalRequestParameters(requestParameters: DictionaryRequestParameters): void {
        requestParameters.set(OAuthParameter.grantType, OAuthGrantType.authorizationCode);
        requestParameters.set(OAuthParameter.code, this.authorizationResult.code);
        requestParameters.set(OAuthParameter.redirectUri, this.redirectUriRequestParameter);
    }

    protected async postTokenRequestAsync(resultEx: AuthenticationResultEx): Promise<void> {
        await super.postTokenRequestAsync(resultEx);

        if ((!this.displayableId  && !this.uniqueId)
            || this.userIdentifierType === UserIdentifierType.OptionalDisplayableId) {
            return;
        }

        const uniqueId: string = (resultEx.result.userInfo && resultEx.result.userInfo.uniqueId) ?
            resultEx.result.userInfo.uniqueId : "NULL";
        const displayableId = resultEx.result.userInfo ? resultEx.result.userInfo.displayableId : "NULL";

        if (this.userIdentifierType === UserIdentifierType.UniqueId
            && uniqueId !== this.uniqueId) {
            throw new AdalUserMismatchException(this.uniqueId, uniqueId);
        }

        if (this.userIdentifierType === UserIdentifierType.RequiredDisplayableId
            && displayableId !== this.displayableId) {
            throw new AdalUserMismatchException(this.displayableId, displayableId);
        }
    }

    protected updateBrokerParameters(parameters: Map<string, string>): void {
        const uri = new URL(this.authorizationResult.code);
        const query = EncodingHelper.urlDecode(uri.search);
        const kvps = EncodingHelper.parseKeyValueList(query, "&", false, false, this.callState, false);
        parameters.set("username", kvps.get("username"));
    }

    protected brokerInvocationRequired(): boolean {
        if (this.authorizationResult
            && this.authorizationResult.code
            && this.authorizationResult.code.toLowerCase().startsWith("msauth://")) {
            this.brokerParameters.set(BrokerParameter.brokerInstallUrl, this.authorizationResult.code);
            return true;
        }

        return false;
    }

    private createAuthorizationUri(): URL {
        let loginHint: string = null;

        if (!this.userId.isAnyUser
            && (this.userId.type === UserIdentifierType.OptionalDisplayableId
                || this.userId.type === UserIdentifierType.RequiredDisplayableId)) {
            loginHint = this.userId.id;
        }

        const requestParameters: IRequestParameters = this.createAuthorizationRequest(loginHint);

        const url = new URL(this.authenticator.authorizationUri);
        url.search = requestParameters.toString();

        return url;
    }

    private createAuthorizationRequest(loginHint: string): DictionaryRequestParameters {
        const authorizationRequestParameters = new DictionaryRequestParameters(this.resource, this.clientKey);
        authorizationRequestParameters.set(OAuthParameter.responseType, OAuthResponseType.code);
        authorizationRequestParameters.set(OAuthParameter.hasChrome, "1");
        authorizationRequestParameters.set(OAuthParameter.redirectUri, this.redirectUriRequestParameter);

        if (loginHint) {
            authorizationRequestParameters.set(OAuthParameter.loginHint, loginHint);
        }

        if (this.claims) {
            authorizationRequestParameters.set("claims", this.claims);
        }

        if (this.callState && this.callState.correlationId && this.callState.correlationId !== Utils.guidEmpty) {
            authorizationRequestParameters.set(OAuthParameter.correlationId, this.callState.correlationId);
        }

        if (this.authorizationParameters != null) {
            this.platformInformation.addPromptBehaviorQueryParameter(
                this.authorizationParameters, authorizationRequestParameters);
        }

        const adalIdParameters = AdalIdHelper.getAdalIdParameters();
        for (const kvp of adalIdParameters) {
            authorizationRequestParameters.set(kvp["0"], kvp["1"]);
        }

        if (this.extraQueryParameters) {
            // Checks for extraQueryParameters duplicating standard parameters
            const kvps = EncodingHelper.parseKeyValueList(
                this.extraQueryParameters, "&", false, false, this.callState, false);

            for (const kvp of kvps) {
                if (authorizationRequestParameters.has(kvp["0"])) {
                    throw new AdalError(
                        AdalErrorCode.duplicateQueryParameter,
                        AdalErrorMessage.duplicateQueryParameter(kvp["0"]),
                        null);
                }
            }

            authorizationRequestParameters.extraQueryParameter = this.extraQueryParameters;
        }

        return authorizationRequestParameters;
    }

    private verifyAuthorizationResult(): void {
        if (this.authorizationResult.error === OAuthError.loginRequired) {
            throw new AdalError(AdalErrorCode.userInteractionRequired, null, null);
        }

        if (this.authorizationResult.status !== AuthorizationStatus.Success) {
            throw new AdalServiceError(
                this.authorizationResult.error, this.authorizationResult.errorDescription, null, null);
        }
    }
}

