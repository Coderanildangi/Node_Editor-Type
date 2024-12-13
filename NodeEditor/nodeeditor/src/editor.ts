import { createRoot } from "react-dom/client";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import {
   ConnectionPlugin,
   Presets as ConnectionPresets
} from "rete-connection-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import {
   AutoArrangePlugin,
   Presets as ArrangePresets,
   ArrangeAppliers
} from "rete-auto-arrange-plugin";
import {
   ContextMenuPlugin,
   Presets as ContextMenuPresets,
   ContextMenuExtra
} from "rete-context-menu-plugin";
import {
   HistoryExtensions,
   HistoryPlugin,
   Presets as HistoryPresets
} from "rete-history-plugin";
import { MinimapExtra, MinimapPlugin } from "rete-minimap-plugin";
import { easeInOut } from "popmotion";
import { insertableNodes } from "./insert-node";
import jsonData from "./input/data.json"; 



const socket = new ClassicPreset.Socket("socket");

class Node extends ClassicPreset.Node {
   width = 200;
   height = 100;

   constructor(label = "Dynamic Node") {
      super(label);
      this.addInput("port", new ClassicPreset.Input(socket));
      this.addOutput("port", new ClassicPreset.Output(socket));
   }

   // Cloning dynamic node
   //clone() {
   //   return new Node()
   //}
}

class Connection<N extends Node> extends ClassicPreset.Connection<N, N> { }

type Schemes = GetSchemes<Node, Connection<Node>>;
type AreaExtra = ReactArea2D<Schemes> | ContextMenuExtra | MinimapExtra;


export async function createEditor(container: HTMLElement) {
   const editor = new NodeEditor<Schemes>();
   const area = new AreaPlugin<Schemes, AreaExtra>(container);
   const connection = new ConnectionPlugin<Schemes, AreaExtra>();
   const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
   const arrange = new AutoArrangePlugin<Schemes>();
   const contextMenu = new ContextMenuPlugin<Schemes>({
      items: ContextMenuPresets.classic.setup([["Node", () => new Node()]])
   });

   const minimap = new MinimapPlugin<Schemes>({
      boundViewport: true
   });

   const history = new HistoryPlugin<Schemes>();

   AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
      accumulating: AreaExtensions.accumulateOnCtrl()
   });

   HistoryExtensions.keyboard(history);

   history.addPreset(HistoryPresets.classic.setup());

   render.addPreset(Presets.classic.setup());
   render.addPreset(Presets.contextMenu.setup());
   render.addPreset(Presets.minimap.setup({ size: 200 }));

   connection.addPreset(ConnectionPresets.classic.setup());

   arrange.addPreset(ArrangePresets.classic.setup());

   editor.use(area);
   area.use(connection);
   area.use(render);
   area.use(arrange);
   area.use(contextMenu);
   area.use(minimap);
   area.use(history);

   const animatedApplier = new ArrangeAppliers.TransitionApplier<Schemes, never>({
      duration: 500,
      timingFunction: easeInOut
   });

   AreaExtensions.simpleNodesOrder(area);

   insertableNodes(area, {
      async createConnections(node, connection) {
         const sourceNode = editor.getNode(connection.source);
         if (!sourceNode) throw new Error(`Node with id ${connection.source} not found`);
         await editor.addConnection(
            new Connection(
               sourceNode,
               connection.sourceOutput,
               node,
               "port"
            )
         );
         const targetNode = editor.getNode(connection.target);
         if (!targetNode) throw new Error(`Node with id ${connection.target} not found`);
         await editor.addConnection(
            new Connection(
               node,
               "port",
               targetNode,
               connection.targetInput
            )
         );
         arrange.layout({
            applier: animatedApplier
         });
      }
   });

   async function addNodesFromJSON(data: { [x: string]: any }, parentNode: Node | null = null, posX = 0, posY = 0) {
      for (const key in data) {
         const childData = data[key];
         const node = new Node(key);
         await editor.addNode(node);
         await area.translate(node.id, { x: posX, y: posY });

         if (parentNode) {
            const connection = new Connection(parentNode, "port", node, "port");
            await editor.addConnection(connection);
         }

         if (Array.isArray(childData)) {
            let childY = posY - (childData.length - 1) * 200 / 2;
            for (const item of childData) {
               const childNode = new Node(item);
               await editor.addNode(childNode);
               await area.translate(childNode.id, { x: posX + 400, y: childY });
               await editor.addConnection(new Connection(node, "port", childNode, "port"));
               childY += 200;
            }
         } else if (typeof childData === "object" && childData !== null) {
            let childY = posY - (Object.keys(childData).length - 1) * 200 / 2;
            for (const subKey in childData) {
               await addNodesFromJSON({ [subKey]: childData[subKey] }, node, posX + 400, childY);
               childY += 200;
            }
         }
         posY += 300;
      }
   }

   await addNodesFromJSON(jsonData);

   await arrange.layout({ applier: animatedApplier });
   AreaExtensions.zoomAt(area, editor.getNodes());

   return {
      destroy: () => area.destroy()
   };
}
