import { PromptBehavior } from "../../features/electron/PromptBehavior";
import { IPlatformParameters } from "../../internal/platform/IPlatformParameters";

/// <summary>
/// Additional parameters used in acquiring user's authorization
/// </summary>
export class PlatformParameters implements IPlatformParameters {
    public something: boolean = true;

    constructor(
        public promptBehavior: PromptBehavior,
        public ownerWindow: object) {}
}
