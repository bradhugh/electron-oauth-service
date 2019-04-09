import { EventEmitter } from "events";
import { AuthenticationResult } from "./AuthenticationResult";
import { AuthenticationResultEx } from "./AuthenticationResultEx";
import { ConsoleLogger } from "./core/AdalLogger";
import { ICoreLogger } from "./core/CoreLoggerBase";
import { ICacheQueryData } from "./internal/cache/CacheQueryData";
import { TokenCacheKey, TokenSubjectType } from "./internal/cache/TokenCacheKey";
import { CallState } from "./internal/CallState";
import { Pair } from "./Pair";
import { TokenCacheItem } from "./TokenCacheItem";
import { TokenCacheNotificationArgs } from "./TokenCacheNotificationArgs";
import { Utils } from "./Utils";

interface ISerializedTokenStore {
    version: number;
    entries: { [key: string]: string };
}

export class TokenCache extends EventEmitter {

    private static delimiter: string = ":::";

    // We do not want to return near expiry tokens, this is why we use this
    // hard coded setting to refresh tokens which are close to expiration.
    private static expirationMarginInMinutes = 5;

    private static logger: ICoreLogger = new ConsoleLogger(Utils.guidEmpty);

    private static $defaultShared = new TokenCache(TokenCache.logger);

    private static isSameCloud(authority: string, authority1: string): boolean {
        return new URL(authority).host === new URL(authority1).host;
    }

    private $hasStateChanged = false;

    private tokenCacheDictionary = new Map<string, AuthenticationResultEx>();

    // Constructor that receives the optional state of the cache
    constructor(private logger: ICoreLogger, state?: Buffer) {
        super();

        if (!logger) {
            this.logger = TokenCache.logger;
        }

        if (state) {
            this.deserialize(state);
        }
    }

    // Static token cache shared by all instances of AuthenticationContext
    // which do not explicitly pass a cache instance during construction.
    static get defaultShared(): TokenCache {
        return TokenCache.$defaultShared;
    }

    // Gets or sets the flag indicating whether cache state has changed.
    // ADAL methods set this flag after any change. Caller application should reset
    // the flag after serializing and persisting the state of the cache.
    get hasStateChanged(): boolean {
        return this.$hasStateChanged;
    }

    set hasStateChanged(value: boolean) {
        this.$hasStateChanged = value;
    }

    // Gets the nunmber of items in the cache.
    get count(): number {
        return this.tokenCacheDictionary.size;
    }

    /// <summary>
    /// Serializes current state of the cache as a blob. Caller application can
    /// persist the blob and update the state of the cache later by
    /// passing that blob back in constructor or by calling method Deserialize.
    /// </summary>
    /// <returns>Current state of the cache as a blob</returns>
    public serialize(): Buffer {
        const store: ISerializedTokenStore = {
            version: 1,
            entries: {},
        };

        for (const entry of this.tokenCacheDictionary) {
            const result = entry["1"];
            store.entries[entry["0"]] = result.serialize();
        }

        const serialized = JSON.stringify(store);
        return Buffer.from(serialized, "utf8");
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

        const serialized = state.toString("utf8");
        const store = JSON.parse(serialized) as ISerializedTokenStore;
        if (store.version !== 1) {
            this.logger.warning(`Unexpected serialized TokenCache version ${store.version}`);
            return;
        }

        this.tokenCacheDictionary.clear();
        const keys = Object.keys(store.entries);
        for (const key of keys) {
            this.tokenCacheDictionary.set(
                key,
                AuthenticationResultEx.deserialize(store.entries[key]));
        }
    }

    /// <summary>
    /// Reads a copy of the list of all items in the cache.
    /// </summary>
    /// <returns>The items in the cache</returns>
    public readItems(): TokenCacheItem[] {
        const args = new TokenCacheNotificationArgs();
        args.tokenCache = this;

        this.onBeforeAccess(args);
        const result: TokenCacheItem[] = [];

        // TODO: Enumerate the items and add them to result

        this.onAfterAccess(args);
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

        this.onBeforeAccess(args);
        this.onBeforeWrite(args);

        let toRemoveStringKey: string = null;

        for (const stringKey of this.tokenCacheDictionary.keys()) {
            const key = TokenCacheKey.fromStringKey(stringKey);

            if (item.match(key)) {
                toRemoveStringKey = stringKey;
                break;
            }
        }

        if (toRemoveStringKey) {
            this.tokenCacheDictionary.delete(toRemoveStringKey);
            // Default.Logger.Information(null, "One item removed successfully");
        } else {
            // CallState.Default.Logger.Information(null, "Item not Present in the Cache");
        }

        this.hasStateChanged = true;
        this.onAfterAccess(args);
    }

    public clear(): void {
        const args = new TokenCacheNotificationArgs();
        args.tokenCache = this;

        this.onBeforeAccess(args);
        this.onBeforeWrite(args);

        // clear the token cache
        this.tokenCacheDictionary.clear();
        // CallState.Default.Logger.Information(null, "Successfully Cleared Cache");

        this.hasStateChanged = true;
        this.onAfterAccess(args);
    }

    public storeToCacheAsync(
        result: AuthenticationResultEx,
        authority: string,
        resource: string,
        clientId: string,
        subjectType: TokenSubjectType,
        callState: CallState): void {

        const uniqueId = result.result.userInfo ? result.result.userInfo.uniqueId : null;
        const displayableId = result.result.userInfo ? result.result.userInfo.displayableId : null;

        // Trigger beforeWrite
        const args = new TokenCacheNotificationArgs();
        args.resource = resource;
        args.clientId = clientId;
        args.uniqueId = uniqueId;
        args.displayableId = displayableId;
        this.onBeforeWrite(args);

        const key = new TokenCacheKey(authority, resource, clientId, subjectType, uniqueId, displayableId);
        this.tokenCacheDictionary.set(key.toStringKey(), result);

        // TODO: UpdateCachedMrrtRefreshTokens?
        this.hasStateChanged = true;
    }

    public loadFromCacheAsync(cacheQueryData: ICacheQueryData, callState: CallState) {

        let resultEx: AuthenticationResultEx = null;
        const kvp = this.loadSingleItemFromCache(cacheQueryData);
        if (kvp) {
            const key = kvp.key;
            resultEx = kvp.value.clone();

            const now = new Date();
            const tokenNearExpiry = resultEx.result.expiresOn.getTime() <= now.getTime() +
                (1000 * 60 * TokenCache.expirationMarginInMinutes);
            const tokenExtendedLifeTimeExpired = resultEx.result.extendedExpiresOn.getTime() <= now.getTime();

            if (key.authority !== cacheQueryData.authority) {
                // this is a cross-tenant result. use RT only
                resultEx.result.accessToken = null;
                this.logger.info("Cross-tenant refresh token found in the cache");
            } else if (tokenNearExpiry && !cacheQueryData.extendedLifeTimeEnabled) {
                // An expired or near expiry token was found in the cache
                resultEx.result.accessToken = null;
                this.logger.info("An expired or near expiry token was found in the cache");
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

                this.logger.info(
                    "The extendedLifeTime is enabled and a stale AT with extendedLifeTimeEnabled is returned.");
            } else if (tokenExtendedLifeTimeExpired) {
                // The AT has expired its ExtendedLifeTime
                resultEx.result.accessToken = null;

                this.logger.info("The AT has expired its ExtendedLifeTime");
            } else {
                const millisecondsLeft = resultEx.result.expiresOn.getTime() - now.getTime();
                const minutesLeft = millisecondsLeft / 1000 / 60;
                this.logger.info(`${minutesLeft.toFixed(2)} minutes left until token in cache expires`);
            }

            if (!resultEx.result.accessToken && !resultEx.refreshToken) {
                // An old item was removed from the cache
                this.tokenCacheDictionary.delete(key.toStringKey());

                this.logger.info("An old item was removed from the cache");

                this.hasStateChanged = true;
                resultEx = null;
            }

            if (resultEx !== null) {
                resultEx.result.authority = key.authority;

                this.logger.info("A matching item (access token or refresh token or both) was found in the cache");
            }
        } else {
            // No matching token was found in the cache
            this.logger.info(`No matching token was found in the cache`);
        }

        return resultEx;
    }

    public on(
        event: "beforeWrite" | "beforeAccess" | "afterAccess",
        listener: (args: TokenCacheNotificationArgs) => void): this {
        return super.on(event, listener);
    }

    public onBeforeWrite(args: TokenCacheNotificationArgs) {
        this.emit("beforeWrite", args);
    }

    public onBeforeAccess(args: TokenCacheNotificationArgs) {
        this.emit("beforeAccess", args);
    }

    public onAfterAccess(args: TokenCacheNotificationArgs) {
        this.emit("afterAccess", args);
    }

    private queryCache(
        authority: string,
        clientId: string,
        subjectType: TokenSubjectType,
        uniqueId: string,
        displayableId: string): Array<Pair<TokenCacheKey, AuthenticationResultEx>> {

        const results: Array<Pair<TokenCacheKey, AuthenticationResultEx>> = [];
        for (const stringKey of this.tokenCacheDictionary.keys()) {
            const cacheKey = TokenCacheKey.fromStringKey(stringKey);

            if ((!authority || cacheKey.authority === authority)
                && (!clientId || cacheKey.clientIdEquals(clientId))
                && (!uniqueId || cacheKey.uniqueId === uniqueId)
                && (!displayableId || cacheKey.displayableIdEquals(displayableId))
                && cacheKey.tokenSubjectType === subjectType) {

                // TODO: Do I need assertionHash?
                const authResultEx = this.tokenCacheDictionary.get(stringKey);
                results.push(new Pair<TokenCacheKey, AuthenticationResultEx>(cacheKey, authResultEx));
            }
        }

        return results;
    }

    private loadSingleItemFromCache(cacheQueryData: ICacheQueryData): Pair<TokenCacheKey, AuthenticationResultEx> {
        let cacheItems = this.queryCache(
            cacheQueryData.authority,
            cacheQueryData.clientId,
            cacheQueryData.subjectType,
            cacheQueryData.uniqueId,
            cacheQueryData.displayableId);

        cacheItems = cacheItems.filter((p) => p.key.resourceEquals(cacheQueryData.resource));
        let result: Pair<TokenCacheKey, AuthenticationResultEx> = null;
        switch (cacheItems.length) {
            case 1:
                // An item matching the requested resource was found in the cache
                result = cacheItems[0];
                break;

            case 0:
                const multiResourceTokens = cacheItems.filter((p) => p.value.isMultipleResourceRefreshToken);
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
                .filter((item) => TokenCache.isSameCloud(item.key.authority, cacheQueryData.authority));

            if (sameCloudEntries.length) {
                result = sameCloudEntries[0];
            }

            // REVIEW: Do we need to null out ADFS tokens?
        }

        return result;
    }
}
