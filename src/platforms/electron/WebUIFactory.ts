import { PromptBehavior } from "../../features/electron/PromptBehavior";
import { IPlatformParameters } from "../../internal/platform/IPlatformParameters";
import { IWebUI } from "../../internal/platform/IWebUI";
import { IWebUIFactory } from "../../internal/platform/IWebUIFactory";
import { InteractiveWebUI } from "./InteractiveWebUI";
import { PlatformParameters } from "./PlatformParameters";

export class WebUIFactory implements IWebUIFactory {
    public createAuthenticationDialog(inputParameters: IPlatformParameters): IWebUI {
        const parameters = inputParameters as PlatformParameters;
        if (!parameters) {
            throw new Error("parameters should be of type PlatformParameters");
        }

        switch (parameters.promptBehavior) {
            case PromptBehavior.Auto:
            case PromptBehavior.Always:
            case PromptBehavior.SelectAccount:
            case PromptBehavior.RefreshSession:
                return new InteractiveWebUI();
            case PromptBehavior.Never:
                throw new Error("SilentWebUI not supported yet!");
            default:
                throw new Error("Unexpected PromptBehavior value");
        }
    }
}
