import { GeoJSON, Icon, Marker, type LatLng, type Layer, type MaplairMap } from "maplair";
import type { GeoJSONOptions } from "maplair/src/layer/GeoJSON.js";
import type { IconOptions } from "maplair/src/layer/marker/Icon.js";
import getFilePath from "wikimedia-commons-file-path/build/wikimedia-commons-file-path";
import { debounce } from "./debounce";

interface Options extends GeoJSONOptions {
  url: string;
  gsnamespace: number;
  icon?: IconOptions;
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
  type: "camera";
  name: null;
}

interface FeatureProperties {
  title: string;
  wikipediaUrl: string;
  thumbnail?: (width: number) => string;
}

// Wikimedia serves thumbnails only in standard widths, e.g. 60, 120, 250, 330, 500, 960
export default class MediaWiki extends GeoJSON {
  declare options: Options;
  updateMarksDebounced: () => void;

  constructor(options: Partial<Options>) {
    super(undefined, {
      url: "",
      gsnamespace: 0,
      iconThumbnail: false,
      thumbnailWidth: 330,
      ...options,
    });
    this.options.pointToLayer = (geoJsonPoint, latlng) => {
      const feature = geoJsonPoint as GeoJSON.Feature<GeoJSON.Point, FeatureProperties>;
      // returning no layer skips the feature
      return (
        options.iconThumbnail
          ? this.pointToThumbnailLayer(feature, latlng)
          : this.pointToIconLayer(feature, latlng)
      ) as Layer;
    };
    if (!this.options.iconThumbnail && !this.options.icon?.iconUrl) {
      throw new Error("Either iconThumbnail or icon is needed!");
    }
    this.updateMarksDebounced = debounce(() => this.updateMarks(), 400);
  }

  onAdd(map: MaplairMap): this {
    super.onAdd(map);
    map.on("zoom move", this.updateMarksDebounced, this);
    void this.updateMarks();
    return this;
  }
  onRemove(map: MaplairMap): this {
    super.onRemove(map);
    map.off("zoom move", this.updateMarksDebounced, this);
    return this;
  }

  pointToThumbnailLayer(
    feature: GeoJSON.Feature<GeoJSON.Point, FeatureProperties>,
    latlng: LatLng,
  ): Marker | undefined {
    const zoom = this._map.getZoom();
    const width = zoom > 20 ? 320 : zoom > 18 ? 240 : zoom > 16 ? 120 : 60;
    const iconUrl = feature.properties.thumbnail?.(330);
    if (!iconUrl) return;
    const icon = new Icon({
      iconUrl,
      iconAnchor: [width / 2, 0],
      iconSize: [width, NaN],
    });
    const marker = new Marker(latlng, {
      icon: icon,
      title: feature.properties.title,
    });
    if (feature.properties.wikipediaUrl) {
      marker.on("click", () => window.open(feature.properties.wikipediaUrl));
      marker.on("pointerover", () => {
        const icon = marker.getElement();
        if (!icon) return;
        icon.setAttribute("zIndexOld", icon.style.zIndex);
        icon.style.zIndex = "987654";
      });
      marker.on("pointerout", () => {
        const icon = marker.getElement();
        if (!icon) return;
        icon.style.zIndex = icon.getAttribute("zIndexOld") || "";
      });
    }
    return marker;
  }

  pointToIconLayer(
    feature: GeoJSON.Feature<GeoJSON.Point, FeatureProperties>,
    latlng: LatLng,
  ): Marker {
    const icon = new Icon(this.options.icon!);
    const marker = new Marker(latlng, {
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
    marker.on("click", () => {
      marker.openPopup();
      marker.getElement()?.removeAttribute("openedViaMouseOver");
    });
    marker.on("pointerover", () => {
      marker.openPopup();
      marker.getElement()?.setAttribute("openedViaMouseOver", "1");
    });
    marker.on("pointerout", () => {
      if (marker.getElement()?.hasAttribute("openedViaMouseOver")) {
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
    const params = new URLSearchParams({
      origin: "*",
      format: "json",
      action: "query",
      list: "geosearch",
      gsnamespace: String(this.options.gsnamespace),
      gslimit: "500",
      gsprop: "type|name",
      gsbbox: [bounds.getNorth(), bounds.getWest(), bounds.getSouth(), bounds.getEast()].join("|"),
    });
    const url = `${this.options.url}/w/api.php?${params}`;

    const headers = { Accept: "application/json" };
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
    const features = geosearch.map((object): GeoJSON.Feature<GeoJSON.Point, FeatureProperties> => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [object.lon, object.lat],
      },
      properties: {
        title: object.title,
        wikipediaUrl: `${this.options.url}/wiki/${object.title}`,
        thumbnail: object.title.match(/^File:/)
          ? (width) => getFilePath(object.title, width)
          : undefined,
      },
    }));
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };
    this.clearLayers();
    this.addData(geojson);
  }
}
