import { AuthorizationResult } from "../../internal/AuthorizationResult";
import { CallState } from "../../internal/CallState";
import { IWebUI } from "../../internal/platform/IWebUI";
import { ElectronWebAuthenticationDialog } from "./ElectronWebAuthenticationDialog";

export class InteractiveWebUI implements IWebUI {

    constructor(private ownerWindow: object) {}

    public acquireAuthorizationAsync(
        authorizationUri: URL,
        redirectUri: URL,
        callState: CallState): Promise<AuthorizationResult> {

        callState.logger.infoPii(`Authorization URL: ${authorizationUri.href}`);
        const dialog = new ElectronWebAuthenticationDialog(this.ownerWindow);
        return dialog.authenticateAAD(authorizationUri, redirectUri);
    }
}
