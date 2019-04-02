import { TokenCacheItem } from "./TokenCacheItem";
import { AuthenticationResultEx, AuthenticationResult } from "./AuthenticationResult";
import { CacheQueryData } from "./internal/cache/CacheQueryData";
import { TokenCacheKey, TokenSubjectType } from "./internal/cache/TokenCacheKey";
import { EventEmitter } from "events";
import { TokenCacheNotificationArgs } from "./TokenCacheNotificationArgs";

export class TokenCache extends EventEmitter {

    private static schemaVersion: number = 3;
    private static delimiter: string = ":::";

    private tokenCacheDictionary: Map<TokenCacheKey, AuthenticationResultEx> = new Map<TokenCacheKey, AuthenticationResultEx>();

    // We do not want to return near expiry tokens, this is why we use this hard coded setting to refresh tokens which are close to expiration.
    private static expirationMarginInMinutes = 5;

    private _hasStateChanged = false;

    private static _defaultShared = new TokenCache();

    // Constructor that receives the optional state of the cache
    constructor(state?: Buffer) {
        super();

        if (state) {
            this.deserialize(state);
        }
    }

    // Static token cache shared by all instances of AuthenticationContext which do not explicitly pass a cache instance during construction.
    static get defaultShared(): TokenCache {
        return TokenCache._defaultShared;
    }

    // Gets or sets the flag indicating whether cache state has changed. ADAL methods set this flag after any change. Caller application should reset 
    // the flag after serializing and persisting the state of the cache.
    get hasStateChanged(): boolean {
        return this._hasStateChanged;
    }

    set hasStateChanged(value: boolean) {
        this._hasStateChanged = value;
    }

    // Gets the nunmber of items in the cache.
    get count(): number {
        return this.tokenCacheDictionary.values.length;
    }

    /// <summary>
    /// Serializes current state of the cache as a blob. Caller application can persist the blob and update the state of the cache later by 
    /// passing that blob back in constructor or by calling method Deserialize.
    /// </summary>
    /// <returns>Current state of the cache as a blob</returns>
    public serialize(): Buffer {
        // TODO: do I really need a version number?
        const serialized = JSON.stringify(this.tokenCacheDictionary);
        return new Buffer(serialized, 'utf8');
    }

    /// <summary>
    /// Deserializes state of the cache. The state should be the blob received earlier by calling the method Serialize.
    /// </summary>
    /// <param name="state">State of the cache as a blob</param>
    public deserialize(state: Buffer): void {

        if (!state) {
            this.tokenCacheDictionary.clear();
            return;
        }

        const serialized = state.toString('utf8');

        // TODO: clearly need some validation of the data here
        this.tokenCacheDictionary = JSON.parse(serialized);
    }

    /// <summary>
    /// Reads a copy of the list of all items in the cache. 
    /// </summary>
    /// <returns>The items in the cache</returns>
    public readItems(): TokenCacheItem[] {
        const args = new TokenCacheNotificationArgs();
        args.tokenCache = this;

        this.emit('beforeAccess', args);
        const result: TokenCacheItem[] = [];

        // TODO: Enumerate the items and add them to result

        this.emit('afterAccess', args);
        return result;
    }

    /// <summary>
    /// Deletes an item from the cache.
    /// </summary>
    /// <param name="item">The item to delete from the cache</param>
    public deleteItem(item: TokenCacheItem) {
        const args = new TokenCacheNotificationArgs();
        args.tokenCache = this;
        args.resource = item.resource;
        args.clientId = item.clientId;
        args.uniqueId = item.uniqueId;
        args.displayableId = item.displayableId;

        this.emit("beforeAccess", args);
        this.emit("beforeWrite", args);

        let toRemoveKey: TokenCacheKey = null;
        this.tokenCacheDictionary.forEach((_entry, key) => {
            if (item.match(key)) {
                toRemoveKey = key;
            }
        });

        if (toRemoveKey) {
            this.tokenCacheDictionary.delete(toRemoveKey);
            // Default.Logger.Information(null, "One item removed successfully");
        } else {
            // CallState.Default.Logger.Information(null, "Item not Present in the Cache");
        }

        this.hasStateChanged = true;
        this.emit("onAfterAccess", args);
    }

    public clear(): void {
        const args = new TokenCacheNotificationArgs();
        args.tokenCache = this;

        this.emit("beforeAccess", args);
        this.emit("beforeWrite", args);

        // clear the token cache
        this.tokenCacheDictionary.clear();
        // CallState.Default.Logger.Information(null, "Successfully Cleared Cache");

        this.hasStateChanged = true;
        this.emit("onafterAccess", args);
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
        this.tokenCacheDictionary.set(key, result);

        // TODO: UpdateCachedMrrtRefreshTokens?
        this.hasStateChanged = true;
    }

    public loadFromCache(cacheQueryData: CacheQueryData) {

        let resultEx: AuthenticationResultEx = null;
        const kvp = this.loadSingleItemFromCache(cacheQueryData);
        if (kvp) {
            const key = kvp.key;
            resultEx = kvp.value.clone();
            
            const now = new Date();
            const tokenNearExpiry = resultEx.result.expiresOn.getTime() <= now.getTime() + (1000 * 60 * TokenCache.expirationMarginInMinutes);
            const tokenExtendedLifeTimeExpired = resultEx.result.extendedExpiresOn.getTime() <= now.getTime();

            if (key.authority !== cacheQueryData.authority) {
                // this is a cross-tenant result. use RT only
                resultEx.result.accessToken = null;
                console.log("Cross-tenant refresh token found in the cache");
            } else if (tokenNearExpiry && !cacheQueryData.extendedLifeTimeEnabled) {
                // An expired or near expiry token was found in the cache
                resultEx.result.accessToken = null;
                console.log("An expired or near expiry token was found in the cache");
            } else if (!key.resourceEquals(cacheQueryData.resource)) {

                // Multi resource refresh token for resource '{0}' will be used to acquire token for '{1}'"
                const newResultEx = new AuthenticationResultEx();
                newResultEx.result = new AuthenticationResult(null, null, new Date(-8640000000000000));
                newResultEx.refreshToken = resultEx.refreshToken;
                newResultEx.resourceInResponse = resultEx.resourceInResponse;
                
                newResultEx.result.updateTenantAndUserInfo(resultEx.result.tenantId, resultEx.result.idToken,
                    resultEx.result.userInfo);
				resultEx = newResultEx;
            } else if ((!tokenExtendedLifeTimeExpired && cacheQueryData.extendedLifeTimeEnabled) && tokenNearExpiry) {
                resultEx.result.extendedLifeTimeToken = true;
                resultEx.result.expiresOn = resultEx.result.extendedExpiresOn;
                
                console.log("The extendedLifeTime is enabled and a stale AT with extendedLifeTimeEnabled is returned.");
            } else if (tokenExtendedLifeTimeExpired) {
                // The AT has expired its ExtendedLifeTime
                resultEx.result.accessToken = null;

                console.log("The AT has expired its ExtendedLifeTime")
            } else {
                const millisecondsLeft = resultEx.result.expiresOn.getTime() - now.getTime();
                const minutesLeft = millisecondsLeft / 1000 / 60;
                console.log(`${minutesLeft.toFixed(2)} minutes left until token in cache expires`);
            }

            if (!resultEx.result.accessToken && !resultEx.refreshToken) {
                // An old item was removed from the cache
                this.tokenCacheDictionary.delete(key);

                console.log("An old item was removed from the cache");

                this.hasStateChanged = true;
                resultEx = null;
            }

            if (resultEx !== null) {
                resultEx.result.authority = key.authority;
                
                console.log("A matching item (access token or refresh token or both) was found in the cache");
            }
        } else {
            // No matching token was found in the cache
            console.log(`No matching token was found in the cache`);
            console.log(this.tokenCacheDictionary);
            console.log(cacheQueryData);
        }

        return resultEx;
    }

    public logCache(): void {
        console.log("***** CACHE START *****");
        console.log(this.tokenCacheDictionary);
        console.log("***** CACHE END *****");
    }

    private queryCache(
        authority: string,
        clientId: string,
        subjectType: TokenSubjectType,
        uniqueId: string,
        displayableId: string): Pair<TokenCacheKey, AuthenticationResultEx>[] {

        const results: Pair<TokenCacheKey, AuthenticationResultEx>[] = [];
        this.tokenCacheDictionary.forEach((entry, cacheKey) => {
            console.log(`Authority: ${(!authority || cacheKey.authority === authority)}`);
            console.log(`clientId: ${(!clientId || cacheKey.clientIdEquals(clientId))}`);
            console.log(`uniqueId: ${(!uniqueId || cacheKey.uniqueId === uniqueId)}`);
            console.log(`displayableId: ${(!displayableId || cacheKey.displayableIdEquals(displayableId))}`);
            console.log(`tokenSubjectType: ${cacheKey.tokenSubjectType === subjectType}`);

            if ((!authority || cacheKey.authority === authority)
                && (!clientId || cacheKey.clientIdEquals(clientId))
                && (!uniqueId || cacheKey.uniqueId === uniqueId)
                && (!displayableId || cacheKey.displayableIdEquals(displayableId))
                && cacheKey.tokenSubjectType === subjectType) {
            
                // TODO: Do I need assertionHash?
                results.push(new Pair<TokenCacheKey, AuthenticationResultEx>(cacheKey, entry));
            }
        });

        return results;
    }

    private loadSingleItemFromCache(cacheQueryData: CacheQueryData): Pair<TokenCacheKey, AuthenticationResultEx> {
        let cacheItems = this.queryCache(
            cacheQueryData.authority,
            cacheQueryData.clientId,
            cacheQueryData.subjectType,
            cacheQueryData.uniqueId,
            cacheQueryData.displayableId);

        cacheItems = cacheItems.filter(p => p.key.resourceEquals(cacheQueryData.resource));
        let result: Pair<TokenCacheKey, AuthenticationResultEx> = null;
        switch (cacheItems.length) {
            case 1:
                // An item matching the requested resource was found in the cache
                result = cacheItems[0];
                break;

            case 0:
                const multiResourceTokens = cacheItems.filter(p => p.value.isMultipleResourceRefreshToken);
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