import { AdalErrorCode } from "../../AdalErrorCode";
import { AdalServiceError } from "../../AdalServiceError";
import { AuthenticationResult } from "../../AuthenticationResult";
import { AuthenticationResultEx } from "../../AuthenticationResultEx";
import { AdalErrorMessage } from "../../Constants";
import { UserInfo } from "../../UserInfo";
import { CallState } from "../CallState";
import { HttpStatusCode } from "../http/HttpStatusCode";
import { IHttpWebResponse } from "../http/IHttpWebResponse";
import { IdToken } from "./IdToken";

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

export interface IJsonTokenResponse {
    token_type: string;
    access_token: string;
    refresh_token: string;
    resource: string;
    id_token: string;
    created_on: number;
    expires_on: number;
    expires_in: number;
    ext_expires_in: number;
    error: string;
    error_description: string;
    error_codes: string[];
    correlation_id: string;
    claims: string;
}

export class TokenResponse {
    public static createFromErrorResponse(webResponse: IHttpWebResponse): TokenResponse {
        let tokenResponse = new TokenResponse();
        if (!webResponse) {
            tokenResponse.error = AdalErrorCode.serviceReturnedError;
            tokenResponse.errorDescription = AdalErrorMessage.serviceReturnedError;
            return tokenResponse;
        }

        if (!webResponse.responseString) {
            tokenResponse.error = AdalErrorCode.unknown;
            tokenResponse.errorDescription = AdalErrorMessage.unknown;
            return tokenResponse;
        }

        try {
            const tokenRespJson = JSON.parse(webResponse.responseString) as IJsonTokenResponse;
            tokenResponse = TokenResponse.fromJson(tokenRespJson);
        } catch (jsonParseError) {
            tokenResponse.error = webResponse.statusCode === HttpStatusCode.ServiceUnavailable
                ? AdalErrorCode.serviceUnavailable : AdalErrorCode.unknown;
            tokenResponse.errorDescription = webResponse.responseString;
        }

        return tokenResponse;
    }

    public static fromJson(jsonResp: IJsonTokenResponse): TokenResponse {
        const resp = new TokenResponse();
        resp.tokenType = jsonResp.token_type;
        resp.accessToken = jsonResp.access_token;
        resp.refreshToken = jsonResp.refresh_token;
        resp.resource = jsonResp.resource;
        resp.idTokenString = jsonResp.id_token;
        resp.createdOn = jsonResp.created_on;
        resp.expiresOn = jsonResp.expires_on;
        resp.expiresIn = jsonResp.expires_in;
        resp.extendedExpiresIn = jsonResp.ext_expires_in;
        resp.error = jsonResp.error;
        resp.errorDescription = jsonResp.error_description;
        resp.errorCodes = jsonResp.error_codes;
        resp.correlationId = jsonResp.correlation_id;
        resp.claims = jsonResp.claims;
        return resp;
    }

    public tokenType: string;
    public accessToken: string;
    public refreshToken: string;
    public resource: string;
    public idTokenString: string;
    public createdOn: number;
    public expiresOn: number;
    public expiresIn: number;
    public extendedExpiresIn: number;
    public error: string;
    public errorDescription: string;
    public errorCodes: string[];
    public correlationId: string;
    public claims: string;
    public authority: string = null;

    public getResult(): AuthenticationResultEx {
        // extendedExpiresOn can be less than expiresOn if
        // the server did not return extendedExpiresOn in the
        // token response. Default json deserialization will set
        // the value to 0.
        if (this.extendedExpiresIn < this.expiresIn) {
            CallState.default.logger.info(
                `ExtendedExpiresIn(${this.extendedExpiresIn}) is less than ExpiresIn(${this.expiresIn}). ` +
                "Set ExpiresIn as ExtendedExpiresIn");
            this.extendedExpiresIn = this.expiresIn;
        }

        const now = new Date();
        const result = this.getResultWithDates(
            new Date(now.getTime() + (this.expiresIn * 1000)),
            new Date(now.getTime() + (this.extendedExpiresIn * 1000)));

        return result;
    }

    public getResultWithDates(expiresOn: Date, extendedExpiresOn: Date): AuthenticationResultEx {
        let resultEx: AuthenticationResultEx = null;

        if (this.accessToken != null) {
            const result = new AuthenticationResult(this.tokenType, this.accessToken, expiresOn, extendedExpiresOn);

            const idToken = IdToken.parse(this.idTokenString);
            if (idToken) {
                const tenantId = idToken.tenantId;
                let uniqueId: string = null;
                let displayableId: string = null;

                if (idToken.objectId) {
                    uniqueId = idToken.objectId;
                } else if (idToken.subject) {
                    uniqueId = idToken.subject;
                }

                if (idToken.upn) {
                    displayableId = idToken.upn;
                } else if (idToken.email) {
                    displayableId = idToken.email;
                }

                const givenName = idToken.givenName;
                const familyName = idToken.familyName;
                const identityProvider = idToken.identityProvider ? idToken.identityProvider : idToken.issuer;
                let passwordExpiresOffest: Date = null ;
                const now = new Date();
                if (idToken.passwordExpiration > 0) {
                    passwordExpiresOffest = new Date(now.getTime() + (idToken.passwordExpiration * 1000));
                }

                let changePasswordUri: URL = null;
                if (idToken.passwordChangeUrl) {
                    changePasswordUri = new URL(idToken.passwordChangeUrl);
                }

                const userInfo = new UserInfo();
                userInfo.uniqueId = uniqueId;
                userInfo.displayableId = displayableId;
                userInfo.givenName = givenName;
                userInfo.familyName = familyName;
                userInfo.identityProvider = identityProvider;
                userInfo.passwordExpiresOn = passwordExpiresOffest;
                userInfo.passwordChangeUrl = changePasswordUri;

                result.updateTenantAndUserInfo(tenantId, this.idTokenString, userInfo);

                result.authority = this.authority;
            }

            resultEx = new AuthenticationResultEx();
            resultEx.result = result;
            resultEx.refreshToken = this.refreshToken;

            // This is only needed for AcquireTokenByAuthorizationCode in which parameter
            // resource is optional and we need to get it from the STS response.
            resultEx.resourceInResponse = this.resource;
        } else if (this.error) {
            throw new AdalServiceError(this.error, this.errorDescription, null, null);
        } else {
            throw new AdalServiceError(AdalErrorCode.unknown, AdalErrorMessage.unknown, null, null);
        }

        return resultEx;
    }
}
