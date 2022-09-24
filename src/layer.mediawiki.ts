import * as L from 'leaflet';
import getFilePath from 'wikimedia-commons-file-path/build/wikimedia-commons-file-path';
import { debounce } from './debounce';

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
  updateMarksDebounced: () => void;

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
    this.updateMarksDebounced = debounce(() => this.updateMarks(), 400);
  }

  options: Options = {
    url: '',
    gsnamespace: 0,
    icon: { iconUrl: '' },
    iconThumbnail: false,
    thumbnailWidth: 320,
  };

  onAdd(map: L.Map): this {
    super.onAdd(map);
    map.on('zoom move', this.updateMarksDebounced, this);
    this.updateMarks();
    return this;
  }
  onRemove(map: L.Map): this {
    super.onRemove(map);
    map.off('zoom move', this.updateMarksDebounced, this);
    return this;
  }

  pointToThumbnailLayer(
    feature: GeoJSON.Feature<GeoJSON.Point, FeatureProperties>,
    latlng: L.LatLng
  ): L.Marker | undefined {
    const zoom = this._map.getZoom();
    const width = zoom > 20 ? 320 : zoom > 18 ? 240 : zoom > 16 ? 120 : 60;
    const iconUrl = feature.properties.thumbnail?.(320);
    if (!iconUrl) return;
    const icon = L.icon({
      iconUrl,
      iconAnchor: [width / 2, 0],
      iconSize: [width, NaN],
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
        icon.style.zIndex = icon.getAttribute('zIndexOld') || '';
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
    if (!feature.properties.title || !feature.properties.wikipediaUrl) {
      return marker;
    }

    let html = `<a href="${feature.properties.wikipediaUrl}" target="_blank">${feature.properties.title}</a>`;
    if (feature.properties.thumbnail) {
      const { thumbnailWidth } = this.options;
      const thumbnail = feature.properties.thumbnail(thumbnailWidth);
      html += `<p><img src="${thumbnail}" width="${thumbnailWidth}"></p>`;
    }

    marker.bindPopup(html, {
      minWidth: 200,
    });
    marker.on('click', () => {
      marker.openPopup();
      marker.getElement()?.removeAttribute('openedViaMouseOver');
    });
    marker.on('mouseover', () => {
      marker.openPopup();
      marker.getElement()?.setAttribute('openedViaMouseOver', '1');
    });
    marker.on('mouseout', () => {
      if (marker.getElement()?.hasAttribute('openedViaMouseOver')) {
        marker.closePopup();
      }
    });

    return marker;
  }

  async updateMarks() {
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

    const headers = { Accept: 'application/json' };
    const res = await fetch(url, { headers });
    if (!res.ok) {
      return;
    }
    const json = await res.json();
    if (json.error || !json.query.geosearch) {
      console.warn(json.error);
      return;
    }
    const geosearch = json.query.geosearch as GeosearchFeature[];
    const features = geosearch.map(
      (object): GeoJSON.Feature<GeoJSON.Point, FeatureProperties> => ({
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
      })
    );
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };
    this.clearLayers();
    this.addData(geojson);
  }
}
