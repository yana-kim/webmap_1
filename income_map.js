'use strict';

console.log('Loaded income_map.js');

// 🗺️ Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoieWFuYWtpbSIsImEiOiJjbWdqeDFsMW4wZDIwMmlxOXVua293c2k0In0.z9HY6AGezbHy6SWcV-HnZQ';

// 🔍 Center on San Mateo County
const center = [-122.3, 37.55];
const zoom = 9.5;

const bayAreaBounds = [
  [-123.2, 36.7], // Southwest corner (near Santa Cruz)
  [-121.3, 38.3]  // Northeast corner (north of Concord)
];


// --- Initialize the map ---
const map = new mapboxgl.Map({
  container: 'map', // HTML container ID
  style: 'mapbox://styles/mapbox/light-v11',
  center,
  zoom
});

window.incomeMap = map;

map.on('load', () => {
  console.log('Map loaded.');

  // --- Add the GeoJSON data source ---
  map.addSource('income_data', {
    type: 'geojson',
    data: './data/san_mateo_income.geojson'
  });

  // --- Add the heatmap (choropleth) layer ---
  map.addLayer({
  id: 'income-choropleth',
  type: 'fill',
  source: 'income_data',
  filter: [
    '>',
    ['to-number', ['get', 'Median Household Income (In 2023 Inflation Adjusted Dollars)']],
    0
  ],
  paint: {
  'fill-color': [
    'interpolate',
    ['linear'],
    ['coalesce',
      ['to-number', ['get', 'Median Household Income (In 2023 Inflation Adjusted Dollars)']],
      0
    ],
    100000, '#7f2704',   // darkest (lowest)
    200000, '#fff5eb'    // lightest (highest)
  ],
  'fill-opacity': 0.8,
  'fill-outline-color': '#000000'
}

});


  // --- Add county boundary outlines for clarity ---
  map.addLayer({
    id: 'income-outline',
    type: 'line',
    source: 'income_data',
    paint: {
      'line-color': '#333',
      'line-width': 0.4
    }
  });

  // --- Add popup on hover ---
    map.on('mousemove', 'income-choropleth', function (e) {
      const feature = e.features[0];
      const income = feature.properties['Median Household Income (In 2023 Inflation Adjusted Dollars)'];

      // Handle missing or null values gracefully
      if (!income || isNaN(income)) return;

      // Change cursor style
      map.getCanvas().style.cursor = 'pointer';

      // Remove existing popup if any
      const existingPopups = document.getElementsByClassName('mapboxgl-popup');
      if (existingPopups.length) existingPopups[0].remove();

      // Create a new popup showing the income
      new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      })
        .setLngLat(e.lngLat)
        .setHTML(
          `<strong>Median Household Income</strong><br>$${Number(income).toLocaleString()}`
        )
        .addTo(map);
    });


    // Change cursor style
    map.getCanvas().style.cursor = 'pointer';

    // // Show popup
    // new mapboxgl.Popup({
    //   closeButton: false,
    //   closeOnClick: false
    // })
    //   .setLngLat(e.lngLat)
    //   .setHTML(
    //     `<strong>Tract:</strong> ${tract}<br>
    //     <strong>Median Income:</strong> $${income ? Number(income).toLocaleString() : 'N/A'}`
    //   )

    //   .addTo(map);
  });

  // --- Remove popup when mouse leaves ---
  map.on('mouseleave', 'income-choropleth', function () {
    map.getCanvas().style.cursor = '';
    const popups = document.getElementsByClassName('mapboxgl-popup');
    if (popups.length) popups[0].remove();
  });

