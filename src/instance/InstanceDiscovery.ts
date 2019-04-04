import { IHttpManager } from "../core/Http/HttpManager";
import { RequestContext } from "../core/RequestContext";

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

    public static isWhitelisted(authorityHost: string): boolean {
        return InstanceDiscovery.whitelistedAuthorities.indexOf(authorityHost) !== -1
            || InstanceDiscovery.whitelistedDomains.find(
                (value, i, _arr) => value.endsWith(authorityHost.toLowerCase())) !== null;
    }

    public static formatAuthorizeEndpoint(host: string, tenant: string) {
        return `https://${host}/${tenant}/oauth2/authorize`;
    }

    private static whitelistedAuthorities: string[] = [
        "login.windows.net", // Microsoft Azure Worldwide - Used in validation scenarios where host is not this list
        "login.chinacloudapi.cn", // Microsoft Azure China
        "login.microsoftonline.de", // Microsoft Azure Blackforest
        "login-us.microsoftonline.com", // Microsoft Azure US Government - Legacy
        "login.microsoftonline.us", // Microsoft Azure US Government
        "login.microsoftonline.com", // Microsoft Azure Worldwide
    ];

    private static whitelistedDomains: string[] = [
        "dsts.core.windows.net",
        "dsts.core.chinacloudapi.cn",
        "dsts.core.cloudapi.de",
        "dsts.core.usgovcloudapi.net",
        "dsts.core.azure-test.net",
    ];

    private static getTenant(uri: URL): string {
        const segments = uri.pathname.split("/");
        return segments[segments.length - 1];
    }

    private static getHost(uri: URL): string {
        if (InstanceDiscovery.whitelistedDomains.find((domain) => uri.host.endsWith(domain))) {
            // Host + Virtual directory
            const segments = uri.pathname.split("/");
            return `${uri.host}/${segments[1]}`;
        } else {
            return uri.host;
        }
    }

    public instanceCache: { [key: string]: IInstanceDiscoveryMetadataEntry } = {};

    constructor(private httpManager: IHttpManager) {}

    public async getMetadataEntryAsync(
        authority: URL,
        validateAuthority: boolean,
        requestContext: RequestContext): Promise<IInstanceDiscoveryMetadataEntry> {

        if (!authority) {
            throw new Error("Authority cannot be null");
        }

        let entry: IInstanceDiscoveryMetadataEntry = this.instanceCache[authority.host];
        if (!entry) {
            this.discoverAsync(authority, validateAuthority, requestContext);
            entry = this.instanceCache[authority.host];
        }

        return entry;
    }

    public async discoverAsync(
        authority: URL,
        validateAuthority: boolean,
        requestContext: RequestContext): Promise<void> {

        const authorityHost = InstanceDiscovery.isWhitelisted(authority.host) ?
            InstanceDiscovery.getHost(authority) : InstanceDiscovery.defaultTrustedAuthority;
        const tenant = InstanceDiscovery.formatAuthorizeEndpoint(
            authority.host, InstanceDiscovery.getTenant(authority));
        const instanceDiscoveryEndpoint =
            `https://${authorityHost}/common/discovery/instance?api-version=1.1&authorization_endpoint=${tenant}`;

        // I diverged here a bit, going to directly into HttpManager instead of building OAuthClient
        let discoveryResponse: IInstanceDiscoveryResponse = null;
        try {
            const httpResponse = await this.httpManager.sendGetAsync(instanceDiscoveryEndpoint, {}, requestContext);
            if (httpResponse.statusCode !== 200) {
                throw new Error(`Metadata discovery failed. Status: ${httpResponse.statusCode}`);
            }

            discoveryResponse = JSON.parse(httpResponse.body) as IInstanceDiscoveryResponse;
            if (validateAuthority && !discoveryResponse.tenant_discovery_endpoint) {
                // hard stop here
                throw new Error("Authority not in valid list");
            }

        } catch (error) {
            if (validateAuthority) {
                throw new Error("Could not fetch metadata, thus could not validate authority");
            }
        }

        if (discoveryResponse && discoveryResponse.metadata) {
            for (const entry of discoveryResponse.metadata) {
                for (const aliasedAuthority of entry.aliases) {
                    this.instanceCache[aliasedAuthority] = entry;
                }
            }
        }

        this.addMetadataEntry(authority.host);
    }

    public addMetadataEntry(host: string): boolean {
        if (!host) {
            throw new Error("Host cannot be null");
        }

        this.instanceCache[host] = {
            preferred_network: host,
            preferred_cache: host,
            aliases: [],
        };

        // REVIEW: TryAdd?
        return true;
    }
}
