import { net, BrowserWindow } from "electron";
import * as querystring from "querystring";
import { OAuth2Response, OAuth2Config, OAuth2Provider } from "electron-oauth-helper";
import { TokenCache } from "./cache/TokenCache";
import { AuthenticationResult } from "./AuthenticationResult";

export interface PostResponse {
    headers: any;
    statusCode: number;
    statusMessage: string;
    body: Buffer;
}

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

    public static async refreshTokenAsync(url: string, refreshToken: string): Promise<OAuth2Response> {
        const postResponse = await Utils.postRequestAsync(url, {
            grant_type: "refresh_token",
            refresh_token: refreshToken
        });

        const response: OAuth2Response = JSON.parse(postResponse.body.toString('utf8'));
        return response;
    }

    public static async getAuthTokenInteractiveAsync(
        authorizeUrl: string,
        accessTokenUrl: string,
        clientId: string,
        redirectUri: string,
        tenantId: string,
        resourceId: string,
        scope: string,
        tokenCache: TokenCache): Promise<any> {
        const config: OAuth2Config = {
            authorize_url: authorizeUrl,
            access_token_url:accessTokenUrl,
            client_id: clientId,
            scope: `https://${tenantId}/${resourceId}/${scope}`,
            response_type: "code",
            redirect_uri: redirectUri
        };

        const provider = new OAuth2Provider(config);

        let authWindow = new BrowserWindow({
            width: 600,
            height: 800,
            webPreferences: {
              nodeIntegration: false, // We recommend disabling nodeIntegration for security.
              contextIsolation: true // We recommend enabling contextIsolation for security.
              // see https://github.com/electron/electron/blob/master/docs/tutorial/security.md
            },
        });

        try {
            const response = await provider.perform(authWindow);

            // TODO: Cache Token
            
            return new AuthenticationResult(
                response.token_type,
                response.access_token,
                Utils.tokenTimeToJsDate(response.expires_on),
                null); // TODO: ext_expires_in

          } finally {
            authWindow.close();
            authWindow = null;
          }
    }

    public static postRequestAsync(url: string, parameters: Object): Promise<PostResponse> {

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