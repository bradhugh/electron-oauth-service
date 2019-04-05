import { PlatformInformationBase } from "./PlatformInformationBase";

export class PlatformInformation extends PlatformInformationBase {
    public getProductName(): string {
        return "Electron OAuth Service module";
    }

    public getEnvironmentVariable(variable: string): string {
        // TODO: Environment variable support
        return null;
    }

    public async getUserPrincipalNameAsync(): Promise<string> {
        return "user@contoso.com"; // TODO: Need to figure out how this is used
    }

    public getProcessorArchitecture(): string {
        return "x64"; // TODO: Node can do this
    }

    public getOperatingSystem(): string {
        return "Windows 10"; // TODO: Node can do this
    }

    public getDeviceModel(): string {
        return "Windows 10"; // TODO: Model
    }
}
