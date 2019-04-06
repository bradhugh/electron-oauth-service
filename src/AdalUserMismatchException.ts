import { AdalError } from "./AdalError";
import { AdalErrorCode } from "./AdalErrorCode";
import { AdalErrorMessage } from "./Constants";

/// <summary>
/// The exception type thrown when user returned by service does not match user in the request.
/// </summary>
export class AdalUserMismatchError extends AdalError {
    /// <summary>
    ///  Initializes a new instance of the exception class.
    /// </summary>
    constructor(public requestedUser: string, public returnedUser: string) {
        super(AdalErrorCode.userMismatch, AdalErrorMessage.userMismatch(returnedUser, requestedUser), null);
    }
    /// <summary>
    /// Creates and returns a string representation of the current exception.
    /// </summary>
    /// <returns>A string representation of the current exception.</returns>
    public toString(): string {
        return super.toString() + `\n\tRequestedUser: ${this.requestedUser}\n\tReturnedUser: ${this.returnedUser}`;
    }
}
