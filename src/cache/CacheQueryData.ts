import { TokenSubjectType } from "./TokenCache";

export interface CacheQueryData {
    authority?: string;
    resource?: string;
    clientId?: string;
    subjectType?: TokenSubjectType;
    uniqueId?: string;
    displayableId?: string;
    assertionHash?: string;
    extendedLifeTimeEnabled?: boolean;
}