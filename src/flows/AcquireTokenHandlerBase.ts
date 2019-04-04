import { AuthenticationResultEx } from "../AuthenticationResultEx";
import { Authenticator, AuthorityType } from "../instance/Authenticator";
import { InstanceDiscovery } from "../instance/InstanceDiscovery";
import { ICacheQueryData } from "../internal/cache/CacheQueryData";
import { TokenSubjectType } from "../internal/cache/TokenCacheKey";
import { CallState } from "../internal/CallState";
import { IRequestData } from "../internal/RequestData";
import { TokenCache } from "../TokenCache";
import { Utils } from "../Utils";
import { BrokerParameter } from "./BrokerParameter";

export class ClientKey {
    constructor(public clientId: string) {}

    public addToParameters(parameters: { [key: string]: string }): void {
        if (this.clientId) {
            parameters.client_id = this.clientId;
        }
    }
}

// tslint:disable-next-line: max-classes-per-file
export class AcquireTokenHandlerBase {

    public static createCallState(correlationId: string): CallState {
        correlationId = (correlationId !== Utils.guidEmpty) ? correlationId : Utils.newGuid();
        return new CallState(correlationId);
    }

    protected static nullResource: string = "null_resource_as_optional";

    public callState: CallState;

    protected supportAdfs: boolean;
    protected authenticator: Authenticator;
    protected resource: string;
    protected clientKey: ClientKey;
    protected resultEx: AuthenticationResultEx;
    protected tokenSubjectType: TokenSubjectType;
    protected uniqueId: string;
    protected displayableId: string;
    protected loadFromCache: boolean = false;
    protected storeToCache: boolean = false;

    private tokenCache: TokenCache;
    private brokerParameters: { [key: string]: string } = null;
    private cacheQueryData: ICacheQueryData = null;

    protected constructor(requestData: IRequestData) {
        this.authenticator = requestData.authenticator;
        this.callState = AcquireTokenHandlerBase.createCallState(requestData.correlationId !== Utils.guidEmpty
            ? requestData.correlationId
            : this.authenticator.correlationId);
        this.tokenCache = requestData.tokenCache;

        if (!requestData.resource) {
            throw new Error("requestData.resource must be set");
        }

        this.resource = requestData.resource !== AcquireTokenHandlerBase.nullResource ? requestData.resource : null;
        this.clientKey = requestData.clientKey;
        this.tokenSubjectType = requestData.subjectType;

        this.loadFromCache = !!this.tokenCache;
        this.storeToCache = !!this.tokenCache;
        this.supportAdfs = false;

        this.brokerParameters = {};
        this.brokerParameters[BrokerParameter.authority] = requestData.authenticator.authority;
        this.brokerParameters[BrokerParameter.resource] = requestData.resource;
        this.brokerParameters[BrokerParameter.clientId] = requestData.clientKey.clientId;
        this.brokerParameters[BrokerParameter.correlationId] = this.callState.correlationId;
        this.brokerParameters[BrokerParameter.clientVersion] = "3"; // TODO: Version?

        this.resultEx = null;

        this.cacheQueryData.extendedLifeTimeEnabled = requestData.extendedLifeTimeEnabled;

        // TODO: Do I need brokerHelper?
        this.callState.logger.info("EOAS is running...");

        let msg = "=== Token Acquisition started: \n\t" +
            `Authentication Target: ${TokenSubjectType[requestData.subjectType]}\n\t`;

        if (InstanceDiscovery.isWhitelisted(requestData.authenticator.getAuthorityHost())) {
            msg += `, Authority Host: ${requestData.authenticator.getAuthorityHost()}`;
        }
        this.callState.logger.info(msg);

        const piiMsg = `=== Token Acquisition started:\n\t` +
            `Authority: ${requestData.authenticator.authority}\n\t` +
            `Resource: ${requestData.resource}\n\t` +
            `ClientId: ${requestData.clientKey.clientId}\n\t` +
            `CacheType: ? ${this.tokenCache ? ` (${this.tokenCache.count} items)` : "null" }\n\t` +
            `Authentication Target: ${TokenSubjectType[requestData.subjectType]}\n\t`;
        this.callState.logger.infoPii(piiMsg);
    }

    protected async PreRunAsync(): Promise<void> {
        await this.authenticator.updateFromTemplateAsync(this.callState);
        this.validateAuthorityType();
    }

    protected validateAuthorityType(): void {
        if (!this.supportAdfs && this.authenticator.authorityType === AuthorityType.ADFS) {
            throw new Error(`Invalid Authority Type Template ${this.authenticator.authority}`);
        }
    }
}
