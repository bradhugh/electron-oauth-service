import { PlatformInformation } from "../platform/PlatformInformation";

// tslint:disable: max-classes-per-file

export class AdalIdParameter {
    /// <summary>
    /// ADAL Flavor: PCL.CoreCLR, PCL.Android, PCL.iOS, PCL.Desktop, PCL.WinRT
    /// </summary>
    public static product = "x-client-SKU";

    /// <summary>
    /// ADAL assembly version
    /// </summary>
    public static version = "x-client-Ver";

    /// <summary>
    /// CPU platform with x86, x64 or ARM as value
    /// </summary>
    public static cpuPlatform = "x-client-CPU";

    /// <summary>
    /// Version of the operating system. This will not be sent on WinRT
    /// </summary>
    public static os = "x-client-OS";

    /// <summary>
    /// Device model. This will not be sent on .NET
    /// </summary>
    public static deviceModel = "x-client-DM";
}

/// <summary>
/// This class adds additional query parameters or headers to the requests sent to STS. This can help us in
/// collecting statistics and potentially on diagnostics.
/// </summary>
export class AdalIdHelper {
    public static versionNotDetermined = "0.0.0.0";

    public static getAdalIdParameters(): Map<string, string> {
        const parameters = new Map<string, string>();

        parameters.set(AdalIdParameter.product, new PlatformInformation().getProductName());
        parameters.set(AdalIdParameter.version, AdalIdHelper.getAdalVersion());

        const processorInformation = new PlatformInformation().getProcessorArchitecture();
        if (processorInformation != null) {
            parameters.set(AdalIdParameter.cpuPlatform, processorInformation);
        }

        const osInformation = new PlatformInformation().getOperatingSystem();
        if (osInformation != null) {
            parameters.set(AdalIdParameter.os, osInformation);
        }

        const deviceInformation = new PlatformInformation().getDeviceModel();
        if (deviceInformation != null) {
            parameters.set(AdalIdParameter.deviceModel, deviceInformation);
        }

        return parameters;
    }

    public static getAdalVersion(): string {
        return AdalIdHelper.versionNotDetermined;
    }

    public static getAssemblyFileVersion(): string {
        return new PlatformInformation().getAssemblyFileVersionAttribute();
    }

    public static getClientVersion(): string {
        let clientVersion = AdalIdHelper.getAdalVersion();
        if (AdalIdHelper.versionNotDetermined === clientVersion) {
            clientVersion = AdalIdHelper.getAssemblyFileVersion();
        }
        return clientVersion;
    }

    public static getAssemblyInformationalVersion(): string {
        return AdalIdHelper.versionNotDetermined;
    }
}
