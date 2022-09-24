'use strict';

import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geocoder as GeocoderControl } from 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

import './style.css';
import Mediawiki from './layer.mediawiki';
import Kartographer from './layer.kartographer';
import * as state from './state';
const query = state.getQuery();

// https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-269750768
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Create a map
const map = L.map('map');
map.attributionControl.setPrefix(
  '<a href="https://github.com/simon04/osm-gadget-leaflet/" target="_blank">' +
    '@simon04/osm-gadget-leaflet</a> (GPL v3)'
);
new GeocoderControl({ position: 'topleft' }).addTo(map);
state.setMapView(map);

// Prepare Kartographer layer
const kartographer = new Kartographer({});

// Prepare marks layer
const commonsThumbnails = new Mediawiki({
  url: 'https://commons.wikimedia.org',
  iconThumbnail: true,
  gsnamespace: 6,
});
const commons = new Mediawiki({
  url: 'https://commons.wikimedia.org',
  icon: {
    iconUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Commons-logo-2.svg/20px-Commons-logo-2.svg.png',
    iconSize: [20, 27],
  },
  gsnamespace: 6,
});
const marks = new Mediawiki({
  url: `https://${query.get('lang') || 'en'}.wikipedia.org`,
  icon: {
    iconUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/20px-Wikipedia-logo-v2.svg.png',
    iconSize: [20, 18],
  },
});

// Add layer switcher
const maxZoom = 24;
const layers = L.control
  .layers(
    {
      Wikimedia: L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
          maxNativeZoom: 19,
          maxZoom,
          attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
        })
        .addTo(map),
      OpenStreetMap: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxNativeZoom: 19,
        maxZoom,
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      }),
      OpenTopoMap: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxNativeZoom: 17,
        maxZoom,
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>), <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      }),
    },
    {
      Kartographer: kartographer.addTo(map),
      'Commons World 🖼': commonsThumbnails.addTo(map),
      'Commons World': commons,
      'Wikipedia World': marks.addTo(map),
    }
  )
  .addTo(map);

if (query.get('lang') === 'de') {
  layers.addBaseLayer(
    L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
      maxNativeZoom: 18,
      maxZoom,
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }),
    'OpenStreetMap.de'
  );
}

// Add a km/miles scale
L.control.scale().addTo(map);

kartographer.load(query.getAll('article'), query.get('lang') || 'en');
window.addEventListener('hashchange', () => {
  const query = state.getQuery();
  kartographer.load(query.getAll('article'), query.get('lang') || 'en');
});
map.on('zoomend moveend', () => state.saveMapView(map));
