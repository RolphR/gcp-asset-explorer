import json
import glob
import logging

import assets

logger = logging.basicConfig(level=logging.INFO)


def main():
    json_files = glob.glob("*.json")

    for file_path in json_files:
        edges = set()
        node_labels = {}
        with open(file_path, "r") as f:
            cloud_assets = json.load(f)

        for asset_data in cloud_assets:
            if not isinstance(asset_data, dict) or "name" not in asset_data:
                continue

            asset = assets.load(asset_data)

            source_name = asset.name
            display_name = asset.display_name
            node_labels[source_name] = f'{asset["assetType"]}:{display_name}'
            for edge in asset.edges:
                edges.add((source_name, edge))

        all_nodes = set()
        for source, target in edges:
            all_nodes.add(source)
            all_nodes.add(target)

        with open(f"{file_path[:-5]}.dot", "w") as f:
            f.write("digraph G {\n")
            f.write("  rankdir=LR;\n")
            f.write("  overlap=false;\n")
            f.write("  splines=true;\n")
            f.write(
                "  node [shape=box, style=rounded, fontname=Helvetica, fontsize=10];\n"
            )
            f.write("  edge [fontsize=9];\n")

            for node, label in node_labels.items():
                f.write(f'  "{node}" [label="{label}"];\n')

            for source, target in sorted(list(edges)):
                f.write(f'  "{source}" -> "{target}";\n')

            f.write("}\n")


if __name__ == "__main__":
    main()
