import * as electron from "electron";
import { Utils } from "../../Utils";
import { CallState } from "../CallState";
import { HttpRequestWrapperError } from "../HttpRequestWrapperError";
import { OAuthHeader } from "../oauth2/OAuthConstants";
import { IHttpClient } from "../platform/IHttpClient";
import { IRequestParameters, StringRequestParameters } from "../RequestParameters";
import { HttpHeaderCollection } from "./HttpHeaderCollection";
import { IHttpWebResponse } from "./IHttpWebResponse";

export class HttpClientWrapper implements IHttpClient {
    public static async createResponseAsync(response: any): Promise<any> { // TODO: IHttpWebResponse or something?
        throw new Error("HttpClientWrapper.createResponseAsync NOT IMPLEMENTED");
    }

    public bodyParameters: IRequestParameters;

    public accept: string;

    public contentType: string;

    public useDefaultCredentials: boolean;

    public headers: HttpHeaderCollection;

    protected callState: CallState;

    private uri: string;
    private _timeoutInMilliSeconds = 30000;

    constructor(uri: string, callState: CallState) {
        this.uri = uri;
        this.headers = new HttpHeaderCollection();
        this.callState = callState;
    }

    public get timeoutInMilliSeconds(): number {
        return this._timeoutInMilliSeconds;
    }

    public set timeoutInMilliSeconds(value: number) {
        this._timeoutInMilliSeconds = value;
    }

    public async getResponseAsync(): Promise<IHttpWebResponse> {
        const method = this.bodyParameters ? "POST" : "GET";
        let effectiveContentType = null;
        let bodyContent: string = null;
        if (this.bodyParameters) {
            if (this.bodyParameters instanceof StringRequestParameters) {
                bodyContent = this.bodyParameters.toString();
                effectiveContentType = this.contentType;
            } else {
                bodyContent = this.bodyParameters.toString();
                effectiveContentType = "application/x-www-form-urlencoded";
            }
        }

        const addCorrelationId = this.callState && this.callState.correlationId
                && this.callState.correlationId !== Utils.guidEmpty;

        // send the request and get the response
        const webResponse = await this.electronRequestAsync(
            method, effectiveContentType, bodyContent, addCorrelationId);

        if (webResponse.statusCode >= 400) {
            throw new HttpRequestWrapperError(
                webResponse,
                new Error(`HTTP request failed with status ${webResponse.statusCode}`));
        }

        if (addCorrelationId) {
            this.verifyCorrelationIdHeaderInReponse(webResponse.headers);
        }

        return webResponse;
    }

    private async electronRequestAsync(
        method: string,
        contentType: string,
        bodyContent: string,
        addCorrelationId: boolean): Promise<IHttpWebResponse> {

        return new Promise((resolve, reject) => {
            const request = electron.net.request({
                url: this.uri,
                method,
                headers: {
                    Accept: this.accept ? this.accept : "application/json",
                },
                timeout: this.timeoutInMilliSeconds,
            });

            if (bodyContent && contentType) {
                request.setHeader("Content-Type", contentType);
                request.setHeader("Content-Length", Buffer.byteLength(bodyContent));
            }

            for (const header of this.headers.getAllEntries()) {
                request.setHeader(header.name, header.value);
            }

            if (addCorrelationId) {
                request.setHeader(OAuthHeader.correlationId, this.callState.correlationId);
                request.setHeader(OAuthHeader.requestCorrelationIdInResponse, "true");
            }

            request.on("response", (response) => {

                const datas: Buffer[] = [];

                response.on("data", (chunk) => {
                    datas.push(chunk);
                });

                response.on("end", () => {
                    const body = Buffer.concat(datas);
                    const resp: IHttpWebResponse = {
                        headers: HttpHeaderCollection.fromElectronHeaders(response.headers),
                        statusCode: response.statusCode,
                        responseString: body.toString("utf8"),
                    };

                    resolve(resp);
                });

                response.on("error", (error: Error) => {
                    reject(error);
                });
            });

            if (bodyContent) {
                request.write(bodyContent, "utf8");
            }

            request.end();
        });
    }

    private verifyCorrelationIdHeaderInReponse(headers: HttpHeaderCollection): void {
        const headerEntries = headers.getAllEntries();
        for (const header of headerEntries) {
            const reponseHeaderKey = header.name;
            const trimmedKey = reponseHeaderKey.trim();
            if (trimmedKey.toLowerCase() === OAuthHeader.correlationId) {
                const correlationIdHeader = headers.getFirst(trimmedKey).trim();
                if (correlationIdHeader !== this.callState.correlationId) {
                    const msg = `Returned correlation id '${correlationIdHeader}' does not match ` +
                        `the sent correlation id '${this.callState.correlationId}'`;
                    this.callState.logger.warning(msg);
                    this.callState.logger.warningPii(msg);
                }

                break;
            }
        }
    }
}
