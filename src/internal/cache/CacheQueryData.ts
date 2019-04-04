import { TokenSubjectType } from "./TokenCacheKey";

export interface ICacheQueryData {
    authority: string;
    resource: string;
    clientId: string;
    subjectType: TokenSubjectType;
    uniqueId?: string;
    displayableId?: string;
    assertionHash?: string;
    extendedLifeTimeEnabled?: boolean;
}
