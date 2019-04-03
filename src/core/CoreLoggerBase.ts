import { Utils } from "../Utils";
import { AdalLogger } from "./AdalLogger";

export interface ICoreLogger {
    correlationId: string;
    piiLoggingEnabled: boolean;

    error(messageScrubbed: string): void;
    errorPii(messageWithPii: string): void;
    errorExPii(exWithPii: Error): void;
    errorExPiiWithPrefix(exWithPii: Error, prefix: string): void;

    warning(messageScrubbed: string): void;
    warningPii(messageWithPii: string): void;
    warningExPii(exWithPii: Error): void;
    warningExPiiWithPrefix(exWithPii: Error, prefix: string): void;

    info(messageScrubbed: string): void;
    infoPii(messageWithPii: string): void;
    infoExPii(exWithPii: Error): void;
    infoExPiiWithPrefix(exWithPii: Error, prefix: string): void;

    verbose(messageScrubbed: string): void;
    verbosePii(messageWithPii: string): void;
}

export class CoreLoggerBase {
    public static default: ICoreLogger = new AdalLogger(Utils.guidEmpty);
}
