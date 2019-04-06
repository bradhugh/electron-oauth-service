import { RequestContext } from "../core/RequestContext";
import { CallState } from "../internal/CallState";
import { Utils } from "../Utils";

export class EncodingHelper {
    public static parseKeyValueListStrict(
        input: string,
        delimiter: string,
        urlDecode: boolean,
        lowercaseKeys: boolean,
        callState: CallState): Map<string, string> {
        return EncodingHelper.parseKeyValueList(input, delimiter, urlDecode, lowercaseKeys, callState, true);
    }

    public static urlDecode(message: string): string {
        if (!message) {
            return message;
        }

        message = message.replace("+", "%20");
        message =  unescape(message);

        return message;
    }

    public static urlEncode(message: string): string {
        if (!message) {
            return null;
        }

        return escape(message);
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

    public static addKeyValueString(messageBuilder: string, key: string, value: string): string {
        const delimiter = (messageBuilder.length === 0) ? "" : "&";
        messageBuilder += `${delimiter}${key}=`;
        messageBuilder += value;
        return messageBuilder;
    }

    /// <summary>
    /// Deserialize the given JSON string in to the specified type <typeparamref name="T"/>
    /// </summary>
    /// <typeparam name="T">Type to deserialize the JSON as</typeparam>
    /// <param name="response">JSON string</param>
    /// <returns>Deserialized type <typeparamref name="T"/></returns>
    public static deserializeResponse<T>(response: string): T {
        if (!response) {
            return null;
        }

        return JSON.parse(response) as T;
    }

    public static parseKeyValueList(
        input: string,
        delimiter: string,
        urlDecode: boolean,
        lowercaseKeys: boolean,
        callState: CallState,
        strict: boolean): Map<string, string> {

        const response = new Map<string, string>();

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

                if (response.has(key) && callState) {
                    callState.logger.warning(`Key/value pair list contains redundant key '${key}'.`);
                }

                response.set(key, value);
            } else if (strict && pair.length > 2) {
                throw new Error("Invalid Argument: input");
            }
        }

        return response;
    }
}
