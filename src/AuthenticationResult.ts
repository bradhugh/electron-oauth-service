import { UserInfo } from "./UserInfo";

export class AuthenticationResult {
    public accessToken: string;
    public accessTokenType: string;
    public authority: string;
    public expiresOn: Date;
    public extendedExpiresOn: Date;
    public extendedLifeTimeToken: boolean;
    public idToken: string;
    public tenantId: string;
    public userInfo: UserInfo;

    constructor(
        accessTokenType: string,
        accessToken: string,
        expiresOn: Date,
        extendedExpiresOn?: Date) {

        this.accessTokenType = accessTokenType;
        this.accessToken = accessToken;
        this.expiresOn = expiresOn;
        if (extendedExpiresOn) {
            this.extendedExpiresOn = extendedExpiresOn;
        } else {
            this.extendedExpiresOn = expiresOn;
        }
    }

    public updateTenantAndUserInfo(tenantId: string, idToken: string, userInfo: UserInfo) {
        this.tenantId = tenantId;
        this.idToken = idToken;
        if (userInfo) {
            this.userInfo = new UserInfo(userInfo);
        }
    }
}
