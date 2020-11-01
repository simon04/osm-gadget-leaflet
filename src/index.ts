'use strict';

import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-providers';
import 'leaflet-control-geocoder/src/index.js';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

import { default as Mediawiki } from './layer.mediawiki';
import { default as WIWOSM } from './layer.wiwosm';
import * as state from './state';
const query = state.getQuery();

// Create a map
const map = L.map('map');
map.attributionControl.setPrefix(
  '<a href="https://github.com/simon04/osm-gadget-leaflet/" target="_blank">' +
    '@simon04/osm-gadget-leaflet</a> (GPL v3)'
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(L.Control as any).geocoder({ position: 'topleft' }).addTo(map);
state.setMapView(map);

// Prepare WIWOSM layer
const wiwosm = new WIWOSM({
  article: query.get('article'),
  lang: query.get('lang') || 'en',
});

// Prepare marks layer
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
  url: 'https://' + (query.get('lang') || 'en') + '.wikipedia.org',
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
      Wikimedia: L.tileLayer
        .provider('Wikimedia', {
          maxNativeZoom: 19,
          maxZoom,
        })
        .addTo(map),
      OpenStreetMap: L.tileLayer.provider('OpenStreetMap', {
        maxNativeZoom: 19,
        maxZoom,
      }),
      HikeBike: L.tileLayer.provider('HikeBike'),
      OpenTopoMap: L.tileLayer.provider('OpenTopoMap', {
        maxNativeZoom: 17,
        maxZoom,
      }),
    },
    {
      WIWOSM: wiwosm.addTo(map),
      'Commons World': commons.addTo(map).updateMarks(),
      'Wikipedia World': marks.addTo(map).updateMarks(),
      'Hill Shading': L.tileLayer.provider('HikeBike.HillShading'),
    }
  )
  .addTo(map);

if (query.get('lang') === 'de') {
  layers.addBaseLayer(
    L.tileLayer.provider('OpenStreetMap.DE'),
    'OpenStreetMap.de'
  );
}

// Add a km/miles scale
L.control.scale().addTo(map);

wiwosm.loadWIWOSM();
window.addEventListener('hashchange', function () {
  L.Util.setOptions(wiwosm, state.getQuery());
  wiwosm.loadWIWOSM();
});
map.on('zoomend moveend', commons.updateMarks, commons);
map.on('zoomend moveend', marks.updateMarks, marks);
map.on('zoomend moveend', state.saveMapView, map);
