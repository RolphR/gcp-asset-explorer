# GCP Asset Explorer

A modern, interactive frontend application to visualize and analyze Google Cloud Platform (GCP) Asset Inventory exports as a directed graph.

## Background

When performinh Google Cloud architecture or security review, I often look at the Asset Inventory.
Over time I created a Python implementation to convert this export to a GraphViz DOT graph.
Although these workl great for small to medium exports, they fail for larger ones.

I've never really gotten into front-end development (backend/low-level/infrastructure design).
I even dare to say that I really dislike doing "front-end stuff".
Tip to the hat to all great front-end devs and engineers out there!
Let me do all the low-level stuff that you find annoying, so you can do thje things I don't like doing ;)

Then the world changed, and I can now tell an LLM to do front-end.
This is why this application is the way it is: I tell a model what I want, and do **not** touch any code.

## Written by AI for me

I asked AI to write this application for me.
It helps me do my work, and hopefully it'll help yours (if you do something similar as me).
Use this application as you see fit.

At this moment I'm not really accepting any PRs, but feel free to open an issue instead.

## Features

- **Interactive Directed Graph Visualization**: Visualize your entire GCP infrastructure as an interconnected network using high-performance WebGL.
- **Client-Side Processing**: No backend required. Parses and processes the raw GCP JSON export natively in your browser using a robust TypeScript port of the reference Python implementation.
- **Advanced Faceted Search**:
  - Filter assets instantly by **Location**, **Service**, or **Asset Type**.
  - **Dynamic Cross-Filtering**: The filter counts automatically update based on your active selections, showing exactly how many assets match your exact criteria.
  - **Global Text Search**: Quickly find assets by querying any property hidden deep within the raw JSON payload.
  - Toggle between **Dimming** unmatched nodes (to retain visual context) or **Hiding** them (to declutter your view).
- **Rich Asset Details Sidebar**:
  - Click any node to open a comprehensive details panel.
  - Displays core extracted metadata in a clean table (Display Name, Parent, Location, Asset Type).
  - Inspect the raw JSON payload using an interactive, collapsible, and syntax-highlighted viewer.
  - Navigate seamlessly between matched assets using "Next" and "Previous" buttons.
- **Secure Export**: Download your precisely filtered slice of the graph back into a clean, raw JSON list format for external processing or auditing.

## Tech Stack

- **Framework**: [React 19](https://react.dev/) via [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Visualization**: [react-force-graph-2d](https://github.com/vasturiano/react-force-graph) (Canvas/WebGL)
- **Icons**: [Lucide React](https://lucide.dev/)
- **JSON Viewer**: [@uiw/react-json-view](https://uiwjs.github.io/react-json-view/)

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm

### Installation

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to the URL provided in the terminal (typically `http://localhost:5173`).

### Usage

1. **Export your GCP Asset Inventory**: Use the `gcloud asset export` command to generate a JSON file of your cloud infrastructure.
2. **Upload**: Drag and drop the `.json` file into the application's dropzone.
3. **Explore**:
   - Pan and zoom around the canvas.
   - Click nodes to view their full configuration in the right sidebar.
   - Use the left Search Panel to drill down into specific services or regions.

## Project Structure

- `frontend/src/utils/parser.ts`: The core logic engine that extracts dependencies and resolves graph edges based on the unique behavioral rules of various GCP services.
- `frontend/src/components/GraphViewer.tsx`: The canvas rendering engine responsible for drawing the nodes, labels, and links.
- `frontend/src/components/SearchPanel.tsx`: The advanced filtering interface.
- `reference_implementation/`: The original Python reference scripts used as a basis for the TypeScript parser logic.
