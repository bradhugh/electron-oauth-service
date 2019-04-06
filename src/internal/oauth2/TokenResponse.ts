import { AuthenticationResultEx } from "../../AuthenticationResultEx";

// tslint:disable: max-classes-per-file

export class TokenResponseClaim {
    public static code = "code";
    public static tokenType = "token_type";
    public static accessToken = "access_token";
    public static refreshToken = "refresh_token";
    public static resource = "resource";
    public static idToken = "id_token";
    public static createdOn = "created_on";
    public static expiresOn = "expires_on";
    public static expiresIn = "expires_in";
    public static extendedExpiresIn = "ext_expires_in";
    public static error = "error";
    public static errorDescription = "error_description";
    public static errorCodes = "error_codes";
    public static claims = "claims";
    public static cloudInstanceHost = "cloud_instance_host_name";
    public static authority = "authority";
}

// TODO: Implement
export class TokenResponse {
    public getResult(): AuthenticationResultEx {
        throw new Error("TokenResponse.getResult() NOT IMPLEMENTED");
    }
}
