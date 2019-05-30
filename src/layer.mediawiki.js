import L from 'leaflet';
import 'leaflet-tilelayer-geojson';
import getFilePath from 'wikimedia-commons-file-path/build/wikimedia-commons-file-path';

var xx = L.GeoJSON.extend({
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
        ? getFilePath(object.title, this.options.thumbnailWidth)
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

export default L.TileLayer.GeoJSON.extend({
  options: {
    url: undefined,
    gsnamespace: 0,
    icon: undefined,
    thumbnailWidth: 300
  },
  initialize: function(options) {
    L.TileLayer.GeoJSON.prototype.initialize.call(this, undefined, options);
  },
  _loadTile: function(tile, tilePoint) {
    var layer = this;
    var req = new XMLHttpRequest();
    this._requests.push(req);
    req.onreadystatechange = this._xhrHandler(req, layer, tile, tilePoint);
    req.open('GET', this.getTileUrl(tilePoint), true);
    req.send();
  },
  getTileUrl: function(coords) {
    var bounds = this._tileCoordsToBounds(coords);
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
    return url;
  },
  _tileLoaded: function(tile, tilePoint) {
    if (!tile.datum) return;
    var geoJSON = this._tileDataToGeoJSON(tile.datum);
    console.log(geoJSON)
    this.addTileData(geoJSON, tilePoint);
  },
  _tileDataToGeoJSON: function(json) {
    return json.query.geosearch.map(function toFeature(object) {
      var thumbnail = object.title.match(/^File:/, '')
        ? getFilePath(object.title, this.options.thumbnailWidth)
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
    }, this);
  }
});
