export function getQuery() {
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

export function setMapView(map) {
  var query = getQuery();
  if (query.lat && query.lon) {
    map.setView([query.lat, query.lon], query.zoom || 9);
  } else {
    var center = window.localStorage
      ? window.localStorage.getItem('mapCenter')
      : undefined;
    var init = false;
    if (typeof center === 'string') {
      try {
        center = JSON.parse(center);
        map.setView(center, center.zoom);
        init = true;
      } catch (e) {
        // ignore
      }
    }
    if (!init) {
      map.setView({ lat: 47.3, lng: 11.3 }, 9);
    }
  }
}

export function saveMapView() {
  if (!window.localStorage) {
    return;
  }
  var mapCenter = {
    lat: this.getCenter().lat,
    lng: this.getCenter().lng,
    zoom: this.getZoom()
  };
  window.localStorage.setItem('mapCenter', JSON.stringify(mapCenter));
}
