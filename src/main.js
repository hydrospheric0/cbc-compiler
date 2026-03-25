import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Papa from 'papaparse';
import Plotly from 'plotly.js-dist-min';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

import './style.css';

import { AUDUBON_ALIAS_BY_KEY, AUDUBON_PREFERRED_NAME_BY_CANON } from './taxonomy_aliases.mjs';

const app = document.querySelector('#app');
const assetUrl = (relativePath) => `${import.meta.env.BASE_URL}${String(relativePath).replace(/^\/+/, '')}`;

const faviconHref = assetUrl('favicon.svg');
let faviconLink = document.querySelector('link[rel="icon"]');
if (!faviconLink) {
  faviconLink = document.createElement('link');
  faviconLink.rel = 'icon';
  document.head.appendChild(faviconLink);
}
faviconLink.type = 'image/svg+xml';
faviconLink.href = faviconHref;

app.innerHTML = `
  <div class="app">
    <header class="topbar">
      <div class="topbarTitle">CBC Compilation Workbench</div>
      <button id="infoBtn" class="infoButton" type="button" aria-label="Info">i</button>
    </header>

    <div class="content-row">
      <div class="layout">
        <aside class="sidebar">

          <div class="sidebar-slot nav-slot">
            <div class="count-header card nav-header">
              <div class="count-header-bar">
                <div class="count-header-text">Navigation</div>
              </div>
            </div>
            <div class="sidebar-card nav-card card">
              <div class="cardBody">

          <div class="count-search-block dropzone" aria-label="Count circle picker">
            <div class="dropzone-title">Step 1: Select count circle</div>
            <div class="dropzone-sub">Type a historic CBC circle name or code to search</div>
            <div class="count-search">
              <input
                id="countCircleSearch"
                class="count-search-input"
                type="text"
                placeholder="Type count name or code (e.g. Putah, CAPC)"
                autocomplete="off"
                spellcheck="false"
                aria-label="Search count circles"
              />
              <div id="countCircleSelected" class="count-search-selected hidden"></div>
              <div id="countCircleSearchResults" class="count-search-results" aria-label="Count circle results"></div>
            </div>
          </div>

          <div id="areasDropzone" class="dropzone dropzone-areas" tabindex="0" role="button" aria-label="Drop count circle areas here">
            <div class="dropzone-title">Or add a custom count circle</div>
            <div class="dropzone-sub">Drop a GeoJSON file here, or click to choose</div>
            <input id="areasFileInput" class="file-input" type="file" accept=".geojson,application/geo+json" />
          </div>

          <div id="dropzone" class="dropzone" tabindex="0" role="button" aria-label="Drop CSV here">
            <div class="dropzone-title">Step 3: Drop eBird CSV</div>
            <div class="dropzone-sub">Drop a CSV here, or click to choose a file</div>
            <input id="fileInput" class="file-input" type="file" accept=".csv,text/csv" />
          </div>

          <div class="controls">
            <label class="control control-date">
              <div class="control-label">Date</div>
              <input id="dateFilter" class="control-input" type="date" value="2025-12-21" />
            </label>

            <label class="control control-cbc">
              <div class="control-label">CBC</div>
              <select id="cbcPreset" class="control-input" aria-label="CBC preset">
                <option value="">(choose)</option>
                <option value="2025-12-21">2025 / CBC 126 / CAPC 55</option>
                <option value="2024-12-15">2024 / CBC 125 / CAPC 54</option>
                <option value="2023-12-17">2023 / CBC 124 / CAPC 53</option>
              </select>
            </label>

            <button id="applyFilter" class="control-button" type="button">Apply</button>
            <button id="matchAreas" class="control-button" type="button">Reset</button>
          </div>

          <div class="compilation" aria-label="Compilation">
            <div class="compilation-title">Compilation</div>
            <div class="compilation-actions">
              <button id="editTrip" class="control-button" type="button">Edit</button>
              <button id="saveEdits" class="control-button" type="button">Save edits</button>
            </div>
            <div id="editsSummary" class="compilation-summary"></div>
          </div>

              </div>
            </div>
          </div>

          <div class="sidebar-slot summary-slot">
            <div class="count-header card selection-header">
              <div class="count-header-bar">
                <div class="count-header-text">Summary</div>
              </div>
            </div>
            <div class="sidebar-card summary-card card">
              <div class="cardBody">

          <div class="summary" aria-label="Summary">
            <div id="countCircleLabel" class="summary-circle"></div>

            <div class="summary-rows">
              <div class="summary-row">
                <div class="summary-k">eBird Trip report:</div>
                <div class="summary-v">
                  <a
                    id="tripReportLink"
                    class="summary-link"
                    href="https://ebird.org/tripreport/449085"
                    target="_blank"
                    rel="noopener noreferrer"
                    >https://ebird.org/tripreport/449085</a
                  >
                </div>
              </div>
              <div class="summary-row">
                <div class="summary-k">Date:</div>
                <div id="summaryDate" class="summary-v">—</div>
              </div>
              <div class="summary-row">
                <div class="summary-k">Records:</div>
                <div id="summaryRecords" class="summary-v">—</div>
              </div>
              <div class="summary-row">
                <div class="summary-k">Total lists:</div>
                <div id="summaryLists" class="summary-v">—</div>
              </div>
              <div class="summary-row">
                <div class="summary-k">Lists w/o distance:</div>
                <div id="summaryListsNoDistance" class="summary-v">—</div>
              </div>
              <div class="summary-row">
                <div class="summary-k">Lists w/o time:</div>
                <div id="summaryListsNoTime" class="summary-v">—</div>
              </div>
              <div class="summary-row">
                <div class="summary-k">Total miles:</div>
                <div id="summaryMiles" class="summary-v">—</div>
              </div>
              <div class="summary-row">
                <div class="summary-k">Total time:</div>
                <div id="summaryTime" class="summary-v">—</div>
              </div>
              <div class="summary-row">
                <div class="summary-k">Locations:</div>
                <div id="summaryLocations" class="summary-v">—</div>
              </div>
            </div>

            <div id="summaryWarnings" class="summary-warnings"></div>
        </div>

          <div class="status" id="status" aria-label="Status"></div>

          <div class="resources" aria-label="Resources">
            <div class="section-title">Resources</div>
            <div class="summary-rows">
              <div class="summary-row">
                <div class="summary-k">Audubon CBC compilation entry:</div>
                <div class="summary-v">
                  <a class="summary-link" href="https://netapp.audubon.org/CBC/" target="_blank" rel="noopener noreferrer">https://netapp.audubon.org/CBC/</a>
                </div>
              </div>
            </div>
          </div>

              </div>
            </div>
          </div>

        </aside>

        <main class="map-pane">
          <section class="map-section card-panel">
            <div id="map" class="map"></div>
          </section>

          <section class="plot-section card-panel">
            <div class="plot">
              <div class="tabs-row">
                <div class="tabs" role="tablist" aria-label="Plot panel">
                  <button id="tabTable" class="tab-button active" type="button" role="tab" aria-selected="true">Table</button>
                  <button id="tabPlot" class="tab-button" type="button" role="tab" aria-selected="false">Plot</button>
                </div>

                <div class="tabs-tools" aria-label="Table tools">
                  <input id="speciesFilter" class="tab-input" type="text" inputmode="search" autocomplete="off" spellcheck="false" placeholder="Species…" aria-label="Species filter" />
                  <span class="tabs-label">taxa</span>
                  <select id="taxonDisplayMode" class="tab-select" aria-label="Taxon display mode">
                    <option value="split" selected>Split taxa</option>
                    <option value="collapse">Collapse to species</option>
                  </select>
                  <span class="tabs-label">taxonomy</span>
                  <select id="sortMode" class="tab-select" aria-label="Sort mode">
                    <option value="ebird" selected>eBird</option>
                    <option value="audubon">Audubon</option>
                    <option value="alpha">Alphabetic</option>
                  </select>
                  <button id="exportCsv" class="tab-button" type="button">Export CSV</button>
                </div>
              </div>

              <div id="panelTable" class="tab-panel active" role="tabpanel">
                <div class="trip-header">
                  <div class="trip-metrics">
                    <div id="tripAreaLabel" class="trip-title trip-area" hidden></div>
                    <div class="trip-title trip-metric trip-metric-species">Species <span id="speciesObservedCount" class="trip-count">0</span></div>
                    <div class="trip-title trip-metric trip-metric-other">Other taxa <span id="otherTaxaCount" class="trip-count">0</span></div>
                    <div class="trip-title trip-metric trip-metric-hybrids">Hybrids <span id="hybridsCount" class="trip-count">0</span></div>
                    <div class="trip-title trip-metric trip-metric-checklists">Checklists <span id="checklistsCount" class="trip-count">0</span></div>
                  </div>
                  <div class="trip-toggles">
                    <label class="trip-toggle">
                      <input id="owlsOnly" type="checkbox" />
                      <span>Owls</span>
                    </label>
                    <label class="trip-toggle">
                      <input id="showUnusual" type="checkbox" />
                      <span>Unusual</span>
                    </label>
                    <label class="trip-toggle">
                      <input id="showAllDetails" type="checkbox" />
                      <span>All details</span>
                    </label>
                  </div>
                </div>

                <div id="tripReport"></div>
              </div>

              <div id="panelPlot" class="tab-panel" role="tabpanel" hidden>
                <div id="speciesPlot" class="species-plot" aria-label="Species plot"></div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
    <footer class="footerbar">
      <span class="footerCopyright">&copy; MetoliusResearch / Bart Wickel, 2026</span>
    </footer>

    <div id="infoModal" class="modalOverlay hidden" role="dialog" aria-modal="true" aria-labelledby="infoModalTitle">
      <div class="modalCard" role="document">
        <div class="modalHeader">
          <div id="infoModalTitle">Information</div>
          <button id="infoModalClose" class="modalClose" type="button" aria-label="Close">×</button>
        </div>
        <div class="modalBody">
          <p>
            This compiler workbench is for reviewing eBird CSV exports against a CBC count circle, checking map placement, and preparing compilation output.
          </p>
          <p style="margin-top: 10px; font-weight: 700;">Current workflow</p>
          <ul>
            <li>Select a historic CBC circle or load a custom GeoJSON count circle.</li>
            <li>Upload an eBird CSV export.</li>
            <li>Review mapped locations, species totals, and compilation edits.</li>
          </ul>
          <p style="margin-top: 12px; font-weight: 800;">Notes</p>
          <ul>
            <li>Historic count circles come from the Audubon CBC source used by the historic app.</li>
            <li>For now, CAPC uses the local custom GeoJSON and local long-term dataset.</li>
            <li>Custom count-circle uploads currently accept GeoJSON only.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
`;

const map = L.map('map', {
  zoomControl: true,
  zoomSnap: 0.25,
  zoomDelta: 0.25,
});
map.setView([38.5, -121.9], 8);

map.createPane('areasPane');
map.getPane('areasPane').style.zIndex = '350';
map.createPane('pointsPane');
map.getPane('pointsPane').style.zIndex = '450';

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 22,
  maxNativeZoom: 19,
  attribution: '&copy; OpenStreetMap contributors',
});

const esriSatellite = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    maxZoom: 22,
    maxNativeZoom: 19,
    attribution: 'Tiles &copy; Esri',
  }
);

const esriTopo = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  {
    maxZoom: 22,
    maxNativeZoom: 19,
    attribution: 'Tiles &copy; Esri',
  }
);

const tileErr = {
  lastAt: 0,
  burst: 0,
  activeName: 'Esri Topo',
};

const noteActiveBaseLayer = (name) => {
  tileErr.activeName = name;
  tileErr.burst = 0;
  tileErr.lastAt = 0;
};

const switchToOsmIfActive = () => {
  if (tileErr.activeName === 'OpenStreetMap') return;
  try {
    if (map.hasLayer(esriTopo)) map.removeLayer(esriTopo);
  } catch {
  }
  try {
    if (map.hasLayer(esriSatellite)) map.removeLayer(esriSatellite);
  } catch {
  }
  try {
    osm.addTo(map);
    noteActiveBaseLayer('OpenStreetMap');
  } catch {
  }
};

const attachTileErrorFallback = (layer, layerName) => {
  if (!layer || !layer.on) return;
  layer.on('tileerror', () => {
    if (tileErr.activeName !== layerName) return;
    const now = Date.now();
    if (tileErr.lastAt && now - tileErr.lastAt < 8000) tileErr.burst += 1;
    else tileErr.burst = 1;
    tileErr.lastAt = now;
    if (tileErr.burst >= 4) switchToOsmIfActive();
  });
};

attachTileErrorFallback(esriTopo, 'Esri Topo');
attachTileErrorFallback(esriSatellite, 'Esri Satellite');

esriTopo.addTo(map);
noteActiveBaseLayer('Esri Topo');

L.control
  .layers(
    {
      'Esri Topo': esriTopo,
      'Esri Satellite': esriSatellite,
      OpenStreetMap: osm,
    },
    {},
    { position: 'topright', collapsed: false }
  )
  .addTo(map);

map.on('baselayerchange', (e) => {
  const name = e?.name || '';
  if (name === 'Esri Topo' || name === 'Esri Satellite' || name === 'OpenStreetMap') noteActiveBaseLayer(name);
});

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function canonicalizeSpeciesName(name) {

  const raw = (name ?? '').toString().trim();
  if (!raw) return '';
  return raw.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeExactSpeciesKey(name) {
  return (name ?? '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeSpeciesKey(name) {
  return canonicalizeSpeciesName(name).toLowerCase();
}

function isChecklistStyleCsv(headerMap) {
  return Boolean(headerMap?.has('submission id') && headerMap?.has('common name'));
}

function shouldPreserveChecklistTaxa(headerMap) {
  return isChecklistStyleCsv(headerMap) && taxonDisplayMode === 'split';
}

const countCircleMeta = {
  id: '',
  code: '',
  name: '',
  circleId: null,
  geojsonPath: '',
  longtermCsvPath: '',
  tripReportUrl: '',
  defaultDate: '',
  cbcPresets: [],
};

const CBC_126_CIRCLES_QUERY_URL =
  'https://services1.arcgis.com/lDFzr3JyGEn5Eymu/arcgis/rest/services/CBC_126/FeatureServer/0/query';

let countCircleCatalog = [];

let areasLayer = null;
let areasIndex = null;
let currentAreasSourceLabel = '';
let activeAreaFilter = null;
let activeLocationFilter = null;
let activeLocationFilterLabel = null;
let pendingOpenPopupLocationKey = null;
let selectedLocationKeys = new Set();
let selectedSpeciesKeysForMap = new Set();
let needsAreaAssignment = false;

function getAreaKeyFromFeature(feature) {
  const props = feature?.properties && typeof feature.properties === 'object' ? feature.properties : {};
  const candidates = [
    props.layer,
    props.subdivision,
    props.subunit,
    props.area,
    props.name,
    props.NAME,
    props.label,
    props.Label,
    props.id,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  const fid = props.fid;
  if (typeof fid === 'number' && Number.isFinite(fid)) return `fid:${fid}`;
  return '';
}

function formatAreaShort(areaKey) {
  const t = (areaKey ?? '').toString().trim();
  if (!t) return '';
  const m = t.match(/\b(\d{1,3})\b/);
  return m ? m[1] : t;
}

function getRowLatLon(row, headerMap) {
  const latRaw = getField(row, headerMap, 'Latitude');
  const lonRaw = getField(row, headerMap, 'Longitude');
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

function approxDistanceScore(lat1, lon1, lat2, lon2) {

  const k = Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  const dx = (lon2 - lon1) * k;
  const dy = lat2 - lat1;
  return dx * dx + dy * dy;
}

function updateAreasStyle() {
  if (!areasLayer) return;
  areasLayer.setStyle((feature) => {
    const base = {
      weight: 2,
    };
    const key = getAreaKeyFromFeature(feature);
    const isActive = Boolean(activeAreaFilter) && key === activeAreaFilter;
    return {
      ...base,
      color: isActive ? '#ff8800' : '#3388ff',
      fill: true,

      fillOpacity: isActive ? 0.22 : 0.12,
    };
  });
}

async function applyAreasGeojson(geojson, { sourceLabel = '' } = {}) {
  if (areasLayer) {
    try {
      map.removeLayer(areasLayer);
    } catch {

    }
    areasLayer = null;
  }

  currentAreasSourceLabel = (sourceLabel || '').toString().trim();

  if (geojson && typeof geojson === 'object') {
    const code = typeof geojson.code === 'string' ? geojson.code.trim() : '';
    const name = typeof geojson.name === 'string' ? geojson.name.trim() : '';
    if (code) countCircleMeta.code = code;
    if (name) countCircleMeta.name = name;
  }

  updateCountCircleLabel();

  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  areasIndex = features
    .filter((f) => f && f.type === 'Feature' && f.geometry)
    .map((feature) => {
      const key = getAreaKeyFromFeature(feature);
      const center = L.geoJSON(feature).getBounds().getCenter();
      return {
        key,
        feature,
        centerLat: center.lat,
        centerLon: center.lng,
      };
    });

  areasLayer = L.geoJSON(geojson, {
    pane: 'areasPane',
    style: () => ({
      weight: 2,
      fill: true,
      fillOpacity: 0.12,
    }),
    onEachFeature: (feature, layer) => {
      const key = getAreaKeyFromFeature(feature);
      if (key) {
        layer.bindTooltip(key, {
          sticky: true,
          direction: 'top',
          opacity: 0.9,
        });
      }

      layer.on('click', () => {
        if (!key) return;

        activeLocationFilter = null;
        activeLocationFilterLabel = null;

        activeAreaFilter = activeAreaFilter === key ? null : key;
        plotLocationsFromCurrentCsv({ zoomToResults: false });
        updateAreasStyle();
      });
    },
  }).addTo(map);

  updateAreasStyle();

  if (currentCsv && needsAreaAssignment) {
    try {
      assignAreasToRows(currentCsv.rows, currentCsv.headerMap);
    } finally {
      needsAreaAssignment = false;
    }
    plotLocationsFromCurrentCsv();
    renderTripReportFromCurrentCsv();
  }

  try {
    pointsLayer.bringToFront();
  } catch {

  }

  const bumpZoom = () => {

    try {
      map.setZoom(map.getZoom() - 0.25);
    } catch {

    }
  };

  const bounds = areasLayer.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [20, 20] });
    setTimeout(bumpZoom, 0);
  } else {
    map.setView([38.5, -122.0], 10);
    setTimeout(bumpZoom, 0);
  }
}

async function loadGeojson() {
  let geojson = null;

  if (countCircleMeta.geojsonPath) {
    const res = await fetch(assetUrl(countCircleMeta.geojsonPath));
    if (!res.ok) {
      throw new Error(`Failed to load GeoJSON: ${res.status} ${res.statusText}`);
    }
    geojson = await res.json();
  } else if (Number.isFinite(countCircleMeta.circleId)) {
    geojson = await loadHistoricCircleGeojson(countCircleMeta.circleId, countCircleMeta.code, countCircleMeta.name);
  } else {
    throw new Error(`No geometry configured for ${countCircleMeta.code || countCircleMeta.name || 'this count circle'}.`);
  }

  await applyAreasGeojson(geojson, { sourceLabel: countCircleMeta.code || countCircleMeta.name || '' });
}

setTimeout(() => map.invalidateSize(), 0);

const statusEl = document.getElementById('status');
const countCircleSearchEl = document.getElementById('countCircleSearch');
const countCircleSearchResultsEl = document.getElementById('countCircleSearchResults');
const countCircleSelectedEl = document.getElementById('countCircleSelected');
const infoBtnEl = document.getElementById('infoBtn');
const infoModalEl = document.getElementById('infoModal');
const infoModalCloseEl = document.getElementById('infoModalClose');
const areasDropzoneEl = document.getElementById('areasDropzone');
const areasFileInputEl = document.getElementById('areasFileInput');
const dropzoneEl = document.getElementById('dropzone');
const fileInputEl = document.getElementById('fileInput');
const dateFilterEl = document.getElementById('dateFilter');
const cbcPresetEl = document.getElementById('cbcPreset');
const applyFilterEl = document.getElementById('applyFilter');

const countCircleLabelEl = document.getElementById('countCircleLabel');
const tripReportLinkEl = document.getElementById('tripReportLink');
const summaryDateEl = document.getElementById('summaryDate');
const summaryRecordsEl = document.getElementById('summaryRecords');
const summaryListsEl = document.getElementById('summaryLists');
const summaryListsNoDistanceEl = document.getElementById('summaryListsNoDistance');
const summaryListsNoTimeEl = document.getElementById('summaryListsNoTime');
const summaryMilesEl = document.getElementById('summaryMiles');
const summaryTimeEl = document.getElementById('summaryTime');
const summaryLocationsEl = document.getElementById('summaryLocations');
const summaryWarningsEl = document.getElementById('summaryWarnings');

const tabTableEl = document.getElementById('tabTable');
const tabPlotEl = document.getElementById('tabPlot');
const panelTableEl = document.getElementById('panelTable');
const panelPlotEl = document.getElementById('panelPlot');
const speciesPlotEl = document.getElementById('speciesPlot');

const taxonDisplayModeEl = document.getElementById('taxonDisplayMode');
const sortModeEl = document.getElementById('sortMode');
const speciesFilterEl = document.getElementById('speciesFilter');
const exportCsvEl = document.getElementById('exportCsv');
const matchAreasEl = document.getElementById('matchAreas');
const editTripEl = document.getElementById('editTrip');
const saveEditsEl = document.getElementById('saveEdits');
const editsSummaryEl = document.getElementById('editsSummary');

const tripReportEl = document.getElementById('tripReport');
const speciesObservedCountEl = document.getElementById('speciesObservedCount');
const otherTaxaCountEl = document.getElementById('otherTaxaCount');
const hybridsCountEl = document.getElementById('hybridsCount');
const checklistsCountEl = document.getElementById('checklistsCount');
const showAllDetailsEl = document.getElementById('showAllDetails');
const showUnusualEl = document.getElementById('showUnusual');
const owlsOnlyEl = document.getElementById('owlsOnly');
const tripAreaLabelEl = document.getElementById('tripAreaLabel');

if (editsSummaryEl) editsSummaryEl.textContent = 'No edits yet.';

const pointsLayer = L.featureGroup().addTo(map);

function focusMapOnCountCircle() {
  const bounds = areasLayer?.getBounds?.();
  if (bounds && bounds.isValid && bounds.isValid()) {
    try {
      map.fitBounds(bounds, { padding: [20, 20] });
    } catch {

    }
  }
}

function detectCbcDateFromRows(rows, headerMap) {
  const counts = new Map();
  for (const row of rows) {
    const raw = (getField(row, headerMap, 'Date') || '').toString().trim();

    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) continue;
    const month = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);
    const inWindow = (month === 12 && day >= 14) || (month === 1 && day <= 15);
    if (!inWindow) continue;
    counts.set(raw, (counts.get(raw) || 0) + 1);
  }
  if (!counts.size) return null;

  const significant = [...counts.entries()].filter(([, n]) => n >= 5);
  if (!significant.length) return null;
  const [dateStr] = significant.sort((a, b) => b[1] - a[1])[0];
  const [, yearStr, monthStr] = dateStr.match(/^(\d{4})-(\d{2})-/) || [];
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const cbcNumber = month === 12 ? year - 1899 : year - 1900;
  return { dateStr, cbcNumber };
}

function updateTaxonomyMissingWarningsFromTripData(data) {
  if (!summaryWarningsEl) return;
  summaryWarningsEl.textContent = '';
  if (!data || !currentCsv) return;
  if (getActiveSortMode() !== 'ebird') return;
  if (currentCsv.headerMap.has('taxonomic order')) return;

  const csvRef = currentCsv;
  loadTaxonomyOrder()
    .then((m) => {
      if (!m) return;
      if (currentCsv !== csvRef) return;

      const missing = [];
      for (const s of data.speciesList || []) {
        const name = (s?.species ?? '').toString();
        if (!name) continue;
        const order = m[name];
        if (typeof order !== 'number') missing.push(name);
      }

      if (!missing.length) return;
      const shown = missing.slice(0, 25);
      summaryWarningsEl.textContent = `Taxonomy missing (${missing.length}): ${shown.join('; ')}${
        missing.length > shown.length ? ' …' : ''
      }`;
    })
    .catch(() => {

    });
}

function updateCountCircleLabel() {
  const code = (countCircleMeta.code || '').trim();
  const name = (countCircleMeta.name || '').trim();
  if (!countCircleLabelEl) return;
  countCircleLabelEl.textContent = code || name ? `Count circle: ${code}${name ? ` - ${name}` : ''}` : 'Count circle: not selected';
}

function updateTripReportLink() {
  if (!tripReportLinkEl) return;
  const href = (countCircleMeta.tripReportUrl || '').toString().trim();
  if (!href) {
    tripReportLinkEl.removeAttribute('href');
    tripReportLinkEl.textContent = '—';
    return;
  }
  tripReportLinkEl.href = href;
  tripReportLinkEl.textContent = href;
}

function updateCbcPresetOptions() {
  if (!cbcPresetEl) return;
  const presets = Array.isArray(countCircleMeta.cbcPresets) ? countCircleMeta.cbcPresets : [];
  const priorValue = (cbcPresetEl.value || '').toString().trim();
  cbcPresetEl.innerHTML = '';

  const emptyOpt = document.createElement('option');
  emptyOpt.value = '';
  emptyOpt.textContent = '(choose)';
  cbcPresetEl.appendChild(emptyOpt);

  for (const preset of presets) {
    const value = (preset?.value || '').toString().trim();
    if (!value) continue;
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = (preset?.label || value).toString();
    cbcPresetEl.appendChild(opt);
  }

  if (priorValue && presets.some((preset) => (preset?.value || '').toString().trim() === priorValue)) {
    cbcPresetEl.value = priorValue;
  }
}

function applyLatestCbcPreset({ syncDate = false } = {}) {
  if (!cbcPresetEl) return false;
  const presetOptions = [...cbcPresetEl.options].filter((option) => (option.value || '').toString().trim());
  const latest = presetOptions[0];
  if (!latest) return false;
  cbcPresetEl.value = latest.value;
  if (syncDate && dateFilterEl) dateFilterEl.value = latest.value;
  return true;
}

function applyCountCircleConfig(config) {
  if (!config || typeof config !== 'object') return;
  countCircleMeta.id = (config.id || '').toString().trim();
  countCircleMeta.code = (config.code || '').toString().trim();
  countCircleMeta.name = (config.name || '').toString().trim();
  countCircleMeta.circleId = Number.isFinite(Number(config.circleId)) ? Number(config.circleId) : null;
  countCircleMeta.geojsonPath = (config.geojson || '').toString().trim();
  countCircleMeta.longtermCsvPath = (config.longtermCsv || '').toString().trim();
  countCircleMeta.tripReportUrl = (config.tripReportUrl || '').toString().trim();
  countCircleMeta.defaultDate = (config.defaultDate || '').toString().trim();
  countCircleMeta.cbcPresets = Array.isArray(config.cbcPresets) ? config.cbcPresets : [];

  updateCountCircleLabel();
  updateTripReportLink();
  updateCbcPresetOptions();

  if (dateFilterEl && countCircleMeta.defaultDate) {
    dateFilterEl.value = countCircleMeta.defaultDate;
  }
}

async function loadCountCircleCatalog() {
  const res = await fetch(assetUrl('count_circles.json'));
  if (!res.ok) {
    throw new Error(`Failed to load count circles: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const localOverrides = Array.isArray(data) ? data : [];
  const catalog = await buildHistoricCountCircleCatalog(localOverrides);
  if (!catalog.length) throw new Error('No count circles configured.');
  countCircleCatalog = catalog;
  return catalog;
}

function normalizeHistoricCircleRow(row) {
  const code = (row?.Abbrev || '').toString().trim();
  const name = (row?.Name || '').toString().trim();
  const circleId = Number(row?.Circle_id);
  if (!code || !name || !Number.isFinite(circleId)) return null;
  return { code, name, circleId };
}

async function loadHistoricCountCircleIndex() {
  const all = [];
  const pageSize = 2000;
  let offset = 0;

  for (let page = 0; page < 5; page++) {
    const url = new URL(CBC_126_CIRCLES_QUERY_URL);
    url.searchParams.set('f', 'json');
    url.searchParams.set('where', '1=1');
    url.searchParams.set('outFields', 'Abbrev,Name,Circle_id');
    url.searchParams.set('returnGeometry', 'false');
    url.searchParams.set('resultOffset', String(offset));
    url.searchParams.set('resultRecordCount', String(pageSize));

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Failed to load historic count circles: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    if (!features.length) break;

    for (const feature of features) {
      const normalized = normalizeHistoricCircleRow(feature?.attributes || {});
      if (normalized) all.push(normalized);
    }

    offset += features.length;
    if (features.length < pageSize) break;
  }

  all.sort((left, right) => left.name.localeCompare(right.name));
  return all;
}

async function buildHistoricCountCircleCatalog(localOverrides) {
  const overrideByCode = new Map();
  for (const item of localOverrides) {
    const code = (item?.code || '').toString().trim().toUpperCase();
    if (code) overrideByCode.set(code, item);
  }

  let historicRows = [];
  try {
    historicRows = await loadHistoricCountCircleIndex();
  } catch (err) {
    console.warn('Falling back to local count circle overrides only.', err);
  }

  const merged = historicRows.map((row) => {
    const override = overrideByCode.get(row.code.toUpperCase()) || {};
    return {
      id: ((override?.id || row.code || '').toString().trim() || row.code).toLowerCase(),
      code: row.code,
      name: override?.name || row.name,
      circleId: row.circleId,
      geojson: (override?.geojson || '').toString().trim(),
      longtermCsv: (override?.longtermCsv || '').toString().trim(),
      tripReportUrl: (override?.tripReportUrl || '').toString().trim(),
      defaultDate: (override?.defaultDate || '').toString().trim(),
      cbcPresets: Array.isArray(override?.cbcPresets) ? override.cbcPresets : [],
      subdivision: (override?.subdivision || '').toString().trim(),
    };
  });

  for (const override of localOverrides) {
    const code = (override?.code || '').toString().trim().toUpperCase();
    if (code && merged.some((item) => item.code.toUpperCase() === code)) continue;
    merged.push({
      id: (override?.id || code || '').toString().trim().toLowerCase(),
      code: (override?.code || '').toString().trim(),
      name: (override?.name || '').toString().trim(),
      circleId: Number.isFinite(Number(override?.circleId)) ? Number(override.circleId) : null,
      geojson: (override?.geojson || '').toString().trim(),
      longtermCsv: (override?.longtermCsv || '').toString().trim(),
      tripReportUrl: (override?.tripReportUrl || '').toString().trim(),
      defaultDate: (override?.defaultDate || '').toString().trim(),
      cbcPresets: Array.isArray(override?.cbcPresets) ? override.cbcPresets : [],
      subdivision: (override?.subdivision || '').toString().trim(),
    });
  }

  merged.sort((left, right) => {
    const byName = (left.name || '').localeCompare(right.name || '');
    return byName || (left.code || '').localeCompare(right.code || '');
  });

  return merged;
}

function closeRingIfNeeded(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return null;
  const points = ring
    .filter((point) => Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]))
    .map((point) => [point[0], point[1]]);
  if (points.length < 3) return null;
  const [firstX, firstY] = points[0];
  const [lastX, lastY] = points[points.length - 1];
  if (firstX !== lastX || firstY !== lastY) points.push([firstX, firstY]);
  return points;
}

function arcgisGeometryToGeojsonGeometry(geometry) {
  if (Array.isArray(geometry?.rings) && geometry.rings.length) {
    const rings = geometry.rings.map(closeRingIfNeeded).filter(Boolean);
    if (!rings.length) return null;
    return { type: 'Polygon', coordinates: rings };
  }

  if (Number.isFinite(geometry?.x) && Number.isFinite(geometry?.y)) {
    return { type: 'Point', coordinates: [geometry.x, geometry.y] };
  }

  return null;
}

async function loadHistoricCircleGeojson(circleId, code, name) {
  const url = new URL(CBC_126_CIRCLES_QUERY_URL);
  url.searchParams.set('f', 'json');
  url.searchParams.set('where', `Circle_id = ${Number(circleId)}`);
  url.searchParams.set('outFields', 'Abbrev,Name,Circle_id');
  url.searchParams.set('returnGeometry', 'true');
  url.searchParams.set('outSR', '4326');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to load circle geometry: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const features = Array.isArray(data?.features) ? data.features : [];
  const geojsonFeatures = features
    .map((feature) => {
      const geometry = arcgisGeometryToGeojsonGeometry(feature?.geometry || null);
      if (!geometry) return null;
      const attrs = feature?.attributes || {};
      return {
        type: 'Feature',
        properties: {
          code: (attrs?.Abbrev || code || '').toString().trim(),
          name: (attrs?.Name || name || '').toString().trim(),
          area: (attrs?.Name || name || code || '').toString().trim(),
          circle_id: Number.isFinite(Number(attrs?.Circle_id)) ? Number(attrs.Circle_id) : Number(circleId),
        },
        geometry,
      };
    })
    .filter(Boolean);

  if (!geojsonFeatures.length) {
    throw new Error(`No geometry returned for ${code || name || `circle ${circleId}`}.`);
  }

  return {
    type: 'FeatureCollection',
    code: (code || '').toString().trim(),
    name: (name || '').toString().trim(),
    features: geojsonFeatures,
  };
}

function getCountCircleDisplayLabel(circle) {
  const code = (circle?.code || '').toString().trim();
  const name = (circle?.name || '').toString().trim();
  const subdivision = (circle?.subdivision || '').toString().trim();
  const baseLabel = code && name ? `${code} - ${name}` : code || name || (circle?.id || '').toString().trim();
  return subdivision ? `${baseLabel} (${subdivision})` : baseLabel;
}

function getFilteredCountCircles(rawQuery) {
  const query = (rawQuery || '').toString().trim().toLowerCase();
  if (!query) return countCircleCatalog.slice();
  return countCircleCatalog.filter((circle) => {
    const hay = [circle?.id, circle?.code, circle?.name, circle?.subdivision]
      .map((value) => (value || '').toString().toLowerCase())
      .join(' ');
    return hay.includes(query);
  });
}

function renderCountCircleSelected() {
  if (!countCircleSelectedEl) return;
  if (!countCircleMeta.id && !countCircleMeta.code && !countCircleMeta.name) {
    countCircleSelectedEl.replaceChildren();
    countCircleSelectedEl.classList.add('hidden');
    return;
  }

  const current = countCircleCatalog.find((circle) => (circle?.id || '').toString().trim() === countCircleMeta.id);
  const fallbackCircle = current || {
    code: countCircleMeta.code,
    name: countCircleMeta.name,
  };

  countCircleSelectedEl.classList.remove('hidden');
  countCircleSelectedEl.replaceChildren();

  const line = document.createElement('div');
  line.className = 'count-selected-line';
  line.textContent = getCountCircleDisplayLabel(fallbackCircle);
  countCircleSelectedEl.appendChild(line);
}

function renderCountCircleSearchResults(rawQuery) {
  if (!countCircleSearchResultsEl) return;
  const query = (rawQuery || '').toString().trim();
  if (!query) {
    countCircleSearchResultsEl.replaceChildren();
    return;
  }
  const results = getFilteredCountCircles(query);
  if (!results.length) {
    countCircleSearchResultsEl.replaceChildren(
      Object.assign(document.createElement('div'), { className: 'count-search-empty', textContent: 'No matches.' })
    );
    return;
  }

  countCircleSearchResultsEl.replaceChildren();
  for (const circle of results.slice(0, 8)) {
    const btn = document.createElement('button');
    btn.className = 'count-search-item';
    btn.type = 'button';
    btn.dataset.action = 'pick-circle';
    btn.dataset.circleId = (circle?.id || '').toString().trim();
    btn.textContent = getCountCircleDisplayLabel(circle);
    countCircleSearchResultsEl.appendChild(btn);
  }
}

async function setActiveCountCircle(circleId, { preserveCsv = true } = {}) {
  const id = (circleId || '').toString().trim();
  const config = countCircleCatalog.find((circle) => (circle?.id || '').toString().trim() === id);
  if (!config) throw new Error(`Unknown count circle: ${id || '(empty)'}`);

  activeAreaFilter = null;
  activeLocationFilter = null;
  activeLocationFilterLabel = null;
  pendingOpenPopupLocationKey = null;
  selectedLocationKeys.clear();
  selectedSpeciesKeysForMap.clear();

  longtermCapcDb = null;
  longtermCapcPromise = null;

  applyCountCircleConfig(config);
  renderCountCircleSelected();
  if (countCircleSearchEl) countCircleSearchEl.value = '';
  if (countCircleSearchResultsEl) countCircleSearchResultsEl.replaceChildren();

  if (!preserveCsv) {
    currentCsv = null;
    clearSummary();
    clearTripReport('');
  } else if (currentCsv) {
    needsAreaAssignment = true;
  }

  await loadGeojson();
  focusMapOnCountCircle();
  if (!preserveCsv && currentCsv == null) renderSpeciesPlotFromCurrentCsv();
}

async function initWorkbench() {
  await loadCountCircleCatalog();
  renderCountCircleSelected();
  setStatus('Select a count circle or drop a count-circle areas file to begin.');
}

let countCircleSearchTimer = null;
function scheduleCountCircleSearch() {
  if (!countCircleSearchEl) return;
  if (countCircleSearchTimer) clearTimeout(countCircleSearchTimer);
  countCircleSearchTimer = setTimeout(() => {
    renderCountCircleSearchResults(countCircleSearchEl.value || '');
  }, 150);
}

function clearSummary() {
  if (summaryDateEl) summaryDateEl.textContent = '—';
  if (summaryRecordsEl) summaryRecordsEl.textContent = '—';
  if (summaryListsEl) summaryListsEl.textContent = '—';
  if (summaryListsNoDistanceEl) summaryListsNoDistanceEl.textContent = '—';
  if (summaryListsNoTimeEl) summaryListsNoTimeEl.textContent = '—';
  if (summaryMilesEl) summaryMilesEl.textContent = '—';
  if (summaryTimeEl) summaryTimeEl.textContent = '—';
  if (summaryLocationsEl) summaryLocationsEl.textContent = '—';
  if (summaryWarningsEl) summaryWarningsEl.textContent = '';
}

updateCountCircleLabel();
updateTripReportLink();
updateCbcPresetOptions();
clearSummary();

function getRowLocationKey(row, headerMap) {
  const locId = getField(row, headerMap, 'Location ID');
  if (locId) return `loc:${locId}`;
  const ll = getRowLatLon(row, headerMap);
  const locName = getField(row, headerMap, 'Location') || 'Location';
  if (!ll) return `name:${locName}`;
  return `pt:${locName}@@${ll.lat.toFixed(6)},${ll.lon.toFixed(6)}`;
}

function assignAreasToRows(rows, headerMap) {
  if (!rows || !rows.length) return 0;
  if (!areasIndex || areasIndex.length === 0) return 0;

  let matchedCount = 0;
  for (const row of rows) {
    const ll = getRowLatLon(row, headerMap);
    if (!ll) continue;

    const pt = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [ll.lon, ll.lat] },
    };

    let best = null;
    for (const area of areasIndex) {
      try {
        if (booleanPointInPolygon(pt, area.feature)) {
          best = area;
          break;
        }
      } catch {

      }
    }

    if (!best) {
      let bestScore = Number.POSITIVE_INFINITY;
      for (const area of areasIndex) {
        const s = approxDistanceScore(ll.lat, ll.lon, area.centerLat, area.centerLon);
        if (s < bestScore) {
          bestScore = s;
          best = area;
        }
      }
    }

    if (best && best.key) {
      row.__cbc_area = best.key;
      matchedCount += 1;
    }
  }

  return matchedCount;
}

function setStatus(text) {
  if (!statusEl) return;
  const raw = (text ?? '').toString();

  if (!raw.includes('\n') && !raw.startsWith('Area filter:') && !raw.startsWith('Hotspot filter:')) {
    statusEl.textContent = raw;
    return;
  }

  statusEl.textContent = '';
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.startsWith('Area filter:') || line.startsWith('Hotspot filter:')) {
      const idx = line.indexOf(':');
      const k = idx >= 0 ? line.slice(0, idx + 1) : line;
      const v = idx >= 0 ? line.slice(idx + 1).trim() : '';

      const row = document.createElement('div');
      row.className = 'status-row';
      const keyEl = document.createElement('div');
      keyEl.className = 'status-k';
      keyEl.textContent = k;
      const valEl = document.createElement('div');
      valEl.className = 'status-v';
      valEl.textContent = v;
      row.appendChild(keyEl);
      row.appendChild(valEl);
      statusEl.appendChild(row);
      continue;
    }

    const msg = document.createElement('div');
    msg.className = 'status-line';
    msg.textContent = line;
    statusEl.appendChild(msg);
  }
}

function normalizeHeaderMap(headers) {
  const map = new Map();
  for (const h of headers) {
    map.set(String(h).trim().toLowerCase(), h);
  }
  return map;
}

function getField(row, headerMap, key) {
  const actual = headerMap.get(key.toLowerCase());
  if (!actual) return '';
  return (row[actual] ?? '').toString().trim();
}

let currentCsv = null;

let taxonDisplayMode = 'split';
let sortMode = 'ebird';

let wordFilter = '';
let speciesNameFilter = '';
let showUnusualOnly = false;
let owlsOnly = false;

function normalizeFilterTokens(raw) {
  return (raw ?? '')
    .toString()
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function matchesSpeciesFilter(speciesName, rawFilter) {
  const tokens = normalizeFilterTokens(rawFilter);
  if (!tokens.length) return true;
  const hay = (speciesName ?? '').toString().toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

function matchesWordFilterRow(row, headerMap, rawFilter) {
  const f = (rawFilter ?? '').toString().trim().toLowerCase();
  if (!f) return true;

  const parts = [
    getField(row, headerMap, 'Common Name'),
    getField(row, headerMap, 'Species'),
    getField(row, headerMap, 'Location'),
    getField(row, headerMap, 'Observation Details'),
    getField(row, headerMap, 'Checklist Comments'),
  ]
    .filter(Boolean)
    .map((v) => v.toString().toLowerCase());

  return parts.some((t) => t.includes(f));
}

function matchesUnusualFilter(speciesName) {
  if (!showUnusualOnly) return true;

  const yolo = getYoloInfoForSpecies(speciesName);
  return Boolean(yolo && (yolo.code === 4 || yolo.code === 5));
}

function matchesOwlsFilter(speciesName) {
  if (!owlsOnly) return true;
  const hay = (speciesName ?? '').toString();

  return /\bowl\b/i.test(hay);
}

let taxonomyOrder = null;
let taxonomyOrderPromise = null;

let taxonomyIndex = null;
let taxonomyIndexPromise = null;

let audubonOrder = null;
let audubonOrderPromise = null;
let audubonFuzzyEntries = null;

let yoloIndex = null;
let yoloIndexPromise = null;

let editMode = false;

const editsByRowId = new Map();

const editsByRowKey = new Map();
const rowKeyByRowId = new Map();

const EDITS_DB_NAME = 'cbc_dashboard_edits_v1';
const EDITS_STORE = 'rowEdits';
const EDITS_SNAPSHOT_STORE = 'editSnapshots';
let editsDbPromise = null;
let editsLoadedPromise = null;

function openEditsDb() {
  if (editsDbPromise) return editsDbPromise;
  editsDbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(EDITS_DB_NAME, 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(EDITS_STORE)) {
          db.createObjectStore(EDITS_STORE, { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains(EDITS_SNAPSHOT_STORE)) {
          const snap = db.createObjectStore(EDITS_SNAPSHOT_STORE, { keyPath: 'id', autoIncrement: true });
          try {
            snap.createIndex('createdAt', 'createdAt', { unique: false });
          } catch {

          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
    } catch (err) {
      reject(err);
    }
  });
  return editsDbPromise;
}

async function loadAllEditsFromDb() {

  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await openEditsDb();
    await new Promise((resolve) => {
      const tx = db.transaction(EDITS_STORE, 'readonly');
      const store = tx.objectStore(EDITS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = Array.isArray(req.result) ? req.result : [];
        for (const r of rows) {
          if (!r || typeof r.key !== 'string') continue;
          editsByRowKey.set(r.key, {
            suggestedCount: typeof r.suggestedCount === 'number' ? r.suggestedCount : null,
            explanation: (r.explanation || '').toString(),
          });
        }
        resolve();
      };
      req.onerror = () => resolve();
    });
  } catch {

  }
}

async function persistEditToDb(rowKey, edit) {
  if (!rowKey || typeof indexedDB === 'undefined') return;
  try {
    const db = await openEditsDb();
    await new Promise((resolve) => {
      const tx = db.transaction(EDITS_STORE, 'readwrite');
      const store = tx.objectStore(EDITS_STORE);
      store.put({
        key: rowKey,
        suggestedCount: edit?.suggestedCount ?? null,
        explanation: (edit?.explanation || '').toString(),
        updatedAt: Date.now(),
        circle: (countCircleMeta.code || '').toString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {

  }
}

function normalizeRowKeyPart(raw) {
  return (raw ?? '').toString().trim().replace(/\s+/g, ' ');
}

function computeRowKey(row, headerMap) {
  const sid = normalizeRowKeyPart(getField(row, headerMap, 'Submission ID'));
  const species = normalizeRowKeyPart(getCanonicalSpeciesFromRow(row, headerMap));
  const date = normalizeRowKeyPart(getField(row, headerMap, 'Date'));
  const time = normalizeRowKeyPart(getField(row, headerMap, 'Time'));
  const locId = normalizeRowKeyPart(getField(row, headerMap, 'Location ID'));
  const loc = normalizeRowKeyPart(getField(row, headerMap, 'Location'));
  const ll = getRowLatLon(row, headerMap);
  const lat = ll ? String(ll.lat) : '';
  const lon = ll ? String(ll.lon) : '';

  const circle = normalizeRowKeyPart(countCircleMeta.code || '');

  return [
    'v1',
    circle,
    sid,
    species,
    date,
    time,
    locId,
    loc,
    lat,
    lon,
  ]
    .filter((p) => p !== '')
    .join('|');
}

function getOrAssignRowKey(row, headerMap) {
  const existing = row?.__cbc_rowKey;
  if (typeof existing === 'string' && existing) return existing;
  const key = computeRowKey(row, headerMap);
  row.__cbc_rowKey = key;
  return key;
}

function normalizeIntegerInput(raw) {
  const t = (raw ?? '').toString().trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (!Number.isInteger(i) || i < 0) return null;
  return i;
}

function parseFiniteNumber(raw) {
  const text = (raw ?? '').toString().trim();
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function formatMinutesAsHoursMinutes(totalMinutes) {
  const safeTotal = Number.isFinite(totalMinutes) ? Math.max(0, Math.round(totalMinutes)) : 0;
  const hours = Math.floor(safeTotal / 60);
  const minutes = safeTotal % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getOrAssignRowId(row) {
  const existing = row?.__cbc_rowId;
  if (typeof existing === 'number' && Number.isFinite(existing)) return existing;

  const next = getOrAssignRowId._nextId || 1;
  getOrAssignRowId._nextId = next + 1;
  row.__cbc_rowId = next;
  return next;
}

function getRowEdit(rowId) {
  return editsByRowId.get(rowId) || { suggestedCount: null, explanation: '' };
}

function setRowEdit(rowId, update) {
  const prev = getRowEdit(rowId);
  const next = { ...prev, ...update };
  editsByRowId.set(rowId, next);
  const rowKey = rowKeyByRowId.get(rowId);
  if (typeof rowKey === 'string' && rowKey) {
    editsByRowKey.set(rowKey, next);

    persistEditToDb(rowKey, next);
  }

  updateEditsSummaryFromCurrentCsv();
}

function getEditedRowsSummaryForCurrentCsv() {
  if (!currentCsv) return { editedObservations: 0, editedSpecies: 0, speciesLines: [] };

  const { rows, headerMap } = currentCsv;
  const dateKeyExists = headerMap.has('date');
  const selectedDate = (dateFilterEl?.value || '').trim();

  let filteredRows =
    selectedDate && dateKeyExists
      ? rows.filter((r) => getField(r, headerMap, 'Date') === selectedDate)
      : rows;

  if (wordFilter) {
    filteredRows = filteredRows.filter((r) => r && matchesWordFilterRow(r, headerMap, wordFilter));
  }

  if (activeAreaFilter) {
    filteredRows = filteredRows.filter((r) => r && r.__cbc_area === activeAreaFilter);
  }

  if (activeLocationFilter) {
    filteredRows = filteredRows.filter((r) => r && r.__cbc_locKey === activeLocationFilter);
  }

  const speciesToDelta = new Map();
  let editedObservations = 0;

  for (const row of filteredRows) {
    const rawSpecies = getField(row, headerMap, 'Common Name') || getField(row, headerMap, 'Species');
    const section = tripReportSectionFromHeaderCell(rawSpecies);
    if (section) continue;

    const species = getCanonicalSpeciesFromRow(row, headerMap);
    if (!species) continue;

    const rowId = getOrAssignRowId(row);
    const edit = getRowEdit(rowId);
    const hasCountEdit = typeof edit.suggestedCount === 'number' && Number.isFinite(edit.suggestedCount);
    const hasExplanation = (edit.explanation || '').trim().length > 0;
    if (!hasCountEdit && !hasExplanation) continue;

    editedObservations += 1;

    const orig = parseCount(getField(row, headerMap, 'Count'));
    const adj = computeAdjustedCount(orig, edit.suggestedCount);
    const delta = typeof orig === 'number' && typeof adj === 'number' ? adj - orig : 0;
    speciesToDelta.set(species, (speciesToDelta.get(species) || 0) + delta);
  }

  const speciesLines = Array.from(speciesToDelta.entries())
    .filter(([, delta]) => delta !== 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 8)
    .map(([species, delta]) => `${species}: ${delta > 0 ? '+' : ''}${delta}`);

  return {
    editedObservations,
    editedSpecies: speciesToDelta.size,
    speciesLines,
  };
}

function updateEditsSummaryFromCurrentCsv() {
  if (!editsSummaryEl) return;

  const { editedObservations, editedSpecies, speciesLines } = getEditedRowsSummaryForCurrentCsv();
  if (editedObservations === 0) {
    editsSummaryEl.textContent = 'No edits yet.';
    return;
  }

  const lines = [`Edited observations: ${editedObservations}`, `Edited species: ${editedSpecies}`];
  if (speciesLines.length) {
    lines.push('', ...speciesLines);
  }
  editsSummaryEl.textContent = lines.join('\n');
}

async function saveAllEditsToDb() {
  if (typeof indexedDB === 'undefined') return;
  const db = await openEditsDb();
  if (!db) return;

  const savedAt = Date.now();
  const edits = [];
  for (const [key, edit] of editsByRowKey.entries()) {
    edits.push({
      key,
      suggestedCount: edit?.suggestedCount ?? null,
      explanation: (edit?.explanation || '').toString(),
    });
  }

  return await new Promise((resolve) => {
    const tx = db.transaction([EDITS_STORE, EDITS_SNAPSHOT_STORE], 'readwrite');
    const store = tx.objectStore(EDITS_STORE);
    const snapStore = tx.objectStore(EDITS_SNAPSHOT_STORE);

    for (const e of edits) {
      store.put({
        key: e.key,
        suggestedCount: e.suggestedCount,
        explanation: e.explanation,
        updatedAt: savedAt,
        circle: (countCircleMeta.code || '').toString(),
      });
    }

    const snapReq = snapStore.put({
      createdAt: savedAt,
      circle: (countCircleMeta.code || '').toString(),
      schema: 1,
      edits,
    });

    let snapshotId = null;
    snapReq.onsuccess = () => {
      snapshotId = snapReq.result;
    };

    tx.oncomplete = () => resolve(snapshotId);
    tx.onerror = () => resolve(null);
    tx.onabort = () => resolve(null);
  });
}

function computeAdjustedCount(originalCount, suggestedCount) {
  if (typeof suggestedCount === 'number' && Number.isFinite(suggestedCount)) return suggestedCount;
  return originalCount;
}

function computeAdjustedTotalForSpecies(speciesName) {
  if (!currentCsv) return null;

  const { rows, headerMap } = currentCsv;
  const dateKeyExists = headerMap.has('date');
  const selectedDate = (dateFilterEl?.value || '').trim();

  let filteredRows =
    selectedDate && dateKeyExists
      ? rows.filter((r) => getField(r, headerMap, 'Date') === selectedDate)
      : rows;

  if (wordFilter) {
    filteredRows = filteredRows.filter((r) => r && matchesWordFilterRow(r, headerMap, wordFilter));
  }

  if (activeAreaFilter) {
    filteredRows = filteredRows.filter((r) => r && r.__cbc_area === activeAreaFilter);
  }

  if (activeLocationFilter) {
    filteredRows = filteredRows.filter((r) => r && r.__cbc_locKey === activeLocationFilter);
  }

  let totalOriginal = 0;
  let totalAdjusted = 0;

  for (const row of filteredRows) {
    const s = getCanonicalSpeciesFromRow(row, headerMap);
    if (s !== speciesName) continue;

    const rowId = getOrAssignRowId(row);
    const edit = getRowEdit(rowId);

    const originalCount = parseCount(getField(row, headerMap, 'Count'));
    const adjustedCount = computeAdjustedCount(originalCount, edit.suggestedCount);

    if (typeof originalCount === 'number') totalOriginal += originalCount;
    if (typeof adjustedCount === 'number') totalAdjusted += adjustedCount;
  }

  return { totalOriginal, totalAdjusted };
}

function updateAdjustedTotalInDom(speciesName) {
  const block = tripReportEl.querySelector(`.species-details[data-species="${CSS.escape(speciesName)}"]`);
  if (!block) return;
  const totalEl = block.querySelector('.species-total');
  if (!totalEl) return;

  const totals = computeAdjustedTotalForSpecies(speciesName);
  if (!totals) return;

  totalEl.textContent = String(totals.totalAdjusted);
  if (totals.totalAdjusted !== totals.totalOriginal) {
    totalEl.title = `Original total: ${totals.totalOriginal}`;
  } else {
    totalEl.title = '';
  }
}

async function loadTaxonomyOrder() {
  if (taxonomyOrder) return taxonomyOrder;
  if (!taxonomyOrderPromise) {
    taxonomyOrderPromise = (async () => {
      const res = await fetch(assetUrl('taxonomy_order.json'));
      if (!res.ok) throw new Error('taxonomy_order.json not found');
      const data = await res.json();
      taxonomyOrder = data?.map && typeof data.map === 'object' ? data.map : null;
      return taxonomyOrder;
    })();
  }
  return taxonomyOrderPromise;
}

async function loadTaxonomyIndex() {
  if (taxonomyIndex) return taxonomyIndex;
  if (!taxonomyIndexPromise) {
    taxonomyIndexPromise = (async () => {
      const res = await fetch(assetUrl('taxonomy_order.json'));
      if (!res.ok) throw new Error('taxonomy_order.json not found');
      const data = await res.json();

      const orderMap =
        data?.map && typeof data.map === 'object'
          ? data.map
          : data?.orderByName && typeof data.orderByName === 'object'
            ? data.orderByName
            : null;

      const exoticByName = new Map();

      const taxa = Array.isArray(data?.taxa) ? data.taxa : Array.isArray(data?.taxaList) ? data.taxaList : null;
      if (taxa) {
        for (const t of taxa) {
          const name = (t?.commonName ?? t?.comName ?? t?.name ?? t?.species ?? '').toString().trim();
          if (!name) continue;

          const raw =
            t?.exoticCategory ??
            t?.exoticCode ??
            t?.exoticStatus ??
            t?.exotic ??
            t?.introduced ??
            t?.isExotic;

          let isExotic = false;
          if (typeof raw === 'boolean') {
            isExotic = raw;
          } else {
            const s = (raw ?? '').toString().trim();
            const up = s.toUpperCase();
            if (up === 'E' || up === 'EXOTIC' || up === 'ESCAPEE' || up.includes('EXOTIC') || up.includes('ESCAP')) {
              isExotic = true;
            }
          }

          if (isExotic) exoticByName.set(name, true);
        }
      }

      taxonomyIndex = { orderMap, exoticByName };
      return taxonomyIndex;
    })();
  }
  return taxonomyIndexPromise;
}

function maybeKickoffTaxonomyIndexLoad() {
  if (taxonomyIndex || taxonomyIndexPromise) return;
  taxonomyIndexPromise = loadTaxonomyIndex()
    .then((idx) => {
      taxonomyIndex = idx;
      taxonomyIndexPromise = null;
      try {
        renderTripReportFromCurrentCsv();
      } catch {

      }
    })
    .catch(() => {
      taxonomyIndexPromise = null;
    });
}

async function loadAudubonOrder() {
  if (audubonOrder) return audubonOrder;
  if (!audubonOrderPromise) {
    audubonOrderPromise = (async () => {
      const res = await fetch(assetUrl('audubon_order.json'));
      if (!res.ok) throw new Error('audubon_order.json not found');
      const data = await res.json();
      const rawMap = data?.map && typeof data.map === 'object' ? data.map : null;
      if (!rawMap) {
        audubonOrder = null;
        audubonFuzzyEntries = null;
        return audubonOrder;
      }

      const m = new Map();
      const setMin = (k, v) => {
        if (!k) return;
        if (m.has(k)) m.set(k, Math.min(m.get(k), v));
        else m.set(k, v);
      };

      const fuzzy = [];

      for (const [k, v] of Object.entries(rawMap)) {
        const rawName = (k ?? '').toString().trim();
        if (!rawName) continue;
        const order = Number(v);
        if (!Number.isFinite(order)) continue;

        const lower = rawName.toLowerCase();
        const canon = canonicalizeSpeciesName(rawName);
        const canonLower = canon.toLowerCase();
        const norm = normalizeSpeciesKey(rawName);

        setMin(rawName, order);
        setMin(lower, order);
        setMin(canon, order);
        setMin(canonLower, order);
        setMin(norm, order);

        fuzzy.push({ key: rawName, order });
      }

      audubonFuzzyEntries = fuzzy
        .map((e) => ({ order: e.order, fuzzy: normalizeForAudubonFuzzy(e.key) }))
        .filter((e) => e.fuzzy);

      audubonOrder = m;
      return audubonOrder;
    })();
  }
  return audubonOrderPromise;
}

function normalizeForAudubonFuzzy(raw) {
  return (raw ?? '')
    .toString()
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldTryAudubonFuzzy(raw) {
  const s = (raw ?? '').toString().toLowerCase();
  if (!s) return false;
  return /\bsp{1,2}\.?\b/.test(s) || s.includes('/') || /\bhybrid\b/.test(s) || /\s[×x]\s/.test(s);
}

function getAudubonOrderValueFuzzy(speciesName) {
  if (!audubonFuzzyEntries || !audubonFuzzyEntries.length) return null;
  const key = normalizeForAudubonFuzzy(speciesName);
  if (!key) return null;

  let best = null;
  for (const e of audubonFuzzyEntries) {
    if (!e?.fuzzy) continue;
    if (e.fuzzy === key) return e.order;
    if (e.fuzzy.includes(key) || key.includes(e.fuzzy)) {
      if (best == null || e.order < best) best = e.order;
    }
  }
  return best;
}

function getAudubonOrderValue(speciesName) {
  if (!audubonOrder) return null;
  const raw = (speciesName ?? '').toString().trim();
  if (!raw) return null;

  const canon = canonicalizeSpeciesName(raw);
  const canonKey = canon.toLowerCase();
  const normKey = normalizeSpeciesKey(raw);

  const preferred = AUDUBON_PREFERRED_NAME_BY_CANON.get(canonKey) || null;
  const alias = AUDUBON_ALIAS_BY_KEY.get(normKey) || null;

  const candidates = [
    ...(preferred ? [preferred, preferred.toLowerCase(), canonicalizeSpeciesName(preferred), canonicalizeSpeciesName(preferred).toLowerCase(), normalizeSpeciesKey(preferred)] : []),
    ...(alias ? [alias, alias.toLowerCase(), canonicalizeSpeciesName(alias), canonicalizeSpeciesName(alias).toLowerCase(), normalizeSpeciesKey(alias)] : []),
    raw,
    raw.toLowerCase(),
    canon,
    canonKey,
    normKey,
  ];

  if (audubonOrder instanceof Map) {
    for (const c of candidates) {
      if (!c) continue;
      const v = audubonOrder.get(c);
      if (typeof v === 'number') return v;
    }

    if (shouldTryAudubonFuzzy(raw)) {
      const fv = getAudubonOrderValueFuzzy(raw);
      if (typeof fv === 'number') return fv;
    }
    return null;
  }

  for (const c of candidates) {
    if (!c) continue;
    const v = audubonOrder[c];
    if (typeof v === 'number') return v;
  }
  return null;
}

async function loadYoloIndex() {
  const res = await fetch(assetUrl('index_yolo.csv'));
  if (!res.ok) throw new Error('index_yolo.csv not found');
  const text = await res.text();

  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => (h ?? '').toString().trim(),
  });

  const rows = parsed.data || [];
  const map = new Map();

  for (const row of rows) {
    const name = (row?.Name ?? '').toString().trim();
    const codeRaw = (row?.code ?? '').toString().trim();
    const designationRaw = (row?.designation ?? row?.Designation ?? '').toString().trim();
    if (!name) continue;
    if (!codeRaw) continue;
    if (codeRaw.toUpperCase() === 'NA') continue;

    const code = Number(codeRaw);
    if (!Number.isFinite(code)) continue;

    const exactKey = name.toLowerCase();
    const canonKey = normalizeSpeciesKey(name);
    const payload = { code, designation: designationRaw };
    if (exactKey) map.set(exactKey, payload);
    if (canonKey) map.set(canonKey, payload);
  }

  return map;
}

function maybeKickoffYoloLoad() {
  if (yoloIndex || yoloIndexPromise) return;
  yoloIndexPromise = loadYoloIndex()
    .then((m) => {
      yoloIndex = m;
      yoloIndexPromise = null;
      try {
        renderTripReportFromCurrentCsv();
      } catch {
      }
    })
    .catch(() => {
      yoloIndexPromise = null;
    });
}

function yoloDesignationFromCode(code) {
  if (code === 5) return 'Rare';
  if (code === 4) return 'Uncommon';
  return '';
}

function getYoloInfoForSpecies(speciesName) {
  if (!yoloIndex) return null;
  const raw = (speciesName ?? '').toString().trim();
  if (!raw) return null;

  const v = yoloIndex.get(raw.toLowerCase()) ?? yoloIndex.get(normalizeSpeciesKey(raw)) ?? null;
  if (!v) return null;
  if (typeof v === 'number') {
    return { code: v, designation: yoloDesignationFromCode(v) };
  }
  const code = Number(v.code);
  if (!Number.isFinite(code)) return null;
  const designation = (v.designation ?? '').toString().trim() || yoloDesignationFromCode(code);
  return { code, designation };
}

function maybeKickoffOrderingLoads() {
  if (!currentCsv) return;

  const mode = getActiveSortMode();

  if (mode === 'audubon') {
    loadAudubonOrder()
      .then(() => {
        try {
          renderTripReportFromCurrentCsv();
        } catch (err) {
          console.error(err);
        }
      })
      .catch(() => {

      });
    return;
  }

  if (mode === 'ebird' && !currentCsv.headerMap.has('taxonomic order')) {
    loadTaxonomyOrder()
      .then(() => {
        try {
          renderTripReportFromCurrentCsv();
        } catch (err) {
          console.error(err);
        }
      })
      .catch(() => {

      });
  }
}

function getActiveSortMode() {
  const v = (sortModeEl?.value || sortMode || 'ebird').toString().trim().toLowerCase();
  if (v === 'alpha' || v === 'alphabetic') return 'alpha';
  if (v === 'audubon') return 'audubon';
  return 'ebird';
}

function normalizeTripReportSpeciesCell(raw) {

  const s = (raw ?? '')
    .toString()

    .replace(/\uFFFC/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';

  const up = s.toUpperCase();
  if (up === 'ADDITIONAL TAXA') return '';
  if (up.startsWith('EXOTIC:')) return '';
  if (up === 'EXOTIC') return '';
  if (up === 'CHECKLISTS') return '';
  if (up === 'SPECIES' || up === 'TAXON') return '';

  return s;
}

function tripReportSectionFromHeaderCell(raw) {
  const s = (raw ?? '').toString().replace(/\uFFFC/g, '').trim();
  if (!s) return '';
  const up = s.toUpperCase();
  if (up === 'ADDITIONAL TAXA') return 'additional';
  if (up.startsWith('EXOTIC:')) return 'exotic';
  if (up === 'EXOTIC') return 'exotic';
  return '';
}

function normalizeTaxonomicCategory(raw) {
  return (raw ?? '').toString().trim().toLowerCase();
}

function isExoticCode(raw) {
  const t = (raw ?? '').toString().trim();
  if (!t) return false;
  const up = t.toUpperCase();
  if (up === 'NA' || up === 'N/A') return false;
  return true;
}

function isSpTaxonName(name) {
  const s = (name ?? '').toString();

  return /\bsp{1,2}\.?(\b|\s|$)/i.test(s);
}

function isSlashTaxonName(name) {
  const s = (name ?? '').toString();
  return s.includes('/');
}

function isHybridTaxonName(name) {
  const s = (name ?? '').toString();

  return /\s[×x]\s/i.test(s) || /\bhybrid\b/i.test(s);
}

function isOtherTaxon(entry) {
  if (!entry) return false;
  if (entry.isHybridTaxon) return false;
  return Boolean(entry.isExotic || entry.isAdditionalTaxon || entry.isSpTaxon || entry.isSlashTaxon);
}

function tripSectionLabelForEntry(entry) {
  const mode = getActiveSortMode();

  if (mode === 'audubon') {

    if (!audubonOrder) {
      if (entry?.isExotic) return 'Exotic / Escapee';
      return 'Species observed';
    }

    if (entry?.isExotic) return 'Exotic / Escapee';
    const ao = getAudubonOrderValue(entry?.species);
    if (typeof ao !== 'number') return 'Not in CBC list';
    return 'Species observed';
  }
  if (entry?.isHybridTaxon) return 'Hybrids';
  if (entry?.isExotic) return 'Exotic / Escapee';
  if (entry?.isAdditionalTaxon) return 'Additional taxa';
  return 'Species observed';
}

function ebirdSectionRank(entry) {

  const isAdditional = Boolean(entry?.isAdditionalTaxon);
  const isExotic = Boolean(entry?.isExotic);
  const isHybrid = Boolean(entry?.isHybridTaxon);
  const isSp = Boolean(entry?.isSpTaxon);
  const isSlash = Boolean(entry?.isSlashTaxon);

  const rank = isAdditional ? 3 : isExotic ? 2 : isHybrid ? 1 : 0;
  const subrank = rank === 3 && (isSp || isSlash) ? 1 : 0;
  return { rank, subrank };
}

function getCanonicalSpeciesFromRow(row, headerMap) {
  const rawSpecies = getField(row, headerMap, 'Common Name') || getField(row, headerMap, 'Species');
  const cleaned = normalizeTripReportSpeciesCell(rawSpecies);
  if (!cleaned) return '';
  if (shouldPreserveChecklistTaxa(headerMap)) return cleaned;
  return canonicalizeSpeciesName(cleaned);
}

function compareSpecies(a, b) {
  const mode = getActiveSortMode();
  if (mode === 'alpha') return a.species.localeCompare(b.species);

  if (mode === 'audubon') {
    const ao = getAudubonOrderValue(a.species);
    const bo = getAudubonOrderValue(b.species);

    const ar = a?.isExotic ? 2 : typeof ao === 'number' ? 0 : 1;
    const br = b?.isExotic ? 2 : typeof bo === 'number' ? 0 : 1;
    if (ar !== br) return ar - br;

    if (ar === 0) return ao - bo;
    return a.species.localeCompare(b.species);
  }

  const sa = ebirdSectionRank(a);
  const sb = ebirdSectionRank(b);
  if (sa.rank !== sb.rank) return sa.rank - sb.rank;
  if (sa.subrank !== sb.subrank) return sa.subrank - sb.subrank;

  const ao = a.taxOrder ?? (taxonomyOrder ? taxonomyOrder[a.species] : null);
  const bo = b.taxOrder ?? (taxonomyOrder ? taxonomyOrder[b.species] : null);

  if (typeof ao === 'number' && typeof bo === 'number') return ao - bo;
  if (typeof ao === 'number') return -1;
  if (typeof bo === 'number') return 1;
  return a.species.localeCompare(b.species);
}

function computeTripDataFromCurrentCsv() {
  if (!currentCsv) return null;

  const activeMode = getActiveSortMode();

  const { rows, headerMap } = currentCsv;
  const dateKeyExists = headerMap.has('date');
  const selectedDate = (dateFilterEl?.value || '').trim();

  let filteredRows =
    selectedDate && dateKeyExists
      ? rows.filter((r) => getField(r, headerMap, 'Date') === selectedDate)
      : rows;

  maybeKickoffTaxonomyIndexLoad();

  if (activeAreaFilter) {
    filteredRows = filteredRows.filter((r) => r && r.__cbc_area === activeAreaFilter);
  }

  if (activeLocationFilter) {
    filteredRows = filteredRows.filter((r) => r && r.__cbc_locKey === activeLocationFilter);
  }

  const hasCommonName = headerMap.has('common name');
  const hasSpecies = headerMap.has('species');
  if (!hasCommonName && !hasSpecies) {
    return {
      error: 'Drop an eBird CSV (MyEBirdData.csv or trip report export) to see the trip report table.',
      filteredRows,
      bySpecies: new Map(),
      speciesList: [],
      allChecklistsSize: 0,
      submissionIdKeyExists: headerMap.has('submission id'),
    };
  }

  const submissionIdKeyExists = headerMap.has('submission id');
  const taxOrderKeyExists = headerMap.has('taxonomic order');
  const exoticCodeKeyExists = headerMap.has('exotic code');
  const taxCategoryKeyExists = headerMap.has('taxonomic category');

  const taxonomyExoticLookup = taxonomyIndex?.exoticByName ?? null;

  const bySpecies = new Map();
  const allChecklists = new Set();

  let sectionHint = 'main';

  for (const row of filteredRows) {
    const rawSpecies = getField(row, headerMap, 'Common Name') || getField(row, headerMap, 'Species');
    const section = tripReportSectionFromHeaderCell(rawSpecies);
    if (section) {
      sectionHint = section;
      continue;
    }

    const species = getCanonicalSpeciesFromRow(row, headerMap);
    if (!species) continue;

    const rowId = getOrAssignRowId(row);
    const edit = getRowEdit(rowId);

    const originalCount = parseCount(getField(row, headerMap, 'Count'));
    const adjustedCount = computeAdjustedCount(originalCount, edit.suggestedCount);
    const taxOrderRaw = taxOrderKeyExists ? getField(row, headerMap, 'Taxonomic Order') : '';
    const taxOrder = taxOrderRaw ? Number(taxOrderRaw) : null;
    const exoticCode = exoticCodeKeyExists ? getField(row, headerMap, 'Exotic Code') : '';
    const taxCategoryRaw = taxCategoryKeyExists ? getField(row, headerMap, 'Taxonomic Category') : '';
    const taxCategory = normalizeTaxonomicCategory(taxCategoryRaw);
    const submissionId = submissionIdKeyExists ? getField(row, headerMap, 'Submission ID') : '';
    const date = getField(row, headerMap, 'Date');
    const time = getField(row, headerMap, 'Time');
    const location = getField(row, headerMap, 'Location');
    const locationId = getField(row, headerMap, 'Location ID');
    const comments =
      getField(row, headerMap, 'Observation Details') ||
      getField(row, headerMap, 'Checklist Comments') ||
      '';

    if (!bySpecies.has(species)) {
      bySpecies.set(species, {
        species,
        taxOrder: Number.isFinite(taxOrder) ? taxOrder : null,
        totalOriginal: 0,
        totalAdjusted: 0,
        isExotic: false,
        isAdditionalTaxon: false,
        isSpTaxon: isSpTaxonName(species),
        isSlashTaxon: isSlashTaxonName(species),
        isHybridTaxon: isHybridTaxonName(species),
        checklists: new Set(),
        observations: [],
      });
    }

    const entry = bySpecies.get(species);
    if (exoticCodeKeyExists) {
      if (isExoticCode(exoticCode)) entry.isExotic = true;
    } else if (sectionHint === 'exotic') {
      entry.isExotic = true;
    } else if (taxonomyExoticLookup && taxonomyExoticLookup.get(species)) {
      entry.isExotic = true;
    }

    if (normalizeSpeciesKey(species) === 'indian peafowl') {
      entry.isExotic = true;
    }

    if (taxCategoryKeyExists) {
      if (taxCategory && taxCategory !== 'species') entry.isAdditionalTaxon = true;
    } else if (sectionHint === 'additional') {
      entry.isAdditionalTaxon = true;
    }

    if (activeMode === 'ebird' && entry.isSpTaxon) {
      entry.isAdditionalTaxon = true;
    }

    if (entry.isSlashTaxon) {
      entry.isAdditionalTaxon = true;
    }

    if (entry.isHybridTaxon) {
      entry.isAdditionalTaxon = true;
    }
    if (Number.isFinite(taxOrder)) {
      if (entry.taxOrder == null || taxOrder < entry.taxOrder) {
        entry.taxOrder = taxOrder;
      }
    }
    if (typeof originalCount === 'number') entry.totalOriginal += originalCount;
    if (typeof adjustedCount === 'number') entry.totalAdjusted += adjustedCount;
    if (submissionId) {
      entry.checklists.add(submissionId);
      allChecklists.add(submissionId);
    }
    entry.observations.push({
      rowId,
      originalCount,
      adjustedCount,
      suggestedCount: edit.suggestedCount,
      explanation: edit.explanation || '',
      date,
      time,
      area: typeof row.__cbc_area === 'string' ? row.__cbc_area : '',
      locKey: typeof row.__cbc_locKey === 'string' ? row.__cbc_locKey : '',
      location,
      locationId,
      comments,
      submissionId,
    });
  }

  if (showUnusualOnly) {

    maybeKickoffYoloLoad();
  }

  const speciesList = Array.from(bySpecies.values())
    .filter((s) => matchesSpeciesFilter(s.species, speciesNameFilter))
    .filter((s) => matchesOwlsFilter(s.species))
    .filter((s) => matchesUnusualFilter(s.species))
    .sort(compareSpecies);

  return {
    error: '',
    filteredRows,
    bySpecies,
    speciesList,
    allChecklistsSize: submissionIdKeyExists ? allChecklists.size : 0,
    submissionIdKeyExists,
  };
}

function setActiveTab(tabName) {
  const isTable = tabName === 'table';

  tabTableEl.classList.toggle('active', isTable);
  tabPlotEl.classList.toggle('active', !isTable);
  tabTableEl.setAttribute('aria-selected', String(isTable));
  tabPlotEl.setAttribute('aria-selected', String(!isTable));

  panelTableEl.classList.toggle('active', isTable);
  panelPlotEl.classList.toggle('active', !isTable);
  panelTableEl.hidden = !isTable;
  panelPlotEl.hidden = isTable;

  if (!isTable) {
    renderSpeciesPlotFromCurrentCsv();
  }
}

tabTableEl.addEventListener('click', () => setActiveTab('table'));
tabPlotEl.addEventListener('click', () => setActiveTab('plot'));

function parseCount(value) {
  const v = (value ?? '').toString().trim();
  if (!v) return null;
  if (v.toUpperCase() === 'X') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatObsDateTime(dateRaw, timeRaw) {
  const d = (dateRaw || '').toString().trim();
  const t = (timeRaw || '').toString().trim();

  const normalizeTimeTo24h = (timeText) => {
    const raw = (timeText || '').toString().trim();
    if (!raw) return '';

    const m = raw.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*([AaPp][Mm])$/);
    if (m) {
      let hour = Number(m[1]);
      const minute = Number(m[2] ?? '00');
      const second = m[3] ?? null;
      const ap = m[4].toUpperCase();

      if (hour === 12) hour = 0;
      if (ap === 'PM') hour += 12;

      const hh = String(hour).padStart(2, '0');
      const mm = String(minute).padStart(2, '0');
      return second ? `${hh}:${mm}:${second}` : `${hh}:${mm}`;
    }

    const m24 = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m24) {
      const hour = Number(m24[1]);
      if (Number.isFinite(hour) && hour >= 0 && hour <= 23) {
        const hh = String(hour).padStart(2, '0');
        return m24[3] ? `${hh}:${m24[2]}:${m24[3]}` : `${hh}:${m24[2]}`;
      }
    }

    return raw;
  };

  let dateOut = d;
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const yy = m[1].slice(2);
    dateOut = `${m[2]}/${m[3]}/${yy}`;
  }

  const tOut = normalizeTimeTo24h(t);
  if (dateOut && tOut) return `${dateOut} ${tOut}`;
  return tOut || dateOut;
}

function clearTripReport(message) {
  speciesObservedCountEl.textContent = '0';
  if (otherTaxaCountEl) otherTaxaCountEl.textContent = '0';
  if (hybridsCountEl) hybridsCountEl.textContent = '0';
  checklistsCountEl.textContent = '0';
  if (tripAreaLabelEl) tripAreaLabelEl.hidden = true;
  tripReportEl.textContent = message || '';
}

let longtermCapcPromise = null;
let longtermCapcDb = null;

function parseWideInt(value) {
  const raw = (value ?? '').toString().trim();
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function isYearColumn(key) {
  return /^\d{4}$/.test((key || '').toString());
}

function loadLongtermCapcDb() {
  if (longtermCapcDb) return Promise.resolve(longtermCapcDb);
  if (longtermCapcPromise) return longtermCapcPromise;

  const csvPath = (countCircleMeta.longtermCsvPath || '').toString().trim();
  if (!csvPath) {
    return Promise.reject(new Error(`No long-term dataset configured for ${countCircleMeta.code || 'this count circle'}.`));
  }

  longtermCapcPromise = fetch(assetUrl(csvPath))
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load long-term dataset: ${r.status} ${r.statusText}`);
      return r.text();
    })
    .then((text) => {
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      });

      if (parsed.errors && parsed.errors.length) {
        const e = parsed.errors[0];
        throw new Error(`Failed to parse long-term dataset: ${e.message || 'unknown parse error'}`);
      }

      const rows = Array.isArray(parsed.data) ? parsed.data : [];
      if (!rows.length) throw new Error('Long-term dataset is empty.');

      const allKeys = new Set();
      for (const row of rows) {
        for (const k of Object.keys(row || {})) allKeys.add(k);
      }

      const years = Array.from(allKeys)
        .filter(isYearColumn)
        .map((y) => Number(y))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b);

      if (!years.length) throw new Error('Long-term dataset has no year columns.');

      const groups = new Map();

      for (const row of rows) {
        const rawSpecies = (row?.Species ?? '').toString().trim();
        if (!rawSpecies) continue;

        const canon = canonicalizeSpeciesName(rawSpecies);
        const isBase = rawSpecies === canon;
        if (!groups.has(canon)) {
          groups.set(canon, {
            canon,
            hasBase: false,
            base: new Array(years.length).fill(0),
            subs: new Array(years.length).fill(0),
          });
        }

        const g = groups.get(canon);
        if (isBase) g.hasBase = true;

        for (let i = 0; i < years.length; i++) {
          const y = String(years[i]);
          const v = parseWideInt(row?.[y]);
          if (isBase) g.base[i] += v;
          else g.subs[i] += v;
        }
      }

      const seriesByCanon = new Map();
      for (const [canon, g] of groups.entries()) {
        const out = new Array(years.length).fill(0);
        for (let i = 0; i < years.length; i++) {
          if (!g.hasBase) {
            out[i] = g.subs[i];
            continue;
          }
          const base = g.base[i];
          const subs = g.subs[i];
          out[i] = subs > 0 && base < subs ? base + subs : base;
        }
        seriesByCanon.set(canon, out);
      }

      const canons = Array.from(seriesByCanon.keys()).sort((a, b) => a.localeCompare(b));

      longtermCapcDb = {
        years,
        seriesByCanon,
        canons,
      };
      return longtermCapcDb;
    })
    .finally(() => {

      if (!longtermCapcDb) longtermCapcPromise = null;
    });

  return longtermCapcPromise;
}

function renderSpeciesPlotFromCurrentCsv() {
  if (!speciesPlotEl) return;
  speciesPlotEl.innerHTML = '';

  const plotTitle = `${countCircleMeta.code || 'CBC'} CBC totals by year`;

  const header = document.createElement('div');
  header.className = 'species-plot-header';
  header.textContent = plotTitle;
  speciesPlotEl.appendChild(header);

  if (!countCircleMeta.id) {
    const empty = document.createElement('div');
    empty.className = 'species-plot-empty';
    empty.textContent = 'Select a count circle to load long-term history.';
    speciesPlotEl.appendChild(empty);
    return;
  }

  const msg = document.createElement('div');
  msg.className = 'species-plot-empty';
  msg.textContent = 'Loading long-term dataset…';
  speciesPlotEl.appendChild(msg);

  loadLongtermCapcDb()
    .then((db) => {
      if (!speciesPlotEl) return;
      speciesPlotEl.innerHTML = '';

      const controls = document.createElement('div');
      controls.className = 'species-plot-controls';

      const title = document.createElement('div');
      title.className = 'species-plot-controls-title';
      title.textContent = 'Species';

      const select = document.createElement('select');
      select.className = 'control-input species-plot-select';
      select.setAttribute('aria-label', 'Species');

      for (const canon of db.canons) {
        const opt = document.createElement('option');
        opt.value = canon;
        opt.textContent = canon;
        select.appendChild(opt);
      }

      const defaultPick = db.seriesByCanon.has('American Robin') ? 'American Robin' : db.canons[0];
      select.value = defaultPick;

      controls.appendChild(title);
      controls.appendChild(select);
      speciesPlotEl.appendChild(controls);

      const renderOne = (canon) => {
        const series = db.seriesByCanon.get(canon);
        if (!series) return;

        while (speciesPlotEl.childNodes.length > 1) {
          speciesPlotEl.removeChild(speciesPlotEl.lastChild);
        }
        speciesPlotEl.appendChild(controls);

        const years = db.years;
        const firstYear = years[0];
        const lastYear = years[years.length - 1];
        const lastIdx = years.length - 1;
        const lastVal = series[lastIdx] ?? 0;
        const yMax = Math.max(1, ...series);
        const yTop = Math.max(1, Math.ceil(yMax * 1.1));

        const wrap = document.createElement('div');
        wrap.className = 'species-plot-wrap';

        const plotDiv = document.createElement('div');
        plotDiv.className = 'species-plot-plotly';
        wrap.appendChild(plotDiv);

        const footer = document.createElement('div');
        footer.className = 'species-plot-footer';
        footer.textContent = `${canon} • ${firstYear}–${lastYear} • 2025: ${lastVal} • Max: ${yMax}`;

        const historicYears = years.slice(0, -1);
        const historicVals = series.slice(0, -1);
        const y2025 = series[lastIdx];

        const stemX = [];
        const stemY = [];
        for (let i = 0; i < historicYears.length; i++) {
          stemX.push(historicYears[i], historicYears[i], null);
          stemY.push(0, historicVals[i], null);
        }

        const traces = [
          {
            type: 'scatter',
            mode: 'lines',
            x: stemX,
            y: stemY,
            hoverinfo: 'skip',
            showlegend: false,
            line: { color: '#636EFA', width: 2 },
          },
          {
            type: 'scatter',
            mode: 'markers',
            x: historicYears,
            y: historicVals,
            showlegend: false,
            marker: { color: '#636EFA', size: 6 },
            hovertemplate: '%{x}: %{y}<extra></extra>',
          },
        ];

        if (Number.isFinite(y2025)) {
          traces.push(
            {
              type: 'scatter',
              mode: 'lines',
              x: [lastYear, lastYear, null],
              y: [0, y2025, null],
              hoverinfo: 'skip',
              showlegend: false,
              line: { color: 'red', width: 3 },
            },
            {
              type: 'scatter',
              mode: 'markers',
              x: [lastYear],
              y: [y2025],
              showlegend: false,
              marker: { color: 'red', size: 8 },
              hovertemplate: '%{x}: %{y}<extra></extra>',
            }
          );
        }

        const layout = {
          autosize: true,
          margin: { l: 40, r: 10, t: 10, b: 30 },
          paper_bgcolor: 'white',
          plot_bgcolor: '#E5ECF6',
          font: { color: '#2a3f5f' },
          annotations: [
            {
              xref: 'paper',
              yref: 'paper',
              x: 0.01,
              y: 0.99,
              xanchor: 'left',
              yanchor: 'top',
              showarrow: false,
              align: 'left',
              font: { size: 18 },
              text: `<b>${canon}</b>`,
            },
          ],
          xaxis: {
            type: 'linear',
            tickmode: 'linear',
            tick0: 1970,
            dtick: 5,
            autorange: false,
            range: [firstYear - 1.7, lastYear + 0.7],
            showgrid: true,
          },
          yaxis: {
            range: [0, yTop],
            showgrid: true,
          },
        };

        const config = {
          displayModeBar: false,
          responsive: true,
        };

        speciesPlotEl.appendChild(wrap);
        speciesPlotEl.appendChild(footer);
        Plotly.react(plotDiv, traces, layout, config);
      };

      select.addEventListener('change', () => {
        renderOne(select.value);
      });

      renderOne(select.value);
    })
    .catch((err) => {
      if (!speciesPlotEl) return;
      speciesPlotEl.innerHTML = '';
      const header2 = document.createElement('div');
      header2.className = 'species-plot-header';
      header2.textContent = plotTitle;
      speciesPlotEl.appendChild(header2);
      const msg2 = document.createElement('div');
      msg2.className = 'species-plot-empty';
      msg2.textContent = err?.message || 'Failed to load long-term dataset.';
      speciesPlotEl.appendChild(msg2);
    });
}

function renderTripReportFromCurrentCsv() {
  const data = computeTripDataFromCurrentCsv();
  if (!data) {
    clearTripReport('');
    return;
  }

  if (data.error) {
    clearTripReport(data.error);
    return;
  }

  updateTaxonomyMissingWarningsFromTripData(data);

  const { speciesList, submissionIdKeyExists, allChecklistsSize } = data;

  const hybrids = (speciesList || []).filter((s) => Boolean(s?.isHybridTaxon)).length;
  const mainSpecies = (speciesList || []).filter(
    (s) => !s?.isExotic && !s?.isAdditionalTaxon && !s?.isSpTaxon && !s?.isSlashTaxon && !s?.isHybridTaxon
  );
  const mainSpeciesCount = new Set(mainSpecies.map((s) => normalizeSpeciesKey(s?.species)).filter(Boolean)).size;
  const otherTaxa = (speciesList || []).filter((s) => isOtherTaxon(s)).length;
  speciesObservedCountEl.textContent = String(mainSpeciesCount);
  if (otherTaxaCountEl) otherTaxaCountEl.textContent = String(Math.max(0, otherTaxa));
  if (hybridsCountEl) hybridsCountEl.textContent = String(Math.max(0, hybrids));
  checklistsCountEl.textContent = String(submissionIdKeyExists ? allChecklistsSize : 0);

  if (tripAreaLabelEl) {
    const area = (activeAreaFilter || '').toString().trim();
    if (area) {
      tripAreaLabelEl.textContent = area;
      tripAreaLabelEl.hidden = false;
    } else {
      tripAreaLabelEl.hidden = true;
    }
  }
  tripReportEl.innerHTML = '';

  if (speciesList.length === 0) {
    clearTripReport('No species rows match the current filter.');
    return;
  }

  maybeKickoffYoloLoad();

  maybeKickoffTaxonomyIndexLoad();

  const fragment = document.createDocumentFragment();

  let lastSection = '';
  for (const s of speciesList) {
    const section = tripSectionLabelForEntry(s);
    if (section !== lastSection) {
      const hdr = document.createElement('div');
      hdr.className = 'trip-section-title';
      hdr.textContent = section;
      fragment.appendChild(hdr);
      lastSection = section;
    }

    const details = document.createElement('div');
    details.className = 'species-details';
    details.dataset.species = s.species;

    const summary = document.createElement('div');
    summary.className = 'species-summary';

    const left = document.createElement('div');
    left.className = 'species-left';

    const total = document.createElement('div');
    total.className = 'species-total';
    total.textContent = String(s.totalAdjusted);
    if (s.totalAdjusted !== s.totalOriginal) {
      total.title = `Original total: ${s.totalOriginal}`;
    }

    const name = document.createElement('div');
    name.className = 'species-name';
    name.textContent = s.species;

    const mapFilter = document.createElement('div');
    mapFilter.className = 'species-map-filter';
    mapFilter.title = 'Filter map locations to this species';

    const mapCb = document.createElement('span');
    mapCb.className = 'species-map-checkbox';

    const speciesKey = normalizeExactSpeciesKey(s.species);
    const syncSpeciesMapToggle = () => {
      const checked = Boolean(speciesKey && selectedSpeciesKeysForMap.has(speciesKey));
      mapCb.dataset.checked = checked ? '1' : '0';
    };
    syncSpeciesMapToggle();

    mapCb.addEventListener('click', (e) => {

      e.preventDefault();
      e.stopPropagation();

      if (!speciesKey) return;
      if (selectedSpeciesKeysForMap.has(speciesKey)) selectedSpeciesKeysForMap.delete(speciesKey);
      else selectedSpeciesKeysForMap.add(speciesKey);
      syncSpeciesMapToggle();

      activeLocationFilter = null;
      activeLocationFilterLabel = null;
      pendingOpenPopupLocationKey = null;

      plotLocationsFromCurrentCsv({ zoomToResults: false });
    });

    mapFilter.appendChild(mapCb);

    left.appendChild(mapFilter);
    left.appendChild(total);
    left.appendChild(name);

    const right = document.createElement('div');
    right.className = 'species-right';

    const yolo = getYoloInfoForSpecies(s.species);
    if (yolo && (yolo.code === 4 || yolo.code === 5)) {
      const badge = document.createElement('div');
      badge.className = `yolo-badge ${yolo.code === 4 ? 'yolo-uncommon' : 'yolo-rare'}`;
      badge.textContent = yolo.designation || (yolo.code === 4 ? 'Uncommon' : 'Rare');
      right.appendChild(badge);
    }

    const listsCount = submissionIdKeyExists ? (s.checklists?.size ?? 0) : null;
    const toggleBtn = document.createElement('span');
    toggleBtn.className = 'species-toggle-btn';
    const syncToggle = () => {
      const isOpen = details.classList.contains('open');
      toggleBtn.textContent = `${isOpen ? '▾' : '▸'}${listsCount == null ? '' : ` ${listsCount}`}`;
    };
    syncToggle();
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const willOpen = !details.classList.contains('open');
      if (willOpen && !showAllDetailsEl.checked) {
        for (const d of tripReportEl.querySelectorAll('.species-details')) {
          if (d !== details) d.classList.remove('open');
        }
      }
      details.classList.toggle('open', willOpen);
      syncToggle();
    });
    right.appendChild(toggleBtn);

    summary.appendChild(left);
    summary.appendChild(right);
    details.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'species-body';
    details.appendChild(body);

    const showAreaCol = true;

    const gridClass = editMode
      ? showAreaCol
        ? 'obs-grid-edit-with-area'
        : 'obs-grid-edit-no-area'
      : showAreaCol
        ? 'obs-grid-view-with-area'
        : 'obs-grid-view-no-area';

    const obsHeader = document.createElement('div');
    obsHeader.className = `obs-header ${gridClass}`;

    const hInd = document.createElement('div');
    hInd.className = 'obs-h obs-h-num';
    hInd.textContent = 'Count:';

    const hTime = document.createElement('div');
    hTime.className = 'obs-h';
    hTime.textContent = 'Time:';

    const hAdj = document.createElement('div');
    hAdj.className = 'obs-h obs-h-num';
    hAdj.textContent = 'Adjust:';

    const hExp = document.createElement('div');
    hExp.className = 'obs-h';
    hExp.textContent = 'Justification:';

    const hArea = document.createElement('div');
    hArea.className = 'obs-h';
    hArea.textContent = 'Area:';

    const hSel = document.createElement('div');
    hSel.className = 'obs-h obs-h-select';
    hSel.textContent = '';

    const hHotspot = document.createElement('div');
    hHotspot.className = 'obs-h';
    hHotspot.textContent = 'Hotspot:';

    const hComments = document.createElement('div');
    hComments.className = 'obs-h';
    hComments.textContent = 'Comments:';

    obsHeader.appendChild(hInd);
    obsHeader.appendChild(hSel);
    if (editMode) obsHeader.appendChild(hAdj);
    if (editMode) obsHeader.appendChild(hExp);
    obsHeader.appendChild(hTime);
    if (showAreaCol) obsHeader.appendChild(hArea);
    obsHeader.appendChild(hHotspot);
    obsHeader.appendChild(hComments);
    body.appendChild(obsHeader);

    const obsList = document.createElement('div');
    obsList.className = 'obs-list';

    const observations = [...s.observations];

    for (const o of observations) {
      const row = document.createElement('div');
      row.className = `obs-row ${gridClass}`;
      row.dataset.rowId = String(o.rowId);

      const ind = document.createElement('div');
      ind.className = 'obs-ind obs-num';
      const hasEdit = o.suggestedCount != null || (o.explanation || '').trim();
      if (!editMode && hasEdit && typeof o.adjustedCount === 'number') {
        ind.textContent = String(o.adjustedCount);
        if (typeof o.originalCount === 'number' && o.adjustedCount !== o.originalCount) {
          ind.title = `Original: ${o.originalCount}`;
        }
      } else {
        ind.textContent = typeof o.originalCount === 'number' ? String(o.originalCount) : '';
      }

      const adj = document.createElement('div');
      adj.className = 'obs-cor obs-num';
      if (editMode) {
        const adjInput = document.createElement('input');
        adjInput.className = 'obs-cor-input';
        adjInput.type = 'number';
        adjInput.inputMode = 'numeric';
        adjInput.min = '0';
        adjInput.step = '1';
        adjInput.placeholder = '';
        adjInput.value = o.suggestedCount == null ? '' : String(o.suggestedCount);
        adjInput.addEventListener('change', () => {
          const suggestedCount = normalizeIntegerInput(adjInput.value);
          setRowEdit(o.rowId, { suggestedCount });
          adjInput.value = suggestedCount == null ? '' : String(suggestedCount);
          updateAdjustedTotalInDom(s.species);
        });
        adj.appendChild(adjInput);
      }

      const dt = document.createElement('div');
      dt.className = 'obs-datetime';
      const dateText = formatObsDateTime(o.date, o.time);
      if (o.submissionId) {
        const a = document.createElement('a');
        a.className = 'checklist-link';
        a.href = `https://ebird.org/checklist/${encodeURIComponent(o.submissionId)}`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = dateText;
        dt.appendChild(a);
      } else {
        dt.textContent = dateText;
      }

      const exp = document.createElement('div');
      exp.className = 'obs-explanation';
      if (editMode) {
        const expInput = document.createElement('input');
        expInput.className = 'obs-explanation-input';
        expInput.type = 'text';
        expInput.placeholder = '';
        expInput.maxLength = 200;
        expInput.value = o.explanation || '';
        expInput.addEventListener('input', () => {
          setRowEdit(o.rowId, { explanation: expInput.value });
        });
        exp.appendChild(expInput);
      }

      const area = document.createElement('div');
      area.className = 'obs-area';
      area.textContent = formatAreaShort(o.area);

      const hsSel = document.createElement('div');
      hsSel.className = 'obs-select';
      const hsCb = document.createElement('input');
      hsCb.className = 'obs-select-checkbox';
      hsCb.type = 'checkbox';
      hsCb.checked = Boolean(o.locKey && selectedLocationKeys.has(o.locKey));
      hsCb.addEventListener('click', (e) => {

        e.stopPropagation();
      });
      hsCb.addEventListener('change', () => {
        if (!o.locKey) return;
        if (hsCb.checked) selectedLocationKeys.add(o.locKey);
        else selectedLocationKeys.delete(o.locKey);

        if (hsCb.checked) pendingOpenPopupLocationKey = o.locKey;
        plotLocationsFromCurrentCsv({ zoomToResults: false });
      });
      hsSel.appendChild(hsCb);

      const hs = document.createElement('div');
      hs.className = 'obs-hotspot';
      hs.textContent = o.location || (o.locationId ? String(o.locationId).trim() : '');

      const com = document.createElement('div');
      com.className = 'obs-comments';
      com.textContent = o.comments;

      row.appendChild(ind);
      row.appendChild(hsSel);
      if (editMode) row.appendChild(adj);
      if (editMode) row.appendChild(exp);
      row.appendChild(dt);
      if (showAreaCol) row.appendChild(area);
      row.appendChild(hs);
      row.appendChild(com);
      obsList.appendChild(row);
    }

    body.appendChild(obsList);
    fragment.appendChild(details);
  }

  tripReportEl.appendChild(fragment);

  const desired = Boolean(showAllDetailsEl.checked);
  for (const d of tripReportEl.querySelectorAll('.species-details')) {
    d.classList.toggle('open', desired);
  }
}

function plotLocationsFromCurrentCsv(options = {}) {
  const { zoomToResults = true, zoomOutLevels = 0 } = options || {};
  if (!currentCsv) {
    setStatus('');
    clearSummary();
    clearTripReport('');
    return;
  }

  const { rows, headerMap } = currentCsv;
  const dateKeyExists = headerMap.has('date');
  const submissionIdKeyExists = headerMap.has('submission id');
  const selectedDate = (dateFilterEl?.value || '').trim();

  let filteredRows =
    selectedDate && dateKeyExists
      ? rows.filter((r) => getField(r, headerMap, 'Date') === selectedDate)
      : rows;

  if (activeAreaFilter) {
    filteredRows = filteredRows.filter((r) => r && r.__cbc_area === activeAreaFilter);
  }

  if (activeLocationFilter) {
    filteredRows = filteredRows.filter((r) => r && r.__cbc_locKey === activeLocationFilter);
  }

  if (selectedSpeciesKeysForMap && selectedSpeciesKeysForMap.size > 0) {
    filteredRows = filteredRows.filter((r) => {
      if (!r) return false;
      const sp = getCanonicalSpeciesFromRow(r, headerMap);
      if (!sp) return false;
      return selectedSpeciesKeysForMap.has(normalizeExactSpeciesKey(sp));
    });
  }

  const unique = new Map();
  const uniqueLists = new Set();
  const checklistSummary = new Map();
  for (const row of filteredRows) {
    const sid = submissionIdKeyExists ? getField(row, headerMap, 'Submission ID') : '';
    const time = getField(row, headerMap, 'Time');
    if (sid) uniqueLists.add(sid);

    if (sid) {
      if (!checklistSummary.has(sid)) {
        checklistSummary.set(sid, {
          time: '',
          durationMin: null,
          distanceKm: null,
        });
      }

      const item = checklistSummary.get(sid);
      if (!item.time && time) item.time = time;

      const durationMin = parseFiniteNumber(getField(row, headerMap, 'Duration (Min)'));
      if (item.durationMin == null && durationMin != null) item.durationMin = durationMin;

      const distanceKm = parseFiniteNumber(getField(row, headerMap, 'Distance Traveled (km)'));
      if (item.distanceKm == null && distanceKm != null) item.distanceKm = distanceKm;
    }

    const ll = getRowLatLon(row, headerMap);
    if (!ll) continue;

    const locId = getField(row, headerMap, 'Location ID');
    const locName = getField(row, headerMap, 'Location') || locId || 'Location';
    const key = row.__cbc_locKey || getRowLocationKey(row, headerMap);

    const area = typeof row.__cbc_area === 'string' ? row.__cbc_area : '';

    if (!unique.has(key)) {
      unique.set(key, { key, lat: ll.lat, lon: ll.lon, name: locName, locId, area, lists: [] });
    }

    if (sid) {
      unique.get(key).lists.push({ sid, time });
    }
  }

  pointsLayer.clearLayers();

  for (const loc of unique.values()) {
    const label = loc.locId ? `${loc.name} (${loc.locId})` : loc.name;

    const highlight = Boolean(activeAreaFilter) && loc.area && loc.area === activeAreaFilter;
    const isSelected = selectedLocationKeys.has(loc.key);
    const color = isSelected ? '#ffcc00' : '#cc0000';

    const bySid = new Map();
    for (const it of loc.lists || []) {
      if (!it?.sid) continue;
      if (!bySid.has(it.sid)) bySid.set(it.sid, { sid: it.sid, time: it.time || '' });
    }
    const lists = Array.from(bySid.values()).sort((a, b) => {
      const ta = (a.time || '').toString();
      const tb = (b.time || '').toString();
      return ta.localeCompare(tb) || a.sid.localeCompare(b.sid);
    });

    const popupTitle =
      loc.locId && /^L\d+$/i.test(String(loc.locId).trim())
        ? `<a href="https://ebird.org/hotspot/${encodeURIComponent(String(loc.locId).trim())}" target="_blank" rel="noopener noreferrer">${escapeHtml(loc.name || 'Hotspot')}</a>`
        : escapeHtml(loc.name || label);

    const popupHtml =
      `<div style="font-size:12px;">` +
      `<div style="font-weight:600; margin-bottom:6px;">${popupTitle}</div>` +
      (lists.length
        ? `<div style="margin-bottom:4px;">Checklists (${lists.length})</div>` +
          `<div style="display:flex; flex-direction:column; gap:4px;">` +
          lists
            .map((it) => {
              const href = `https://ebird.org/checklist/${encodeURIComponent(it.sid)}`;
              const text = it.time ? `${it.time} — ${it.sid}` : it.sid;
              return `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
            })
            .join('') +
          `</div>`
        : `<div>(No Submission IDs for this hotspot in the current filter.)</div>`) +
      `</div>`;

    const tooltipText = `${loc.name || label}${lists.length ? ` — ${lists.length} checklist${lists.length === 1 ? '' : 's'}` : ''}`;

    const marker = L.circleMarker([loc.lat, loc.lon], {
      pane: 'pointsPane',
      radius: isSelected ? 7 : 4,
      weight: isSelected ? 2 : 1,
      color,
      fillColor: color,
      fillOpacity: isSelected ? 1 : 0.8,
    })
      .bindPopup(popupHtml)
      .bindTooltip(tooltipText, {
        sticky: true,
        direction: 'top',
        opacity: 0.9,
      })
      .on('click', () => {

        try {
          map.panTo([loc.lat, loc.lon]);
        } catch {

        }
      })
      .addTo(pointsLayer);

    if (pendingOpenPopupLocationKey && pendingOpenPopupLocationKey === loc.key) {
      try {
        marker?.openPopup?.();
      } catch {

      }
      pendingOpenPopupLocationKey = null;
    }
  }

  try {
    pointsLayer.bringToFront();
  } catch {

  }

  if (summaryDateEl) summaryDateEl.textContent = selectedDate || '—';
  if (summaryRecordsEl) summaryRecordsEl.textContent = String(filteredRows.length);
  if (summaryListsEl) summaryListsEl.textContent = submissionIdKeyExists ? String(uniqueLists.size) : '—';
  if (submissionIdKeyExists) {
    let listsNoDistance = 0;
    let listsNoTime = 0;
    let totalDurationMin = 0;
    let totalDistanceKm = 0;

    for (const item of checklistSummary.values()) {
      if (item.durationMin == null) listsNoTime += 1;
      else totalDurationMin += item.durationMin;

      if (item.distanceKm == null) listsNoDistance += 1;
      else totalDistanceKm += item.distanceKm;
    }

    if (summaryListsNoDistanceEl) summaryListsNoDistanceEl.textContent = String(listsNoDistance);
    if (summaryListsNoTimeEl) summaryListsNoTimeEl.textContent = String(listsNoTime);
    if (summaryMilesEl) summaryMilesEl.textContent = `${(totalDistanceKm * 0.621371).toFixed(1)} mi`;
    if (summaryTimeEl) summaryTimeEl.textContent = formatMinutesAsHoursMinutes(totalDurationMin);
  } else {
    if (summaryListsNoDistanceEl) summaryListsNoDistanceEl.textContent = '—';
    if (summaryListsNoTimeEl) summaryListsNoTimeEl.textContent = '—';
    if (summaryMilesEl) summaryMilesEl.textContent = '—';
    if (summaryTimeEl) summaryTimeEl.textContent = '—';
  }
  if (summaryLocationsEl) summaryLocationsEl.textContent = String(unique.size);

  const statusLines = [];
  if (selectedDate && !dateKeyExists) statusLines.push('Date filter ignored (no Date column)');
  if (currentAreasSourceLabel) statusLines.push(`Areas source: ${currentAreasSourceLabel}`);
  if (activeAreaFilter) statusLines.push(`Area filter: ${activeAreaFilter}`);
  if (activeLocationFilterLabel) statusLines.push(`Hotspot filter: ${activeLocationFilterLabel}`);
  else if (activeLocationFilter) statusLines.push('Hotspot filter: (selected)');
  if (selectedSpeciesKeysForMap && selectedSpeciesKeysForMap.size > 0) {
    statusLines.push(`Species map filter: ${selectedSpeciesKeysForMap.size}`);
  }
  setStatus(statusLines.join('\n'));

  const bounds = pointsLayer.getBounds();
  if (zoomToResults && bounds.isValid()) {
    map.fitBounds(bounds, { padding: [20, 20] });
    if (zoomOutLevels) {
      const minZoom = typeof map.getMinZoom === 'function' ? map.getMinZoom() : 0;
      map.setZoom(Math.max(minZoom, map.getZoom() - Number(zoomOutLevels)));
    }
  }

  renderTripReportFromCurrentCsv();
  renderSpeciesPlotFromCurrentCsv();
}

function parseCsvAndStore(csvText) {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => (h ?? '').toString().trim(),
  });

  const errors = parsed.errors || [];

  const columnCountWarnings = errors.filter((e) =>
    ['TooFewFields', 'TooManyFields', 'FieldMismatch'].includes(e.code)
  );
  const nonColumnCountErrors = errors.filter(
    (e) => !['TooFewFields', 'TooManyFields', 'FieldMismatch'].includes(e.code)
  );
  if (nonColumnCountErrors.length) {

    throw new Error(nonColumnCountErrors[0].message || 'CSV parse error');
  }

  const rows = parsed.data;
  if (!rows || rows.length === 0) {
    throw new Error('CSV has no rows');
  }

  const headerMap = normalizeHeaderMap(parsed.meta.fields || Object.keys(rows[0] || {}));

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r && (typeof r.__cbc_rowId !== 'number' || !Number.isFinite(r.__cbc_rowId))) {
      r.__cbc_rowId = i + 1;
    }
    if (r && typeof r.__cbc_locKey !== 'string') {
      r.__cbc_locKey = getRowLocationKey(r, headerMap);
    }

    if (r && typeof r.__cbc_rowKey !== 'string') {
      r.__cbc_rowKey = getOrAssignRowKey(r, headerMap);
    }
  }

  editsByRowId.clear();
  rowKeyByRowId.clear();
  for (const r of rows) {
    const rowId = r?.__cbc_rowId;
    if (typeof rowId !== 'number' || !Number.isFinite(rowId)) continue;
    const rowKey = r?.__cbc_rowKey;
    if (typeof rowKey === 'string' && rowKey) {
      rowKeyByRowId.set(rowId, rowKey);
      const e = editsByRowKey.get(rowKey);
      if (e) editsByRowId.set(rowId, e);
    }
  }

  if (editsLoadedPromise) {
    editsLoadedPromise.then(() => {
      editsByRowId.clear();
      rowKeyByRowId.clear();
      for (const r of rows) {
        const rowId = r?.__cbc_rowId;
        if (typeof rowId !== 'number' || !Number.isFinite(rowId)) continue;
        const rowKey = r?.__cbc_rowKey;
        if (typeof rowKey === 'string' && rowKey) {
          rowKeyByRowId.set(rowId, rowKey);
          const e = editsByRowKey.get(rowKey);
          if (e) editsByRowId.set(rowId, e);
        }
      }
      try {
        renderTripReportFromCurrentCsv();
        renderSpeciesPlotFromCurrentCsv();
      } catch (err) {
        console.error(err);
      }
    });
  }

  currentCsv = {
    rows,
    headerMap,
    errors,
    columnWarningCount: columnCountWarnings.length,
  };

  const detected = detectCbcDateFromRows(rows, headerMap);
  const appliedLatestPreset = applyLatestCbcPreset({ syncDate: true });
  if (!appliedLatestPreset && detected && dateFilterEl) {
    dateFilterEl.value = detected.dateStr;

    if (cbcPresetEl) {
      const matchingOption = [...cbcPresetEl.options].find((o) => o.value === detected.dateStr);
      if (matchingOption) {
        cbcPresetEl.value = detected.dateStr;
      } else {

        const [y, mo, d] = detected.dateStr.split('-');
        const label = `${detected.dateStr}  (CBC ${detected.cbcNumber})`;
        const opt = document.createElement('option');
        opt.value = detected.dateStr;
        opt.textContent = label;
        cbcPresetEl.insertBefore(opt, cbcPresetEl.options[1] || null);
        cbcPresetEl.value = detected.dateStr;
      }
    }
  }

  if (areasIndex && areasIndex.length) {
    assignAreasToRows(rows, headerMap);
  } else {
    needsAreaAssignment = true;
  }

  plotLocationsFromCurrentCsv();

  maybeKickoffOrderingLoads();

  maybeKickoffYoloLoad();

  renderCountCircleSelected();
  updateCountCircleLabel();
}

function openInfoModal() {
  if (!infoModalEl) return;
  infoModalEl.classList.remove('hidden');
  infoModalCloseEl?.focus?.();
}

function closeInfoModal() {
  if (!infoModalEl) return;
  infoModalEl.classList.add('hidden');
  infoBtnEl?.focus?.();
}

infoBtnEl?.addEventListener('click', () => {
  if (!infoModalEl) return;
  const isHidden = infoModalEl.classList.contains('hidden');
  if (isHidden) openInfoModal();
  else closeInfoModal();
});

infoModalCloseEl?.addEventListener('click', () => closeInfoModal());

infoModalEl?.addEventListener('click', (e) => {
  if (e.target === infoModalEl) closeInfoModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!infoModalEl) return;
  if (infoModalEl.classList.contains('hidden')) return;
  closeInfoModal();
});

  editsLoadedPromise = loadAllEditsFromDb();

function exportTripCsv() {
  const data = computeTripDataFromCurrentCsv();
  if (!data || data.error) {
    alert(data?.error || 'No table data to export');
    return;
  }

  const rows = data.speciesList.map((s) => {
    const editedObs = (s.observations || []).filter(
      (o) => o && (o.suggestedCount != null || (o.explanation || '').trim())
    );

    const editsSummary = editedObs
      .map((o) => {
        const sid = (o.submissionId || '').trim();
        const sidPart = sid ? `${sid}: ` : '';
        const cntPart = o.suggestedCount == null ? '' : String(o.suggestedCount);
        const exp = (o.explanation || '').trim();
        const expPart = exp ? ` (${exp})` : '';
        return `${sidPart}${cntPart}${expPart}`.trim();
      })
      .filter(Boolean)
      .join(' | ');

    return {
      Species: s.species,
      'Original Count': s.totalOriginal,
      'Adjusted Count': s.totalAdjusted,
      Edits: editsSummary,
    };
  });

  const csv = Papa.unparse(rows, {
    columns: ['Species', 'Original Count', 'Adjusted Count', 'Edits'],
  });

  const selectedDate = (dateFilterEl?.value || '').trim();
  const dateToken = selectedDate ? selectedDate.replaceAll('-', '') : 'all';

  const sortMode = getActiveSortMode();
  const sortToken = sortMode === 'audubon' ? 'Audubon' : sortMode === 'alpha' ? 'Alpha' : 'eBirdtax';

  const rawCode = (countCircleMeta.code || 'CAPC').trim();
  const codeToken = rawCode.replace(/[^A-Za-z0-9_-]/g, '');

  const safeDateToken = dateToken.replace(/[^0-9a-zA-Z_-]/g, '');
  const filename = `${safeDateToken}_${codeToken}_${sortToken}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

sortModeEl?.addEventListener('change', () => {
  sortMode = getActiveSortMode();
  maybeKickoffOrderingLoads();
  renderTripReportFromCurrentCsv();
  renderSpeciesPlotFromCurrentCsv();
});

speciesFilterEl?.addEventListener('input', () => {
  speciesNameFilter = (speciesFilterEl.value || '').toString();
  renderTripReportFromCurrentCsv();
  renderSpeciesPlotFromCurrentCsv();
});

showUnusualEl?.addEventListener('change', () => {
  showUnusualOnly = Boolean(showUnusualEl.checked);
  if (showUnusualOnly) {
    owlsOnly = false;
    if (owlsOnlyEl) owlsOnlyEl.checked = false;
  }
  if (showUnusualOnly) maybeKickoffYoloLoad();
  renderTripReportFromCurrentCsv();
  renderSpeciesPlotFromCurrentCsv();
});

owlsOnlyEl?.addEventListener('change', () => {
  owlsOnly = Boolean(owlsOnlyEl.checked);
  if (owlsOnly) {
    showUnusualOnly = false;
    if (showUnusualEl) showUnusualEl.checked = false;
  }
  renderTripReportFromCurrentCsv();
  renderSpeciesPlotFromCurrentCsv();
});

taxonDisplayModeEl?.addEventListener('change', () => {
  taxonDisplayMode = (taxonDisplayModeEl.value || 'split').toString().trim() === 'collapse' ? 'collapse' : 'split';
  selectedSpeciesKeysForMap.clear();
  plotLocationsFromCurrentCsv({ zoomToResults: false });
});

exportCsvEl?.addEventListener('click', () => {
  try {
    exportTripCsv();
  } catch (err) {
    console.error(err);
    alert(err.message || String(err));
  }
});

editTripEl?.addEventListener('click', () => {
  editMode = !editMode;
  if (editTripEl) editTripEl.classList.toggle('active', editMode);

  if (editMode && showAllDetailsEl) {
    showAllDetailsEl.checked = true;
  }

  renderTripReportFromCurrentCsv();
  updateEditsSummaryFromCurrentCsv();
});

saveEditsEl?.addEventListener('click', async () => {
  saveEditsEl.disabled = true;
  const prevLabel = saveEditsEl.textContent;
  saveEditsEl.textContent = 'Saving…';
  try {
    const snapshotId = await saveAllEditsToDb();
    saveEditsEl.textContent = snapshotId ? `Saved v${snapshotId}` : 'Saved';
  } catch {
    saveEditsEl.textContent = 'Save failed';
  } finally {
    window.setTimeout(() => {
      saveEditsEl.textContent = prevLabel;
      saveEditsEl.disabled = false;
    }, 900);
  }
});

matchAreasEl?.addEventListener('click', () => {
  try {

    activeAreaFilter = null;
    activeLocationFilter = null;
    activeLocationFilterLabel = null;
    pendingOpenPopupLocationKey = null;
    selectedLocationKeys.clear();
    selectedSpeciesKeysForMap.clear();
    try {
      map.closePopup();
    } catch {

    }
    updateAreasStyle();
    plotLocationsFromCurrentCsv();
  } catch (err) {
    console.error(err);
    alert(err.message || String(err));
  }
});

async function handleFile(file) {
  if (!file) return;
  setStatus(`Reading ${file.name}…`);
  const text = await file.text();
  parseCsvAndStore(text);
}

async function loadDefaultCsv() {

  try {
    setStatus('Loading default CSV…');
    const res = await fetch(assetUrl('MyEBirdData.csv'));
    if (!res.ok) {

      setStatus('');
      return;
    }
    const text = await res.text();
    const headerLine = (text.split(/\r?\n/, 1)[0] || '').toLowerCase();
    const looksLikeCsv =
      headerLine.includes('submission id') ||
      headerLine.includes('common name') ||
      headerLine.includes('species,count');
    if (!looksLikeCsv) {
      setStatus('');
      return;
    }
    parseCsvAndStore(text);
  } catch (err) {
    console.error(err);
    setStatus('');
  }
}

function normalizeParsedGeojson(parsed, { fallbackLabel = '' } = {}) {
  const label = (fallbackLabel || '').toString().trim();

  const withFeatureLabel = (feature, featureLabel) => {
    if (!feature || feature.type !== 'Feature') return null;
    const props = feature.properties && typeof feature.properties === 'object' ? { ...feature.properties } : {};
    if (featureLabel && !props.layer && !props.name && !props.NAME && !props.label) {
      props.layer = featureLabel;
    }
    return { ...feature, properties: props };
  };

  if (parsed?.type === 'FeatureCollection') {
    return {
      ...parsed,
      features: Array.isArray(parsed.features) ? parsed.features.map((feature) => withFeatureLabel(feature, label)).filter(Boolean) : [],
    };
  }

  if (parsed?.type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: [withFeatureLabel(parsed, label)].filter(Boolean),
    };
  }

  if (Array.isArray(parsed)) {
    const features = [];
    for (const item of parsed) {
      const normalized = normalizeParsedGeojson(item, { fallbackLabel: label });
      if (normalized?.type === 'FeatureCollection') features.push(...normalized.features);
    }
    return { type: 'FeatureCollection', features };
  }

  if (parsed && typeof parsed === 'object') {
    const features = [];
    for (const [key, value] of Object.entries(parsed)) {
      const normalized = normalizeParsedGeojson(value, { fallbackLabel: key || label });
      if (normalized?.type === 'FeatureCollection') features.push(...normalized.features);
    }
    return { type: 'FeatureCollection', features };
  }

  return { type: 'FeatureCollection', features: [] };
}

async function parseAreasFile(file) {
  const name = (file?.name || '').toString();
  const lower = name.toLowerCase();

  if (lower.endsWith('.geojson')) {
    const text = await file.text();
    return normalizeParsedGeojson(JSON.parse(text), { fallbackLabel: name.replace(/\.[^.]+$/, '') });
  }

  throw new Error('Unsupported area file. Use GeoJSON only.');
}

async function handleAreasFile(file) {
  if (!file) return;
  setStatus(`Reading area file ${file.name}…`);
  const geojson = await parseAreasFile(file);
  if (!Array.isArray(geojson.features) || geojson.features.length === 0) {
    throw new Error('No polygon features found in area file.');
  }
  await applyAreasGeojson(geojson, { sourceLabel: file.name });
  renderCountCircleSelected();
  setStatus(`Loaded count circle areas from ${file.name}`);
}

applyFilterEl?.addEventListener('click', () => {
  try {
    plotLocationsFromCurrentCsv();
  } catch (err) {
    console.error(err);
    alert(err.message || String(err));
  }
});

cbcPresetEl?.addEventListener('change', () => {
  const v = (cbcPresetEl.value || '').toString().trim();
  if (!v) return;
  if (dateFilterEl) dateFilterEl.value = v;
  try {
    plotLocationsFromCurrentCsv({ zoomToResults: false });
    focusMapOnCountCircle();
  } catch (err) {
    console.error(err);
    alert(err.message || String(err));
  }
});

countCircleSearchEl?.addEventListener('input', () => {
  scheduleCountCircleSearch();
});

countCircleSearchEl?.addEventListener('focus', () => {
  if (countCircleSearchEl.value) {
    scheduleCountCircleSearch();
  }
});

countCircleSearchEl?.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  const results = getFilteredCountCircles(countCircleSearchEl.value || '');
  const nextId = (results[0]?.id || '').toString().trim();
  if (!nextId) return;
  e.preventDefault();
  try {
    setStatus('Loading count circle…');
    await setActiveCountCircle(nextId, { preserveCsv: true });
    setStatus('');
  } catch (err) {
    console.error(err);
    alert(err.message || String(err));
    setStatus('');
  }
});

countCircleSearchResultsEl?.addEventListener('click', async (e) => {
  const btn = e.target?.closest?.('[data-action="pick-circle"]');
  if (!btn) return;
  const nextId = (btn.getAttribute('data-circle-id') || '').toString().trim();
  if (!nextId) return;
  try {
    setStatus('Loading count circle…');
    await setActiveCountCircle(nextId, { preserveCsv: true });
    setStatus('');
  } catch (err) {
    console.error(err);
    alert(err.message || String(err));
    setStatus('');
  }
});

showAllDetailsEl.addEventListener('change', () => {
  for (const d of tripReportEl.querySelectorAll('.species-details')) {
    d.classList.toggle('open', Boolean(showAllDetailsEl.checked));
  }
});

dropzoneEl.addEventListener('click', () => fileInputEl.click());
dropzoneEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInputEl.click();
  }
});

areasDropzoneEl?.addEventListener('click', () => areasFileInputEl?.click());
areasDropzoneEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    areasFileInputEl?.click();
  }
});

fileInputEl.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  try {
    await handleFile(file);
  } catch (err) {
    console.error(err);
    alert(err.message || String(err));
    setStatus('');
  } finally {

    e.target.value = '';
  }
});

areasFileInputEl?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  try {
    await handleAreasFile(file);
  } catch (err) {
    console.error(err);
    alert(err.message || String(err));
    setStatus('');
  } finally {
    e.target.value = '';
  }
});

dropzoneEl.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzoneEl.classList.add('dragover');
});

dropzoneEl.addEventListener('dragleave', () => {
  dropzoneEl.classList.remove('dragover');
});

areasDropzoneEl?.addEventListener('dragover', (e) => {
  e.preventDefault();
  areasDropzoneEl.classList.add('dragover');
});

areasDropzoneEl?.addEventListener('dragleave', () => {
  areasDropzoneEl.classList.remove('dragover');
});

dropzoneEl.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropzoneEl.classList.remove('dragover');
  const file = e.dataTransfer?.files?.[0];
  try {
    await handleFile(file);
  } catch (err) {
    console.error(err);
    alert(err.message || String(err));
    setStatus('');
  }
});

areasDropzoneEl?.addEventListener('drop', async (e) => {
  e.preventDefault();
  areasDropzoneEl.classList.remove('dragover');
  const file = e.dataTransfer?.files?.[0];
  try {
    await handleAreasFile(file);
  } catch (err) {
    console.error(err);
    alert(err.message || String(err));
    setStatus('');
  }
});

initWorkbench().catch((err) => {
  console.error(err);
  alert(err.message || String(err));
  setStatus('');
});
