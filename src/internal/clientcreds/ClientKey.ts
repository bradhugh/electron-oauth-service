import { OAuthParameter } from "../oauth2/OAuthConstants";

export class ClientKey {

    public hasCredential = false;

    constructor(public clientId: string) {}

    public addToParameters(parameters: Map<string, string>): void {
        if (this.clientId) {
            parameters.set(OAuthParameter.clientId, this.clientId);
        }

        // TODO: Credential, Assertion, Certificate
    }
}
