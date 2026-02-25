from ._base import *


class SecuritycenterVirtualMachineThreatDetectionSettings(Base):
    @property
    def parent(self):
        return fix_reference(self._data["ancestors"][0])


class SecuritycentermanagementSecurityCenterService(Base):
    @property
    def parent(self):
        return fix_reference(self._data["ancestors"][0])
