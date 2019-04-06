import { Authenticator } from "../instance/Authenticator";
import { TokenCache } from "../TokenCache";
import { TokenSubjectType } from "./cache/TokenCacheKey";
import { ClientKey } from "./clientcreds/ClientKey";

export interface IRequestData {
    authenticator: Authenticator;
    tokenCache: TokenCache;
    resource: string;
    clientKey: ClientKey;
    subjectType: TokenSubjectType;
    extendedLifeTimeEnabled: boolean;
    correlationId: string;
}
