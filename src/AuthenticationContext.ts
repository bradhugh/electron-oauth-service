import { AuthenticationResult } from "./AuthenticationResult";
import { Authenticator } from "./instance/Authenticator";
import { TokenSubjectType } from "./internal/cache/TokenCacheKey";
import { CallState } from "./internal/CallState";
import { ClientKey } from "./internal/clientcreds/ClientKey";
import { AcquireTokenInteractiveHandler } from "./internal/flows/AcquireTokenInteractiveHandler";
import { AcquireTokenSilentHandler } from "./internal/flows/AcquireTokenSilentHandler";
import { IPlatformParameters } from "./internal/platform/IPlatformParameters";
import { IWebUI } from "./internal/platform/IWebUI";
import { WebUIFactoryProvider } from "./internal/platform/WebUIFactoryProvider";
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

    public async acquireTokenAsync(
        resource: string,
        clientId: string,
        redirectUri: string,
        parameters: IPlatformParameters,
        userId: UserIdentifier,
        extraQueryParameters: string): Promise<AuthenticationResult> {

        // Do this just in case our passed in user doesn't have the UserIdentifier prototype
        userId = new UserIdentifier(userId.id, userId.type);

        const result = await this.acquireTokenCommonAsync(
            resource,
            clientId,
            redirectUri,
            parameters,
            userId,
            extraQueryParameters);

        return result;
    }

    public async acquireTokenSilentAsync(
        resource: string,
        clientId: string,
        userId: UserIdentifier,
        parameters: IPlatformParameters): Promise<AuthenticationResult> {

        // Do this just in case our passed in user doesn't have the UserIdentifier prototype
        userId = new UserIdentifier(userId.id, userId.type);

        return await this.acquireTokenSilentCommonAsync(resource, new ClientKey(clientId), userId, parameters);
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
        const result = await handler.runAsync();
        return result;
    }

    private async acquireTokenSilentCommonAsync(
        resource: string,
        clientKey: ClientKey,
        userId: UserIdentifier,
        parameters: IPlatformParameters): Promise<AuthenticationResult> {

        const correlationId = Utils.newGuid();

        const requestData: IRequestData = {
            authenticator: this.authenticator,
            tokenCache: this.tokenCache,
            resource,
            clientKey,
            extendedLifeTimeEnabled: this.extendedLifeTimeEnabled,
            subjectType: TokenSubjectType.User,
            correlationId,
        };

        const handler = new AcquireTokenSilentHandler(requestData, userId, parameters);
        const result = await handler.runAsync();
        return result;
    }

    private createWebAuthenticationDialog(parameters: IPlatformParameters): IWebUI {
        return WebUIFactoryProvider.webUIFactory.createAuthenticationDialog(parameters);
    }
}
