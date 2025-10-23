'use strict';

console.log('Loaded race_map.js');

mapboxgl.accessToken = 'pk.eyJ1IjoieWFuYWtpbSIsImEiOiJjbWdqeDFsMW4wZDIwMmlxOXVua293c2k0In0.z9HY6AGezbHy6SWcV-HnZQ';

const center = [-122.3, 37.55];
const zoom = 9.5;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center,
  zoom
});

const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});


map.on('load', () => {
  map.addSource('race_data', {
    type: 'geojson',
    data: './data/san_mateo_pct_hispanic.geojson'  // your file
  });

  // Choropleth for % Hispanic
  map.addLayer({
    id: 'race-choropleth',
    type: 'fill',
    source: 'race_data',
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['to-number', ['get', 'Pct_Hispanic']],
        0, '#fff5eb',     // low % Hispanic
        25, '#fee6ce',
        40, '#fdae6b',
        60, '#e34a33',
        100, '#7f2704'    // high % Hispanic
      ],
      'fill-opacity': 0.8,
      'fill-outline-color': '#000000'
    }
  });

  // Popup on hover
  map.on('mousemove', 'race-choropleth', e => {
  const f = e.features[0];
  const pct = f.properties.Pct_Hispanic;
  map.getCanvas().style.cursor = 'pointer';

  popup
    .setLngLat(e.lngLat)
    .setHTML(`<strong>% Hispanic / Latino:</strong> ${pct.toFixed(1)}%`)
    .addTo(map);
});


  map.on('mouseleave', 'race-choropleth', () => {
    map.getCanvas().style.cursor = '';
    const popups = document.getElementsByClassName('mapboxgl-popup');
    if (popups.length) popups[0].remove();
  });
});
