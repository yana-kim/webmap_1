'use strict';

// debug
console.log('Loaded map.js');

// your Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoieWFuYWtpbSIsImEiOiJjbWdqeDFsMW4wZDIwMmlxOXVua293c2k0In0.z9HY6AGezbHy6SWcV-HnZQ';

// initialize map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v9',
  center: [-73.93324, 40.80877],
  zoom: 14
});

// Everything inside map.on('load') happens after the map is ready
map.on('load', function () {

  // =====================
  // 1️⃣ Polygon data (blocks)
  // =====================
  const blocks_url = "./data/blocks_joined_trees_um.geojson";

  map.addSource('blocks_data', {
    type: 'geojson',
    data: blocks_url
  });

  // 🟩 add polygon layer with data-driven fill-color
  map.addLayer({
    id: 'blocks',
    type: 'fill',
    source: 'blocks_data',
    paint: {
      'fill-color': [
        'case',
        // if avg_diamet is null → white
        ['==', ['get', 'avg_diamet'], null], 'white',

        // otherwise color by ranges
        ['step', ['get', 'avg_diamet'],
          '#ffffff',     // < 2.615
          2.615, '#edf8e9',
          6.444, '#bae4b3',
          9.379, '#74c476',
          15.036, '#31a354',
          26.000, '#006d2c'
        ]
      ],
      'fill-outline-color': '#000000',
      'fill-opacity': 0.5
    }
  });

  // =====================
  // 2️⃣ Point data (trees)
  // =====================
  const trees_url = "./data/2015_Street_Tree_Census_subset_um.geojson";

// define a 'source' for your point dataset
map.addSource('trees_data',{
    'type':'geojson',
    'data': trees_url
});
// add a new layer with your points
map.addLayer({
    'id':'trees',
    'type':'circle',
    'source':'trees_data',
    'paint':{
    'circle-color': '#349f27',
    'circle-opacity':0.7,
    'circle-radius': ['/', ['get', 'tree_dbh'], 5],
    },
})

})
