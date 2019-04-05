/// <summary>
/// Error code returned as a property in AdalException
/// </summary>
export class AdalErrorCode {

    /// <summary>
    /// Unknown error.
    /// </summary>
    public static unknown = "unknown_error";

    /// <summary>
    /// Non https redirect failed
    /// </summary>
    public static nonHttpsRedirectNotSupported = "non_https_redirect_failed";
    /// <summary>
    /// Invalid argument.
    /// </summary>
    public static invalidArgument = "invalid_argument";

    /// <summary>
    /// Authentication failed.
    /// </summary>
    public static authenticationFailed = "authentication_failed";

    /// <summary>
    /// Authentication canceled.
    /// </summary>
    public static authenticationCanceled = "authentication_canceled";

    /// <summary>
    /// Unauthorized response expected from resource server.
    /// </summary>
    public static unauthorizedResponseExpected = "unauthorized_response_expected";

    /// <summary>
    /// 'authority' is not in the list of valid addresses.
    /// </summary>
    public static authorityNotInValidList = "authority_not_in_valid_list";

    /// <summary>
    /// Authority validation failed.
    /// </summary>
    public static authorityValidationFailed = "authority_validation_failed";

    /// <summary>
    /// Loading required assembly failed.
    /// </summary>
    public static assemblyLoadFailed = "assembly_load_failed";

    /// <summary>
    /// Assembly not found.
    /// </summary>
    public static assemblyNotFound = "assembly_not_found";

    /// <summary>
    /// Invalid owner window type.
    /// </summary>
    public static invalidOwnerWindowType = "invalid_owner_window_type";

    /// <summary>
    /// MultipleTokensMatched were matched.
    /// </summary>
    public static multipleTokensMatched = "multiple_matching_tokens_detected";

    /// <summary>
    /// Invalid authority type.
    /// </summary>
    public static invalidAuthorityType = "invalid_authority_type";

    /// <summary>
    /// Invalid credential type.
    /// </summary>
    public static invalidCredentialType = "invalid_credential_type";

    /// <summary>
    /// Invalid service URL.
    /// </summary>
    public static invalidServiceUrl = "invalid_service_url";

    /// <summary>
    /// failed_to_acquire_token_silently.
    /// </summary>
    public static failedToAcquireTokenSilently = "failed_to_acquire_token_silently";

    /// <summary>
    /// Certificate key size too small.
    /// </summary>
    public static certificateKeySizeTooSmall = "certificate_key_size_too_small";

    /// <summary>
    /// Identity protocol login URL Null.
    /// </summary>
    public static identityProtocolLoginUrlNull = "identity_protocol_login_url_null";

    /// <summary>
    /// Identity protocol mismatch.
    /// </summary>
    public static identityProtocolMismatch = "identity_protocol_mismatch";

    /// <summary>
    /// Email address suffix mismatch.
    /// </summary>
    public static emailAddressSuffixMismatch = "email_address_suffix_mismatch";

    /// <summary>
    /// Identity provider request failed.
    /// </summary>
    public static identityProviderRequestFailed = "identity_provider_request_failed";

    /// <summary>
    /// STS token request failed.
    /// </summary>
    public static stsTokenRequestFailed = "sts_token_request_failed";

    /// <summary>
    /// Encoded token too long.
    /// </summary>
    public static encodedTokenTooLong = "encoded_token_too_long";

    /// <summary>
    /// Service unavailable.
    /// </summary>
    public static serviceUnavailable = "service_unavailable";

    /// <summary>
    /// Service returned error.
    /// </summary>
    public static serviceReturnedError = "service_returned_error";

    /// <summary>
    /// Federated service returned error.
    /// </summary>
    public static federatedServiceReturnedError = "federated_service_returned_error";

    /// <summary>
    /// STS metadata request failed.
    /// </summary>
    public static stsMetadataRequestFailed = "sts_metadata_request_failed";

    /// <summary>
    /// No data from STS.
    /// </summary>
    public static noDataFromSts = "no_data_from_sts";

    /// <summary>
    /// User Mismatch.
    /// </summary>
    public static userMismatch = "user_mismatch";

    /// <summary>
    /// Unknown User Type.
    /// </summary>
    public static unknownUserType = "unknown_user_type";

    /// <summary>
    /// Unknown User.
    /// </summary>
    public static unknownUser = "unknown_user";

    /// <summary>
    /// User Realm Discovery Failed.
    /// </summary>
    public static userRealmDiscoveryFailed = "user_realm_discovery_failed";

    /// <summary>
    /// Accessing WS Metadata Exchange Failed.
    /// </summary>
    public static accessingWsMetadataExchangeFailed = "accessing_ws_metadata_exchange_failed";

    /// <summary>
    /// Parsing WS Metadata Exchange Failed.
    /// </summary>
    public static parsingWsMetadataExchangeFailed = "parsing_ws_metadata_exchange_failed";

    /// <summary>
    /// WS-Trust Endpoint Not Found in Metadata Document.
    /// </summary>
    public static wsTrustEndpointNotFoundInMetadataDocument = "wstrust_endpoint_not_found";

    /// <summary>
    /// Parsing WS-Trust Response Failed.
    /// </summary>
    public static parsingWsTrustResponseFailed = "parsing_wstrust_response_failed";

    /// <summary>
    /// The request could not be preformed because the network is down.
    /// </summary>
    public static networkNotAvailable = "network_not_available";

    /// <summary>
    /// The request could not be preformed because of an unknown failure in the UI flow.
    /// </summary>
    public static authenticationUiFailed = "authentication_ui_failed";

    /// <summary>
    /// One of two conditions was encountered.
    /// 1. The PromptBehavior.Never flag was passed and but the staticraint could not be honored 
    ///    because user interaction was required.
    /// 2. An error occurred during a silent web authentication that prevented the authentication
    ///    flow from completing in a short enough time frame.
    /// </summary>
    public static userInteractionRequired = "user_interaction_required";

    /// <summary>
    /// Password is required for managed user.
    /// </summary>
    public static passwordRequiredForManagedUserError = "password_required_for_managed_user";

    /// <summary>
    /// Failed to get user name.
    /// </summary>
    public static getUserNameFailed = "get_user_name_failed";

    /// <summary>
    /// Federation Metadata Url is missing for federated user.
    /// </summary>
    public static missingFederationMetadataUrl = "missing_federation_metadata_url";

    /// <summary>
    /// Failed to refresh token.
    /// </summary>
    public static failedToRefreshToken = "failed_to_refresh_token";

    /// <summary>
    /// Integrated authentication failed. You may try an alternative authentication method.
    /// </summary>
    public static integratedAuthFailed = "integrated_authentication_failed";

    /// <summary>
    /// Duplicate query parameter in extraQueryParameters
    /// </summary>
    public static duplicateQueryParameter = "duplicate_query_parameter";

    /// <summary>
    /// Broker response hash did not match
    /// </summary>
    public static brokerReponseHashMismatch = "broker_response_hash_mismatch";

    /// <summary>
    /// Device certificate not found.
    /// </summary>
    public static deviceCertificateNotFound = "device_certificate_not_found";

    /// <summary>
    /// Claims step-up required.
    /// </summary>
    public static interactionRequired = "interaction_required";
}
