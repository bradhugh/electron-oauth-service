// This needs to be a:
// case-insensitive dictionary
// that can hold multiple values of the same header.
// Similar to .NET WebHeaderCollection

export class HttpHeaderCollection {
    private headerDictionary: Map<string, string[]> = new Map<string, string[]>();

    public get(headerName: string): string {
        const values: string[] = this.getValues(headerName);
        return values.join(",");
    }

    public getValues(headerName: string): string[] {
        if (!headerName) {
            return [];
        }

        const headerKey = headerName.toLowerCase();
        const values = this.headerDictionary.get(headerKey);
        return values ? values : [];
    }

    public getFirst(headerName: string): string {
        if (!headerName) {
            return "";
        }

        const values = this.getValues(headerName);
        if (values.length) {
            return values[0];
        }

        return "";
    }

    public contains(headerName: string) {
        if (!headerName) {
            return false;
        }

        return this.headerDictionary.has(headerName.toLowerCase());
    }

    public add(headerName: string, headerValue: string) {

        if (!headerName) {
            throw new Error("headerName must not be null");
        }

        const headerKey = headerName.toLowerCase();
        const values = this.headerDictionary.get(headerKey);
        if (!values) {
            this.headerDictionary.set(headerKey, [ headerValue ]);
        } else {
            // There is a pre-existing value there, we need to append it to the array
            values.push(headerValue);
            this.headerDictionary.set(headerKey, values);
        }
    }
}
