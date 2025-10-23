
'use strict';

// Chart.js setup
let basisChart = null;
let caseChart = null;

let selectedCity = null;

function initChart() {
  const basisCtx = document.getElementById('basisChart').getContext('2d');
  const caseCtx = document.getElementById('caseChart').getContext('2d');
  Chart.register(ChartDataLabels);

  // --- Bar chart: Basis for UD Notice ---
  basisChart = new Chart(basisCtx, {
    type: 'bar',
    data: {
      labels: ['NPR', 'Behavior', 'No Fault'],
      datasets: [{
        label: 'Eviction Reasons',
        data: [0, 0, 0],
        backgroundColor: ['#fdbb84', '#fc8d59', '#e34a33', '#fee8c8']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Basis for UD Notice',
          padding: { top: 10, bottom: 20 }
        },
        datalabels: {
          color: '#333',
          anchor: 'end',
          align: 'top',
          font: { weight: 'bold', size: 12 },
          formatter: value => (value > 0 ? value : '')
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 100 },
        }
      }

      ,
      animation: { duration: 800, easing: 'easeOutQuart' }
    }
  });

  // --- Pie chart: Case Disposition ---
  caseChart = new Chart(caseCtx, {
    type: 'polarArea',
    data: {
      labels: ['Active', 'Dismissed', 'Judgment', 'Stayed'],
      datasets: [{
        data: [1230, 942, 318, 101],
        backgroundColor: ['#fdbb84', '#fc8d59', '#e34a33', '#fee8c8']
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          ticks: {
            display: false 
          }
        }
      },
      plugins: {
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: 'Case Disposition',
          padding: { top: 20, bottom: 10 }
        },
        datalabels: {
          color: '#333',
          font: { weight: 'bold', size: 12 },
          // 👇 these two lines move labels *outside* the slice
          anchor: 'end',      // attaches label to the edge of the slice
          align: 'end',       // positions label *outside* the chart radius
          offset: 8,          // small gap between label and slice
          formatter: value => (value > 0 ? value : '')
        }

      },
      animation: { duration: 800, easing: 'easeOutQuart' }
    }
  });
}


console.log('Loaded map.js');

mapboxgl.accessToken = 'pk.eyJ1IjoieWFuYWtpbSIsImEiOiJjbWdqeDFsMW4wZDIwMmlxOXVua293c2k0In0.z9HY6AGezbHy6SWcV-HnZQ';

const center = [-122.3, 37.55];
const zoom = 9.5;
const dataUrl = "./data/san_mateo_evictions 2.geojson";

let activePopup2019 = null;
let activePopup2023 = null;

function clearAllPopups() {
  if (activePopup2019) { activePopup2019.remove(); activePopup2019 = null; }
  if (activePopup2023) { activePopup2023.remove(); activePopup2023 = null; }
}

const bayAreaBounds = [
  [-123.2, 36.7], // Southwest corner (near Santa Cruz)
  [-121.3, 38.3]  // Northeast corner (north of Concord)
];


// --- Initialize two maps ---
const map2019 = new mapboxgl.Map({
  container: 'map-2019',
  style: 'mapbox://styles/mapbox/light-v11',
  center,
  zoom,
  minZoom: 7,       // how far out you can zoom
  maxZoom: 13,      // how far in you can zoom
  maxBounds: bayAreaBounds // keeps map view inside Bay Area
});

const map2023 = new mapboxgl.Map({
  container: 'map-2023',
  style: 'mapbox://styles/mapbox/light-v11',
  center,
  zoom,
  minZoom: 7,
  maxZoom: 13,
  maxBounds: bayAreaBounds
});

// --- Add eviction layers ---
function addEvictionLayer(map, year) {
  map.on('load', async () => {
    // --- Add data source ---
    map.addSource('blocks_data_' + year, {
      type: 'geojson',
      data: dataUrl
    });

    // --- Compute totals once the data is loaded ---
    const response = await fetch(dataUrl);
    const data = await response.json();

    const totals = data.features.reduce((acc, f) => {
      const p = f.properties;
      acc.NPR += p.NPR || 0;
      acc.Behavior += p.Behavior || 0;
      acc.No_Fault += p.No_Fault || 0;
      acc.Active += p.Active || 0;
      acc.Dismissed += p.Dismissed || 0;
      acc.Judgment += p.Judgment || 0;
      acc.Stayed += p.Stayed || 0;
      return acc;
    }, { NPR: 0, Behavior: 0, No_Fault: 0, Active: 0, Dismissed: 0, Judgment: 0, Stayed: 0 });

    // --- Initialize charts with totals ---
    if (basisChart && caseChart) {
      basisChart.data.datasets[0].data = [totals.NPR, totals.Behavior, totals.No_Fault];
      caseChart.data.datasets[0].data = [totals.Active, totals.Dismissed, totals.Judgment, totals.Stayed];
      
      basisChart.update();
      caseChart.update();
    }

    // --- Add map layers ---
    map.addLayer({
      id: 'evictions_' + year,
      type: 'fill',
      source: 'blocks_data_' + year,
      paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['to-number', ['get', 'count']],
        10, '#fff7ec',     // lightest (lowest)
        250, '#b30000'    // darkest (highest)
      ],
      'fill-outline-color': '#000000',
      'fill-opacity': 0.6
    },
    filter: ['==', ['get', 'Year'], year]

    });

    map.addLayer({
      id: 'borders_' + year,
      type: 'line',
      source: 'blocks_data_' + year,
      paint: {
        'line-color': '#000',
        'line-width': 0.5
      },
      filter: ['==', ['get', 'Year'], year]
    });

    // --- Highlight layer (initially empty) ---
    map.addLayer({
      id: 'highlighted_' + year,
      type: 'line',
      source: 'blocks_data_' + year,
      paint: {
        'line-color': '#000000', // outline color (black)
        'line-width': 1.2,
        'line-opacity': 0.9
      },
      filter: ['==', ['get', 'ZIP'], ''] // start with nothing selected

      
    });
    


    


    map.on('click', 'evictions_' + year, function (e) {
      const features = map.queryRenderedFeatures(e.point, { layers: ['evictions_' + year] });

      // --- If click is outside polygons → reset charts and remove highlight ---
      if (!features.length) {
        selectedCity = null;
        map.setFilter('highlighted_' + year, ['==', ['get', 'ZIP'], '']);

        // Reset charts to totals
        basisChart.options.scales.y.max = 2200;
        basisChart.options.scales.y.ticks.stepSize = 200;

        document.getElementById('panel-city').textContent = 'All Cities (Total)';
        document.getElementById('panel-year').textContent = '2019–2023';
        document.getElementById('panel-zip').textContent = '—';
        document.getElementById('panel-count').textContent =
          totals.NPR + totals.Behavior + totals.No_Fault;

        basisChart.data.datasets[0].data = [totals.NPR, totals.Behavior, totals.No_Fault];
        caseChart.data.datasets[0].data = [
          totals.Active, totals.Dismissed, totals.Judgment, totals.Stayed
        ];
        basisChart.update();
        caseChart.update();
        return;
      }

      // --- Get properties of clicked feature (safe because a feature exists) ---
      const props = e.features[0].properties;
      const cityName = props.PO_NAME || 'Unknown Area';

      // ✅ If same city clicked again → reset to totals and remove highlight
      if (selectedCity === cityName) {
        selectedCity = null;
        map.setFilter('highlighted_' + year, ['==', ['get', 'ZIP'], '']);

        basisChart.options.scales.y.max = 2200;
        basisChart.options.scales.y.ticks.stepSize = 200;

        document.getElementById('panel-city').textContent = 'All Cities (Total)';
        document.getElementById('panel-year').textContent = '2019–2023';
        document.getElementById('panel-zip').textContent = '—';
        document.getElementById('panel-count').textContent =
          totals.NPR + totals.Behavior + totals.No_Fault;

        basisChart.data.datasets[0].data = [totals.NPR, totals.Behavior, totals.No_Fault];
        caseChart.data.datasets[0].data = [
          totals.Active, totals.Dismissed, totals.Judgment, totals.Stayed
        ];
        basisChart.update();
        caseChart.update();
        return;
      }

      // ✅ Otherwise highlight the new city and update dashboard
      selectedCity = cityName;
      map.setFilter('highlighted_' + year, ['==', ['get', 'ZIP'], props.ZIP]);

      // Adjust y-axis for detailed city view
      basisChart.options.scales.y.max = 240;
      basisChart.options.scales.y.ticks.stepSize = 25;

      const zip = props.ZIP || props.ZCTA5CE10 || '—';
      const count = props.count ?? '—';

      document.getElementById('panel-city').textContent = cityName;
      document.getElementById('panel-year').textContent = year;
      document.getElementById('panel-zip').textContent = zip;
      document.getElementById('panel-count').textContent = count;

      // Update charts
      basisChart.data.datasets[0].data = [
        props.NPR || 0,
        props.Behavior || 0,
        props.No_Fault || 0
      ];
      caseChart.data.datasets[0].data = [
        props.Active || 0,
        props.Dismissed || 0,
        props.Judgment || 0,
        props.Stayed || 0
      ];
      basisChart.update();
      caseChart.update();

      // Small lift animation
      const panel = document.getElementById('dashboard-panel');
      panel.style.transform = 'translateY(-3px)';
      setTimeout(() => (panel.style.transform = 'translateY(0)'), 150);
    });


  });
}



// Add both layers
addEvictionLayer(map2019, '2019');
addEvictionLayer(map2023, '2023');

// --- Create swipe comparison ---
const compare = new mapboxgl.Compare(map2019, map2023, '#comparison-container', {
  orientation: 'vertical'
});

// Nuke any inline styles the plugin may set
requestAnimationFrame(() => {
  const s = document.querySelector('#comparison-container .compare-swiper');
  if (s) {
    s.style.background = 'none';
    s.style.backgroundColor = '#b0b0b0';
    s.style.width = '3px';
    s.style.boxShadow = 'none';
    s.style.border = 'none';
  }
});
// --- Clear popups when handle is moved ---
const handle = document.querySelector('.compare-swiper');
if (handle) {
  ['mousedown', 'touchstart', 'keydown', 'pointerdown'].forEach(evt =>
    handle.addEventListener(evt, clearAllPopups, { passive: true })
  );
}

// --- Add year labels ---
const leftLabel = document.createElement('div');
leftLabel.className = 'swipe-label left';
leftLabel.textContent = '2019';
document.body.appendChild(leftLabel);

const rightLabel = document.createElement('div');
rightLabel.className = 'swipe-label right';
rightLabel.textContent = '2023';
document.body.appendChild(rightLabel);

initChart();
// === SIMPLE YEAR BUTTON LOGIC ===
const btn2019 = document.getElementById('btn-2019');
const btn2023 = document.getElementById('btn-2023');
const btnBoth  = document.getElementById('btn-both');

btn2019.addEventListener('click', () => {
  btn2019.classList.add('active');
  btn2023.classList.remove('active');
  btnBoth.classList.remove('active');

  if (basisChart && caseChart) {
    basisChart.data.datasets[0].data = [870, 79, 161];   // 2019 NPR / Behavior / No-Fault
    caseChart.data.datasets[0].data  = [191, 351, 573, 3]; // 2019 Active / Dismissed / Judgment / Stayed
    basisChart.update();
    caseChart.update();
  }

  document.getElementById('panel-year').textContent = 2019;
  document.getElementById('panel-city').textContent = 'All Cities (2019 Totals)';
  document.getElementById('panel-zip').textContent  = '—';
});

btn2023.addEventListener('click', () => {
  btn2023.classList.add('active');
  btn2019.classList.remove('active');
  btnBoth.classList.remove('active');

  if (basisChart && caseChart) {
    basisChart.data.datasets[0].data = [1288, 107, 112]; // 2023 NPR / Behavior / No-Fault
    caseChart.data.datasets[0].data  = [183, 331, 173, 3]; // 2023 Active / Dismissed / Judgment / Stayed
    basisChart.update();
    caseChart.update();
  }

  document.getElementById('panel-year').textContent = 2023;
  document.getElementById('panel-city').textContent = 'All Cities (2023 Totals)';
  document.getElementById('panel-zip').textContent  = '—';
});

btnBoth.addEventListener('click', () => {
  btnBoth.classList.add('active');
  btn2019.classList.remove('active');
  btn2023.classList.remove('active');

  // --- Combine 2019 + 2023 totals ---
  if (basisChart && caseChart) {
    basisChart.data.datasets[0].data = [
      870 + 1288,   // NPR
      79  + 107,    // Behavior
      161 + 112     // No Fault
    ];
    caseChart.data.datasets[0].data = [
      191 + 183,    // Active
      351 + 331,    // Dismissed
      573 + 173,    // Judgment
      3   + 3       // Stayed
    ];
    basisChart.update();
    caseChart.update();
  }

  document.getElementById('panel-year').textContent = '2019 + 2023';
  document.getElementById('panel-city').textContent = 'All Cities (Combined Totals)';
  document.getElementById('panel-zip').textContent  = '—';
});

