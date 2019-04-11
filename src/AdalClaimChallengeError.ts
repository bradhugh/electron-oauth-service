import { AdalServiceError } from "./AdalServiceError";

/// <summary>
/// The exception type thrown when a claims challenge error occurs during token acquisition.
/// </summary>
export class AdalClaimChallengeException extends AdalServiceError {
    /// <summary>
    /// Claims challenge returned from the STS. This value should be passed back to the API caller.
    /// </summary>
    public claims: string;

    /// <summary>
    /// Initializes a new instance of the exception class for handling claims.
    /// </summary>
    constructor(errorCode: string, message: string, innerException: Error, claims: string) {
        super(errorCode, message, null, innerException);
        this.claims = claims;
    }
}
