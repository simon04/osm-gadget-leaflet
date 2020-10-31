import { Map } from 'leaflet';

export function getQuery(): URLSearchParams {
  return new URLSearchParams((location.hash || '').substring(2));
}

export function setMapView(map: Map): void {
  const query = getQuery();
  if (query.has('lat') && query.has('lon')) {
    map.setView(
      [+query.get('lat'), +query.get('lon')],
      +query.get('zoom') || 9
    );
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

export function saveMapView(): void {
  if (!window.localStorage) {
    return;
  }
  const mapCenter = {
    lat: this.getCenter().lat,
    lng: this.getCenter().lng,
    zoom: this.getZoom(),
  };
  window.localStorage.setItem('mapCenter', JSON.stringify(mapCenter));
}
