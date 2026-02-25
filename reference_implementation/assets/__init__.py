import importlib

from ._base import *


def load(data):
    asset_type = data["assetType"]
    service_name = asset_type.split(".")[0]
    service_type = asset_type.split("/")[1]

    if service_name.startswith("cloud"):
        class_name = f"Cloud{service_name.replace("cloud", "").title()}{service_type}"
    else:
        class_name = f"{service_name.title()}{service_type}"

    # Some services are logically grouped.
    # Ensure the auto class finder can actually find them
    service_file_name = service_name
    service_grouping = set(["bigquery", "securitycenter", "storage"])
    for group in service_grouping:
        if service_name.startswith(group):
            service_file_name = group
            break

    try:
        assets_module = importlib.import_module(f"{__name__}.{service_file_name}")
    except ModuleNotFoundError:
        assets_module = importlib.import_module(f"{__name__}")

    service_module = getattr(assets_module, service_file_name, assets_module)
    asset_class = getattr(service_module, class_name, UnknownAssetType)
    return asset_class(data)
