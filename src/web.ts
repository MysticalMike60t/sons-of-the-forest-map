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
import { initWakelock } from "./lib/wakelock";
import {
  getCustomNodes,
  setCustomNodes,
  getDiscoveredNodeIDs,
  setDiscoveredNodeIDs,
} from "./lib/nodes";
import { saveFile } from "./lib/storage";

let lastLocation = { x: 0, y: 0, z: 0 };
let lastRotation = 0;

function getLastPosition() {
  return { location: lastLocation, rotation: lastRotation };
}

type Backup = {
  customNodes?: unknown;
  discoveredNodeIDs?: unknown;
};

loadDictionary().then(() => {
  translateHTML();
  LocaleSelector();

  const mapElement = document.querySelector<HTMLDivElement>(".map")!;
  const map = Map(mapElement);
  TileLayer({ map });

  const { refresh, panToMarker } = Nodes({ map });
  CustomNode({
    element: document.querySelector<HTMLButtonElement>("#add_custom_node")!,
    map,
    getLastPosition,
    onAdd: refresh,
  });

  // Backup: custom nodes + discovered nodes in one file
  document
    .querySelector<HTMLButtonElement>("#backup_custom_node")!
    .addEventListener("click", () => {
      const backup = {
        customNodes: getCustomNodes(),
        discoveredNodeIDs: getDiscoveredNodeIDs(),
      };
      const blob = new Blob([JSON.stringify(backup)], {
        type: "application/json",
      });
      saveFile(blob, `SOTF_Map_Backup_${Date.now()}.json`);
    });

  // Restore: one persistent hidden file input, works in Firefox + Chromium
  const restoreInput = document.createElement("input");
  restoreInput.type = "file";
  restoreInput.accept = ".json,application/json";
  restoreInput.hidden = true;
  document.body.append(restoreInput);

  document
    .querySelector<HTMLButtonElement>("#restore_custom_node")!
    .addEventListener("click", () => {
      restoreInput.value = ""; // allow picking the same file twice
      restoreInput.click();
    });

  restoreInput.addEventListener("change", async () => {
    const file = restoreInput.files?.[0];
    if (!file) {
      return;
    }
    try {
      const data = JSON.parse(await file.text()) as unknown;

      // Old format: plain array of custom nodes
      // New format: { customNodes, discoveredNodeIDs }
      let customNodes: unknown = null;
      let discoveredNodeIDs: unknown = null;
      if (Array.isArray(data)) {
        customNodes = data;
      } else if (data && typeof data === "object") {
        customNodes = (data as Backup).customNodes;
        discoveredNodeIDs = (data as Backup).discoveredNodeIDs;
      }

      if (!Array.isArray(customNodes) && !Array.isArray(discoveredNodeIDs)) {
        throw new Error("not a map backup file");
      }

      const parts: string[] = [];
      if (Array.isArray(customNodes)) {
        setCustomNodes(customNodes);
        parts.push(`${customNodes.length} custom`);
      }
      if (Array.isArray(discoveredNodeIDs)) {
        const ids = discoveredNodeIDs.filter(
          (id): id is number => typeof id === "number",
        );
        setDiscoveredNodeIDs(ids);
        parts.push(`${ids.length} discovered`);
      }
      refresh();
      alert(`Restored ${parts.join(" + ")} nodes`);
    } catch (error) {
      console.error("Restore failed:", error);
      alert(`Restore failed: ${(error as Error).message}`);
    }
  });

  ContextMenu({ map, onAdd: refresh });
  Filters({ onChange: refresh });

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

  Zones({ map });
  initWakelock();
  Search({ panToMarker });
});
