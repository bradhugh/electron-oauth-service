import * as uuidv4 from "uuid/v4";

export interface IPostResponse {
    headers: any;
    statusCode: number;
    statusMessage: string;
    body: Buffer;
}

export class Utils {

    public static guidEmpty = "00000000-0000-0000-0000-000000000000";

    public static newGuid(): string {
        return uuidv4();
    }

    public static delay(milliseconds: number): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            setTimeout(resolve, milliseconds);
        });
    }

    public static tokenTimeToJsDate(time: string) {

        if (!time) {
            return null;
        }

        // The date is represented as the number of seconds from 1970-01-01T0:0:0Z UTC
        const secs = parseInt(time, 10);
        const jan11970 = Date.UTC(1970, 1, 1, 0, 0, 0, 0);
        const date = new Date(jan11970 + (secs * 1000));

        return date;
    }

    public static trimStart(input: string, character: string): string {
        const exp = new RegExp(`^[${Utils.escapeRegExp(character)}]+`, "g");
        return input.replace(exp, "");
    }

    public static trimEnd(input: string, character: string): string {
        const exp = new RegExp(`[${Utils.escapeRegExp(character)}]+$`, "g");
        return input.replace(exp, "");
    }

    public static trim(input: string, character: string): string {
        input = this.trimStart(input, character);
        input = this.trimEnd(input, character);
        return input;
    }

    public static escapeRegExp(input: string): string {
        return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
}
