import { Utils } from "./Utils";
import { TokenCache, TokenSubjectType } from "./cache/TokenCache";

export class UserInfo {
}

export class AuthenticationResult {
    public accessToken: string;
    public accessTokenType: string;
    public authority: string;
    public expiresOn: Date;
    public extendedExpiresOn: Date;
    public extendedLifeTimeToken: boolean;
    public idToken: string;
    public tenantId: string;
    public userInfo: UserInfo;

    constructor(
        accessTokenType: string,
        accessToken: string,
        expiresOn: Date,
        extendedExpiresOn?: Date) {

        this.accessTokenType = accessTokenType;
        this.accessToken = accessToken;
        this.expiresOn = expiresOn;
        if (extendedExpiresOn) {
            this.extendedExpiresOn = extendedExpiresOn;
        } else {
            this.extendedExpiresOn = expiresOn;
        }
    }
}

export class AuthenticationContext {

    private tokenCache: TokenCache = new TokenCache();

    constructor(
        private authority: string,
        private authorizeUrl: string,
        private accessTokenUrl: string,
        private redirectUri: string
    ) {}

    public async acquireTokenAsync(
        tenant: string,
        resource: string,
        scope: string = "user_impersonation",
        clientId: string,
        redirectUri: string = null): Promise<AuthenticationResult> {

        if (!redirectUri) {
            redirectUri = this.redirectUri;
        }

        // Check if token is in the cache
        let cacheResult = this.tokenCache.loadFromCache({
            authority: this.authority,
            clientId: clientId,
            subjectType: TokenSubjectType.Client,
        });

        if (cacheResult) {
            return cacheResult.result;
        }
        
        // Get the token interactively if needed
        const result = await Utils.getAuthTokenInteractiveAsync(
            this.authority,
            this.authorizeUrl,
            this.accessTokenUrl,
            clientId,
            redirectUri,
            tenant,
            resource,
            scope,
            this.tokenCache);

        return result;
    }
}
