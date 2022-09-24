import { Map } from 'leaflet';

export function getQuery(): URLSearchParams {
  return new URLSearchParams((location.hash || '').substring(2));
}

export function setMapView(map: Map): void {
  const query = getQuery();
  const lat = query.get('lat');
  const lon = query.get('lon');
  if (lat && lon) {
    map.setView([+lat, +lon], +(query.get('zoom') || '9'));
  } else {
    const centerString = window.localStorage
      ? window.localStorage.getItem('mapCenter')
      : undefined;
    let init = false;
    if (typeof centerString === 'string') {
      try {
        const center = JSON.parse(centerString);
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

export function saveMapView(map: Map): void {
  if (!window.localStorage) {
    return;
  }
  const mapCenter = {
    lat: map.getCenter().lat,
    lng: map.getCenter().lng,
    zoom: map.getZoom(),
  };
  window.localStorage.setItem('mapCenter', JSON.stringify(mapCenter));
}
