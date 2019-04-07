import { AuthorizationResult } from "../../internal/AuthorizationResult";
import { CallState } from "../../internal/CallState";
import { IWebUI } from "../../internal/platform/IWebUI";

export class InteractiveWebUI implements IWebUI {
    public acquireAuthorizationAsync(
        authorizationUri: URL,
        redirectUri: URL,
        callState: CallState): Promise<AuthorizationResult> {

        callState.logger.infoPii(`Authorization URL: ${authorizationUri.href}`);
        throw new Error("InteractiveWebUI.acquireAuthorizationAsync not implemented.");
    }
}
