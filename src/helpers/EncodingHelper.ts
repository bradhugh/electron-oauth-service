import { RequestContext } from "../core/RequestContext";
import { Utils } from "../Utils";

export class EncodingHelper {
    public static parseKeyValueListStrict(
        input: string,
        delimiter: string,
        urlDecode: boolean,
        lowercaseKeys: boolean,
        requestContext: RequestContext): { [key: string]: string } {
        return EncodingHelper.parseKeyValueList(input, delimiter, urlDecode, lowercaseKeys, requestContext, true);
    }

    public static urlDecode(message: string): string {
        if (!message) {
            return message;
        }

        message = message.replace("+", "%20");
        message =  unescape(message);

        return message;
    }

    public static splitWithQuotes(input: string, delimiter: string): string[] {
        const items: string[] = [];

        if (!input) {
            return items;
        }

        let startIndex = 0;
        let insideString = false;
        let item: string = null;
        for (let i = 0; i < input.length; i++) {
            if (input[i] === delimiter && !insideString) {
                item = input.substring(startIndex, i - startIndex);
                if (item.trim()) {
                    items.push(item);
                }

                startIndex = i + 1;
            } else if (input[i] === '"') {
                insideString = !insideString;
            }
        }

        item = input.substring(startIndex);
        if (item.trim()) {
            items.push(item);
        }

        return items;
    }

    private static parseKeyValueList(
        input: string,
        delimiter: string,
        urlDecode: boolean,
        lowercaseKeys: boolean,
        requestContext: RequestContext,
        strict: boolean): { [key: string]: string } {

        const response: { [key: string]: string } = {};

        const queryPairs: string[] = EncodingHelper.splitWithQuotes(input, delimiter);

        for (const queryPair of queryPairs) {
            const pair: string[] = EncodingHelper.splitWithQuotes(queryPair, "=");

            if (pair.length === 2 && pair[0] && pair[1]) {
                let key: string = pair[0];
                let value: string = pair[1];

                // Url decoding is needed for parsing OAuth response,
                // but not for parsing WWW-Authenticate header in 401 challenge
                if (urlDecode) {
                    key = EncodingHelper.urlDecode(key);
                    value = EncodingHelper.urlDecode(value);
                }

                if (lowercaseKeys) {
                    key = key.trim().toLowerCase();
                }

                value = value.trim();
                value = Utils.trim(value, '\"').trim();

                if (response[key] && requestContext != null) {
                    requestContext.logger.warning(`Key/value pair list contains redundant key '${key}'.`);
                }

                response[key] = value;
            } else if (strict && pair.length > 2) {
                throw new Error("Invalid Argument: input");
            }
        }

        return response;
    }
}
