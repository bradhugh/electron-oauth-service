import { OAuthParameter } from "../oauth2/OAuthConstants";

export class ClientKey {
    constructor(public clientId: string) {}

    public addToParameters(parameters: Map<string, string>): void {
        if (this.clientId) {
            parameters.set(OAuthParameter.clientId, this.clientId);
        }

        // TODO: Credential, Assertion, Certificate
    }
}
