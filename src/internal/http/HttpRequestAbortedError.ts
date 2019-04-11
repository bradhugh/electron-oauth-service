export class HttpRequestAbortedError extends Error {
    constructor() {
        super("The HTTP Request was aborted");
    }
}
