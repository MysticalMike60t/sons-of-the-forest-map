import { t } from "../lib/i18n";

export default function Status() {
  const locationStatus =
    document.querySelector<HTMLParagraphElement>(".location-status")!;
  locationStatus.innerText = t("Location is not detected");

  function setLocation(location: { x: number; y: number; z: number } | null) {
    if (!location) {
      locationStatus.innerText = t("Location is not detected");
    } else {
      locationStatus.innerText = `X: ${location.x} Y: ${location.y} Z: ${location.z}`;
    }
  }
  return {
    setLocation,
  };
}
