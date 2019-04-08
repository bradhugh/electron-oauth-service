export class UserInfo {
    public uniqueId?: string;
    public displayableId?: string;
    public givenName: string;
    public familyName: string;
    public identityProvider: string;
    public passwordExpiresOn: Date;
    public passwordChangeUrl: URL;
}
