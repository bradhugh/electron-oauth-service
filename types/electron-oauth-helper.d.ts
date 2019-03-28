declare module "electron-oauth-helper" {

    import { BrowserWindow } from "electron";

    export interface OAuth2Config {
        authorize_url: string;
        access_token_url: string;
        response_type: string;
        scope: string;
        client_id: string;
        redirect_uri: string;
    }

    export interface OAuth2Response {
        token_type: string;
        scope: string;
        expires_in: string;
        ext_expires_in: string;
        expires_on: string;
        not_before: string;
        resource: string;
        access_token: string;
        refresh_token: string;
        id_token: string;
    }

    export class OAuth2Provider {
        constructor(config: OAuth2Config);

        perform(authWindow: BrowserWindow): Promise<OAuth2Response>;
    }
}
