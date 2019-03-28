import { TokenCacheItem } from "./TokenCacheItem";
import { AuthenticationResultEx, AuthenticationResult } from "../AuthenticationResult";
import { TokenCacheKey } from "./TokenCacheKey";
import { CacheQueryData } from "./CacheQueryData";
import { EventEmitter } from "events";

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

export interface KeyAndResult {
    key: TokenCacheKey;
    value: AuthenticationResultEx;
}

export class TokenCache extends EventEmitter {

    private tokenCacheDictionary: { [key: string]: AuthenticationResultEx } = {};

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

        this.emit("beforeAccess", args);
        this.emit("beforeWrite", args);

        // clear the token cache
        this.tokenCacheDictionary = {};
    }

    public storeToCache(
        result: AuthenticationResultEx,
        authority: string,
        resource: string,
        clientId: string,
        subjectType: TokenSubjectType): void {

        const uniqueId = result.result.userInfo ? result.result.userInfo.uniqueId : null;
        const displayableId = result.result.userInfo ? result.result.userInfo.displayableId: null;

        // Trigger beforeWrite
        const args = new TokenCacheNotificationArgs();
        args.resource = resource;
        args.clientId = clientId;
        args.uniqueId = uniqueId;
        args.displayableId = displayableId;
        this.emit("beforeWrite", args);

        const key = new TokenCacheKey(authority, resource, clientId, subjectType, uniqueId, displayableId);
        this.tokenCacheDictionary[key.getStringKey()] = result;

        // TODO: UpdateCachedMrrtRefreshTokens?
        this.hasStateChanged = true;
    }

    private queryCache(
        authority: string,
        clientId: string,
        subjectType: TokenSubjectType,
        uniqueId: string,
        displayableId: string): KeyAndResult[] {

        const results: KeyAndResult[] = [];
        const keys = Object.keys(this.tokenCacheDictionary);
        for (const key of keys) {
            const entry = this.tokenCacheDictionary[key];
            const cacheKey = TokenCacheKey.fromStringKey(key);
            if ((!authority || cacheKey.authority === authority)
                && (!clientId || cacheKey.clientIdEquals(clientId))
                && (!uniqueId || cacheKey.uniqueId === uniqueId)
                && (!displayableId || cacheKey.displayableIdEquals(displayableId))
                && cacheKey.tokenSubjectType === subjectType) {
            
                // TODO: Do I need assertionHash?
                results.push({
                    key: cacheKey,
                    value: entry
                });
            }
        }

        return results;
    }

    public loadFromCache(cacheQueryData: CacheQueryData) {

        let result: AuthenticationResultEx = null;
        const kvp = this.loadSingleItemFromCache(cacheQueryData);
        if (kvp) {
            const key = kvp.key;
            result = kvp.value.clone();
            
            const now = new Date();
            const validByExpiresOn = result.result.expiresOn.getTime() <= now.getTime() + (1000 * 60 * 5);
            const validByExpiresOnExtended = result.result.extendedExpiresOn.getTime() <= now.getTime();

            if (key.authority === cacheQueryData.authority) {
                // Cross-tenant refresh token found in the cache
                result.result.accessToken = null;
            } else if (validByExpiresOn && !cacheQueryData.extendedLifeTimeEnabled) {
                // An expired or near expiry token was found in the cache
                result.result.accessToken = null;
            } else if (!key.resourceEquals(cacheQueryData.resource)) {

                // Multi resource refresh token for resource '{0}' will be used to acquire token for '{1}'"
                const tempResult = new AuthenticationResultEx();
                tempResult.result = new AuthenticationResult(null, null, new Date(-8640000000000000));
                tempResult.refreshToken = result.refreshToken;
				tempResult.resourceInResponse = result.resourceInResponse;
				tempResult.result.updateTenantAndUserInfo(result.result.tenantId, result.result.idToken, result.result.userInfo);
				result = tempResult;
            } else if ((!validByExpiresOnExtended && cacheQueryData.extendedLifeTimeEnabled) && validByExpiresOn) {
                // The extendedLifeTime is enabled and a stale AT with extendedLifeTimeEnabled is returned
                result.result.extendedLifeTimeToken = true;
				result.result.expiresOn = result.result.extendedExpiresOn;
            } else if (validByExpiresOnExtended) {
                // The AT has expired its ExtendedLifeTime
                result.result.accessToken = null;
            } else {
                const millisecondsLeft = result.result.expiresOn.getTime() - now.getTime();
                const minutesLeft = millisecondsLeft / 1000 / 60;
                console.log(`${minutesLeft.toFixed(2)} minutes left until token in cache expires`);
            }

            if (result.result.accessToken === null && result.refreshToken === null) {
                // An old item was removed from the cache
                delete this.tokenCacheDictionary[key.getStringKey()];
                this.hasStateChanged = true;
                result = null;
            }

            if (result !== null) {
                result.result.authority = key.authority;
                // A matching item (access token or refresh token or both) was found in the cache
            }
        } else {
            // No matching token was found in the cache
            console.log(`No matching token was found in the cache`);
            console.log(this.tokenCacheDictionary);
            console.log(cacheQueryData);
        }

        return result;
    }

    private loadSingleItemFromCache(cacheQueryData: CacheQueryData): KeyAndResult {
        const source = this.queryCache(
            cacheQueryData.authority,
            cacheQueryData.clientId,
            cacheQueryData.subjectType,
            cacheQueryData.uniqueId,
            cacheQueryData.displayableId);

        const list = source.filter(p => p.key.resourceEquals(cacheQueryData.resource));
        const count = list.length;
        let result: KeyAndResult = null;
        switch (count) {
            case 1:
                // An item matching the requested resource was found in the cache
                result = list[0];
                break;

            case 0:
                const multiResourceTokens = source.filter(p => p.value.isMultipleResourceRefreshToken);
                if (multiResourceTokens.length) {
                    // A Multi Resource Refresh Token for a different resource was found which can be used
                    result = multiResourceTokens[0];
                }
                break;

            default:
                throw new Error("Multiple matching tokens detected");
        }

        if (!result && cacheQueryData.subjectType !== TokenSubjectType.Client) {
            const sameCloudEntries = this.queryCache(
                null,
                cacheQueryData.clientId,
                cacheQueryData.subjectType,
                cacheQueryData.uniqueId,
                cacheQueryData.displayableId)
                .filter(item => TokenCache.isSameCloud(item.key.authority, cacheQueryData.authority));
            
            if (sameCloudEntries.length) {
                result = sameCloudEntries[0];
            }

            // REVIEW: Do we need to null out ADFS tokens?
        }

        return result;
    }

    private static isSameCloud(authority: string, authority1: string): boolean {
        return new URL(authority).host === new URL(authority1).host;
    }
}