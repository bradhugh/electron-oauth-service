import { TokenCache } from "./TokenCache";

export class TokenCacheNotificationArgs {
    public tokenCache: TokenCache;
    public clientId: string;
    public resource: string;
    public uniqueId: string;
    public displayableId: string;
}
