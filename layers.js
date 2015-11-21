'use strict';

L.GeoJSON.WIWOSM = L.GeoJSON.extend({

  initialize: function(options) {
    L.GeoJSON.prototype.initialize.call(this, undefined, options);
  },

  options: {
    coordsToLatLng: function(coords) {
      // unproject EPSG:3857
      var earthRadius = 6378137;
      var pt = L.point(coords[0], coords[1]);
      pt = pt.multiplyBy(1 / earthRadius);
      var ll = L.Projection.SphericalMercator.unproject(pt);
      return ll;
    },

    pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng);
    }
  },

  loadWIWOSM: function() {
    var me = this;
    if (!this.options.article || !this.options.lang) {
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', addData);
    xhr.open('GET', 'https://tools.wmflabs.org/wiwosm/osmjson/getGeoJSON.php?' +
        'lang=' + this.options.lang + '&article=' + this.options.article);
    xhr.send();
    return this;

    function addData() {
      if (this.status !== 200 || !this.responseText) {
        return;
      }
      var geojson = JSON.parse(this.responseText);
      me.addData(geojson);
      me._map.fitBounds(me.getBounds());
    }
  }
});
