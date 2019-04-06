import { CallState } from "../CallState";
import { AdalIdHelper } from "../helpers/AdalIdHelper";
import { OAuthParameter, PromptValue } from "../oauth2/OAuthConstants";
import { DictionaryRequestParameters } from "../RequestParameters";
import { IPlatformParameters } from "./IPlatformParameters";

export abstract class PlatformInformationBase {
    public abstract getProductName(): string;
    public abstract getEnvironmentVariable(variable: string): string;
    public abstract getUserPrincipalNameAsync(): Promise<string>;
    public abstract getProcessorArchitecture(): string;
    public abstract getOperatingSystem(): string;
    public abstract getDeviceModel(): string;

    public getAssemblyFileVersionAttribute(): string {
        return AdalIdHelper.versionNotDetermined;
    }

    public async isUserLocalAsync(callState: CallState): Promise<boolean> {
        return false;
    }

    public isDomainJoined(): boolean {
        return false;
    }

    public addPromptBehaviorQueryParameter(
        parameters: IPlatformParameters,
        authorizationRequestParameters: DictionaryRequestParameters): void {
        authorizationRequestParameters.set(OAuthParameter.prompt, PromptValue.login);
    }

    public getCacheLoadPolicy(parameters: IPlatformParameters): boolean {
        return true;
    }

    public validateRedirectUri(redirectUri: URL, callState: CallState): URL {
        if (!redirectUri) {
            throw new Error("redirectUri cannot be null");
        }

        return redirectUri;
    }

    public getRedirectUriAsString(redirectUri: URL, callState: CallState): string {
        return redirectUri.href;
    }
}
