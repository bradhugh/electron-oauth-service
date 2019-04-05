import { ClientKey } from "../flows/AcquireTokenHandlerBase";
import { EncodingHelper } from "../helpers/EncodingHelper";
import { OAuthParameter } from "./oauth2/OAuthConstants";

// tslint:disable: max-classes-per-file

export interface IRequestParameters {
    toString(): string;
}

export class DictionaryRequestParameters extends Map<string, string> implements IRequestParameters {

    public extraQueryParameter: string;

    constructor(resource: string, clientKey: ClientKey) {
        super();

        if (resource) {
            this.set(OAuthParameter.resource, resource);
        }

        clientKey.addToParameters(this);
    }

    public toString(): string {
        let messageBuilder = "";

        for (const kvp of this.entries()) {
            messageBuilder = EncodingHelper.addKeyValueString(
                messageBuilder, EncodingHelper.urlEncode(kvp["0"]), EncodingHelper.urlEncode(kvp["1"]));
        }

        if (this.extraQueryParameter != null) {
            messageBuilder += "&" + this.extraQueryParameter;
        }

        return messageBuilder;
    }
}

export class StringRequestParameters implements IRequestParameters {
    private parameter: string;

    public StringRequestParameters(stringBuilderParameter: string) {
        this.parameter = stringBuilderParameter;
    }

    public toString(): string {
        return this.parameter;
    }
}