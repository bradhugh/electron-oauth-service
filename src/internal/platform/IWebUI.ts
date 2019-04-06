import { AuthorizationResult } from "../AuthorizationResult";
import { CallState } from "../CallState";

export interface IWebUI {
    acquireAuthorizationAsync(
        authorizationUri: URL, redirectUri: URL, callState: CallState): Promise<AuthorizationResult>;
}
