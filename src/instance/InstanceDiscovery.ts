import { AdalError } from "../AdalError";
import { AdalErrorCode } from "../AdalErrorCode";
import { AdalServiceError } from "../AdalServiceError";
import { IHttpManager } from "../core/Http/HttpManager";
import { CallState } from "../internal/CallState";
import { AdalHttpClient } from "../internal/http/AdalHttpClient";

export interface IInstanceDiscoveryMetadataEntry {
    preferred_network: string;
    preferred_cache: string;
    aliases: string[];
}

export interface IInstanceDiscoveryResponse {
    tenant_discovery_endpoint: string;
    metadata: IInstanceDiscoveryMetadataEntry[];
}

export class InstanceDiscovery {
    public static defaultTrustedAuthority = "login.microsoftonline.com";

    // The following cache could be private, but we keep it public so that internal unit test can take a peek into it.
    // Keys are host strings.
    public static instanceCache = new Map<string, IInstanceDiscoveryMetadataEntry>();

    public static isWhitelisted(authorityHost: string): boolean {
        return InstanceDiscovery.whitelistedAuthorities.has(authorityHost);
    }

    public static async getMetadataEntryAsync(
        authority: URL,
        validateAuthority: boolean,
        callState: CallState): Promise<IInstanceDiscoveryMetadataEntry> {
        if (!authority) {
            throw new Error("authority cannot be null");
        }

        let entry: IInstanceDiscoveryMetadataEntry = null;
        if (!InstanceDiscovery.instanceCache.has(authority.host)) {
            await InstanceDiscovery.discoverAsync(authority, validateAuthority, callState);
            if (InstanceDiscovery.instanceCache.has(authority.host)) {
                entry = InstanceDiscovery.instanceCache.get(authority.host);
            }
        } else {
            entry = InstanceDiscovery.instanceCache.get(authority.host);
        }

        return entry;
    }

    public static formatAuthorizeEndpoint(host: string, tenant: string): string {
        return `https://${host}/${tenant}/oauth2/authorize`;
    }

    // To populate a host into the cache as-is, when it is not already there
    public static addMetadataEntry(host: string): boolean {
        if (!host) {
            throw new Error("host cannot be null!");
        }

        InstanceDiscovery.instanceCache.set(host, {
            preferred_network: host,
            preferred_cache: host,
            aliases: null,
        });

        return true;
    }

    private static whitelistedAuthorities = new Set<string>([
        "login.windows.net", // Microsoft Azure Worldwide - Used in validation scenarios where host is not this list
        "login.chinacloudapi.cn", // Microsoft Azure China
        "login.microsoftonline.de", // Microsoft Azure Blackforest
        "login-us.microsoftonline.com", // Microsoft Azure US Government - Legacy
        "login.microsoftonline.us", // Microsoft Azure US Government
        "login.microsoftonline.com", // Microsoft Azure Worldwide
    ]);

    private static getTenant(uri: URL): string {
        return uri.href.split("/")[1];  // Will generate exception when tenant can not be determined
    }

    // No return value. Modifies InstanceCache directly.
    private static async discoverAsync(
        authority: URL, validateAuthority: boolean, callState: CallState): Promise<void> {

        const authorityHost = InstanceDiscovery.whitelistedAuthorities.has(authority.host) ?
            authority.host : InstanceDiscovery.defaultTrustedAuthority;

        const authorizeEndpoint = InstanceDiscovery.formatAuthorizeEndpoint(
            authority.host, InstanceDiscovery.getTenant(authority));

        // tslint:disable-next-line: max-line-length - not really sure how to make it short enough
        const instanceDiscoveryEndpoint = `https://${authorityHost}/common/discovery/instance?api-version=1.1&authorization_endpoint=${authorizeEndpoint}`;

        const client = new AdalHttpClient(instanceDiscoveryEndpoint, callState);
        let discoveryResponse: IInstanceDiscoveryResponse = null;
        try {
            discoveryResponse = await client.getResponseAsync<IInstanceDiscoveryResponse>();
            if (validateAuthority && !discoveryResponse.tenant_discovery_endpoint) {
                // hard stop here
                throw new AdalError(AdalErrorCode.authorityNotInValidList, null, null);
            }
        } catch (error) {
            if (!(error instanceof AdalServiceError)) {
                throw error;
            }

            const ex = error as AdalServiceError;

            // The pre-existing implementation
            // has been coded in this way: it catches the AdalServiceException and then
            // translate it into 2 validation-relevant exceptions.
            // So the following implementation absorbs these specific exceptions
            // when the validateAuthority flag is false.
            // All other unexpected exceptions will still bubble up, as always.
            if (validateAuthority) {
                // hard stop here
                throw new AdalError(
                    (ex.errorCode === "invalid_instance")
                        ? AdalErrorCode.authorityNotInValidList
                        : AdalErrorCode.authorityValidationFailed, null, ex);
            }
        }

        if (discoveryResponse && discoveryResponse.metadata) {
            for (const entry of discoveryResponse.metadata) {
                if (entry.aliases) {
                    for (const aliasedAuthority of entry.aliases) {
                        InstanceDiscovery.instanceCache.set(aliasedAuthority, entry);
                    }
                }
            }
        }

        InstanceDiscovery.addMetadataEntry(authority.host);
    }
}
