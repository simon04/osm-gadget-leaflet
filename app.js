'use strict';

var query = getQuery();

// Create a map
var map = L.map('map').setView([47.3, 11.3], 9);

// Prepare WIWOSM layer
var wiwosm = new L.GeoJSON.WIWOSM({
  article: query.article,
  lang: query.lang
});

// Prepare marks layer
var marks = new L.GeoJSON.WikipediaMarks({
  lang: query.lang
});

// Add layer switcher
var layers = L.control.layers({
  'Wikimedia': wikimediaLayer().addTo(map),
  'OpenStreetMap': osmLayer()
}, {
  'WIWOSM': wiwosm.addTo(map),
  'Wikipedia World': marks.addTo(map)
}).addTo(map);

// Add a km/miles scale
L.control.scale().addTo(map);

wiwosm.loadWIWOSM();
map.on('zoomend', function() {
  marks.updateMarks.call(marks);
});

function wikimediaLayer() {
  var q = getQuery();
  var style = q.s || 'osm-intl'; // Allow user to change style via the ?s=xxx URL parameter
  var scale = bracketDevicePixelRatio();
  var scalex = (scale === 1) ? '' : ('@' + scale + 'x');
  return L.tileLayer('https://maps.wikimedia.org/' + style + '/{z}/{x}/{y}' + scalex + '.png', {
    maxZoom: 18,
    attribution: 'Wikimedia maps beta | Map data &copy; ' +
        '<a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    id: 'wikipedia-map-01'
  });
}

function osmLayer() {
  return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; ' +
        '<a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  });
}

function bracketDevicePixelRatio() {
  var brackets = [1, 1.3, 1.5, 2, 2.6, 3];
  var baseRatio = window.devicePixelRatio || 1;
  for (var i = 0; i < brackets.length; i++) {
    var scale = brackets[i];
    if (scale >= baseRatio || (baseRatio - scale) < 0.1) {
      return scale;
    }
  }
  return brackets[brackets.length - 1];
}

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
