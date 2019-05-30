osm-gadget-leaflet
==================

A map visualizing a spatial object within a Wikipedia article plus displaying other articles in the surrounding.

This implementation is based on [LeafletJS](https://leafletjs.com/) and might, eventually, replace the [current implementation](https://de.wikipedia.org/wiki/Wikipedia:WikiProjekt_Georeferenzierung/Anwendungen/OpenStreetMap/en) which is based on OpenLayers 2.

Examples
--------
* https://tools.wmflabs.org/osm-gadget-leaflet/#/?lang=en&article=Austria
* https://tools.wmflabs.org/osm-gadget-leaflet/#/?lang=wikidata&article=Q40
* https://tools.wmflabs.org/osm-gadget-leaflet/#/?lang=wikidata&article=Q40&article=Q183

Building
--------
1. Run `yarn` to obtain the libraries and build the project
2. Open `index.html` in the browser and specify a query, e.g., `index.html#/?lang=en&article=Austria`
