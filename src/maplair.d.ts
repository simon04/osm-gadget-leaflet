// maplair@4.1.0 ships no type declarations, so its types are inferred from the JSDoc of its sources
// (see tsconfig.json), except for the members added to classes by other modules
import type { AttributionControl } from "maplair";
import type { LatLngExpression } from "maplair/src/geo/LatLng.js";
import type { PopupOptions } from "maplair/src/layer/Popup.js";

declare module "maplair" {
  interface Layer {
    bindPopup(content: string | HTMLElement, options?: PopupOptions): this;
    openPopup(latlng?: LatLngExpression): this;
    closePopup(): this;
  }
  interface MaplairMap {
    attributionControl: AttributionControl;
  }
}
