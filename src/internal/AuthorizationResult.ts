import { AdalErrorCode } from "../AdalErrorCode";
import { AdalErrorMessage } from "../Constants";
import { EncodingHelper } from "../helpers/EncodingHelper";
import { TokenResponseClaim } from "./oauth2/TokenResponse";

export enum AuthorizationStatus {
    Success,
    ErrorHttp,
    ProtocolError,
    UserCancel,
    UnknownError,
}

export class AuthorizationResult {

    public code: string;
    public error: string;
    public errorDescription: string;
    public cloudInstanceHost: string;

    constructor(public status: AuthorizationStatus, returnedUriInput: string) {

        if (this.status === AuthorizationStatus.UserCancel) {
            this.error = AdalErrorCode.authenticationCanceled;
            this.errorDescription = AdalErrorMessage.authenticationCanceled;
        } else if (this.status === AuthorizationStatus.UnknownError) {
            this.error = AdalErrorCode.unknown;
            this.errorDescription = AdalErrorMessage.unknown;
        } else if (returnedUriInput) {
            this.parseAuthorizeResponse(returnedUriInput);
        }
    }

    public parseAuthorizeResponse(webAuthenticationResult: string): void {
        const resultUri = new URL(webAuthenticationResult);

        // NOTE: The Fragment property actually contains the leading '#' character and that must be dropped
        const resultData: string = resultUri.search;

        if (resultData) {
            // Remove the leading '?' first
            const response = EncodingHelper.parseKeyValueList(resultData.substring(1), "&", true, true, null, false);

            if (response.has(TokenResponseClaim.code)) {
                this.code = response.get(TokenResponseClaim.code);
            } else if (webAuthenticationResult.toLowerCase().startsWith("msauth://")) {
                this.code = webAuthenticationResult;
            } else if (response.has(TokenResponseClaim.error)) {
                this.error = response.get(TokenResponseClaim.error);
                this.errorDescription = response.has(TokenResponseClaim.errorDescription)
                    ? response.get(TokenResponseClaim.errorDescription)
                    : null;
                this.status = AuthorizationStatus.ProtocolError;
            } else {
                this.error = AdalErrorCode.authenticationFailed;
                this.errorDescription = AdalErrorMessage.authorizationServerInvalidResponse;
                this.status = AuthorizationStatus.UnknownError;
            }

            if (response.has(TokenResponseClaim.cloudInstanceHost)) {
                this.cloudInstanceHost = response.get(TokenResponseClaim.cloudInstanceHost);
            }
        } else {
            this.error = AdalErrorCode.authenticationFailed;
            this.errorDescription = AdalErrorMessage.authorizationServerInvalidResponse;
            this.status = AuthorizationStatus.UnknownError;
        }
    }
}
