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

L.GeoJSON.WikipediaMarks = L.GeoJSON.extend({

  initialize: function(options) {
    L.GeoJSON.prototype.initialize.call(this, undefined, options);
  },

  options: {
    lang: 'en',
    coats: 0,
    thumbs: 0,

    pointToLayer: function(feature, latlng) {
      if (feature.properties.title && feature.properties.wikipediaUrl) {
        var html = L.Util.template('<a href="{wikipediaUrl}">{title}</a>', feature.properties);
        return L.marker(latlng).bindPopup(html);
      } else {
        return L.marker(latlng);
      }
    }
  },

  updateMarks: function() {
    var me = this;
    var url = L.Util.template('https://tools.wmflabs.org/wp-world/marks-geojson.php?' +
        'LANG={lang}&coats={coats}&thumbs={thumbs}', this.options);
    url = url + '&bbox=' + this._map.getBounds().toBBoxString();

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', updateLayer);
    xhr.open('GET', url);
    xhr.send();
    return this;

    function updateLayer() {
      if (this.status !== 200 || !this.responseText) {
        return;
      }
      var geojson = JSON.parse(this.responseText);
      me.addData(geojson);
    }
  }

});
