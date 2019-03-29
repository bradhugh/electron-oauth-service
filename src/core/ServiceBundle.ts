import { InstanceDiscovery } from "../instance/InstanceDiscovery";
import { AuthenticationParameters } from "../AuthenticationParameters";

export interface IServiceBundle {
    instanceDiscovery: InstanceDiscovery;
    authenticationParameters: AuthenticationParameters;
}