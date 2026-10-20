import leaflet from "leaflet";
import ContextMenu from "./components/ContextMenu";
import CustomNode from "./components/CustomNode";
import Filters from "./components/Filters";
import LocaleSelector from "./components/LocaleSelector";
import Map from "./components/Map";
import Nodes from "./components/Nodes";
import Search from "./components/Search";
import TileLayer from "./components/TileLayer";
import Zones from "./components/Zones";
import { loadDictionary, translateHTML } from "./lib/i18n";
import {
  getCustomNodes,
  getDiscoveredNodeIDs,
  setCustomNodes,
  setDiscoveredNodeIDs,
} from "./lib/nodes";
import { openFileOrFiles, saveFile } from "./lib/storage";

console.log("Init main");

await loadDictionary();
translateHTML();
LocaleSelector();

const mapElement = document.querySelector<HTMLDivElement>(".map")!;
const map = Map(mapElement);
TileLayer({ map });
initAppHeader({ map });

let lastLocation = { x: 0, y: 0, z: 0 };
let lastRotation = 0;

function getLastPosition() {
  return { location: lastLocation, rotation: lastRotation };
}

const { refresh, panToMarker } = Nodes({ map });
CustomNode({
  element: document.querySelector<HTMLButtonElement>("#add_custom_node")!,
  map,
  getLastPosition,
  onAdd: refresh,
});
document
  .querySelector<HTMLButtonElement>("#backup_custom_node")!
  .addEventListener("click", () => {
    const backup = {
      customNodes: getCustomNodes(),
      discoveredNodeIDs: getDiscoveredNodeIDs(),
    };
    const fileName = `SOTF_Map_Backup_${Date.now()}.json`;
    const blob = new Blob([JSON.stringify(backup)], {
      type: "application/json",
    });
    saveFile(blob, fileName);
  });
document
  .querySelector<HTMLButtonElement>("#restore_custom_node")!
  .addEventListener("click", async () => {
    const file = await openFileOrFiles();
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", (loadEvent) => {
      const text = loadEvent.target?.result;
      if (!text || typeof text !== "string") {
        return;
      }
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          // old format: custom nodes only
          setCustomNodes(data);
        } else if (data && typeof data === "object") {
          if (Array.isArray(data.customNodes)) {
            setCustomNodes(data.customNodes);
          }
          if (Array.isArray(data.discoveredNodeIDs)) {
            setDiscoveredNodeIDs(
              data.discoveredNodeIDs.filter(
                (id: unknown): id is number => typeof id === "number",
              ),
            );
          }
        }
        refresh();
      } catch (error) {
        console.error("Restore failed:", error);
      }
    });
    reader.readAsText(file);
  });

ContextMenu({ map, onAdd: refresh });
Filters({ onChange: refresh });
Zones({ map });
Search({ panToMarker });

async function initAppHeader({ map }: { map: leaflet.Map }) {
  const menuOpenElement =
    document.querySelector<HTMLButtonElement>(".layout > .menu")!;
  menuOpenElement.onclick = () => {
    document.body.classList.add("open");
    document.body.classList.remove("close");
    map.invalidateSize(true);
  };

  const menuCloseElement =
    document.querySelector<HTMLButtonElement>(".aside .menu")!;
  menuCloseElement.onclick = () => {
    document.body.classList.add("close");
    document.body.classList.remove("open");
    map.invalidateSize(true);
  };
}
