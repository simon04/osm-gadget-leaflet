import L from 'leaflet';
import getFilePath from 'wikimedia-commons-file-path/build/wikimedia-commons-file-path';

var renderer = L.GeoJSON.extend({
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
  }
});

export default L.TileLayer.extend({
  options: {
    url: undefined,
    gsnamespace: 0,
    icon: undefined,
    thumbnailWidth: 300
  },
  initialize: function(options) {
    this.renderingLayer = new L.GeoJSON();
    L.TileLayer.GeoJSON.prototype.initialize.call(this, undefined, options);
  },
  onAdd: function(map) {
    L.TileLayer.prototype.onAdd.call(this, map);
    map.addLayer(this.renderingLayer);
  },
  onRemove: function(map) {
    map.removeLayer(this.renderingLayer);
    L.TileLayer.prototype.onRemove.call(this, map);
  },
  createTile: function(coords, done) {
    var url = this.getTileUrl(coords);
    fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(this._tileDataToGeoJSON.bind(this))
      .then(
        function(features) {
          this.renderingLayer.addData(features);
          done(null, document.createElement('div'));
        }.bind(this)
      );
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
