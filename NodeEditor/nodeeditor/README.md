# Rete.js Dynamic Node Editor

This project is a dynamic Node Editor built using [Rete.js](https://rete.js.org/) along with its plugins. The editor is capable of rendering nodes based on hierarchical JSON data, dynamically adding/removing nodes, and exporting the current node structure back to JSON.

## Features

- **Dynamic Node Creation:** Nodes are created dynamically from a nested JSON structure.
- **Hierarchical Node Placement:** Nodes are positioned in a visually organized hierarchical structure.
  - Child nodes are distributed evenly above and below their parent, considering the number of children (even/odd).
- **Dynamic Node Manipulation:**
  - Add new nodes interactively.
  - Remove nodes dynamically.
- **Export to JSON:** Export the current node configuration to JSON format.
- **Rete.js Plugins:**
  - `rete-area-plugin` for managing the canvas and interactions.
  - `rete-connection-plugin` for handling connections between nodes.
  - `rete-react-plugin` for React-based rendering of nodes.

## Getting Started

### Prerequisites

- **Node.js** (v14 or later)
- Package Manager: `npm` or `yarn`

### Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd rete-dynamic-node-editor
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Usage

1. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```
2. Open the application in your browser at `http://localhost:3000`.

## Core Functionality

### Dynamic Node Creation

Nodes are created dynamically by parsing hierarchical JSON data. Child nodes are arranged relative to their parent nodes:
- **Even Children:** Half are placed above, and half below the parent node.
- **Odd Children:** The middle child is aligned with the parent, while others are evenly distributed above and below.

### Dynamic Node Manipulation

- **Add Nodes:** Interactively add nodes by calling the `createNode` function.
- **Remove Nodes:** Remove nodes dynamically, ensuring proper connection handling.

### Export to JSON

The current node structure can be exported to JSON using the `editor.toJSON()` method, enabling easy integration and persistence of the node graph.

### Example JSON Input

The editor processes JSON data like the following to generate nodes:

```json
{
   "InternalCombustionEngines": {
      "Classification": {
         "ByIgnitionMethod": {
            "SparkIgnition": {
               "Description": "Engines that use a spark plug to ignite the air-fuel mixture.",
               "Examples": ["Petrol Engines", "Gas Engines"]
            },
            "CompressionIgnition": {
               "Description": "Engines that use compression to raise the temperature of air to ignite the fuel.",
               "Examples": ["Diesel Engines"]
            }
         }
      }
   }
}
```

### Export Example

The following is an example of JSON output for a generated node graph:

```json
{
   "nodes": {
      "1": {
         "id": 1,
         "name": "InternalCombustionEngines",
         "inputs": [],
         "outputs": ["Classification"]
      },
      "2": {
         "id": 2,
         "name": "Classification",
         "inputs": ["InternalCombustionEngines"],
         "outputs": ["ByIgnitionMethod"]
      }
   }
}
```

## Project Structure

- **`src/index.ts`**: Entry point of the application.
- **`src/editor.ts`**: Core implementation of the Rete.js Node Editor.
- **`src/jsonData.ts`**: Contains the example hierarchical JSON data.

## Future Enhancements

- Improved UI for dynamic node creation and deletion.
- Support for advanced node configuration and validation.
- Enhanced exporting features to save/load complete editor states.

## Dependencies

- [Rete.js](https://rete.js.org/)
- [Rete-area-plugin](https://rete.js.org/#/plugins/area)
- [Rete-connection-plugin](https://rete.js.org/#/plugins/connection)
- [Rete-react-plugin](https://rete.js.org/#/plugins/react)

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

**Happy Coding!** 🚀
