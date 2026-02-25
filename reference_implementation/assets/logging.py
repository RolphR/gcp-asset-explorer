from ._base import *


class LoggingLink(Base):
    pass


class LoggingLogBucket(Base):
    @property
    def display_name(self):
        return f'{self.location}/{self.resource_data["name"].split("/")[-1]}'


class LoggingLogSink(Base):
    @property
    def parent(self):
        return fix_reference(self.resource_data["destination"])


class LoggingRecentQuery(Base):
    pass
