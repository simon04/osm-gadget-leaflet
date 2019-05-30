import L from 'leaflet';
import 'leaflet.vectorgrid/dist/Leaflet.VectorGrid.js';
import geojsonvt from 'geojson-vt';
import getFilePath from 'wikimedia-commons-file-path/build/wikimedia-commons-file-path';

export default L.VectorGrid.extend({
  options: {
    maxZoom: 19,
    maxNativeZoom: 19,
    interactive: true,
    vectorTileLayerStyles: {},
    url: undefined,
    gsnamespace: 0,
    icon: undefined,
    thumbnailWidth: 300
  },

  initialize: function(options) {
    L.VectorGrid.prototype.initialize.call(this, options);
    this.options.vectorTileLayerName = this.options.url;
    this.options.vectorTileLayerStyles[this.options.vectorTileLayerName] = {
      icon: L.icon(this.options.icon)
    };
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
  _getVectorTilePromise: function(coords) {
    var url = this.getTileUrl(coords);
    return fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(this._toGeoJSON.bind(this))
      .then(this._toVectorTile.bind(this, coords));
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
  _toGeoJSON: function(json) {
    var features = json.query.geosearch.map(function toFeature(object) {
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
    return {
      type: 'FeatureCollection',
      features: features
    };
  },
  _toVectorTile: function(coords, geojson) {
    var layerName = this.options.vectorTileLayerName;
    var slicer = geojsonvt(geojson, {
      maxZoom: this.options.maxNativeZoom || this.options.maxZoom
    });
    var slicedTileLayer = slicer.getTile(coords.z, coords.x, coords.y);
    var tileLayers = {};
    if (slicedTileLayer) {
      var vectorTileLayer = {
        features: slicedTileLayer.features,
        extent: 4096,
        name: layerName,
        length: slicedTileLayer.features.length
      };
      tileLayers[layerName] = vectorTileLayer;
    }
    return { layers: tileLayers, coords: coords };
  }
});
