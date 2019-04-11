export class UserInfo {

    public uniqueId: string;
    public displayableId: string;
    public givenName: string;
    public familyName: string;
    public identityProvider: string;
    public passwordExpiresOn: Date;
    public passwordChangeUrl: URL;

    constructor(other?: UserInfo) {
        if (other) {
            this.uniqueId = other.uniqueId;
            this.displayableId = other.displayableId;
            this.givenName = other.givenName;
            this.familyName = other.familyName;
            this.identityProvider = other.identityProvider;
            this.passwordExpiresOn = other.passwordExpiresOn;
            this.passwordChangeUrl = other.passwordChangeUrl;
        }
    }
}
