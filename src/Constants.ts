// tslint:disable: max-line-length

/// <summary>
/// The active directory authentication error message.
/// </summary>
export class AdalErrorMessage {
    public static accessingMetadataDocumentFailed = "Accessing WS metadata exchange failed";

    public static assemblyNotFoundTemplate =
        "Assembly required for the platform not found. Make sure assembly '{0}' exists";

    public static assemblyLoadFailedTemplate =
        "Loading an assembly required for the platform failed. Make sure assembly for the correct platform '{0}' exists";

    public static authenticationUiFailed = "The browser based authentication dialog failed to complete";
    public static authorityInvalidUriFormat = "'authority' should be in Uri format";
    public static authorityNotInValidList = "'authority' is not in the list of valid addresses";
    public static authorityValidationFailed = "Authority validation failed";
    public static nonHttpsRedirectNotSupported = "Non-HTTPS url redirect is not supported in webview";
    public static authorityUriInsecure = "'authority' should use the 'https' scheme";

    public static authorityUriInvalidPath =
        "'authority' Uri should have at least one segment in the path (i.e. https://<host>/<path>/...)";

    public static authorizationServerInvalidResponse = "The authorization server returned an invalid response";

    public static certificateKeySizeTooSmallTemplate =
        "The certificate used must have a key size of at least {0} bits";

    public static emailAddressSuffixMismatch =
        "No identity provider email address suffix matches the provided address";

    public static encodedTokenTooLong = "Encoded token size is beyond the upper limit";
    public static failedToAcquireTokenSilently = "Failed to acquire token silently as no token was found in the cache. Call method AcquireToken";
    public static failedToRefreshToken = "Failed to refresh access token";
    public static federatedServiceReturnedErrorTemplate = "Federated service at {0} returned error: {1}";
    public static identityProtocolLoginUrlNull = "The LoginUrl property in identityProvider cannot be null";
    public static identityProtocolMismatch = "No identity provider matches the requested protocol";

    public static identityProviderRequestFailed =
        "Token request made to identity provider failed. Check InnerException for more details";

    public static invalidArgumentLength = "Parameter has invalid length";
    public static invalidAuthenticateHeaderFormat = "Invalid authenticate header format";
    public static invalidAuthorityTypeTemplate = "Invalid authority type. This method overload is not supported by '{0}'";
    public static invalidCredentialType = "Invalid credential type";
    public static invalidFormatParameterTemplate = "Parameter '{0}' has invalid format";
    public static invalidTokenCacheKeyFormat = "Invalid token cache key format";
    public static missingAuthenticateHeader = "WWW-Authenticate header was expected in the response";

    public static multipleTokensMatched =
        "The cache contains multiple tokens satisfying the requirements. Call AcquireToken again providing more arguments (e.g. UserId)";

    public static networkIsNotAvailable = "The network is down so authentication cannot proceed";
    public static noDataFromSTS = "No data received from security token service";
    public static nullParameterTemplate = "Parameter '{0}' cannot be null";
    public static parsingMetadataDocumentFailed = "Parsing WS metadata exchange failed";
    public static parsingWsTrustResponseFailed = "Parsing WS-Trust response failed";
    public static passwordRequiredForManagedUserError = "Password is required for managed user";
    public static redirectUriContainsFragment = "'redirectUri' must NOT include a fragment component";
    public static serviceReturnedError = "Service returned error. Check InnerException for more details";
    public static brokerReponseHashMismatch = "Unencrypted broker response hash did not match the expected hash";

    public static stsMetadataRequestFailed =
        "Metadata request to Access Control service failed. Check InnerException for more details";

    public static stsTokenRequestFailed =
        "Token request to security token service failed.  Check InnerException for more details";

    public static unauthorizedHttpStatusCodeExpected =
        "Unauthorized Http Status Code (401) was expected in the response";

    public static unauthorizedResponseExpected = "Unauthorized http response (status code 401) was expected";
    public static unexpectedAuthorityValidList = "Unexpected list of valid addresses";
    public static unknown = "Unknown error";
    public static unknownUser = "Could not identify logged in user";
    public static unknownUserType = "Unknown User Type";

    public static unsupportedAuthorityValidation =
        "Authority validation is not supported for this type of authority";

    public static unsupportedMultiRefreshToken =
        "This authority does not support refresh token for multiple resources. Pass null as a resource";

    public static authenticationCanceled = "User canceled authentication";
    public static userMismatch = "User '{0}' returned by service does not match user '{1}' in the request";
    public static userCredentialAssertionTypeEmpty = "credential.AssertionType cannot be empty";

    public static userInteractionRequired =
        "One of two conditions was encountered: "
        +
        "1. The PromptBehavior.Never flag was passed, but the constraint could not be honored, because user interaction was required. "
        +
        "2. An error occurred during a silent web authentication that prevented the http authentication flow from completing in a short enough time frame";

    public static userRealmDiscoveryFailed = "User realm discovery failed";

    public static wsTrustEndpointNotFoundInMetadataDocument =
        "WS-Trust endpoint not found in metadata document";

    public static getUserNameFailed = "Failed to get user name";

    public static missingFederationMetadataUrl =
        "Federation Metadata Url is missing for federated user. This user type is unsupported.";

    public static specifyAnyUser =
        "If you do not need access token for any specific user, pass userId=UserIdentifier.AnyUser instead of userId=null.";

    public static integratedAuthFailed =
        "Integrated authentication failed. You may try an alternative authentication method";

    public static duplicateQueryParameter = (param: string) => `Duplicate query parameter '${param}' in extraQueryParameters`;

    public static deviceCertificateNotFoundTemplate = "Device Certificate was not found for {0}";

    public static interactionRequired = "interaction_required";
}
