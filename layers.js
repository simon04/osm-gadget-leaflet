'use strict';

L.TileLayer.OSM = L.TileLayer.extend({
  initialize: function(options) {
    L.TileLayer.prototype.initialize.call(this,
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', options);
  },
  options: {
    maxZoom: 19,
    attribution: '&copy; ' +
        '<a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }
});

L.TileLayer.PublicTransport = L.TileLayer.extend({
  initialize: function(options) {
    L.TileLayer.prototype.initialize.call(this,
        'http://tile.memomaps.de/tilegen/{z}/{x}/{y}.png', options);
  },
  options: {
    attribution: L.TileLayer.OSM.prototype.options.attribution
  }
});

L.TileLayer.WMFLabs = L.TileLayer.extend({
  initialize: function(options) {
    L.TileLayer.prototype.initialize.call(this,
        'https://tiles.wmflabs.org/{style}/{z}/{x}/{y}.png', options);
  },
  options: {
    attribution: L.TileLayer.OSM.prototype.options.attribution
  }
});

L.TileLayer.OSMde = L.TileLayer.extend({
  initialize: function(options) {
    L.TileLayer.prototype.initialize.call(this,
        'http://tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', options);
  },
  options: {
    attribution: L.TileLayer.OSM.prototype.options.attribution
  }
});

L.TileLayer.WikimediaMaps = L.TileLayer.extend({

  initialize: function(options) {
    var scale = bracketDevicePixelRatio();
    var scalex = (scale === 1) ? '' : ('@' + scale + 'x');
    L.TileLayer.prototype.initialize.call(this,
        'https://maps.wikimedia.org/{style}/{z}/{x}/{y}' + scalex + '.png', options);

    function bracketDevicePixelRatio() {
      var brackets = [1, 1.3, 1.5, 2, 2.6, 3];
      var baseRatio = window.devicePixelRatio || 1;
      for (var i = 0; i < brackets.length; i++) {
        var scale = brackets[i];
        if (scale >= baseRatio || (baseRatio - scale) < 0.1) {
          return scale;
        }
      }
      return brackets[brackets.length - 1];
    }
  },

  options: {
    style: 'osm-intl',
    maxZoom: 18,
    attribution: 'Wikimedia maps beta | Map data &copy; ' +
        '<a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }

});

L.GeoJSON.WIWOSM = L.GeoJSON.extend({

  initialize: function(options) {
    L.GeoJSON.prototype.initialize.call(this, undefined, options);
  },

  options: {
    coordsToLatLng: function(coords) {
      // unproject EPSG:3857
      var pt = L.point(coords[0], coords[1]);
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
    } else if (typeof this.options.article === 'object') {
      this.clearLayers();
      this.options.article.map(loadArticle);
    } else {
      var doClear = true;
      loadArticle(this.options.article);
    }
    return this;

    function loadArticle(article) {
      var xhr = new XMLHttpRequest();
      xhr.addEventListener('load', addData);
      xhr.open('GET', 'https://tools.wmflabs.org/wiwosm/osmjson/getGeoJSON.php?' +
          'lang=' + me.options.lang + '&article=' + article);
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
        if (feature.properties.thumbnail) {
          html = html + L.Util.template('<p><img src="{thumbnail}"></p>', feature.properties);
        }
        return L.marker(latlng).bindPopup(html, {
          minWidth: 200
        });
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
