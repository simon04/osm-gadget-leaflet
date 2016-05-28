'use strict';

var query = getQuery();

// Create a map
var map = L.map('map').setView([47.3, 11.3], 9);

// Prepare WIWOSM layer
var wiwosm = new L.GeoJSON.WIWOSM({
  article: query.article,
  lang: query.lang || 'en'
});

// Prepare marks layer
var marks = new L.GeoJSON.WikipediaMarks({
  lang: query.lang || 'en'
});

// Add layer switcher
var layers = L.control.layers({
  'Wikimedia': new L.TileLayer.WikimediaMaps({style: query.style || 'osm-intl'}).addTo(map),
  'HikeBike': new L.TileLayer.WMFLabs({style: 'hikebike'}),
  'Public Transport (ÖPNV)': new L.TileLayer.PublicTransport(),
  'OpenStreetMap': new L.TileLayer.OSM()
}, {
  'WIWOSM': wiwosm.addTo(map),
  'Wikipedia World': marks.addTo(map),
  'Hill Shading': new L.TileLayer.WMFLabs({style: 'hillshading'})
}).addTo(map);

if (query.lang === 'de') {
  layers.addBaseLayer(new L.TileLayer.OSMde(), 'OpenStreetMap.de');
}

// Add a km/miles scale
L.control.scale().addTo(map);

wiwosm.loadWIWOSM();
window.addEventListener('hashchange', function() {
  L.setOptions(wiwosm, getQuery());
  wiwosm.loadWIWOSM();
});
map.on('zoomend moveend', marks.updateMarks, marks);

function getQuery() {
  var query_string = {};
  var hash = window.location.hash.split(/^#\/\?/); // split on #/?
  var vars = hash && hash[1] && hash[1].split('&') || [];
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=', 2);
    var key = pair[0];
    var value = decodeURIComponent(pair[1]);
    if (typeof query_string[key] === 'undefined') {
      // first entry with this name -> store
      query_string[key] = value;
    } else if (typeof query_string[pair[0]] === 'string') {
      // second entry with this name -> convert to array
      var arr = [query_string[key], value];
      query_string[key] = arr;
    } else {
      // third or later entry with this name -> append to array
      query_string[key].push(value);
    }
  }
  return query_string;
}
