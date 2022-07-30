import * as L from 'leaflet';
import getFilePath from 'wikimedia-commons-file-path/build/wikimedia-commons-file-path';

interface Options extends L.GeoJSONOptions {
  url: string;
  gsnamespace: number;
  icon: L.IconOptions;
  iconThumbnail: boolean;
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
  thumbnail?: (width: number) => string;
}

export default class MediaWiki extends L.GeoJSON {
  constructor(options: Partial<Options>) {
    super(undefined, options);
    L.Util.setOptions(this, {
      ...options,
      pointToLayer: options.iconThumbnail
        ? this.pointToThumbnailLayer.bind(this)
        : this.pointToIconLayer.bind(this),
    });
    if (!this.options.iconThumbnail && !this.options.icon) {
      throw new Error('Either iconThumbnail or icon is needed!');
    }
  }

  options: Options = {
    url: undefined,
    gsnamespace: 0,
    icon: undefined,
    iconThumbnail: false,
    thumbnailWidth: 320,
  };

  onAdd(map: L.Map): this {
    super.onAdd(map);
    map.on('zoomend moveend', this.updateMarks, this);
    this.updateMarks();
    return this;
  }
  onRemove(map: L.Map): this {
    super.onRemove(map);
    map.off('zoomend moveend', this.updateMarks, this);
    return this;
  }

  pointToThumbnailLayer(
    feature: GeoJSON.Feature<GeoJSON.Point, FeatureProperties>,
    latlng: L.LatLng
  ): L.Marker {
    const zoom = this._map.getZoom();
    const width = zoom > 20 ? 320 : zoom > 18 ? 240 : zoom > 16 ? 120 : 60;
    const iconUrl = feature.properties.thumbnail(320);
    if (!iconUrl) return;
    const icon = L.icon({
      iconUrl,
      iconAnchor: [width / 2, 0],
      iconSize: [width, undefined],
    });
    const marker = L.marker(latlng, {
      icon: icon,
      title: feature.properties.title,
    });
    if (feature.properties.wikipediaUrl) {
      marker.on('click', () => window.open(feature.properties.wikipediaUrl));
      marker.on('mouseover', (event) => {
        const icon = event.target._icon as HTMLImageElement;
        icon.setAttribute('zIndexOld', icon.style.zIndex);
        icon.style.zIndex = '987654';
      });
      marker.on('mouseout', (event) => {
        const icon = event.target._icon as HTMLImageElement;
        icon.style.zIndex = icon.getAttribute('zIndexOld');
      });
    }
    return marker;
  }

  pointToIconLayer(
    feature: GeoJSON.Feature<GeoJSON.Point, FeatureProperties>,
    latlng: L.LatLng
  ): L.Marker {
    const icon = L.icon(this.options.icon);
    const marker = L.marker(latlng, {
      icon: icon,
      title: feature.properties.title,
    });
    const popup = getPopupHtml.call(this, feature);
    if (popup) {
      marker.bindPopup(popup, {
        minWidth: 200,
      });
      marker.on('click', function () {
        this.openPopup();
        this.openedViaMouseOver = false;
      });
      marker.on('mouseover', function () {
        this.openPopup();
        this.openedViaMouseOver = true;
      });
      marker.on('mouseout', function () {
        if (this.openedViaMouseOver) {
          this.closePopup();
        }
      });
    }
    return marker;

    function getPopupHtml(
      feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProperties>
    ) {
      let html;
      if (feature.properties.title && feature.properties.wikipediaUrl) {
        html = L.Util.template(
          '<a href="{wikipediaUrl}" target="_blank">{title}</a>',
          feature.properties
        );
        if (feature.properties.thumbnail) {
          const { thumbnailWidth } = this.options;
          const thumbnail = feature.properties.thumbnail(thumbnailWidth);
          html += L.Util.template(
            '<p><img src="{thumbnail}" width="{thumbnailWidth}"></p>',
            { thumbnail, thumbnailWidth }
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
    let url = `${this.options.url}/w/api.php`;
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
        bounds.getEast(),
      ].join('|'),
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
      const geosearch = json.query.geosearch as GeosearchFeature[];
      const geojson = geosearch.map(toFeature, this);
      this.clearLayers();
      this.addData(geojson);
    }

    function toFeature(
      object: GeosearchFeature
    ): GeoJSON.Feature<GeoJSON.Point, FeatureProperties> {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [object.lon, object.lat],
        },
        properties: {
          title: object.title,
          wikipediaUrl: `${this.options.url}/wiki/${object.title}`,
          thumbnail: object.title.match(/^File:/)
            ? (width) => getFilePath(object.title, width)
            : undefined,
        },
      };
    }
  }
}
