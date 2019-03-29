import { TokenCache, TokenSubjectType } from "../cache/TokenCache";

export class ClientKey {
    constructor(public clientId: string) {}

    addToParameters(parameters: { [key: string]: string }): void {
        if (this.clientId) {
            parameters["client_id"] = this.clientId;
        }
    }
}

export interface RequestData {
    tokenCache: TokenCache;
    resource: string;
    clientKey: ClientKey;
    subjectType: TokenSubjectType;
    extendedLifeTimeEnabled: boolean;
}

export class AcquireTokenHandlerBase {
    resource: string;
}