import * as L from 'leaflet';

interface Options extends L.GeoJSONOptions {
  article?: string | string[];
  lang?: string;
  coordsToLatLng(coords: L.LatLngTuple): L.LatLng;
  pointToLayer(feature: GeoJSON.Feature, latlng: L.LatLng): L.CircleMarker;
}

export default class WIWOSK extends L.GeoJSON {
  options: Options = {
    coordsToLatLng(coords: L.LatLngTuple) {
      // unproject EPSG:3857
      const pt = L.point(coords[0], coords[1]);
      const ll = L.Projection.SphericalMercator.unproject(pt);
      return ll;
    },

    pointToLayer(feature: GeoJSON.Feature, latlng: L.LatLng) {
      return L.circleMarker(latlng);
    }
  };

  constructor(options: Partial<Options>) {
    super(undefined, options);
    L.Util.setOptions(this, options);
  }

  loadWIWOSM(): this {
    if (!this.options.article || !this.options.lang) {
      return;
    } else if (typeof this.options.article === 'object') {
      this.clearLayers();
      this.options.article.map(a => this.loadArticle(a));
    } else {
      this.loadArticle(this.options.article, true);
    }
    return this;
  }

  private loadArticle(article: string, doClear = false) {
    let url = 'https://tools.wmflabs.org/wiwosm/osmjson/getGeoJSON.php';
    url += L.Util.getParamString({
      lang: this.options.lang,
      article: article
    });
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', () => {
      if (xhr.status !== 200 || !xhr.responseText) {
        return;
      }
      const geojson = JSON.parse(xhr.responseText);
      if (doClear) {
        this.clearLayers();
      }
      this.addData(geojson);
      this._map.fitBounds(this.getBounds());

    });
    xhr.open('GET', url);
    xhr.send();
  }
}
