import { TokenSubjectType } from "./TokenCache";
import { AuthenticationResult } from "../AuthenticationContext";
import { TokenCacheKey } from "./TokenCacheKey";

export class TokenCacheItem {
    public authority: string;
    public clientId: string;
    public expiresOn: Date;
    public familyName: string;
    public givenName: string;
    public identityProvider: string;
    public resource: string;
    public tenantId: string;
    public uniqueId: string;
    public displayableId: string;
    public accessToken: string;
    public idToken: string;
    public tokenSubjectType: TokenSubjectType;

    constructor(
        key: TokenCacheKey,
        result: AuthenticationResult,
    ) {
        this.authority = key.authority;
        this.resource = key.resource;
        this.clientId = key.clientId;
        this.tokenSubjectType = key.tokenSubjectType;
        this.uniqueId = key.uniqueId;
        this.displayableId = key.displayableId;
        this.tenantId = result.tenantId;
        this.expiresOn = result.expiresOn;
        this.accessToken = result.accessToken;
        this.idToken = result.idToken;

        // TODO: UserInfo
    }

    public match(key: TokenCacheKey): boolean {
        if (key.authority === this.authority
            && key.resourceEquals(this.resource)
            && key.clientIdEquals(this.clientId)
            && key.tokenSubjectType === this.tokenSubjectType
            && key.uniqueId === this.uniqueId) {
            
            return key.displayableIdEquals(this.displayableId);
        }

        return false;
    }
}