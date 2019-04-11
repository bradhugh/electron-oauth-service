import { AdalClaimChallengeException } from "../../AdalClaimChallengeError";
import { AdalErrorCode } from "../../AdalErrorCode";
import { AdalServiceError } from "../../AdalServiceError";
import { EncodingHelper } from "../../helpers/EncodingHelper";
import { Utils } from "../../Utils";
import { CallState } from "../CallState";
import { AdalIdHelper } from "../helpers/AdalIdHelper";
import { HttpRequestWrapperError } from "../HttpRequestWrapperError";
import { TokenResponse } from "../oauth2/TokenResponse";
import { IHttpClient } from "../platform/IHttpClient";
import { IRequestParameters } from "../RequestParameters";
import { HttpClientWrapper } from "./HttpClientWrapper";
import { HttpRequestAbortedError } from "./HttpRequestAbortedError";
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

            if (!(error instanceof HttpRequestWrapperError)) {
                throw error;
            }

            const ex = error as HttpRequestWrapperError;

            if (ex.innerError instanceof HttpRequestAbortedError) {
                this.resiliency = true;

                this._callState.logger.info(`Network timeout.`);
                this._callState.logger.infoPii(`Network timeout, Exception ${ex}`);
            }

            if (!this.resiliency && !ex.webResponse) {
                this._callState.logger.errorExPii(ex);
                throw new AdalServiceError(AdalErrorCode.unknown, null, null, ex);
            }

            // check for resiliency
            if (!this.resiliency && ex.webResponse.statusCode >= 500 && ex.webResponse.statusCode < 600) {
                this._callState.logger.info(
                    "HttpStatus code: " + ex.webResponse.statusCode + ", Exception type: <??>");

                this._callState.logger.infoPii(
                    "HttpStatus code: " + ex.webResponse.statusCode + ", Exception message: " +
                    ex.innerError ?  ex.innerError.message : "");

                this.resiliency = true;
            }

            if (this.resiliency) {
                if (this.retryOnce) {
                    await Utils.delay(AdalHttpClient.delayTimePeriodMilliSeconds);
                    this.retryOnce = false;

                    const msg = "Retrying one more time..";
                    this._callState.logger.info(msg);

                    return await this.getResponseAsync<T>(respondToDeviceAuthChallenge);
                }

                this._callState.logger.info(
                    "Retry Failed, Exception type: ???");
                this._callState.logger.infoPii(
                    "Retry Failed, Exception message: " + ex.innerError ? ex.innerError.message : "");
            }

            if (!this.isDeviceAuthChallenge(ex.webResponse, respondToDeviceAuthChallenge)) {
                const tokenResponse: TokenResponse = TokenResponse.createFromErrorResponse(ex.webResponse);
                const errorCodes: string[] = tokenResponse.errorCodes ?
                    tokenResponse.errorCodes : [ ex.webResponse.statusCode.toString() ];
                const serviceEx: AdalServiceError = new AdalServiceError(tokenResponse.error,
                    tokenResponse.errorDescription,
                    errorCodes, ex);

                if (ex.webResponse.statusCode === 400 &&
                    tokenResponse.error === AdalErrorCode.interactionRequired) {
                    throw new AdalClaimChallengeException(
                        tokenResponse.error, tokenResponse.errorDescription, ex, tokenResponse.claims);
                }

                throw serviceEx;
            }

            // attempt device auth
            return await this.handleDeviceAuthChallengeAsync<T>(ex.webResponse);
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

    private async handleDeviceAuthChallengeAsync<T>(response: IHttpWebResponse): Promise<T> {
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
