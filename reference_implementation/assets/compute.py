from ._base import *


class ComputeAddress(Base):
    @property
    def edges(self):
        edges = []  # = super().edges
        if "subnetwork" in self.resource_data:
            edges.append(fix_reference(self.resource_data["subnetwork"]))
        elif "users" in self.resource_data:
            for user_name in self.resource_data["users"]:
                edges.append(fix_reference(user_name))
        elif (
            "status" in self.resource_data
            and self.resource_data["status"] == "RESERVED"
        ):
            edges.append(self.parent)
        else:
            print(f"Unknown binding for address {self.name}...")
            edges.append(self.parent)
        return edges


class ComputeDisk(Base):
    pass


class ComputeExternalVpnGateway(Base):
    pass


class ComputeFirewall(Base):
    pass


class ComputeFirewallPolicy(Base):
    pass


class ComputeForwardingRule(Base):
    @property
    def edges(self):
        if "network" in self.resource_data:
            return [fix_reference(self.resource_data["network"])]
        if "target" in self.resource_data:
            return [fix_reference(self.resource_data["target"])]
        else:
            print(f"Unknown target for forwarding rule {self.name}...")
            return [self.parent]


class ComputeGlobalAddress(Base):
    pass


class ComputeGlobalForwardingRule(Base):
    pass


class ComputeHealthCheck(Base):
    pass


class ComputeInstance(Base):
    pass


class ComputeInstanceGroup(Base):
    pass


class ComputeInstanceSettings(Base):
    pass


class ComputeInstantSnapshot(Base):
    pass


class ComputeNetwork(Base):
    pass


class ComputeNetworkEndpointGroup(Base):
    pass


class ComputeProject(Base):
    pass


class ComputeRegionBackendService(Base):
    pass


class ComputeRegionDisk(Base):
    pass


class ComputeResourcePolicy(Base):
    pass


class ComputeRoute(Base):
    @property
    def edges(self):
        edges = []
        if "nextHopVpnTunnel" in self.resource_data:
            edges.append(fix_reference(self.resource_data["nextHopVpnTunnel"]))
        elif "nextHopNetwork" in self.resource_data:
            edges.append(fix_reference(self.resource_data["nextHopNetwork"]))
        elif "nextHopGateway" in self.resource_data:
            edges.append(fix_reference(self.resource_data["network"]))
        elif "nextHopPeering" in self.resource_data:
            edges.append(fix_reference(self.resource_data["network"]))
        else:
            print(f"Unknown target for route {self.name}...")
            edges.append(fix_reference(self.resource_data["network"]))
        return edges


class ComputeRouter(Base):
    @property
    def edges(self):
        return [fix_reference(self.resource_data["network"])]


class ComputeSecurityPolicy(Base):
    pass


class ComputeSnapshot(Base):
    pass


class ComputeSslCertificate(Base):
    pass


class ComputeSslPolicy(Base):
    pass


class ComputeSubnetwork(Base):
    @property
    def edges(self):
        return [fix_reference(self.resource_data["network"])]


class ComputeTargetHttpsProxy(Base):
    pass


class ComputeTargetVpnGateway(Base):
    @property
    def edges(self):
        return [fix_reference(self.resource_data["network"])]


class ComputeUrlMap(Base):
    pass


class ComputeVpnGateway(Base):
    pass


class ComputeVpnTunnel(Base):
    @property
    def edges(self):
        return [fix_reference(self.resource_data["targetVpnGateway"])]
