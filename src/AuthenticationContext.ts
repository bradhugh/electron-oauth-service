import { AuthenticationResult } from "./AuthenticationResult";
import { ConsoleLogger } from "./core/AdalLogger";
import { ICoreLogger } from "./core/CoreLoggerBase";
import { TokenSubjectType } from "./internal/cache/TokenCacheKey";
import { CallState } from "./internal/CallState";
import { TokenCache } from "./TokenCache";
import { Utils } from "./Utils";

export class AuthenticationContext {

    // TODO: Generate correlation id
    private logger: ICoreLogger = new ConsoleLogger(Utils.guidEmpty);

    private tokenCache: TokenCache = new TokenCache(this.logger);

    private callState: CallState = new CallState(Utils.guidEmpty);

    constructor(
        private authority: string,
        private authorizeUrl: string,
        private accessTokenUrl: string,
        private redirectUri: string,
    ) {}

    public async acquireTokenSilentAsync(
        tenant: string,
        resource: string,
        clientId: string,
        redirectUri: string = null): Promise<AuthenticationResult> {

        // Acquire token silently
        return this.acquireTokenAsync(tenant, resource, clientId, redirectUri, true);
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
        tenant: string,
        resource: string,
        clientId: string,
        redirectUri: string = null,
        silent = false): Promise<AuthenticationResult> {

        if (!redirectUri) {
            redirectUri = this.redirectUri;
        }

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
                this.accessTokenUrl,
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

        // If they specified silent, we can't do the interactive
        if (silent) {
            return result.result;
        }

        // Get the token interactively if needed
        result = await Utils.getAuthTokenInteractiveAsync(
            this.authority,
            this.authorizeUrl,
            this.accessTokenUrl,
            clientId,
            redirectUri,
            tenant,
            resource,
            this.tokenCache,
            this.callState);

        return result.result;
    }

    public clearCache(): void {
        this.tokenCache.clear();
    }
}
