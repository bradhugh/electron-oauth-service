import { IHttpManager } from "./core/Http/HttpManager";
import { RequestContext } from "./core/RequestContext";
import { AdalLogger } from "./core/AdalLogger";
import { Utils } from "./Utils";
import { CoreLoggerBase } from "./core/CoreLoggerBase";

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
            IHttpWebResponse response = error.Response;
            if (response == null)
            {
                var serviceEx = new AdalServiceException(AdalErrorMessage.UnauthorizedHttpStatusCodeExpected, error);
                CoreLoggerBase.Default.ErrorPii(serviceEx);
                throw serviceEx;
            }

            authParams = createFromUnauthorizedResponseCommon(response);
        }

        return authParams;
    }
}