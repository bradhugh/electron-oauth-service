import { AuthenticationParameters } from "../AuthenticationParameters";
import { InstanceDiscovery } from "../instance/InstanceDiscovery";

export interface IServiceBundle {
    instanceDiscovery: InstanceDiscovery;
    authenticationParameters: AuthenticationParameters;
}
