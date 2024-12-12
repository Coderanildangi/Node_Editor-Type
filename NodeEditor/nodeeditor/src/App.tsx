import { createEditor } from "./editor";
import { useRete } from "rete-react-plugin";

export default function App() {
   const [ref] = useRete(createEditor);

   return (
      <div className="App" id="App">
         <div ref={ref} style={{ height: "100vh", width: "100vw" }}></div>
      </div>
   );
}