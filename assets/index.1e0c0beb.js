var S=Object.defineProperty,L=Object.defineProperties;var O=Object.getOwnPropertyDescriptors;var x=Object.getOwnPropertySymbols;var T=Object.prototype.hasOwnProperty,M=Object.prototype.propertyIsEnumerable;var y=(a,e,o)=>e in a?S(a,e,{enumerable:!0,configurable:!0,writable:!0,value:o}):a[e]=o,v=(a,e)=>{for(var o in e||(e={}))T.call(e,o)&&y(a,o,e[o]);if(x)for(var o of x(e))M.call(e,o)&&y(a,o,e[o]);return a},k=(a,e)=>L(a,O(e));import{l as i,w as W,i as U,a as z,s as I,G as P}from"./vendor.b9132a1c.js";const N=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))n(t);new MutationObserver(t=>{for(const r of t)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function o(t){const r={};return t.integrity&&(r.integrity=t.integrity),t.referrerpolicy&&(r.referrerPolicy=t.referrerpolicy),t.crossorigin==="use-credentials"?r.credentials="include":t.crossorigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(t){if(t.ep)return;t.ep=!0;const r=o(t);fetch(t.href,r)}};N();class f extends i.exports.GeoJSON{constructor(e){super(void 0,e);if(this.options={url:void 0,gsnamespace:0,icon:void 0,iconThumbnail:!1,thumbnailWidth:320},i.exports.Util.setOptions(this,k(v({},e),{pointToLayer:e.iconThumbnail?this.pointToThumbnailLayer.bind(this):this.pointToIconLayer.bind(this)})),!this.options.iconThumbnail&&!this.options.icon)throw new Error("Either iconThumbnail or icon is needed!")}onAdd(e){return super.onAdd(e),e.on("zoomend moveend",this.updateMarks,this),this.updateMarks(),this}onRemove(e){return super.onRemove(e),e.off("zoomend moveend",this.updateMarks,this),this}pointToThumbnailLayer(e,o){const n=this._map.getZoom(),t=n>20?320:n>18?240:n>16?120:60,r=e.properties.thumbnail(320);if(!r)return;const s=i.exports.icon({iconUrl:r,iconAnchor:[t/2,0],iconSize:[t,void 0]}),l=i.exports.marker(o,{icon:s,title:e.properties.title});return e.properties.wikipediaUrl&&(l.on("click",()=>window.open(e.properties.wikipediaUrl)),l.on("mouseover",c=>{const d=c.target._icon;d.setAttribute("zIndexOld",d.style.zIndex),d.style.zIndex="987654"}),l.on("mouseout",c=>{const d=c.target._icon;d.style.zIndex=d.getAttribute("zIndexOld")})),l}pointToIconLayer(e,o){const n=i.exports.icon(this.options.icon),t=i.exports.marker(o,{icon:n,title:e.properties.title}),r=s.call(this,e);return r&&(t.bindPopup(r,{minWidth:200}),t.on("click",function(){this.openPopup(),this.openedViaMouseOver=!1}),t.on("mouseover",function(){this.openPopup(),this.openedViaMouseOver=!0}),t.on("mouseout",function(){this.openedViaMouseOver&&this.closePopup()})),t;function s(l){let c;if(l.properties.title&&l.properties.wikipediaUrl&&(c=i.exports.Util.template('<a href="{wikipediaUrl}" target="_blank">{title}</a>',l.properties),l.properties.thumbnail)){const{thumbnailWidth:d}=this.options,b=l.properties.thumbnail(d);c+=i.exports.Util.template('<p><img src="{thumbnail}" width="{thumbnailWidth}"></p>',{thumbnail:b,thumbnailWidth:d})}return c}}updateMarks(){if(!this._map)return;const e=this._map.getBounds();let o=this.options.url+"/w/api.php";o+=i.exports.Util.getParamString({origin:"*",format:"json",action:"query",list:"geosearch",gsnamespace:this.options.gsnamespace,gslimit:500,gsprop:"type|name",gsbbox:[e.getNorth(),e.getWest(),e.getSouth(),e.getEast()].join("|")});const n=new XMLHttpRequest;return n.addEventListener("load",t.bind(this)),n.open("GET",o),n.send(),this;function t(){if(n.status!==200||!n.responseText)return;const s=JSON.parse(n.responseText);if(s.error||!s.query.geosearch){console.warn(s.error);return}const c=s.query.geosearch.map(r,this);this.clearLayers(),this.addData(c)}function r(s){return{type:"Feature",geometry:{type:"Point",coordinates:[s.lon,s.lat]},properties:{title:s.title,wikipediaUrl:this.options.url+"/wiki/"+s.title,thumbnail:s.title.match(/^File:/)?l=>W(s.title,l):void 0}}}}}class C extends i.exports.GeoJSON{constructor(e){super(void 0,e);this.options={coordsToLatLng(o){const n=i.exports.point(o[0],o[1]);return i.exports.Projection.SphericalMercator.unproject(n)},pointToLayer(o,n){return i.exports.circleMarker(n)}},i.exports.Util.setOptions(this,e)}loadWIWOSM(){if(!(!this.options.article||!this.options.lang))return typeof this.options.article=="object"?(this.clearLayers(),this.options.article.map(e=>this.loadArticle(e))):this.loadArticle(this.options.article,!0),this}loadArticle(e,o=!1){let n="https://tools.wmflabs.org/wiwosm/osmjson/getGeoJSON.php";n+=i.exports.Util.getParamString({lang:this.options.lang,article:e});const t=new XMLHttpRequest;t.addEventListener("load",()=>{if(t.status!==200||!t.responseText)return;const r=JSON.parse(t.responseText);o&&this.clearLayers(),this.addData(r),this._map.fitBounds(this.getBounds())}),t.open("GET",n),t.send()}}function w(){return new URLSearchParams((location.hash||"").substring(2))}function E(a){const e=w();if(e.has("lat")&&e.has("lon"))a.setView([+e.get("lat"),+e.get("lon")],+e.get("zoom")||9);else{const o=window.localStorage?window.localStorage.getItem("mapCenter"):void 0;let n=!1;if(typeof o=="string")try{const t=JSON.parse(o);a.setView(t,t.zoom),n=!0}catch{}n||a.setView({lat:47.3,lng:11.3},9)}}function A(){if(!window.localStorage)return;const a={lat:this.getCenter().lat,lng:this.getCenter().lng,zoom:this.getZoom()};window.localStorage.setItem("mapCenter",JSON.stringify(a))}const m=w();i.exports.Icon.Default.mergeOptions({iconRetinaUrl:U,iconUrl:z,shadowUrl:I});const p=i.exports.map("map");p.attributionControl.setPrefix('<a href="https://github.com/simon04/osm-gadget-leaflet/" target="_blank">@simon04/osm-gadget-leaflet</a> (GPL v3)');new P({position:"topleft"}).addTo(p);E(p);const u=new C({article:m.get("article"),lang:m.get("lang")||"en"}),G=new f({url:"https://commons.wikimedia.org",iconThumbnail:!0,gsnamespace:6}),_=new f({url:"https://commons.wikimedia.org",icon:{iconUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Commons-logo-2.svg/20px-Commons-logo-2.svg.png",iconSize:[20,27]},gsnamespace:6}),g=new f({url:"https://"+(m.get("lang")||"en")+".wikipedia.org",icon:{iconUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/20px-Wikipedia-logo-v2.svg.png",iconSize:[20,18]}}),h=24,q=i.exports.control.layers({Wikimedia:i.exports.tileLayer.provider("Wikimedia",{maxNativeZoom:19,maxZoom:h}).addTo(p),OpenStreetMap:i.exports.tileLayer.provider("OpenStreetMap",{maxNativeZoom:19,maxZoom:h}),HikeBike:i.exports.tileLayer.provider("HikeBike"),OpenTopoMap:i.exports.tileLayer.provider("OpenTopoMap",{maxNativeZoom:17,maxZoom:h})},{WIWOSM:u.addTo(p),"Commons World \u{1F5BC}":G.addTo(p),"Commons World":_,"Wikipedia World":g.addTo(p).updateMarks(),"Hill Shading":i.exports.tileLayer.provider("HikeBike.HillShading")}).addTo(p);m.get("lang")==="de"&&q.addBaseLayer(i.exports.tileLayer.provider("OpenStreetMap.DE"),"OpenStreetMap.de");i.exports.control.scale().addTo(p);u.loadWIWOSM();window.addEventListener("hashchange",function(){i.exports.Util.setOptions(u,w()),u.loadWIWOSM()});p.on("zoomend moveend",g.updateMarks,g);p.on("zoomend moveend",A,p);
//# sourceMappingURL=index.1e0c0beb.js.map
