import L from 'leaflet';
import 'leaflet-providers';

L.TileLayer.Provider.providers.memomaps = {
  url: 'http://tile.memomaps.de/tilegen/{z}/{x}/{y}.png',
  options: {
    attribution: '{attribution.OpenStreetMap}'
  }
};

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
});

L.GeoJSON.Geosearch = L.GeoJSON.extend({
  initialize: function(options) {
    options = options || {};
    options.pointToLayer = this.pointToLayer.bind(this);
    L.GeoJSON.prototype.initialize.call(this, undefined, options);
  },

  options: {
    url: undefined,
    gsnamespace: 0,
    icon: undefined,
    thumbnailWidth: 300
  },

  pointToLayer: function(feature, latlng) {
    var icon = L.icon(this.options.icon);
    var marker = L.marker(latlng, {
      icon: icon,
      title: feature.properties.title
    });
    var popup = getPopupHtml(feature);
    if (popup) {
      marker.bindPopup(popup, {
        minWidth: 200
      });
      marker.on('click', function() {
        this.openPopup();
        this.openedViaMouseOver = false;
      });
      marker.on('mouseover', function() {
        this.openPopup();
        this.openedViaMouseOver = true;
      });
      marker.on('mouseout', function() {
        if (this.openedViaMouseOver) {
          this.closePopup();
        }
      });
    }
    return marker;

    function getPopupHtml(feature) {
      var html;
      if (feature.properties.title && feature.properties.wikipediaUrl) {
        html = L.Util.template(
          '<a href="{wikipediaUrl}" target="_blank">{title}</a>',
          feature.properties
        );
        if (feature.properties.thumbnail) {
          html =
            html +
            L.Util.template(
              '<p><img src="{thumbnail}" width="{thumbnailWidth}"></p>',
              feature.properties
            );
        }
      }
      return html;
    }
  },

  updateMarks: function() {
    if (!this._map) {
      return;
    }
    var bounds = this._map.getBounds();
    var url = this.options.url + '/w/api.php';
    url += L.Util.getParamString({
      origin: '*',
      format: 'json',
      action: 'query',
      list: 'geosearch',
      gsnamespace: this.options.gsnamespace,
      gslimit: 500,
      gsprop: 'type|name',
      gsbbox: [
        bounds.getNorth(),
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast()
      ].join('|')
    });

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', updateLayer.bind(this));
    xhr.open('GET', url);
    xhr.send();
    return this;

    function updateLayer() {
      if (xhr.status !== 200 || !xhr.responseText) {
        return;
      }
      var json = JSON.parse(xhr.responseText);
      if (json.error || !json.query.geosearch) {
        console.warn(json.error);
        return;
      }
      var geojson = json.query.geosearch.map(toFeature, this);
      this.clearLayers();
      this.addData(geojson);
    }

    function toFeature(object) {
      var thumbnail = object.title.match(/^File:/, '')
        ? this.options.url +
          '/w/index.php?title=Special:Redirect/file/' +
          object.title.replace(/^File:/, '') +
          '&width=' +
          this.options.thumbnailWidth
        : undefined;
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [object.lon, object.lat]
        },
        properties: {
          title: object.title,
          wikipediaUrl: this.options.url + '/wiki/' + object.title,
          thumbnailWidth: this.options.thumbnailWidth,
          thumbnail: thumbnail
        }
      };
    }
  }
});
