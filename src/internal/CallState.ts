import { ConsoleLogger } from "../core/AdalLogger";
import { ICoreLogger } from "../core/CoreLoggerBase";
import { Utils } from "../Utils";

export class CallState {
    public static default: CallState = new CallState(Utils.guidEmpty);

    public logger: ICoreLogger;

    constructor(public correlationId: string) {
        this.logger = new ConsoleLogger(correlationId);
    }
}
