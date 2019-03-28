import { TokenSubjectType } from "./TokenCache";

export class TokenCacheKey {

    constructor(
        public authority: string,
        public resource: string,
        public clientId: string,
        public tokenSubjectType: TokenSubjectType,
        public uniqueId: string,
        public displayableId: string) {}

    public getStringKey(): string {
        return `${this.authority}:::${this.resource.toLowerCase()}:::${this.clientId.toLowerCase()}` +
            `:::${this.uniqueId ? this.uniqueId : ''}` +
            `:::${this.displayableId ? this.displayableId.toLowerCase() : ''}` +
            `:::${this.tokenSubjectType}`;
    }

    public static fromStringKey(stringKey: string): TokenCacheKey {
        const parts: string[] = stringKey.split(':::');
        if (parts.length !== 6) {
            throw new Error(`Token cache key ${stringKey} is in the incorrect format!`);
        }

        const authority = parts[0];
        const resourceId = parts[1];
        const clientId = parts[3];
        const uniqueId = parts[4];
        const displayableId = parts[5];
        const tokenSubjectType: TokenSubjectType = parseInt(parts[6]);

        return new TokenCacheKey(
            authority,
            resourceId,
            clientId,
            tokenSubjectType,
            uniqueId,
            displayableId);
    }

    public resourceEquals(otherResource: string): boolean {
        return otherResource.toLowerCase() === this.resource.toLowerCase();
    }

    public clientIdEquals(otherClientId: string): boolean {
        return otherClientId.toLowerCase() === this.clientId.toLowerCase();
    }

    public displayableIdEquals(otherDisplayableId: string): boolean {
        return otherDisplayableId.toLowerCase() === this.displayableId.toLowerCase();
    }
}