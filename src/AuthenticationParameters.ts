import { IHttpManager, HttpError } from "./core/Http/HttpManager";
import { RequestContext } from "./core/RequestContext";
import { AdalLogger } from "./core/AdalLogger";
import { Utils } from "./Utils";
import { CoreLoggerBase } from "./core/CoreLoggerBase";
import { HttpResponse } from "./core/Http/HttpResponse";
import { EncodingHelper } from "./helpers/EncodingHelper";

export class AuthenticationParameters {
    private static authenticateHeader = "WWW-Authenticate";
    private static bearer = "bearer";
    private static authorityKey = "authorization_uri";
    private static resourceKey = "resource_id";

    public authority: string = null;

    public resource: string = null;

    constructor(private httpManager: IHttpManager) {
    }

    public createFromResourceUrlAsync(resourceUrl: URL): Promise<AuthenticationParameters> {
        return this.createFromResourceUrlCommonAsync(resourceUrl);
    }

    private async createFromResourceUrlCommonAsync(resourceUrl: URL): Promise<AuthenticationParameters> {
        if (resourceUrl == null) {
            throw new Error("resourceUrl cannot be null");
        }

        let authParams: AuthenticationParameters = null;

        try
        {
            await this.httpManager.sendGetAsync(
                resourceUrl.href,
                null,
                new RequestContext(
                    null, new AdalLogger(Utils.guidEmpty)));

            var ex = new Error("AdalError.UnauthorizedResponseExpected");
            CoreLoggerBase.default.errorExPii(ex);
            throw ex;

        }
        catch (error)
        {
            const httpError = error as HttpError;
            if (httpError) {
                const response = httpError.response;
                
                if (response == null)
                {
                    var serviceEx = new Error("AdalErrorMessage.UnauthorizedHttpStatusCodeExpected");
                    CoreLoggerBase.default.errorExPii(serviceEx);
                    throw serviceEx;
                }

                throw new Error("Not implemented");
                //authParams = AuthenticationParameters.createFromUnauthorizedResponseCommon(response);
            } else {
                // Didn't expect this kind of error here
                throw error;
            }
        }

        return authParams;
    }

    private createFromUnauthorizedResponseCommon(response: HttpResponse): AuthenticationParameters {
        if (response == null) {
            throw new Error("response should not be null here");
        }

        let authParams: AuthenticationParameters = null;
        if (response.statusCode == 401)
        {
            if (response.headers[AuthenticationParameters.authenticateHeader]) {
                throw new Error("Not implemented");
                // authParams = this.createFromResponseAuthenticateHeader(response.headers.GetValues(AuthenticateHeader).FirstOrDefault());
            } else {
                var ex = new Error("AdalErrorMessage.MissingAuthenticateHeader");
                CoreLoggerBase.default.errorExPii(ex);
                throw ex;
            }
        } else {
            var ex = new Error("AdalErrorMessage.UnauthorizedHttpStatusCodeExpected");
            CoreLoggerBase.default.errorExPii(ex);
            throw ex;
        }

        return authParams;
    }

    public createFromResponseAuthenticateHeader(authenticateHeader: string): AuthenticationParameters {
        if (!authenticateHeader) {
            throw new Error("authenticateHeader cannot be null");
        }

        authenticateHeader = authenticateHeader.trim();

        // This also checks for cases like "BearerXXXX authorization_uri=...." and "Bearer" and "Bearer "
        if (!authenticateHeader.toLowerCase().startsWith(AuthenticationParameters.bearer)
            || authenticateHeader.length < AuthenticationParameters.bearer.length + 2
            || authenticateHeader[AuthenticationParameters.bearer.length] !== " ") {
            var ex = new Error("AdalErrorMessage.InvalidAuthenticateHeaderFormat authenticateHeader");
            CoreLoggerBase.default.error("AdalErrorMessage.InvalidAuthenticateHeaderFormat");
            CoreLoggerBase.default.errorExPii(ex);
            throw ex;
        }

        authenticateHeader = authenticateHeader.substring(AuthenticationParameters.bearer.length).trim();

        let authenticateHeaderItems: { [key: string]: string } = null;
        try {
            authenticateHeaderItems = EncodingHelper.parseKeyValueListStrict(authenticateHeader, ',', false, true, null);
        } catch (error) {
            var newEx = new Error("AdalErrorMessage.InvalidAuthenticateHeaderFormat: authenticateHeader");
            CoreLoggerBase.default.error("AdalErrorMessage.InvalidAuthenticateHeaderFormat");
            CoreLoggerBase.default.errorExPii(newEx);
            throw newEx;
        }

        var authParams = new AuthenticationParameters(this.httpManager);
        let param;
        param = authenticateHeaderItems[AuthenticationParameters.authorityKey];
        authParams.authority = !param ? null : param;
        param = authenticateHeaderItems[AuthenticationParameters.resourceKey];
        authParams.resource = !param ? null : param;

        return authParams;
    }
}