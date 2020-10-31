import * as L from 'leaflet';

interface Options extends L.GeoJSONOptions {
  article?: string | string[];
  lang?: string;
  coordsToLatLng(coords: L.LatLngTuple): L.LatLng;
  pointToLayer(feature: GeoJSON.Feature, latlng: L.LatLng): L.CircleMarker<any>;
}

export default class WIWOSK extends L.GeoJSON {
  options: Options = {
    coordsToLatLng(coords: L.LatLngTuple) {
      // unproject EPSG:3857
      var pt = L.point(coords[0], coords[1]);
      var ll = L.Projection.SphericalMercator.unproject(pt);
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

  loadWIWOSM() {
    var me = this;
    if (!this.options.article || !this.options.lang) {
      return;
    } else if (typeof this.options.article === 'object') {
      this.clearLayers();
      this.options.article.map(loadArticle);
    } else {
      var doClear = true;
      loadArticle(this.options.article);
    }
    return this;

    function loadArticle(article: string) {
      var url = 'https://tools.wmflabs.org/wiwosm/osmjson/getGeoJSON.php';
      url += L.Util.getParamString({
        lang: me.options.lang,
        article: article
      });
      var xhr = new XMLHttpRequest();
      xhr.addEventListener('load', addData);
      xhr.open('GET', url);
      xhr.send();
    }

    function addData() {
      if (this.status !== 200 || !this.responseText) {
        return;
      }
      var geojson = JSON.parse(this.responseText);
      if (doClear) {
        me.clearLayers();
      }
      me.addData(geojson);
      me._map.fitBounds(me.getBounds());
    }
  }
}
