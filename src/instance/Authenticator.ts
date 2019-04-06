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
        if (authorityUri.protocol !== "https:") {
            throw new Error(`authority must be HTTPS, not '${authorityUri.protocol}'`);
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

    private static tenantNameRegex = /common/i;

    private static isAdfsAuthority(firstPath: string) {
        return firstPath.toLowerCase().startsWith("adfs");
    }

    public correlationId: string = Utils.guidEmpty;

    private tenantlessTenantName = "Common";

    private _validateAuthority = false;
    private _updatedFromTemplate = false;
    private _authority: string = null;
    private _authorityType: AuthorityType = AuthorityType.AAD;
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

    public get tokenUri(): string {
        return this._tokenUri;
    }

    constructor(authority: string, validateAuthority: boolean) {
        this.init(authority, validateAuthority);
    }

    public getAuthorityHost() {
        return !!this.authority ? new URL(this.authority).host : null;
    }

    public updateTenantId(tenantId: string): void {
        if (this.isTenantless && tenantId) {
            this.replaceTenantlessTenant(tenantId);
            this._updatedFromTemplate = false;
        }
    }

    public async updateAuthorityAsync(
        authority: string,
        callState: CallState): Promise<void> {

        this.init(authority, this.validateAuthority);

        this._updatedFromTemplate = false;
        await this.updateFromTemplateAsync(callState);
    }

    public async updateFromTemplateAsync(callState: CallState): Promise<void> {
        callState.logger.verbose(`updateFromTemplateAsync enter. updatedFromTemplate: ${this._updatedFromTemplate}`);
        if (!this._updatedFromTemplate) {
            const authorityUri = new URL(this.authority);
            let host = authorityUri.host;

            const path: string = authorityUri.pathname.substring(1);
            const tenant = path.substring(0, path.indexOf("/"));
            if (this.authorityType === AuthorityType.AAD) {
                const metadata = await InstanceDiscovery.getMetadataEntryAsync(
                    authorityUri,
                    this.validateAuthority,
                    callState);

                host = metadata.preferred_network;
                // All the endpoints will use this updated host, and it affects future network calls, as desired.
                // The Authority remains its original host, and will be used in TokenCache later.
            } else {
                InstanceDiscovery.addMetadataEntry(host);
            }

            this._authorizationUri = InstanceDiscovery.formatAuthorizeEndpoint(host, tenant);
            this._deviceCodeUri = `https://${host}/${tenant}/oauth2/devicecode`;
            this._tokenUri = `https://${host}/${tenant}/oauth2/token`;
            this._userRealmUriPrefix = `https://${host}/common/userrealm/`;
            this._isTenantless = tenant.toLowerCase() === this.tenantlessTenantName.toLowerCase();
            this._selfSignedJwtAudience = this._tokenUri;
            this._updatedFromTemplate = true;
        }

        callState.logger.verbose("updateFromTemplateAsync exit.");
    }

    private init(authority: string, validateAuthority: boolean): void {

        this._authority = Authenticator.ensureUrlEndsWithForwardSlash(authority);
        this._authorityType = Authenticator.detectAuthorityType(authority);

        if (this.authorityType !== AuthorityType.AAD && validateAuthority) {
            throw new Error("UnsupportedAuthorityValidation");
        }

        this._validateAuthority = true;
    }

    private replaceTenantlessTenant(tenantId: string): void {
        this._authority = this.authority.replace(Authenticator.tenantNameRegex, tenantId);
    }
}
