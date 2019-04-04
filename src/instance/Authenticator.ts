import { RequestContext } from "../core/RequestContext";
import { IServiceBundle } from "../core/ServiceBundle";
import { CallState } from "../internal/CallState";
import { Utils } from "../Utils";
import { InstanceDiscovery } from "./InstanceDiscovery";

export enum AuthorityType {
    AAD,
    ADFS,
}

export class Authenticator {

    public static ensureUrlEndsWithForwardSlash(uri: string): string {
        if (uri && !uri.endsWith("/")) {
            uri = uri + "/";
        }

        return uri;
    }

    public static detectAuthorityType(authority: string): AuthorityType {
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
        const authorityType: AuthorityType = Authenticator.isAdfsAuthority(firstPath) ?
            AuthorityType.ADFS : AuthorityType.AAD;

        return authorityType;
    }

    private static isAdfsAuthority(firstPath: string) {
        return firstPath.toLowerCase().startsWith("adfs");
    }

    public correlationId: string = Utils.guidEmpty;

    private tenantlessTenantName = "Common";

    private _validateAuthority = false;
    private _updatedFromTemplate = false;
    private _authority: string = null;
    private _authorityType: AuthorityType = AuthorityType.AAD;
    private _serviceBundle: IServiceBundle = null;
    private _authorizationUri: string = null;
    private _deviceCodeUri: string = null;
    private _tokenUri: string = null;
    private _userRealmUriPrefix: string = null;
    private _isTenantless: boolean = false;
    private _selfSignedJwtAudience: string = null;

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

    public get authorizationUri(): string {
        return this._authorizationUri;
    }

    public get deviceCodeUri(): string {
        return this._deviceCodeUri;
    }

    public get userRealmUriPrefix(): string {
        return this._userRealmUriPrefix;
    }

    public get isTenantless(): boolean {
        return this._isTenantless;
    }

    public get selfSignedJwtAudience(): string {
        return this._selfSignedJwtAudience;
    }

    constructor(serviceBundle: IServiceBundle, authority: string, validateAuthority: boolean) {
        this.init(serviceBundle, authority, validateAuthority);
    }

    public getAuthorityHost() {
        return !!this.authority ? new URL(this.authority).host : null;
    }

    public async UpdateAuthorityAsync(
        serviceBundle: IServiceBundle,
        authority: string,
        callState: CallState): Promise<void> {

        this.init(serviceBundle, authority, this.validateAuthority);

        this._updatedFromTemplate = false;
        await this.updateFromTemplateAsync(callState);
    }

    public async updateFromTemplateAsync(callState: CallState): Promise<void> {
        if (!this._updatedFromTemplate) {
            const authorityUri = new URL(this.authority);
            let host = authorityUri.host;

            // The authority could be https://{AzureAD host name}/{tenantid}
            // OR https://{Dsts host name}/dstsv2/{tenantid}
            // Detecting the tenantId using the last segment of the url
            const segments = authorityUri.pathname.split("/");
            const tenant: string = segments[segments.length - 1];
            if (this.authorityType === AuthorityType.AAD) {
                const metadata = await this.serviceBundle.instanceDiscovery.getMetadataEntryAsync(
                    authorityUri,
                    this.validateAuthority,
                    callState);

                host = metadata.preferred_network;
                // All the endpoints will use this updated host, and it affects future network calls, as desired.
                // The Authority remains its original host, and will be used in TokenCache later.
            } else {
                this.serviceBundle.instanceDiscovery.addMetadataEntry(host);
            }

            this._authorizationUri = InstanceDiscovery.formatAuthorizeEndpoint(host, tenant);
            this._deviceCodeUri = `https://${host}/${tenant}/oauth2/devicecode`;
            this._tokenUri = `https://${host}/${tenant}/oauth2/token`;
            this._userRealmUriPrefix = `https://${host}/common/userrealm/`;
            this._isTenantless = tenant.toLowerCase() === this.tenantlessTenantName.toLowerCase();
            this._selfSignedJwtAudience = this._tokenUri;
            this._updatedFromTemplate = true;
        }
    }

    private init(serviceBundle: IServiceBundle, authority: string, validateAuthority: boolean): void {

        this._authority = Authenticator.ensureUrlEndsWithForwardSlash(authority);
        this._authorityType = Authenticator.detectAuthorityType(authority);

        if (this.authorityType !== AuthorityType.AAD && validateAuthority) {
            throw new Error("UnsupportedAuthorityValidation");
        }

        this._validateAuthority = true;
        this._serviceBundle = serviceBundle;
    }
}
