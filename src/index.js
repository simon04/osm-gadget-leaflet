'use strict';

import L from 'leaflet';
import './layers';
import * as state from './state';
var query = state.getQuery();

// Create a map
var map = L.map('map');
map.attributionControl.setPrefix(
  '<a href="https://github.com/simon04/osm-gadget-leaflet/" target="_blank">' +
    '@simon04/osm-gadget-leaflet</a> (MIT)'
);
state.setMapView(map);

// Prepare WIWOSM layer
var wiwosm = new L.GeoJSON.WIWOSM({
  article: query.article,
  lang: query.lang || 'en'
});

// Prepare marks layer
var commons = new L.GeoJSON.Geosearch({
  url: 'https://commons.wikimedia.org',
  icon: {
    iconUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Commons-logo-2.svg/20px-Commons-logo-2.svg.png',
    iconSize: [20, 27]
  },
  gsnamespace: 6
});
var marks = new L.GeoJSON.Geosearch({
  url: 'https://' + (query.lang || 'en') + '.wikipedia.org',
  icon: {
    iconUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/20px-Wikipedia-logo-v2.svg.png',
    iconSize: [20, 18]
  }
});

// Add layer switcher
var layers = L.control
  .layers(
    {
      Wikimedia: L.tileLayer.provider('Wikimedia').addTo(map),
      OpenStreetMap: L.tileLayer.provider('OpenStreetMap'),
      HikeBike: L.tileLayer.provider('HikeBike'),
      'Public Transport (ÖPNV)': L.tileLayer.provider('memomaps'),
      OpenTopoMap: L.tileLayer.provider('OpenTopoMap')
    },
    {
      WIWOSM: wiwosm.addTo(map),
      'Commons World': commons.addTo(map).updateMarks(),
      'Wikipedia World': marks.addTo(map).updateMarks(),
      'Hill Shading': L.tileLayer.provider('HikeBike.HillShading')
    }
  )
  .addTo(map);

if (query.lang === 'de') {
  layers.addBaseLayer(
    L.tileLayer.provider('OpenStreetMap.DE'),
    'OpenStreetMap.de'
  );
}

// Add a km/miles scale
L.control.scale().addTo(map);

wiwosm.loadWIWOSM();
window.addEventListener('hashchange', function() {
  L.setOptions(wiwosm, state.getQuery());
  wiwosm.loadWIWOSM();
});
map.on('zoomend moveend', commons.updateMarks, commons);
map.on('zoomend moveend', marks.updateMarks, marks);
map.on('zoomend moveend', state.saveMapView, map);
