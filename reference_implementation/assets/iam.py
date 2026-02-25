from ._base import *


class IamRole(Base):
    pass


class IamServiceAccount(Base):
    @property
    def display_name(self):
        return self.resource_data["email"]


class IamServiceAccountKey(Base):
    pass


class IamWorkloadIdentityPool(Base):
    @property
    def display_name(self):
        return self.resource_data["name"].split("/")[-1]


class IamWorkloadIdentityPoolProvider(Base):
    @property
    def display_name(self):
        return self.resource_data["name"].split("/")[-1]
