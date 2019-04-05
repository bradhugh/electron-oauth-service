// tslint:disable: max-classes-per-file

export class OAuthHeader {
    public static correlationId = "client-request-id";
    public static requestCorrelationIdInResponse = "return-client-request-id";
}

export class OAuthParameter {
    public static responseType = "response_type";
    public static grantType = "grant_type";
    public static clientId = "client_id";
    public static clientSecret = "client_secret";
    public static clientAssertion = "client_assertion";
    public static clientAssertionType = "client_assertion_type";
    public static refreshToken = "refresh_token";
    public static redirectUri = "redirect_uri";
    public static resource = "resource";
    public static code = "code";
    public static scope = "scope";
    public static assertion = "assertion";
    public static requestedTokenUse = "requested_token_use";
    public static username = "username";
    public static password = "password";

    public static hasChrome = "haschrome";
    public static loginHint = "login_hint"; // login_hint is not standard oauth2 parameter
    public static correlationId = OAuthHeader.correlationId; // correlation id is not standard oauth2 parameter
    public static prompt = "prompt"; // prompt is not standard oauth2 parameter
}

export class OAuthGrantType {
    public static authorizationCode = "authorization_code";
    public static refreshToken = "refresh_token";
    public static clientCredentials = "client_credentials";
    public static saml11Bearer = "urn:ietf:params:oauth:grant-type:saml1_1-bearer";
    public static saml20Bearer = "urn:ietf:params:oauth:grant-type:saml2-bearer";
    public static jwtBearer = "urn:ietf:params:oauth:grant-type:jwt-bearer";
    public static password = "password";
    public static deviceCode = "device_code";
}

export class OAuthResponseType {
    public static code = "code";
}

export class OAuthAssertionType {
    public static jwtBearer = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
}

export class OAuthRequestedTokenUse {
    public static onBehalfOf = "on_behalf_of";
}

export class OAuthError {
    public static loginRequired = "login_required";
}

export class OAuthValue {
    public static scopeOpenId = "openid";
}

export class PromptValue {
    public static login = "login";
    public static refreshSession = "refresh_session";
    public static selectAccount = "select_account";

    // The behavior of this value is identical to prompt=none for managed users; However, for federated users, AAD
    // redirects to ADFS as it cannot determine in advance whether ADFS can login user silently (e.g. via WIA) or not.
    public static attemptNone = "attempt_none";
}
