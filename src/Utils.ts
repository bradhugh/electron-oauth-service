import { net, BrowserWindow } from "electron";
import * as querystring from "querystring";
import { OAuth2Response, OAuth2Config, OAuth2Provider } from "electron-oauth-helper";
import { TokenCache } from "./TokenCache";
import { AuthenticationResult, AuthenticationResultEx } from "./AuthenticationResult";
import { TokenCacheItem } from "./TokenCacheItem";
import { TokenSubjectType } from "./internal/cache/TokenCacheKey";

export interface PostResponse {
    headers: any;
    statusCode: number;
    statusMessage: string;
    body: Buffer;
}

export class Utils {

    public static guidEmpty = "00000000-0000-0000-0000-000000000000";

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

    public static async refreshAccessTokenAsync(
        url: string,
        authority: string,
        resource: string,
        clientId: string,
        resultEx: AuthenticationResultEx,
        tokenCache: TokenCache): Promise<AuthenticationResultEx> {

        const postResponse = await Utils.postRequestAsync(url, {
            grant_type: "refresh_token",
            refresh_token: resultEx.refreshToken,
            scope: "openid",
            resource: resource,
            client_id: clientId,
        });

        if (postResponse.statusCode !== 200) {
            console.log("FAILED RESPONSE:");
            console.log(postResponse.body.toString('utf8'));
            throw new Error(`Failed to refresh token. Error: ${postResponse.statusCode} - ${postResponse.statusMessage}`);
        }

        const responseString = postResponse.body.toString('utf8');
        
        console.log("****POST RESPONSE****");
        console.log(responseString);

        const response: OAuth2Response = JSON.parse(responseString);

        resultEx.result = new AuthenticationResult(
            response.token_type,
            response.access_token,
            Utils.tokenTimeToJsDate(response.expires_on),
            null); // TODO: ext_expires_in

        if (!response.refresh_token) {
            console.log("Refresh token was missing from the token refresh response, so the refresh token in the request is returned instead");
        } else {
            resultEx.refreshToken = response.refresh_token;
        }

        // REVIEW: What should TokenSubjectType be?
        tokenCache.storeToCache(resultEx, authority, resource, clientId, TokenSubjectType.Client);

        return resultEx;
    }

    //private async sendTokenRequestByRefreshTokenAsync(refreshToken: string): AuthenticationResultEx {}

    public static async getAuthTokenInteractiveAsync(
        authority: string,
        authorizeUrl: string,
        accessTokenUrl: string,
        clientId: string,
        redirectUri: string,
        tenantId: string,
        resourceId: string,
        scope: string,
        tokenCache: TokenCache): Promise<AuthenticationResultEx> {
        const config: OAuth2Config = {
            authorize_url: authorizeUrl,
            access_token_url:accessTokenUrl,
            client_id: clientId,
            scope: `https://${tenantId}/${resourceId}/${scope}`,
            response_type: "code",
            redirect_uri: redirectUri,
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

            const result = new AuthenticationResult(
                response.token_type,
                response.access_token,
                Utils.tokenTimeToJsDate(response.expires_on),
                null); // TODO: ext_expires_in

            const exResult = new AuthenticationResultEx();
            exResult.result = result;
            exResult.refreshToken = response.refresh_token;
            exResult.error = null;

            // REVIEW: What should TokenSubjectType be?
            tokenCache.storeToCache(exResult, authority, resourceId, clientId, TokenSubjectType.Client);
            
            return exResult;

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
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}