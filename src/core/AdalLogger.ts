import { ICoreLogger } from "./CoreLoggerBase";

// tslint:disable: no-console

export class AdalLogger implements ICoreLogger {
    public piiLoggingEnabled: boolean;

    constructor(public correlationId: string) {}

    public error(messageScrubbed: string): void {
        console.log(messageScrubbed);
    }

    public errorPii(messageWithPii: string): void {
        console.log(messageWithPii);
    }

    public errorExPii(exWithPii: Error): void {
        console.log(exWithPii);
    }

    public errorExPiiWithPrefix(exWithPii: Error, prefix: string): void {
        console.log(exWithPii);
    }

    public warning(messageScrubbed: string): void {
        console.log(messageScrubbed);
    }

    public warningPii(messageWithPii: string): void {
        console.log(messageWithPii);
    }

    public warningExPii(exWithPii: Error): void {
        console.log(exWithPii);
    }

    public warningExPiiWithPrefix(exWithPii: Error, prefix: string): void {
        console.log(exWithPii);
    }

    public info(messageScrubbed: string): void {
        console.log(messageScrubbed);
    }

    public infoPii(messageWithPii: string): void {
        console.log(messageWithPii);
    }

    public infoExPii(exWithPii: Error): void {
        console.log(exWithPii);
    }

    public infoExPiiWithPrefix(exWithPii: Error, prefix: string): void {
        console.log(exWithPii);
    }

    public verbose(messageScrubbed: string): void {
        console.log(messageScrubbed);
    }

    public verbosePii(messageWithPii: string): void {
        console.log(messageWithPii);
    }
}
