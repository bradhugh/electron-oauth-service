import { AuthenticationResult } from "./AuthenticationResult";

export class AuthenticationResultEx {

    public static deserialize(serializedObject: string): AuthenticationResultEx {
        return JSON.parse(serializedObject) as AuthenticationResultEx;
    }

    public result: AuthenticationResult;
    public refreshToken: string;
    public isMultipleResourceRefreshToken: boolean;
    public resourceInResponse: string;
    public error: Error;
    public userAssertionHash: string;

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
