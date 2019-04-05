import { HttpHeaderCollection } from "./HttpHeaderCollection";

export interface IHttpWebResponse {
    statusCode: number;
    headers: HttpHeaderCollection;
    responseString: string;
}
