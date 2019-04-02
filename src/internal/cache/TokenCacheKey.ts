export enum TokenSubjectType {
    User,
    Client,
    UserPlusClient
}

export class TokenCacheKey {

    constructor(
        public authority: string,
        public resource: string,
        public clientId: string,
        public tokenSubjectType: TokenSubjectType,
        public uniqueId: string,
        public displayableId: string) {}

    // public getStringKey(): string {
    //     return `${this.authority}:::${this.resource.toLowerCase()}:::${this.clientId.toLowerCase()}` +
    //         `:::${this.uniqueId ? this.uniqueId : ''}` +
    //         `:::${this.displayableId ? this.displayableId.toLowerCase() : ''}` +
    //         `:::${this.tokenSubjectType}`;
    // }

    // public static fromStringKey(stringKey: string): TokenCacheKey {
    //     const exp = new RegExp(/^(.+):::(.+):::(.+):::(.*):::(.*):::(.+)$/);
    //     const match = exp.exec(stringKey);
    //     if (!match) {
    //         throw new Error(`Token cache key ${stringKey} is in the incorrect format!`);
    //     }

    //     const authority = match[1];
    //     const resourceId = match[2];
    //     const clientId = match[3];
    //     const uniqueId = match[4];
    //     const displayableId = match[5];
    //     const tokenSubjectType: TokenSubjectType = parseInt(match[6]);

    //     console.log(`fromStringKey:
    //         Authority: ${authority}
    //         resourceId ${resourceId}
    //         clientId: ${clientId}
    //         uniqueId: ${uniqueId}
    //         tokenSubjectType: ${tokenSubjectType}`);

    //     return new TokenCacheKey(
    //         authority,
    //         resourceId,
    //         clientId,
    //         tokenSubjectType,
    //         uniqueId,
    //         displayableId);
    // }

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