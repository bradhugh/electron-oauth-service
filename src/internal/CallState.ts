import { ConsoleLogger } from "../core/ConsoleLogger";
import { ILogger } from "../ILogger";
import { Utils } from "../Utils";

export class CallState {
    constructor(
        public correlationId: string,
        public logger: ILogger) {
    }
}
