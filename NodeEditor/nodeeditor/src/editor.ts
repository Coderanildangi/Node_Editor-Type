import { createRoot } from "react-dom/client";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import { ConnectionPlugin, Presets as ConnectionPresets } from "rete-connection-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";

// Define Schemes and AreaExtra types
type Schemes = GetSchemes<
   ClassicPreset.Node,
   ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>
>;
type AreaExtra = ReactArea2D<Schemes>;

// Define JSON data
const jsonData = {
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
         },
         "ByCylinderArrangement": {
            "Inline": {
               "Description": "Cylinders arranged in a single line.",
               "Variants": ["Inline-3", "Inline-4", "Inline-6"]
            },
            "V-Type": {
               "Description": "Cylinders arranged in two banks forming a 'V'.",
               "Variants": ["V6", "V8", "V12"]
            },
            "Flat": {
               "Description": "Cylinders arranged horizontally opposing each other.",
               "Variants": ["Flat-4", "Flat-6"]
            },
            "Radial": {
               "Description": "Cylinders arranged in a circular configuration.",
               "Variants": ["5-Cylinder Radial", "9-Cylinder Radial"]
            }
         },
         "ByFuelType": {
            "Petrol": {
               "Description": "Engines that use gasoline as fuel.",
               "Characteristics": ["High RPM", "Lightweight"]
            },
            "Diesel": {
               "Description": "Engines that use diesel as fuel.",
               "Characteristics": ["High Torque", "Fuel Efficient"]
            },
            "Gas": {
               "Description": "Engines that use natural gas or LPG.",
               "Characteristics": ["Clean Emissions", "Lower Energy Density"]
            },
            "Multi-Fuel": {
               "Description": "Engines that can run on multiple fuel types.",
               "Examples": ["Petrol and LPG", "Diesel and Biodiesel"]
            }
         },
         "ByCoolingMethod": {
            "AirCooled": {
               "Description": "Engines cooled by air flowing over fins.",
               "Usage": ["Motorcycles", "Small Aircraft"]
            },
            "WaterCooled": {
               "Description": "Engines cooled using a liquid coolant.",
               "Usage": ["Cars", "Trucks"]
            }
         },
         "ByNumberOfStrokes": {
            "TwoStroke": {
               "Description": "Engines that complete a power cycle in two strokes.",
               "Characteristics": ["Simple Design", "High Power-to-Weight Ratio"]
            },
            "FourStroke": {
               "Description": "Engines that complete a power cycle in four strokes.",
               "Characteristics": ["Efficient", "Widely Used"]
            }
         }
      },
      "Applications": {
         "Automotive": {
            "Examples": ["Passenger Cars", "Trucks", "Motorcycles"]
         },
         "Aviation": {
            "Examples": ["Light Aircraft Engines", "Helicopter Engines"]
         },
         "Marine": {
            "Examples": ["Outboard Motors", "Ship Engines"]
         },
         "Industrial": {
            "Examples": ["Generators", "Pumps", "Construction Equipment"]
         }
      }
   }

};

// Function to create editor
export async function createEditor(container: HTMLElement) {
   const socket = new ClassicPreset.Socket("socket");

   const editor = new NodeEditor<Schemes>();
   const area = new AreaPlugin<Schemes, AreaExtra>(container);
   const connection = new ConnectionPlugin<Schemes, AreaExtra>();
   const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });

   // Add plugins to the editor
   editor.use(area);
   area.use(connection);
   area.use(render);

   // Add presets for rendering and connections
   render.addPreset(Presets.classic.setup());
   connection.addPreset(ConnectionPresets.classic.setup());

   // Enable node selection and ordering
   AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
      accumulating: AreaExtensions.accumulateOnCtrl(),
   });
   AreaExtensions.simpleNodesOrder(area);

   // Function to create a node
   async function createNode(label: string, x: number, y: number) {
      const node = new ClassicPreset.Node(label);
      node.addOutput("output", new ClassicPreset.Output(socket));
      node.addInput("input", new ClassicPreset.Input(socket));

      await editor.addNode(node);
      await area.translate(node.id, { x: x, y: y });
      return node;
   }

   // Function to recursively add nodes based on JSON data
   async function addNodesFromJSON(data: { [x: string]: any; Car?: { "Engine Type": string[]; "Transmission Type": string[]; }; }, parentNode = null, posX = 0, posY = 0) {
      for (const key in data) {
         const childData = data[key];
         const node = await createNode(key, posX, posY);

         if (parentNode) {
            const connection = new ClassicPreset.Connection(parentNode as ClassicPreset.Node, "output", node as ClassicPreset.Node, "input");
            await editor.addConnection(connection);
         }

         if (Array.isArray(childData)) {
            let childY = posY + 300;
            for (const value of childData) {
               const childNode = await createNode(value, posX + 200, childY);
               const connection = new ClassicPreset.Connection(node, "output", childNode, "input");
               await editor.addConnection(connection);
               childY += 300;
            }
         } else if (typeof childData === "object" && childData !== null) {
            await addNodesFromJSON(childData, node, posX + 500, posY + 500);
         }

         posY += 300; // Adjust vertical spacing between nodes
      }
   }

   // Add nodes based on JSON data
   await addNodesFromJSON(jsonData);

   // Zoom to fit nodes
   setTimeout(() => {
      AreaExtensions.zoomAt(area, editor.getNodes());
   }, 10);

   return {
      destroy: () => area.destroy(),
   };
}
