
export class UserInfo {
    public uniqueId?: string;
    public displayableId?: string;
}

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
            this.userInfo = userInfo; // REVIEW: UserInfo = new UserInfo(userInfo);
        }
    }
}

export class AuthenticationResultEx {
    public result: AuthenticationResult;
    public refreshToken: string;
    public isMultipleResourceRefreshToken: boolean;
    public resourceInResponse: string;
    public error: Error;
    public userAssertionHash: string;

    public static deserialize(serializedObject: string): AuthenticationResultEx {
        return JSON.parse(serializedObject) as AuthenticationResultEx;
    }

    public serialize(): string {
        return JSON.stringify(this);
    }

    public clone(): AuthenticationResultEx {
        const cloned = new AuthenticationResultEx();
        cloned.userAssertionHash = this.userAssertionHash;
        cloned.error = this.error;
        cloned.refreshToken = this.refreshToken;
        cloned.resourceInResponse = this.resourceInResponse;
        cloned.result = new AuthenticationResult(
            this.result.accessTokenType,
            this.result.accessToken,
            this.result.expiresOn,
            this.result.extendedExpiresOn);

        cloned.result.extendedLifeTimeToken = this.result.extendedLifeTimeToken;
        cloned.result.idToken = this.result.idToken;
        cloned.result.tenantId = this.result.tenantId;
        cloned.result.userInfo = this.result.userInfo;

        return cloned;
    }
}