import { CircleMarker, GeoJSON } from "maplair";
import type { GeoJSONOptions } from "maplair/src/layer/GeoJSON.js";

/**
 * https://www.mediawiki.org/wiki/Extension:Kartographer
 */
export default class Kartographer extends GeoJSON {
  constructor(options?: GeoJSONOptions) {
    super(undefined, {
      pointToLayer: (feature, latlng) => new CircleMarker(latlng),
      ...options,
    });
  }

  async load(article?: string | string[], lang?: string) {
    if (!article || !article.length || !lang) {
      return;
    }
    const params = new URLSearchParams({ getgeojson: "1", ids: String(article) });
    const url = `https://maps.wikimedia.org/geoshape?${params}`;
    const headers = { Accept: "application/geo+json" };
    const res = await fetch(url, { headers });
    if (!res.ok) {
      return;
    }
    const geojson = await res.json();
    this.clearLayers();
    this.addData(geojson);
    this._map.fitBounds(this.getBounds());
  }
}
