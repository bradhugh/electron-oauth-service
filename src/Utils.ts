import { net } from "electron";
import * as querystring from "querystring";

export class Utils {
    public static tokenTimeToJsDate(time: string) {

        if (!time) {
            return null;
        }

        // The date is represented as the number of seconds from 1970-01-01T0:0:0Z UTC
        const secs = parseInt(time);
        const jan11970 = Date.UTC(1970, 1, 1, 0, 0, 0, 0);
        const date = new Date(jan11970 + (secs * 1000));
        
        return date;
    }

    public static async refreshToken(url: string, refreshToken: string) {
        const myData = await Utils.postRequest(url, {
            grant_type: "refresh_token",
            refresh_token: refreshToken
        });

        console.log(myData);
    }

    public static postRequest(url: string, parameters: Object): Promise<any> {

        return new Promise((resolve, reject) => {
            const postData = querystring.stringify(parameters);

            const request = net.request({
                url,
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": Buffer.byteLength(postData)
                }
            });

            request.on("response", response => {

                const datas: Buffer[] = [];
        
                response.on("data", chunk => {
                    datas.push(chunk);
                });
        
                response.on("end", () => {
                    const body = Buffer.concat(datas)
                    const resp = {
                        headers: response.headers,
                        statusCode: response.statusCode,
                        statusMessage: response.statusMessage,
                        body: body,
                    }

                    resolve(resp);
                });
        
                response.on("error", (error: Error) => {
                    reject(error)
                });
            });
        
            request.write(postData, "utf8");
            request.end();
        });
    }
}