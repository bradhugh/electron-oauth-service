import { TokenSubjectType } from "../internal/cache/TokenCacheKey";
import { TokenCache } from "../TokenCache";

export class ClientKey {
    constructor(public clientId: string) {}

    public addToParameters(parameters: { [key: string]: string }): void {
        if (this.clientId) {
            parameters.client_id = this.clientId;
        }
    }
}

export interface IRequestData {
    tokenCache: TokenCache;
    resource: string;
    clientKey: ClientKey;
    subjectType: TokenSubjectType;
    extendedLifeTimeEnabled: boolean;
}

// tslint:disable-next-line: max-classes-per-file
export class AcquireTokenHandlerBase {
    public resource: string;
}
