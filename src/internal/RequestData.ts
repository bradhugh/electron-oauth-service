import { ClientKey } from "../flows/AcquireTokenHandlerBase";
import { Authenticator } from "../instance/Authenticator";
import { TokenCache } from "../TokenCache";
import { TokenSubjectType } from "./cache/TokenCacheKey";

export interface IRequestData {
    authenticator: Authenticator;
    tokenCache: TokenCache;
    resource: string;
    clientKey: ClientKey;
    subjectType: TokenSubjectType;
    extendedLifeTimeEnabled: boolean;
    correlationId: string;
}
