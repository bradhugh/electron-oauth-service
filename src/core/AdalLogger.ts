import { ICoreLogger } from "./CoreLoggerBase";

export class AdalLogger implements ICoreLogger {
    public piiLoggingEnabled: boolean;

    constructor(public correlationId: string) {}

    error(messageScrubbed: string): void {
        console.log(messageScrubbed);
    }

    errorPii(messageWithPii: string): void {
        console.log(messageWithPii);
    }

    errorExPii(exWithPii: Error): void {
        console.log(exWithPii);
    }

    errorExPiiWithPrefix(exWithPii: Error, prefix: string): void {
        console.log(exWithPii);
    }

    warning(messageScrubbed: string): void {
        console.log(messageScrubbed);
    }

    warningPii(messageWithPii: string): void {
        console.log(messageWithPii);
    }

    warningExPii(exWithPii: Error): void {
        console.log(exWithPii);
    }

    warningExPiiWithPrefix(exWithPii: Error, prefix: string): void {
        console.log(exWithPii);
    }

    info(messageScrubbed: string): void {
        console.log(messageScrubbed);
    }

    infoPii(messageWithPii: string): void {
        console.log(messageWithPii);
    }

    infoExPii(exWithPii: Error): void {
        console.log(exWithPii);
    }

    infoExPiiWithPrefix(exWithPii: Error, prefix: string): void {
        console.log(exWithPii);
    }

    verbose(messageScrubbed: string): void {
        console.log(messageScrubbed);
    }

    verbosePii(messageWithPii: string): void {
        console.log(messageWithPii);
    }
}