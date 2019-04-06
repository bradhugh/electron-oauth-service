import { IPlatformParameters } from "./IPlatformParameters";
import { IWebUI } from "./IWebUI";

export interface IWebUIFactory {
    createAuthenticationDialog(parameters: IPlatformParameters): IWebUI;
}
