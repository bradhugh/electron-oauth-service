import { IHttpWebResponse } from "./http/IHttpWebResponse";

export class HttpRequestWrapperError extends Error {
    constructor(public webResponse: IHttpWebResponse, public innerError: Error) {
        super("HttpRequestWrapperError");
    }
}
