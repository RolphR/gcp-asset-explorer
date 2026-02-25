from ._base import *


class RunExecution(Base):
    pass


class RunJob(Base):
    @property
    def display_name(self):
        return f"{self.location}/{self.resource_data['metadata']['name']}"


class RunRevision(Base):
    pass


class RunService(Base):
    @property
    def display_name(self):
        return f"{self.location}/{self.resource_data['metadata']['name']}"
