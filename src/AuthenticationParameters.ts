import { ConsoleLogger } from "./core/AdalLogger";
import { CoreLoggerBase } from "./core/CoreLoggerBase";
import { HttpError, IHttpManager } from "./core/Http/HttpManager";
import { HttpResponse } from "./core/Http/HttpResponse";
import { RequestContext } from "./core/RequestContext";
import { EncodingHelper } from "./helpers/EncodingHelper";
import { CallState } from "./internal/CallState";
import { Utils } from "./Utils";

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

    public createFromResponseAuthenticateHeader(authenticateHeader: string): AuthenticationParameters {
        if (!authenticateHeader) {
            throw new Error("authenticateHeader cannot be null");
        }

        authenticateHeader = authenticateHeader.trim();

        // This also checks for cases like "BearerXXXX authorization_uri=...." and "Bearer" and "Bearer "
        if (!authenticateHeader.toLowerCase().startsWith(AuthenticationParameters.bearer)
            || authenticateHeader.length < AuthenticationParameters.bearer.length + 2
            || authenticateHeader[AuthenticationParameters.bearer.length] !== " ") {
            const ex = new Error("AdalErrorMessage.InvalidAuthenticateHeaderFormat authenticateHeader");
            CoreLoggerBase.default.error("AdalErrorMessage.InvalidAuthenticateHeaderFormat");
            CoreLoggerBase.default.errorExPii(ex);
            throw ex;
        }

        authenticateHeader = authenticateHeader.substring(AuthenticationParameters.bearer.length).trim();

        let authenticateHeaderItems: { [key: string]: string } = null;
        try {
            // tslint:disable-next-line: max-line-length
            authenticateHeaderItems = EncodingHelper.parseKeyValueListStrict(authenticateHeader, ",", false, true, null);
        } catch (error) {
            const newEx = new Error("AdalErrorMessage.InvalidAuthenticateHeaderFormat: authenticateHeader");
            CoreLoggerBase.default.error("AdalErrorMessage.InvalidAuthenticateHeaderFormat");
            CoreLoggerBase.default.errorExPii(newEx);
            throw newEx;
        }

        const authParams = new AuthenticationParameters(this.httpManager);
        let param;
        param = authenticateHeaderItems[AuthenticationParameters.authorityKey];
        authParams.authority = !param ? null : param;
        param = authenticateHeaderItems[AuthenticationParameters.resourceKey];
        authParams.resource = !param ? null : param;

        return authParams;
    }

    private async createFromResourceUrlCommonAsync(resourceUrl: URL): Promise<AuthenticationParameters> {
        if (resourceUrl == null) {
            throw new Error("resourceUrl cannot be null");
        }

        const authParams: AuthenticationParameters = null;

        try {
            await this.httpManager.sendGetAsync(
                resourceUrl.href,
                null,
                new CallState(Utils.guidEmpty));

            const ex = new Error("AdalError.UnauthorizedResponseExpected");
            CoreLoggerBase.default.errorExPii(ex);
            throw ex;

        } catch (error) {
            const httpError = error as HttpError;
            if (httpError) {
                const response = httpError.response;

                if (response == null) {
                    const serviceEx = new Error("AdalErrorMessage.UnauthorizedHttpStatusCodeExpected");
                    CoreLoggerBase.default.errorExPii(serviceEx);
                    throw serviceEx;
                }

                throw new Error("Not implemented");
                // authParams = AuthenticationParameters.createFromUnauthorizedResponseCommon(response);
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

        const authParams: AuthenticationParameters = null;
        if (response.statusCode === 401) {
            if (response.headers[AuthenticationParameters.authenticateHeader]) {
                throw new Error("Not implemented");
                // authParams = this.createFromResponseAuthenticateHeader(
                // response.headers.GetValues(AuthenticateHeader).FirstOrDefault());
            } else {
                const ex = new Error("AdalErrorMessage.MissingAuthenticateHeader");
                CoreLoggerBase.default.errorExPii(ex);
                throw ex;
            }
        } else {
            const ex = new Error("AdalErrorMessage.UnauthorizedHttpStatusCodeExpected");
            CoreLoggerBase.default.errorExPii(ex);
            throw ex;
        }

        return authParams;
    }
}
