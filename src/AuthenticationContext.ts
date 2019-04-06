import { AuthenticationResult } from "./AuthenticationResult";
import { ConsoleLogger } from "./core/AdalLogger";
import { ICoreLogger } from "./core/CoreLoggerBase";
import { Authenticator } from "./instance/Authenticator";
import { TokenSubjectType } from "./internal/cache/TokenCacheKey";
import { CallState } from "./internal/CallState";
import { ClientKey } from "./internal/clientcreds/ClientKey";
import { AcquireTokenInteractiveHandler } from "./internal/flows/AcquireTokenInteractiveHandler";
import { IPlatformParameters } from "./internal/platform/IPlatformParameters";
import { IWebUI } from "./internal/platform/IWebUI";
import { IRequestData } from "./internal/RequestData";
import { TokenCache } from "./TokenCache";
import { UserIdentifier } from "./UserIdentifier";
import { Utils } from "./Utils";

export enum AuthorityValidationType {
    True,
    False,
    NotProvided,
}

export class AuthenticationContext {

    public extendedLifeTimeEnabled = false;

    public authenticator: Authenticator;

    private callState: CallState = new CallState(Utils.guidEmpty);

    constructor(
        public authority: string,
        validateAuthority: AuthorityValidationType = AuthorityValidationType.NotProvided,
        public tokenCache: TokenCache = TokenCache.defaultShared,
    ) {
        this.authenticator = new Authenticator(
            authority,
            (validateAuthority !== AuthorityValidationType.False));
    }

    public getCachedResult(resource: string, clientId: string): AuthenticationResult {
        // Check if token is in the cache
        const exResult = this.tokenCache.loadFromCacheAsync({
            authority: this.authority,
            resource,
            clientId,
            subjectType: TokenSubjectType.Client,
            extendedLifeTimeEnabled: false,
        },
        this.callState);

        // If we actually found a cache entry, return it
        if (exResult) {
            return exResult.result;
        }

        // No cache entry, so build an empty result
        return new AuthenticationResult(null, null, null);
    }

    public async acquireTokenAsyncOld(
        resource: string,
        clientId: string,
        redirectUri: string,
        authorizeUrl: string,
        accessTokenUrl: string): Promise<AuthenticationResult> {

        // Check if token is in the cache
        let result = this.tokenCache.loadFromCacheAsync({
            authority: this.authority,
            resource,
            clientId,
            subjectType: TokenSubjectType.Client,
            extendedLifeTimeEnabled: false,
        },
        this.callState);

        // We found a valid token in the cache
        if (result && result.result && result.result.accessToken) {
            return result.result;
        }

        // Token is expired, but we have a refresh token
        if (result && result.refreshToken) {
            result = await Utils.refreshAccessTokenAsync(
                accessTokenUrl,
                this.authority,
                resource,
                clientId,
                result,
                this.tokenCache,
                this.callState);

            if (result && result.result && result.result.accessToken) {
                return result.result;
            }
        }

        // Get the token interactively if needed
        result = await Utils.getAuthTokenInteractiveAsync(
            this.authority,
            authorizeUrl,
            accessTokenUrl,
            clientId,
            redirectUri,
            resource,
            this.tokenCache,
            this.callState);

        return result.result;
    }

    public async acquireTokenAsync(
        resource: string,
        clientId: string,
        redirectUri: string,
        parameters: IPlatformParameters,
        userId: UserIdentifier,
        extraQueryParameters: string): Promise<AuthenticationResult> {

        return await this.acquireTokenCommonAsync(
            resource,
            clientId,
            redirectUri,
            parameters,
            userId,
            extraQueryParameters);
    }

    public clearCache(): void {
        this.tokenCache.clear();
    }

    private async acquireTokenCommonAsync(
        resource: string,
        clientId: string,
        redirectUri: string,
        parameters: IPlatformParameters,
        userId: UserIdentifier,
        extraQueryParameters: string = null,
        claims: string = null): Promise<AuthenticationResult> {

        const correlationId = Utils.newGuid();

        const requestData: IRequestData = {
            authenticator: this.authenticator,
            tokenCache: this.tokenCache,
            resource,
            clientKey: new ClientKey(clientId),
            extendedLifeTimeEnabled: this.extendedLifeTimeEnabled,
            subjectType: TokenSubjectType.User,
            correlationId,
        };

        const handler = new AcquireTokenInteractiveHandler(requestData, new URL(redirectUri), parameters, userId,
            extraQueryParameters, this.createWebAuthenticationDialog(parameters), claims);
        return await handler.runAsync();
    }

    private createWebAuthenticationDialog(parameters: IPlatformParameters): IWebUI {
        throw new Error("createWebAuthenticationDialog: Not implemented!");
    }
}
