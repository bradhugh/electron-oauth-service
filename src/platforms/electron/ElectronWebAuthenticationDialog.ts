import { BrowserWindow } from "electron";
import { AuthorizationResult, AuthorizationStatus } from "../../internal/AuthorizationResult";

export class ElectronWebAuthenticationDialog {

    private callbackUri: URL = null;

    private window: BrowserWindow = null;

    constructor(ownerWindow: object) {
        if (ownerWindow) {
            if (!(ownerWindow instanceof BrowserWindow)) {
                throw new Error("ownerWindow must be BrowserWindow");
            }

            this.window = ownerWindow as BrowserWindow;
        } else {
            // Make our own window
            this.window = new BrowserWindow({
                width: 600,
                height: 800,
                webPreferences: {
                  nodeIntegration: false, // We recommend disabling nodeIntegration for security.
                  contextIsolation: true, // We recommend enabling contextIsolation for security.
                  // see https://github.com/electron/electron/blob/master/docs/tutorial/security.md
                },
            });
        }
    }

    public async authenticateAAD(requestUri: URL, callbackUri: URL): Promise<AuthorizationResult> {
        this.callbackUri = callbackUri;

        this.window.loadURL(requestUri.href);
        let gotResult = false;

        return new Promise<AuthorizationResult>((resolve, reject) => {

            this.window.on("closed", () =>  {
                if (!gotResult) {
                    reject(new Error("Window was closed"));
                }
            });

            this.window.webContents.on(
                "did-redirect-navigation",
                (_event, url, _isInPlace, _isMainFrame, _frameProcessId, _frameRoutingId) => {
                    if (this.isRedirectUrl(url)) {
                        gotResult = true;
                        this.window.close();
                        resolve(new AuthorizationResult(AuthorizationStatus.Success, url));
                    }
            });
        });
    }

    private isRedirectUrl(url: string): boolean {
        return url.toLowerCase().startsWith(this.callbackUri.href.toLowerCase());
    }
}
