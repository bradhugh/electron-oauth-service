export class Base64UrlEncoder {
    //
    // The following functions perform base64url encoding which differs from regular base64 encoding as follows
    // * padding is skipped so the pad character '=' doesn't have to be percent encoded
    // * the 62nd and 63rd regular base64 encoding characters ('+' and '/') are replace with ('-' and '_')
    // The changes make the encoding alphabet file and URL safe
    // See RFC4648, section 5 for more info
    //
    public static decodeBytes(arg: string): string {
        let s = arg;
        s = s.replace(
            Base64UrlEncoder.base64UrlCharacter62, Base64UrlEncoder.base64Character62); // 62nd char of encoding
        s = s.replace(
            Base64UrlEncoder.base64UrlCharacter63, Base64UrlEncoder.base64Character63); // 63rd char of encoding

        switch (s.length % 4) {
            // Pad
            case 0:
                break; // No pad chars in this case
            case 2:
                s += Base64UrlEncoder.doubleBase64PadCharacter;
                break; // Two pad chars
            case 3:
                s += Base64UrlEncoder.base64PadCharacter;
                break; // One pad char
            default:
                throw new Error(`Illegal base64url string! ${arg}`);
        }

        return btoa(s); // Standard base64 decoder

    }

    public static Encode(arg: string): string {
        if (!arg) {
            throw new Error("arg cannot be null");
        }

        let s = atob(arg);
        s = s.split(Base64UrlEncoder.base64PadCharacter)[0]; // Remove any trailing padding
        s = s.replace(
            Base64UrlEncoder.base64Character62, Base64UrlEncoder.base64UrlCharacter62);  // 62nd char of encoding
        s = s.replace(
            Base64UrlEncoder.base64Character63, Base64UrlEncoder.base64UrlCharacter63);  // 63rd char of encoding

        return s;
    }

    private static base64PadCharacter = "=";
    private static base64Character62 = "+";
    private static base64Character63 = "/";
    private static base64UrlCharacter62 = "-";
    private static base64UrlCharacter63 = "_";
    private static readonly doubleBase64PadCharacter =
        `${Base64UrlEncoder.base64PadCharacter}${Base64UrlEncoder.base64PadCharacter}`;
}
