import re

from ._base import *


class DnsManagedZone(Base):
    @property
    def name(self):
        # DnsResourceRecordSet references project id, not project number
        project_number = self.parent.split("/")[-1]
        name = super().name
        return re.sub(r"projects\/[^\/]+\/", f"projects/{project_number}/", name)


class DnsPolicy(Base):
    pass


class DnsResourceRecordSet(Base):
    @property
    def parent(self):
        # reference to DnsManagedZone includes locations/global/, remove it
        parent = super().parent
        return re.sub(r"locations\/[^\/]+\/", "", parent)
