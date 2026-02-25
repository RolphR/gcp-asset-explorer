from ._base import *


class CloudKmsCryptoKey(Base):
    @property
    def display_name(self):
        return self.resource_data["name"].split("/")[-1]


class CloudKmsCryptoKeyVersion(Base):
    @property
    def display_name(self):
        return self.resource_data["name"].split("/")[-1]


class CloudKmsKeyRing(Base):
    @property
    def display_name(self):
        return self.resource_data["name"].split("/")[-1]
