import leaflet from "leaflet";

import { BOUNDS } from "../lib/config";
import { getMapLocationById } from "../lib/locations";
import { getMapLocationId } from "../lib/router";

const EDGE_PADDING = 0.5;

export default function Map(container: HTMLDivElement) {
  const mapLocationId = getMapLocationId();
  const mapLocation =
    typeof mapLocationId === "number"
      ? getMapLocationById(mapLocationId)
      : null;

  const map = leaflet.map(container, {
    zoomControl: true,
    attributionControl: true,
    minZoom: -4,
    maxZoom: 5,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 120,
    crs: leaflet.CRS.Simple,
    maxBoundsViscosity: 1.0,
  });
  if (mapLocation) {
    map.setView([mapLocation.y, mapLocation.x], 0);
  } else {
    map.fitBounds(BOUNDS);
  }

  const island = leaflet.latLngBounds(BOUNDS as leaflet.LatLngBoundsLiteral);
  const updateMaxBounds = () => {
    const size = map.getSize();
    const scale = map.options.crs!.scale(map.getZoom());
    const padX = (size.x * EDGE_PADDING) / scale;
    const padY = (size.y * EDGE_PADDING) / scale;
    map.setMaxBounds([
      [island.getSouth() - padY, island.getWest() - padX],
      [island.getNorth() + padY, island.getEast() + padX],
    ]);
  };
  updateMaxBounds();
  map.on("zoomend resize", updateMaxBounds);

  const divElement = leaflet.DomUtil.create("div", "leaflet-position");
  const handleMouseMove = (event: leaflet.LeafletMouseEvent) => {
    divElement.innerHTML = `<span>[${event.latlng.lng.toFixed(
      2,
    )}, ${event.latlng.lat.toFixed(2)}]</span>`;
  };
  const handleMouseOut = () => {
    divElement.innerHTML = ``;
  };
  const CoordinatesControl = leaflet.Control.extend({
    onAdd(map: leaflet.Map) {
      map.on("mousemove", handleMouseMove);
      map.on("mouseout", handleMouseOut);
      return divElement;
    },
    onRemove(map: leaflet.Map) {
      map.off("mousemove", handleMouseMove);
      map.off("mouseout", handleMouseOut);
    },
  });

  const coordinates = new CoordinatesControl({ position: "bottomleft" });
  coordinates.addTo(map);

  return map;
}
