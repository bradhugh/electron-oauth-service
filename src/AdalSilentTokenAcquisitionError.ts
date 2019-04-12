import { AdalError } from "./AdalError";
import { AdalErrorCode } from "./AdalErrorCode";
import { AdalErrorMessage } from "./Constants";

/// <summary>
/// The exception type thrown when a token cannot be acquired silently.
/// </summary>
export class AdalSilentTokenAcquisitionException extends AdalError {
    /// <summary>
    ///  Initializes a new instance of the exception class.
    /// </summary>
    constructor(innerError?: Error) {
        super(AdalErrorCode.failedToAcquireTokenSilently, AdalErrorMessage.failedToAcquireTokenSilently, innerError);
    }
}
