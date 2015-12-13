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
      var icon = getIcon(feature.properties.feature);
      var marker = L.marker(latlng, {icon: icon});
      var popup = getPopupHtml(feature);
      if (popup) {
        marker.bindPopup(popup, {
          minWidth: 200
        });
      }
      return marker;

      function getPopupHtml(feature) {
        var html;
        if (feature.properties.title && feature.properties.wikipediaUrl) {
          html = L.Util.template('<a href="{wikipediaUrl}">{title}</a>', feature.properties);
          if (feature.properties.thumbnail) {
            html = html + L.Util.template('<p><img src="{thumbnail}"></p>', feature.properties);
          }
        }
        return html;
      }

      function getIcon(feature) {
        var customIcon = getIconForFeature(feature);
        if (customIcon) {
          return L.divIcon({
            className: customIcon,
            iconSize: [24, 24],
            iconAnchor: [12, -3]
          });
        }
        return new L.Icon.Default();
      }

      function getIconForFeature(feature) {
        var iconForFeature = {
          country: 'maki-icon circle',
          satellite: 'maki-icon rocket',
          state: 'maki-icon circle',
          adm1st: 'maki-icon circle',
          adm2nd: 'maki-icon circle',
          adm3rd: 'maki-icon circle',
          city: 'maki-icon circle',
          isle: 'maki-icon land-use',
          mountain: 'maki-icon triangle',
          river: 'maki-icon water',
          waterbody: 'maki-icon water',
          event: 'maki-icon theatre',
          forest: 'maki-icon park',
          glacier: 'maki-icon land-use',
          airport: 'maki-icon airport',
          railwaystation: 'maki-icon rail',
          edu: 'maki-icon college',
          pass: 'maki-icon golf',
          landmark: 'maki-icon marker'
        };
        return feature && iconForFeature[feature];
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
      me.clearLayers();
      me.addData(geojson);
    }
  }

});
