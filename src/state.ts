import { Map } from 'leaflet';

export function getQuery() {
  return new URLSearchParams((location.hash || '').substring(2));
}

export function setMapView(map: Map) {
  var query = getQuery();
  if (query.has('lat') && query.has('lon')) {
    map.setView(
      [+query.get('lat'), +query.get('lon')],
      +query.get('zoom') || 9
    );
  } else {
    var centerString = window.localStorage
      ? window.localStorage.getItem('mapCenter')
      : undefined;
    var init = false;
    if (typeof centerString === 'string') {
      try {
        var center = JSON.parse(centerString);
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
    zoom: this.getZoom(),
  };
  window.localStorage.setItem('mapCenter', JSON.stringify(mapCenter));
}
