import * as L from 'leaflet';
import getFilePath from 'wikimedia-commons-file-path/build/wikimedia-commons-file-path';

interface Options extends L.GeoJSONOptions {
  url: string;
  gsnamespace: number;
  icon: L.IconOptions;
  thumbnailWidth: number;
}

export interface GeosearchFeature {
  pageid: number;
  ns: number;
  title: string;
  lat: number;
  lon: number;
  dist: number;
  primary: string;
  type: 'camera';
  name: null;
}

interface FeatureProperties {
  title: string;
  wikipediaUrl: string;
  thumbnailWidth: number;
  thumbnail?: string;
}

export default class MediaWiki extends L.GeoJSON {
  constructor(options: Partial<Options>) {
    super(undefined, options);
    L.Util.setOptions(this, {
      ...options,
      pointToLayer: this.pointToLayer.bind(this),
    });
  }

  options: Options = {
    url: undefined,
    gsnamespace: 0,
    icon: undefined,
    thumbnailWidth: 300
  };

  pointToLayer(
    feature: GeoJSON.Feature<GeoJSON.Point, FeatureProperties>,
    latlng: L.LatLng
  ): L.Marker {
    const icon = L.icon(this.options.icon);
    const marker = L.marker(latlng, {
      icon: icon,
      title: feature.properties.title
    });
    const popup = getPopupHtml(feature);
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

    function getPopupHtml(feature: GeoJSON.Feature) {
      let html;
      if (feature.properties.title && feature.properties.wikipediaUrl) {
        html = L.Util.template(
          '<a href="{wikipediaUrl}" target="_blank">{title}</a>',
          feature.properties
        );
        if (feature.properties.thumbnail) {
          html += L.Util.template(
            '<p><img src="{thumbnail}" width="{thumbnailWidth}"></p>',
            feature.properties
          );
        }
      }
      return html;
    }
  }

  updateMarks(): this {
    if (!this._map) {
      return;
    }
    const bounds = this._map.getBounds();
    let url = this.options.url + '/w/api.php';
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

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', updateLayer.bind(this));
    xhr.open('GET', url);
    xhr.send();
    return this;

    function updateLayer() {
      if (xhr.status !== 200 || !xhr.responseText) {
        return;
      }
      const json = JSON.parse(xhr.responseText);
      if (json.error || !json.query.geosearch) {
        console.warn(json.error);
        return;
      }
      const geojson = json.query.geosearch.map(toFeature, this);
      this.clearLayers();
      this.addData(geojson);
    }

    function toFeature(object: GeosearchFeature) {
      const thumbnail: string = object.title.match(/^File:/)
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
        } as FeatureProperties
      };
    }
  }
}
