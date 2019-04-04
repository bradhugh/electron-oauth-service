import { ICoreLogger } from "./CoreLoggerBase";

// tslint:disable: no-console

export class ConsoleLogger implements ICoreLogger {
    public piiLoggingEnabled: boolean = false;

    constructor(public correlationId: string) {}

    public error(messageScrubbed: string): void {
        console.log(`[ELOAS] [ERROR] ${messageScrubbed}`);
    }

    public errorPii(messageWithPii: string): void {
        if (this.piiLoggingEnabled) {
            console.log(`[ELOAS] [ERROR] ${messageWithPii}`);
        }
    }

    public errorExPii(exWithPii: Error): void {
        if (this.piiLoggingEnabled) {
            console.log("[ELOAS] [ERROR]");
            console.log(exWithPii);
        }
    }

    public errorExPiiWithPrefix(exWithPii: Error, prefix: string): void {
        if (this.piiLoggingEnabled) {
            console.log(`[ELOAS] [ERROR] ${prefix}`);
            console.log(exWithPii);
        }
    }

    public warning(messageScrubbed: string): void {
        console.log(`[ELOAS] [WARN] ${messageScrubbed}`);
    }

    public warningPii(messageWithPii: string): void {
        if (this.piiLoggingEnabled) {
            console.log(`[ELOAS] [WARN] ${messageWithPii}`);
        }
    }

    public warningExPii(exWithPii: Error): void {
        if (this.piiLoggingEnabled) {
            console.log("[ELOAS] [WARN]");
            console.log(exWithPii);
        }
    }

    public warningExPiiWithPrefix(exWithPii: Error, prefix: string): void {
        if (this.piiLoggingEnabled) {
            console.log(`[ELOAS] [WARN] ${prefix}`);
            console.log(exWithPii);
        }
    }

    public info(messageScrubbed: string): void {
        console.log(`[ELOAS] [INFO] ${messageScrubbed}`);
    }

    public infoPii(messageWithPii: string): void {
        if (this.piiLoggingEnabled) {
            console.log(`[ELOAS] [INFO] ${messageWithPii}`);
        }
    }

    public infoExPii(exWithPii: Error): void {
        if (this.piiLoggingEnabled) {
            console.log("[ELOAS] [INFO]");
            console.log(exWithPii);
        }
    }

    public infoExPiiWithPrefix(exWithPii: Error, prefix: string): void {
        if (this.piiLoggingEnabled) {
            console.log(`[ELOAS] [INFO] ${prefix}`);
            console.log(exWithPii);
        }
    }

    public verbose(messageScrubbed: string): void {
        console.log(`[ELOAS] [VERBOSE] ${messageScrubbed}`);
    }

    public verbosePii(messageWithPii: string): void {
        if (this.piiLoggingEnabled) {
            console.log(`[ELOAS] [VERBOSE] ${messageWithPii}`);
        }
    }
}
