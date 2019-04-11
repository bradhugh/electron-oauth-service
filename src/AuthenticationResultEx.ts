import { AuthenticationResult } from "./AuthenticationResult";
import { UserInfo } from "./UserInfo";

export class AuthenticationResultEx {

    public static staticClone(clone: AuthenticationResultEx, source: AuthenticationResultEx) {
        clone.userAssertionHash = source.userAssertionHash;
        clone.error = source.error;
        clone.refreshToken = source.refreshToken;
        clone.resourceInResponse = source.resourceInResponse;
        clone.result = new AuthenticationResult(
            source.result.accessTokenType,
            source.result.accessToken,
            source.result.expiresOn,
            source.result.extendedExpiresOn);

        clone.result.extendedLifeTimeToken = source.result.extendedLifeTimeToken;
        clone.result.idToken = source.result.idToken;
        clone.result.tenantId = source.result.tenantId;
        clone.result.userInfo = new UserInfo(source.result.userInfo);
    }

    public static deserialize(serializedObject: string): AuthenticationResultEx {
        const deserialized =  JSON.parse(serializedObject, (key, value) => {
            switch (key) {
                case "expiresOn":
                case "extendedExpiresOn":
                    return new Date(value);
            }

            return value;
        }) as AuthenticationResultEx;
        const clone = new AuthenticationResultEx();
        AuthenticationResultEx.staticClone(clone, deserialized);
        return clone;
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
        AuthenticationResultEx.staticClone(cloned, this);

        return cloned;
    }
}
