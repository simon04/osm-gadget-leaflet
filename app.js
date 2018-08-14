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
      'Commons World': commons.addTo(map),
      'Wikipedia World': marks.addTo(map),
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
  L.setOptions(wiwosm, getQuery());
  wiwosm.loadWIWOSM();
});
map.on('zoomend moveend', commons.updateMarks, commons);
map.on('zoomend moveend', marks.updateMarks, marks);

function getQuery() {
  var query_string = {};
  var hash = window.location.hash.split(/^#\/\?/); // split on #/?
  var vars = (hash && hash[1] && hash[1].split('&')) || [];
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
