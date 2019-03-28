import { EventEmitter } from "electron";
import { TokenCacheItem } from "./TokenCacheItem";
import { AuthenticationResultEx } from "../AuthenticationResult";
import { TokenCacheKey } from "./TokenCacheKey";

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