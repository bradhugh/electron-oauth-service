import { OAuth2Provider, OAuth2Config } from "electron-oauth-helper";
import { BrowserWindow } from "electron";
import { Utils } from "./Utils";

export class UserInfo {
}

export class AuthenticationResult {
    public accessToken: string;
    public accessTokenType: string;
    public authority: string;
    public expiresOn: Date;
    public extendedExpiresOn: Date;
    public extendedLifeTimeToken: boolean;
    public idToken: string;
    public tenantId: string;
    public userInfo: UserInfo;

    constructor(
        accessTokenType: string,
        accessToken: string,
        expiresOn: Date,
        extendedExpiresOn?: Date) {

        this.accessTokenType = accessTokenType;
        this.accessToken = accessToken;
        this.expiresOn = expiresOn;
        if (extendedExpiresOn) {
            this.extendedExpiresOn = extendedExpiresOn;
        } else {
            this.extendedExpiresOn = expiresOn;
        }
    }
}

export class AuthenticationContext {

    constructor(
        private authorizeUrl: string,
        private accessTokenUrl: string,
        private redirectUri: string
    ) {}

    public async acquireTokenAsync(
        tenant: string,
        resource: string,
        scope: string = "user_impersonation",
        clientId: string,
        redirectUri: string = null): Promise<AuthenticationResult> {

        if (!redirectUri) {
            redirectUri = this.redirectUri;
        }

        const config: OAuth2Config = {
            authorize_url: this.authorizeUrl,
            access_token_url: this.accessTokenUrl,
            client_id: clientId,
            scope: `https://${tenant}/${resource}/${scope}`,
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
            console.log(response);

            const refreshed = await Utils.refreshToken(this.accessTokenUrl, response.refresh_token);
            console.log("REFRESHED");
            console.log(refreshed);

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
}
