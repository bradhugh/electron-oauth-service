import { ICoreLogger } from "./CoreLoggerBase";

export class RequestContext {

    public telemetryRequestId: string;

    constructor(public clientId: string, public logger: ICoreLogger) {
        this.clientId = !clientId ? "unset_client_id" : clientId;
    }
}
