import { TokenCache } from "./TokenCache";

export class TokenCacheNotificationArgs {
    tokenCache: TokenCache;
    clientId: string;
    resource: string;
    uniqueId: string;
    displayableId: string;
}