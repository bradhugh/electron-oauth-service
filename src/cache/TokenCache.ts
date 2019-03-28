import { EventEmitter } from "electron";
import { AuthenticationResult } from "../AuthenticationContext";

export class TokenCacheNotificationArgs {
    tokenCache: TokenCache;
    clientId: string;
    resource: string;
    uniqueId: string;
    displayableId: string;
}

export enum TokenSubjectType {
    User,
    Client,
    UserPlusClient
}

export class TokenCacheKey {
    public authority: string;
    public resource: string;
    public clientId: string;
    public uniqueId: string;
    public displayableId: string;
    public tokenSubjectType: TokenSubjectType;

    constructor(
        authority: string,
        resource: string,
        clientId: string,
        tokenSubjectType: TokenSubjectType,
        uniqueId: string,
        displayableId: string) {}

    public getStringKey(): string {
        return `${this.authority}:::${this.resource.toLowerCase()}:::${this.clientId.toLowerCase()}` +
            `:::${this.uniqueId}` +
            `:::${this.displayableId !== null ? this.displayableId.toLowerCase() : null}` +
            `:::${this.tokenSubjectType}`;
    }

    public static fromStringKey(stringKey: string): TokenCacheKey {
        const parts: string[] = stringKey.split(':::');
        if (parts.length !== 6) {
            throw new Error(`Token cache key ${stringKey} is in the incorrect format!`);
        }

        const authority = parts[0];
        const resourceId = parts[1];
        const clientId = parts[3];
        const uniqueId = parts[4];
        const displayableId = parts[5];
        const tokenSubjectType: TokenSubjectType = parseInt(parts[6]);

        return new TokenCacheKey(
            authority,
            resourceId,
            clientId,
            tokenSubjectType,
            uniqueId,
            displayableId);
    }

    public resourceEquals(otherResource: string): boolean {
        return otherResource.toLowerCase() === this.resource.toLowerCase();
    }

    public clientIdEquals(otherClientId: string): boolean {
        return otherClientId.toLowerCase() === this.clientId.toLowerCase();
    }

    public displayableIdEquals(otherDisplayableId: string): boolean {
        return otherDisplayableId.toLowerCase() === this.displayableId.toLowerCase();
    }
}

export class AuthenticationResultEx {
    public result: AuthenticationResult;
    public refreshToken: string;
    public isMultipleResourceRefreshToken: boolean;
    public resourceInResponse: string;
    public error: Error;
    public userAssertionHash: string;

    public static deserialize(serializedObject: string): AuthenticationResultEx {
        return JSON.parse(serializedObject) as AuthenticationResultEx;
    }

    public serialize(): string {
        return JSON.stringify(this);
    }

    public clone(): AuthenticationResultEx {
        const cloned = new AuthenticationResultEx();
        cloned.userAssertionHash = this.userAssertionHash;
        cloned.error = this.error;
        cloned.refreshToken = this.refreshToken;
        cloned.resourceInResponse = this.resourceInResponse;
        cloned.result = new AuthenticationResult(
            this.result.accessTokenType,
            this.result.accessToken,
            this.result.expiresOn,
            this.result.extendedExpiresOn);

        cloned.result.extendedLifeTimeToken = this.result.extendedLifeTimeToken;
        cloned.result.idToken = this.result.idToken;
        cloned.result.tenantId = this.result.tenantId;
        cloned.result.userInfo = this.result.userInfo;

        return cloned;
    }
}

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

    match(key: TokenCacheKey): boolean {
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

export class TokenCache extends EventEmitter {

    private tokenCacheDictionary: { [key: string]: AuthenticationResultEx } ;

    private _hasStateChanged = false;

    get hasStateChanged(): boolean {
        return this._hasStateChanged;
    }

    set hasStateChanged(value: boolean) {
        this._hasStateChanged = value;
    }

    public readItems(): TokenCacheItem[] {
        const args = new TokenCacheNotificationArgs();
        args.tokenCache = this;

        this.emit('beforeAccess', args);
        const result: TokenCacheItem[] = [];

        const keys = Object.keys(this.tokenCacheDictionary);
        for (let key of keys) {
            const entry = this.tokenCacheDictionary[key];
            const item = new TokenCacheItem(
                TokenCacheKey.fromStringKey(key),
                entry.result);

            result.push(item);
        }

        this.emit('afterAccess', args);
        return result;
    }

    public clear(): void {
        const args = new TokenCacheNotificationArgs();
        args.tokenCache = this;

        this.emit('beforeAccess', args);
        this.emit('beforeWrite', args);

        // clear the token cache
        this.tokenCacheDictionary = {};
    }
}