import { RequestContext } from "../RequestContext";
import { HttpResponse } from "./HttpResponse";

import { net } from "electron";
import * as querystring from "querystring";
import { CallState } from "../../internal/CallState";

// tslint:disable: max-classes-per-file

export interface IHttpManager {
    sendPostAsync(
        endpoint: string,
        headers: { [key: string]: string },
        bodyParameters: { [key: string]: string },
        callState: CallState): Promise<HttpResponse>;

    sendPostWithContentAsync(
        endpoint: string,
        headers: { [key: string]: string },
        body: string,
        callState: CallState): Promise<HttpResponse>;

    sendGetAsync(
        endpoint: string,
        headers: { [key: string]: string },
        callState: CallState): Promise<HttpResponse>;

    sendPostForceResponseAsync(
        endpoint: string,
        headers: { [key: string]: string },
        body: string,
        callState: CallState): Promise<HttpResponse>;
}

export class HttpError extends Error {
    constructor(message: string, public response: HttpResponse) {
        super(message);
    }
}

export class HttpManager implements IHttpManager {
    public async sendPostAsync(
        endpoint: string,
        headers: { [key: string]: string },
        bodyParameters: { [key: string]: string },
        callState: CallState): Promise<HttpResponse> {

        const postData = querystring.stringify(bodyParameters);
        headers["content-type"] = "application/x-www-form-urlencoded";

        const resp = await this.requestCommonAsync(
            endpoint,
            "POST",
            headers,
            postData,
            callState);

        return resp;
    }

    public async sendPostWithContentAsync(
        endpoint: string,
        headers: { [key: string]: string },
        body: string,
        callState: CallState): Promise<HttpResponse> {

        const resp = await this.requestCommonAsync(
            endpoint,
            "POST",
            headers,
            body,
            callState);

        return resp;

    }

    public async sendGetAsync(
        endpoint: string,
        headers: { [key: string]: string },
        callState: CallState): Promise<HttpResponse> {

        const resp = await this.requestCommonAsync(
            endpoint,
            "GET",
            headers,
            null,
            callState);

        return resp;
    }

    // REVIEW: What should this do different than sendPostWithContentAsync?
    public async sendPostForceResponseAsync(
        endpoint: string,
        headers: { [key: string]: string },
        body: string,
        callState: CallState): Promise<HttpResponse> {

        const resp = await this.requestCommonAsync(
            endpoint,
            "POST",
            headers,
            body,
            callState);

        return resp;
    }

    private requestCommonAsync(
        url: string,
        method: string,
        headers: { [key: string]: string },
        body: string,
        callState: CallState): Promise<HttpResponse> {

        return new Promise((resolve, reject) => {

            const request = net.request({
                url,
                method,
                headers,
            });

            request.on("response", (response) => {

                const datas: Buffer[] = [];

                response.on("data", (chunk) => {
                    datas.push(chunk);
                });

                response.on("end", () => {
                    const bodyBuffer = Buffer.concat(datas);
                    const resp: HttpResponse = {
                        headers: response.headers,
                        statusCode: response.statusCode,
                        body: bodyBuffer.toString("utf8"),
                    };

                    if (response.statusCode >= 400) {
                        return reject(new HttpError(`HTTP request failed with status ${response.statusCode}`, resp));
                    }

                    return resolve(resp);
                });

                response.on("error", (error: Error) => {
                    return reject(error);
                });
            });

            if (body) {
                request.write(body, "utf8");
            }

            request.end();
        });
    }
}
