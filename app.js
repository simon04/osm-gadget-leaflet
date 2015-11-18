'use strict';

// Create a map
var map = L.map('map').setView([40.75, -73.96], 4);

// Add layer switcher
L.control.layers({
  'Wikimedia': wikimediaLayer().addTo(map),
  'OpenStreetMap': osmLayer()
}).addTo(map);

// Add a km/miles scale
L.control.scale().addTo(map);

// Update the zoom level label
map.on('zoomend', function() {
});

function wikimediaLayer() {
  // Allow user to change style via the ?s=xxx URL parameter
  // Uses "osm-intl" as the default style
  var match = window.location.search.match(/s=([^&\/]*)/);
  var style = (match && match[1]) || 'osm-intl';
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
