from ._base import *


class BigquerydatatransferTransferConfig(Base):
    pass


class BigqueryDataset(Base):
    @property
    def display_name(self):
        return self.resource_data["id"]


class BigqueryRoutine(Base):
    pass


class BigqueryTable(Base):
    @property
    def display_name(self):
        return self.resource_data["id"]


class BigqueryreservationReservation(Base):
    pass
