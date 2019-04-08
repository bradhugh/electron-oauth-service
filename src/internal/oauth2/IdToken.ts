import { Base64UrlEncoder } from "../Base64UrlEncoder";

// tslint:disable: max-classes-per-file

export class IdTokenClaim {
    public static objectId = "oid";
    public static subject = "sub";
    public static tenantId = "tid";
    public static upn = "upn";
    public static email = "email";
    public static givenName = "given_name";
    public static familyName = "family_name";
    public static identityProvider = "idp";
    public static issuer = "iss";
    public static passwordExpiration = "pwd_exp";
    public static passwordChangeUrl = "pwd_url";
}

export interface IJsonIdToken {
    oid: string;
    sub: string;
    tid: string;
    upn: string;
    email: string;
    given_name: string;
    family_name: string;
    idp: string;
    iss: string;
    pwd_exp: number;
    pwd_url: string;
}

export class IdToken {

    public static fromJsonToken(jsonToken: IJsonIdToken): IdToken {
        const idToken = new IdToken();
        idToken.objectId = jsonToken.oid;
        idToken.subject = jsonToken.sub;
        idToken.tenantId = jsonToken.tid;
        idToken.upn = jsonToken.upn;
        idToken.email = jsonToken.email;
        idToken.givenName = jsonToken.given_name;
        idToken.familyName = jsonToken.family_name;
        idToken.identityProvider = jsonToken.idp;
        idToken.issuer = jsonToken.iss;
        idToken.passwordExpiration = jsonToken.pwd_exp;
        idToken.passwordChangeUrl = jsonToken.pwd_url;
        return idToken;
    }

    public static parse(idToken: string): IdToken {
        let idTokenBody: IdToken = null;
        if (idToken) {
            const idTokenSegments: string[] = idToken.split(".");

            // If Id token format is invalid, we silently ignore the id token
            if (idTokenSegments.length === 3) {
                try {
                    const idTokenString: string = Base64UrlEncoder.decodeBytes(idTokenSegments[1]);
                    const jsonIdToken = JSON.parse(idTokenString) as IJsonIdToken;
                    idTokenBody = IdToken.fromJsonToken(jsonIdToken);
                } catch (error) {
                    // We silently ignore the id token if exception occurs.
                }
            }
        }

        return idTokenBody;
    }

    public objectId: string;

    public subject: string;

    public tenantId: string;

    public upn: string;

    public givenName: string;

    public familyName: string;

    public email: string;

    public passwordExpiration: number;

    public passwordChangeUrl: string;

    public identityProvider: string;

    public issuer: string;
}
