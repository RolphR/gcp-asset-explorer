import re
import logging as log_facility


def fix_reference(field):
    if re.match(r"^(projects|folders|organizations)\/[0-9]+$", field):
        return f"//cloudresourcemanager.googleapis.com/{field}"
    elif field.startswith("https://www.googleapis.com/compute/v1/"):
        return field.replace(
            "https://www.googleapis.com/compute/v1/",
            "//compute.googleapis.com/",
        )
    elif field.startswith("logging.googleapis.com/"):
        return field.replace(
            "logging.googleapis.com/",
            "//logging.googleapis.com/",
        )
    else:
        return field


def find_dependencies(data, dependencies):
    if isinstance(data, dict):
        for value in data.values():
            find_dependencies(value, dependencies)
    elif isinstance(data, list):
        for item in data:
            find_dependencies(item, dependencies)
    elif isinstance(data, str):
        if data.startswith("//"):
            dependencies.add(data)
        elif ".gserviceaccount.com" in data:
            parts = data.split(":")
            email = parts[-1]
            if "@" in email:
                dependencies.add(email)


class Base:
    def __init__(self, data):
        self._data = data

    def __getitem__(self, key):
        return self._data[key]

    @property
    def name(self):
        return self._data["name"]

    @property
    def type(self):
        return self._data["assetType"]

    @property
    def location(self):
        return self._data["resource"]["location"]

    @property
    def parent(self):
        parent_name = self._data["resource"].get("parent", "")
        if not parent_name:
            parent_name = fix_reference(self._data["ancestors"][0])
        return parent_name

    @property
    def resource_data(self):
        return self._data["resource"]["data"]

    @property
    def display_name(self):
        return self.resource_data.get(
            "displayName",
            self.resource_data.get("name", self.name),
        )

    @property
    def edges(self):
        return [self.parent]


class UnknownAssetType(Base):
    def __init__(self, data):
        super().__init__(data)
        log_facility.info(f"Unknown asset type: {self.type}, defaulting to base class")
