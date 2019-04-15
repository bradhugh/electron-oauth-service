import { ILogger } from "../ILogger";

export class RequestContext {

    public telemetryRequestId: string;

    constructor(public clientId: string, public logger: ILogger) {
        this.clientId = !clientId ? "unset_client_id" : clientId;
    }
}
