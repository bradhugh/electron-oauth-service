import { IServiceBundle } from "../core/ServiceBundle";
import { InstanceDiscovery } from "./InstanceDiscovery";

export enum AuthorityType {
    AAD,
    ADFS,
}

export class Authenticator {
    private tenantlessTenantName = "Common";

    private _validateAuthority = false;
    private _updatedFromTemplate = false;
    private _authority: string = null;
    private _authorityType: AuthorityType;
    private _serviceBundle: IServiceBundle;

    public authorizationUri: string;
    public deviceCodeUri: string;
    public tokenUri: string;
    public userRealmUriPrefix: string;
    public isTenantless: boolean;
    public selfSignedJwtAudience: string;

    public get validateAuthority(): boolean {
        return this._validateAuthority;
    }

    public get authority(): string {
        return this._authority;
    }

    public get authorityType(): AuthorityType {
        return this._authorityType;
    }

    public get serviceBundle(): IServiceBundle {
        return this._serviceBundle;
    }

    constructor(serviceBundle: IServiceBundle, authority: string, validateAuthority: boolean) {
        this.init(serviceBundle, authority, validateAuthority);
    }

    public UpdateAuthorityAsync(authority: string): Promise<void> {

    }

    public async UpdateFromTemplateAsync(): Promise<void> {
        if (!this._updatedFromTemplate) {
            const authorityUri = new URL(this.authority);
            var host = authorityUri.host;

            // The authority could be https://{AzureAD host name}/{tenantid} OR https://{Dsts host name}/dstsv2/{tenantid}
            // Detecting the tenantId using the last segment of the url
            const segments = authorityUri.pathname.split("/");
            const tenant: string = segments[segments.length - 1];
            if (this.authorityType == AuthorityType.AAD)
            {
                var metadata = await this.serviceBundle.instanceDiscovery.getMetadataEntryAsync(authorityUri, this.validateAuthority, requestContext).ConfigureAwait(false);
                host = metadata.PreferredNetwork;
                // All the endpoints will use this updated host, and it affects future network calls, as desired.
                // The Authority remains its original host, and will be used in TokenCache later.
            } else {
                this.serviceBundle.instanceDiscovery.addMetadataEntry(host);
            }

            this.authorizationUri = InstanceDiscovery.formatAuthorizeEndpoint(host, tenant);
            this.deviceCodeUri = `https://${host}/${tenant}/oauth2/devicecode`;
            this.tokenUri = `https://${host}/${tenant}/oauth2/token`;
            this.userRealmUriPrefix = `https://${host}/common/userrealm/`;
            this.isTenantless = tenant.toLowerCase() === this.tenantlessTenantName.toLowerCase();
            this.selfSignedJwtAudience = this.tokenUri;
            this._updatedFromTemplate = true;
        }
    }

    public static ensureUrlEndsWithForwardSlash(uri: string): string {
        if (uri && !uri.endsWith("/")) {
            uri = uri + "/";
        }

        return uri;
    }

    public static DetectAuthorityType(authority: string): AuthorityType {
        if (!authority) {
            throw new Error("authority cannot be null or empty");
        }

        const authorityUri = new URL(authority);
        if (authorityUri.protocol !== "https") {
            throw new Error("authority must be HTTPS");
        }

        const path: string = authorityUri.pathname.substring(1);
        if (!path) {
            throw new Error("The authority path is invalid");
        }

        const firstPath = path.substring(0, path.indexOf("/"));
        const authorityType: AuthorityType = Authenticator.isAdfsAuthority(firstPath) ? AuthorityType.ADFS : AuthorityType.AAD;

        return authorityType;
    }

    private static isAdfsAuthority(firstPath: string) {
        return firstPath.toLowerCase().startsWith("adfs");
    }

    private init(serviceBundle: IServiceBundle, authority: string, validateAuthority: boolean): void {

        this._authority = Authenticator.ensureUrlEndsWithForwardSlash(authority);
        this._authorityType = Authenticator.DetectAuthorityType(authority);

        if (this.authorityType !== AuthorityType.AAD && validateAuthority)
        {
            throw new Error("UnsupportedAuthorityValidation");
        }

        this._validateAuthority = true;
        this._serviceBundle = serviceBundle;
    }
}
