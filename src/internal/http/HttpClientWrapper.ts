import { CallState } from "../CallState";
import { IHttpClient } from "../platform/IHttpClient";
import { IRequestParameters } from "../RequestParameters";
import { HttpHeaderCollection } from "./HttpHeaderCollection";

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
    private _maxResponseSizeInBytes = 1048576;

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

    public async getResponseAsync(): Promise<any> { // TODO: IHttpWebResponse
       throw new Error("HttpClientWrapper.getResponseAsync NOT IMPLEMENTED");
    }
}
