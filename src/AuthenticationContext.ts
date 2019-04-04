import { AuthenticationResult } from "./AuthenticationResult";
import { ConsoleLogger } from "./core/AdalLogger";
import { ICoreLogger } from "./core/CoreLoggerBase";
import { TokenSubjectType } from "./internal/cache/TokenCacheKey";
import { TokenCache } from "./TokenCache";
import { Utils } from "./Utils";

export class AuthenticationContext {

    // TODO: Generate correlation id
    private logger: ICoreLogger = new ConsoleLogger(Utils.guidEmpty);

    private tokenCache: TokenCache = new TokenCache(this.logger);

    constructor(
        private authority: string,
        private authorizeUrl: string,
        private accessTokenUrl: string,
        private redirectUri: string,
    ) {}

    public async acquireTokenSilentAsync(
        tenant: string,
        resource: string,
        scope: string,
        clientId: string,
        redirectUri: string = null): Promise<AuthenticationResult> {

        // Acquire token silently
        return this.acquireTokenAsync(tenant, resource, scope, clientId, redirectUri, true);
    }

    public getCachedResult(resource: string, clientId: string): AuthenticationResult {
        // Check if token is in the cache
        const exResult = this.tokenCache.loadFromCache({
            authority: this.authority,
            resource,
            clientId,
            subjectType: TokenSubjectType.Client,
            extendedLifeTimeEnabled: false,
        });

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
        scope: string = "user_impersonation",
        clientId: string,
        redirectUri: string = null,
        silent = false): Promise<AuthenticationResult> {

        if (!redirectUri) {
            redirectUri = this.redirectUri;
        }

        // Check if token is in the cache
        let result = this.tokenCache.loadFromCache({
            authority: this.authority,
            resource,
            clientId,
            subjectType: TokenSubjectType.Client,
            extendedLifeTimeEnabled: false,
        });

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
                this.logger);

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
            scope,
            this.tokenCache,
            this.logger);

        return result.result;
    }

    public clearCache(): void {
        this.tokenCache.clear();
    }
}
