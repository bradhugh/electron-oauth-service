import { HttpHeaderCollection } from "../http/HttpHeaderCollection";
import { IRequestParameters } from "../RequestParameters";

export interface IHttpClient {
    bodyParameters: IRequestParameters;

    accept: string;

    contentType: string;

    useDefaultCredentials: boolean;

    headers: HttpHeaderCollection;

    getResponseAsync(): Promise<any>; // TODO: Promise<HttpWebResponse>
}
