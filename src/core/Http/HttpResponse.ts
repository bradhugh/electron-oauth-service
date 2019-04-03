export class HttpResponse {
    public headers: { [key: string]: string } = {};
    public statusCode: number;
    public body: string;
}
