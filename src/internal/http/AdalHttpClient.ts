import { AdalErrorCode } from "../../AdalErrorCode";
import { AdalServiceError } from "../../AdalServiceError";
import { EncodingHelper } from "../../helpers/EncodingHelper";
import { Utils } from "../../Utils";
import { CallState } from "../CallState";
import { AdalIdHelper } from "../helpers/AdalIdHelper";
import { IHttpClient } from "../platform/IHttpClient";
import { IRequestParameters } from "../RequestParameters";
import { HttpClientWrapper } from "./HttpClientWrapper";
import { HttpStatusCode } from "./HttpStatusCode";
import { IHttpWebResponse } from "./IHttpWebResponse";

export class AdalHttpClient {

    private static deviceAuthHeaderName = "x-ms-PKeyAuth";
    private static deviceAuthHeaderValue = "1.0";
    private static wwwAuthenticateHeader = "WWW-Authenticate";
    private static pKeyAuthName = "PKeyAuth";
    private static delayTimePeriodMilliSeconds = 1000;

    private static checkForExtraQueryParameter(url: string): string {
        // new PlatformInformation().GetEnvironmentVariable("ExtraQueryParameter");
        const extraQueryParameter: string = null;
        const delimiter: string = (url.indexOf("?") > 0) ? "&" : "?";
        if (extraQueryParameter) {
            url += delimiter + extraQueryParameter;
        }

        return url;
    }

    public resiliency = false;
    public retryOnce = true;
    public requestUri: string;

    public client: IHttpClient;

    private _callState: CallState;

    constructor(uri: string, public callState: CallState) {
        this.requestUri = AdalHttpClient.checkForExtraQueryParameter(uri);
        this.client = new HttpClientWrapper(this.requestUri, callState);
        this._callState = callState;
    }

    // TODO: Was this private?
    public async getResponseAsync<T>(respondToDeviceAuthChallenge: boolean = true): Promise<T> {
        let typedResponse: T = null;
        let response: IHttpWebResponse;

        try {
            const adalIdHeaders: Map<string, string> = AdalIdHelper.getAdalIdParameters();
            for (const kvp of adalIdHeaders.entries()) {
                this.client.headers.add(kvp["0"], kvp["1"]);
            }

            // add pkeyauth header
            this.client.headers.add(AdalHttpClient.deviceAuthHeaderName, AdalHttpClient.deviceAuthHeaderValue);
            response = await this.client.getResponseAsync();

            typedResponse = EncodingHelper.deserializeResponse<T>(response.responseString);
        } catch (error) {

            throw error;

            // const ex = error as HttpRequestWrapperException;
            // if (!ex) {
            //     throw error;
            // }

            // if (ex.InnerException instanceof TaskCanceledException) {
            //     this.resiliency = true;

            //     this._callState.logger.info("Network timeout, Exception type: " + ex.InnerException.GetType());
            //     this._callState.logger.infoPii("Network timeout, Exception message: " + ex.InnerException.Message);
            // }

            // if (!this.resiliency && ex.WebResponse == null)
            // {
            //     this._callState.logger.errorExPii(ex);
            //     throw new AdalServiceError(AdalErrorCode.unknown, null, null, ex);
            // }

            // // check for resiliency
            // if (!this.resiliency && ex.webResponse.statusCode >= 500 && ex.webResponse.statusCode < 600) {
            //     this._callState.logger.info(
            //         "HttpStatus code: " + ex.WebResponse.StatusCode + ", Exception type: <??>");

            //     this._callState.logger.infoPii(
            //         "HttpStatus code: " + ex.WebResponse.StatusCode + ", Exception message: " +
            //         ex.InnerException ?  ex.InnerException.message : "");

            //     this.resiliency = true;
            // }

            // if (this.resiliency) {
            //     if (this.retryOnce) {
            //         await Utils.delay(AdalHttpClient.delayTimePeriodMilliSeconds);
            //         this.retryOnce = false;

            //         const msg = "Retrying one more time..";
            //         this._callState.logger.info(msg);

            //         return await this.getResponseAsync<T>(respondToDeviceAuthChallenge);
            //     }

            //     this._callState.logger.info(
            //         "Retry Failed, Exception type: ???");
            //     this._callState.logger.infoPii(
            //         "Retry Failed, Exception message: " + ex.InnerException ? ex.InnerException.message : "");
            // }

            // if (!this.isDeviceAuthChallenge(ex.WebResponse, respondToDeviceAuthChallenge)) {
            //     const tokenResponse: TokenResponse = TokenResponse.createFromErrorResponse(ex.WebResponse);
            //     const errorCodes: string[] = tokenResponse.ErrorCodes ?
            //         tokenResponse.ErrorCodes : [ ex.WebResponse.StatusCode.toString() ];
            //     const serviceEx: AdalServiceError = new AdalServiceError(tokenResponse.Error,
            //         tokenResponse.ErrorDescription,
            //         errorCodes, ex);

            //     if (ex.WebResponse.StatusCode === 400 &&
            //         tokenResponse.Error === AdalErrorCode.interactionRequired) {
            //         throw new AdalClaimChallengeException(
            //             tokenResponse.Error, tokenResponse.ErrorDescription, ex, tokenResponse.Claims);
            //     }

            //     throw serviceEx;
            // }

            // attempt device auth
            // return await this.handleDeviceAuthChallengeAsync<T>(ex.WebResponse);
        }

        return typedResponse;
    }

    private isDeviceAuthChallenge(response: IHttpWebResponse, respondToDeviceAuthChallenge: boolean): boolean {
        // return DeviceAuthHelper.CanHandleDeviceAuthChallenge
        //         && response
        //         && respondToDeviceAuthChallenge
        //         && response.headers
        //         && response.statusCode === HttpStatusCode.Unauthorized
        //         && response.headers.contains(AdalHttpClient.wwwAuthenticateHeader)
        //         && response.headers.getFirst(AdalHttpClient.wwwAuthenticateHeader)
        //             .toLowerCase().startsWith(AdalHttpClient.pKeyAuthName);

        return false;
    }

    private ParseChallengeData(response: IHttpWebResponse): Map<string, string> {
        const data = new Map<string, string>();
        const authHeaders = response.headers.getValues(AdalHttpClient.wwwAuthenticateHeader);
        let wwwAuthenticate = authHeaders.length ? authHeaders[0] : "";
        wwwAuthenticate = wwwAuthenticate.substring(AdalHttpClient.pKeyAuthName.length + 1);
        const headerPairs: string[] = EncodingHelper.splitWithQuotes(wwwAuthenticate, ",");
        for (const pair of headerPairs) {
            const keyValue: string[] = EncodingHelper.splitWithQuotes(pair, "=");
            data.set(keyValue[0].trim(), keyValue[1].trim().replace("\"", ""));
        }

        return data;
    }

    private async HandleDeviceAuthChallengeAsync<T>(response: IHttpWebResponse): Promise<T> {
        const responseDictionary: Map<string, string> = this.ParseChallengeData(response);

        if (!responseDictionary.has("SubmitUrl")) {
            responseDictionary.set("SubmitUrl", this.requestUri);
        }

        throw new Error("HandleDeviceAuthChallengeAsync not implemented");
        const respHeader: string = null;
        // TODO: await DeviceAuthHelper.CreateDeviceAuthChallengeResponseAsync(responseDictionary);
        const rp: IRequestParameters = this.client.bodyParameters;
        this.client = new HttpClientWrapper(
            AdalHttpClient.checkForExtraQueryParameter(responseDictionary.get("SubmitUrl")),
            this.callState);
        this.client.bodyParameters = rp;
        this.client.headers.add("Authorization", respHeader);
        return await this.getResponseAsync<T>(false);
    }
}
