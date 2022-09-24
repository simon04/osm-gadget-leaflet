import * as L from 'leaflet';

interface Options extends L.GeoJSONOptions {
  pointToLayer(feature: GeoJSON.Feature, latlng: L.LatLng): L.CircleMarker;
}

/**
 * https://www.mediawiki.org/wiki/Extension:Kartographer
 */
export default class Kartographer extends L.GeoJSON {
  options: Options = {
    pointToLayer(feature: GeoJSON.Feature, latlng: L.LatLng) {
      return L.circleMarker(latlng);
    },
  };

  constructor(options: Partial<Options>) {
    super(undefined, options);
    L.Util.setOptions(this, options);
  }

  async load(article?: string | string[], lang?: string) {
    if (!article || !article.length || !lang) {
      return;
    }
    const url = `https://maps.wikimedia.org/geoshape${L.Util.getParamString({
      getgeojson: 1,
      ids: article,
    })}`;
    const headers = { Accept: 'application/geo+json' };
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
