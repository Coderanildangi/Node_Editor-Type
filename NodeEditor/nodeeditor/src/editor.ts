import { createRoot } from "react-dom/client";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import { ConnectionPlugin, Presets as ConnectionPresets } from "rete-connection-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import {
   AutoArrangePlugin,
   Presets as ArrangePresets,
   ArrangeAppliers
} from "rete-auto-arrange-plugin";

// Define Schemes and AreaExtra types
type Schemes = GetSchemes<
   ClassicPreset.Node & { width: number; height: number; },
   ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>
>;
type AreaExtra = ReactArea2D<Schemes>;

// Define JSON data
const jsonData = {
   "Automobile": {
      "Input": {
         "Energy Source": {
            "Fuel": ["Gasoline", "Diesel"],
            "Battery": ["Electric Vehicle"],
            "Hybrid Sources": []
         },
         "Controls": {
            "Steering": {},
            "Accelerator": {},
            "Brake": {},
            "Gear System": {}
         },
         "Environment Interaction": {
            "Air Intake": {},
            "Road Feedback": {},
            "Sensors": ["Cameras", "Radar"]
         }
      },
      "Process": {
         "Powertrain": {
            "Engine": {},
            "Transmission": {},
            "Drivetrain": {}
         },
         "Control Systems": {
            "Electronic Control Units": {},
            "Stability Control": {},
            "Driver Assistance Systems": {}
         },
         "Auxiliary Systems": {
            "Climate Control": {},
            "Infotainment": {},
            "Lighting and Indicators": {}
         }
      },
      "Output": {
         "Motion": {
            "Forward Motion": {},
            "Reverse Motion": {},
            "Turning": {}
         },
         "Communication": {
            "External": ["Horn", "Indicators", "Brake Lights"],
            "Internal": ["Displays", "Alerts"]
         },
         "Environmental Impact": {
            "Emissions": ["Exhaust Gases", "Noise"],
            "Energy Loss": ["Heat", "Friction"]
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
   const arrange = new AutoArrangePlugin<Schemes>();

   // Add plugins to the editor
   editor.use(area);
   area.use(connection);
   area.use(render);
   area.use(arrange);

   // Add presets for rendering and connections
   render.addPreset(Presets.classic.setup());
   connection.addPreset(ConnectionPresets.classic.setup());

   // Enable node selection and ordering
   AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
      accumulating: AreaExtensions.accumulateOnCtrl(),
   });
   AreaExtensions.simpleNodesOrder(area);

   const applier = new ArrangeAppliers.TransitionApplier<Schemes, never>({
      duration: 500,
      timingFunction: (t) => t,
      async onTick() {
         await AreaExtensions.zoomAt(area, editor.getNodes());
      }
   });

   arrange.addPreset(ArrangePresets.classic.setup());

   // Function to create a node
   async function createNode(label: string, x: number, y: number) {
      const node = new ClassicPreset.Node(label);
      node.addOutput("output", new ClassicPreset.Output(socket));
      node.addInput("input", new ClassicPreset.Input(socket));

      // Add width and height properties to the node
      (node as any).width = 200;
      (node as any).height = 100;

      await editor.addNode(node);
      await area.translate(node.id, { x: x, y: y });
      return node;
   }

   // Function to recursively add nodes based on JSON data
   async function addNodesFromJSON(data: { [x: string]: any }, parentNode: ClassicPreset.Node | null = null, posX = 0, posY = 0) {
      for (const key in data) {
         const childData = data[key];
         const node = await createNode(key, posX, posY);

         if (parentNode) {
            const connection = new ClassicPreset.Connection(parentNode as ClassicPreset.Node, "output", node as ClassicPreset.Node, "input");
            await editor.addConnection(connection);
         }

         if (Array.isArray(childData)) {
            const count = childData.length;
            const totalHeight = (count - 1) * 400;
            let childY = posY - totalHeight / 2;

            for (let i = 0; i < count; i++) {
               const childNode = await createNode(childData[i], posX + 500, childY);
               const connection = new ClassicPreset.Connection(node, "output", childNode, "input");
               await editor.addConnection(connection);
               childY += 400;
            }
         } else if (typeof childData === "object" && childData !== null) {
            const childKeys = Object.keys(childData);
            const count = childKeys.length;
            const totalHeight = (count - 1) * 400;
            let childY = posY - totalHeight / 2;

            for (let i = 0; i < count; i++) {
               const childKey = childKeys[i];
               await addNodesFromJSON({ [childKey]: childData[childKey] }, node, posX + 500, childY);
               childY += 400;
            }
         }

         posY += 300; // Adjust vertical spacing between nodes
      }
   }

   // Add nodes based on JSON data
   await addNodesFromJSON(jsonData);

   // Enable auto-arrange
   await arrange.layout({ applier });

   // Zoom to fit nodes
   setTimeout(() => {
      AreaExtensions.zoomAt(area, editor.getNodes());
   }, 10);

   return {
      destroy: () => area.destroy(),
   };
}
