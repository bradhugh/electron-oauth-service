import { AdalSilentTokenAcquisitionException } from "../../AdalSilentTokenAcquisitionError";
import { AuthenticationResultEx } from "../../AuthenticationResultEx";
import { AdalErrorMessage } from "../../Constants";
import { AcquireTokenHandlerBase } from "../../flows/AcquireTokenHandlerBase";
import { BrokerParameter } from "../../flows/BrokerParameter";
import { ILogger } from "../../ILogger";
import { UserIdentifier, UserIdentifierType } from "../../UserIdentifier";
import { TokenSubjectType } from "../cache/TokenCacheKey";
import { IPlatformParameters } from "../platform/IPlatformParameters";
import { IRequestData } from "../RequestData";
import { DictionaryRequestParameters } from "../RequestParameters";

export class AcquireTokenSilentHandler extends AcquireTokenHandlerBase {

    constructor(
        requestData: IRequestData,
        userId: UserIdentifier,
        parameters: IPlatformParameters,
        logger: ILogger) {

        super(requestData, logger);

        if (!userId) {
            throw new Error(AdalErrorMessage.specifyAnyUser);
        }

        requestData.subjectType = requestData.clientKey.hasCredential
            ? TokenSubjectType.UserPlusClient
            : TokenSubjectType.User;

        this.uniqueId = userId.uniqueId;
        this.displayableId = userId.displayableId;
        this.userIdentifierType = userId.type;
        this.supportADFS = true;

        this.brokerParameters.set(BrokerParameter.username, userId.id);
        this.brokerParameters.set(BrokerParameter.usernameType, UserIdentifierType[userId.type]);
        this.brokerParameters.set(BrokerParameter.silentBrokerFlow, null); // add key
    }

    protected sendTokenRequestAsync(): Promise<AuthenticationResultEx> {
        if (!this.resultEx) {
            const msg = "No token matching arguments found in the cache";
            this.callState.logger.verbose(msg);
            this.callState.logger.verbosePii(msg);

            throw new AdalSilentTokenAcquisitionException();
        }

        throw new AdalSilentTokenAcquisitionException(this.resultEx.error);
    }

    protected addAdditionalRequestParameters(requestParameters: DictionaryRequestParameters): void {
        // No additional request parameters needed
    }
}
