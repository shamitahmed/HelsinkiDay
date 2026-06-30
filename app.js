// Helsinki Day Event Explorer - MapLibre GL JS Application Script (Free Version)

// Inject custom CSS styling for MapLibre markers and elements
const styleElement = document.createElement('style');
styleElement.textContent = `
    .maplibre-event-marker-wrapper {
        cursor: pointer;
        will-change: transform;
    }
    .maplibre-event-marker-inner {
        transition: transform 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));
        transform: scale(0.8);
        transform-origin: bottom center;
        width: 100%;
        height: 100%;
        will-change: transform;
    }
    .maplibre-event-marker-wrapper:hover .maplibre-event-marker-inner {
        transform: scale(0.96) translateY(-3px);
    }
    .maplibre-event-marker-inner.selected {
        transform: scale(1.0);
    }
    .maplibre-event-marker-wrapper:hover .maplibre-event-marker-inner.selected {
        transform: scale(1.15) translateY(-3px);
    }
    .user-location-marker {
        width: 32px;
        height: 32px;
        background: rgba(0, 132, 255, 0.18);
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0, 132, 255, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
    }
    .user-location-marker::before {
        content: '';
        width: 14px;
        height: 14px;
        background: #0084ff;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-sizing: border-box;
    }
    .user-location-marker::after {
        content: '';
        position: absolute;
        top: -6px;
        left: -6px;
        right: -6px;
        bottom: -6px;
        border-radius: 50%;
        border: 2px solid rgba(0, 132, 255, 0.35);
        animation: pulse-user-loc 2.2s infinite ease-out;
        box-sizing: border-box;
    }
    @keyframes pulse-user-loc {
        0% {
            transform: scale(0.6);
            opacity: 1;
        }
        100% {
            transform: scale(1.6);
            opacity: 0;
        }
    }
    /* Simple styling overrides to integrate MapLibre attribution */
    .maplibregl-ctrl-attrib {
        background: rgba(15, 23, 42, 0.8) !important;
        color: var(--text-secondary) !important;
        border-radius: var(--border-radius-sm) !important;
        font-family: var(--font-body) !important;
        font-size: 0.65rem !important;
        padding: 2px 6px !important;
        border: 1px solid var(--border-color) !important;
        z-index: 10;
    }
    .maplibregl-ctrl-attrib a {
        color: var(--accent-yellow) !important;
    }
`;
document.head.appendChild(styleElement);

// ==========================================================================
// Configurations & Global State
// ==========================================================================
let map = null;
let isMapLoaded = false;
let allEvents = [];
let filteredEvents = [];
let activeEventId = null;
let markersMap = new Map(); // Store MapLibre markers keyed by event ID
let userLocationMarker = null;
let userLocation = null;
let userLocationWatchId = null;
const activeKeys = new Set();
let animationFrameId = null;

// Category Mapping (Finnish to English for cleaner UI)
const CATEGORY_TRANSLATIONS = {
    'musiikki': 'Music',
    'lapsille': 'Children',
    'avoimet-ovet-kierrokset-ja-nayttelyt': 'Open Doors & Exhibitions',
    'muotoilu-ja-tyopajat': 'Design & Workshops',
    'luonto-ja-ymparisto': 'Nature & Environment',
    'kirjallisuus-fi': 'Literature',
    'kirjallisuus': 'Literature',
    'tanssi-teatteri-ja-elokuvat': 'Dance & Theatre',
    'liikunta-ja-hyva-olo': 'Sports & Wellness',
    'ruoka': 'Food',
    'meri': 'The Sea',
    'seniorit-fi': 'Seniors',
    'seniorit': 'Seniors',
    'nuorilta-nuorille-fi': 'Youth',
    'nuorilta-nuorille': 'Youth',
    'klassikot': 'Classics',
    'yotapahtuma': 'Night Events'
};

const CATEGORY_COLORS = {
    'Music': '#a855f7',
    'Children': '#eab308',
    'Open Doors & Exhibitions': '#64748b',
    'Design & Workshops': '#ec4899',
    'Nature & Environment': '#22c55e',
    'Literature': '#f59e0b',
    'Dance & Theatre': '#f43f5e',
    'Sports & Wellness': '#10b981',
    'Food': '#f97316',
    'The Sea': '#14b8a6',
    'Seniors': '#6366f1',
    'Youth': '#0ea5e9',
    'Classics': '#a16207',
    'Night Events': '#4f46e5',
    'Other': '#00d2ff'
};

const CATEGORY_EMOJIS = {
    'Music': '🎵',
    'Children': '🧸',
    'Open Doors & Exhibitions': '🏛️',
    'Design & Workshops': '🎨',
    'Nature & Environment': '🌳',
    'Literature': '📖',
    'Dance & Theatre': '🎭',
    'Sports & Wellness': '🏃',
    'Food': '🍕',
    'The Sea': '⚓',
    'Seniors': '👵',
    'Youth': '🎒',
    'Classics': '🎻',
    'Night Events': '🌙',
    'Other': '📍'
};

// Default center coordinates (Helsinki City Center)
const HELSINKI_CENTER = {
    lng: 24.9414,
    lat: 60.1699,
    zoom: 13.6,
    pitch: 45,
    bearing: 0
};

// Current Filters
const filters = {
    searchQuery: '',
    category: 'all'
};

// ==========================================================================
// Language Translation Systems (English & Finnish support)
// ==========================================================================
let currentLang = 'en';

const CATEGORY_TRANSLATIONS_FI = {
    'Music': 'Musiikki',
    'Children': 'Lapsille',
    'Open Doors & Exhibitions': 'Avoimet ovet & näyttelyt',
    'Design & Workshops': 'Työpajat & muotoilu',
    'Nature & Environment': 'Luonto & ympäristö',
    'Literature': 'Kirjallisuus',
    'Dance & Theatre': 'Tanssi & teatteri',
    'Sports & Wellness': 'Liikunta & terveys',
    'Food': 'Ruoka',
    'The Sea': 'Meri',
    'Seniors': 'Seniorit',
    'Youth': 'Nuoret',
    'Classics': 'Klassikot',
    'Night Events': 'Yötapahtumat',
    'Other': 'Muut'
};

const TRANSLATIONS = {
    en: {
        bannerText: "🥳 🎉 Happy Helsinki Day 2026 🥳 🎉",
        helsinkiFacts: [
            "Helsinki was founded in 1550 by King Gustavus Vasa of Sweden.",
            "Helsinki has over 300 islands in its archipelago.",
            "About one-third of Helsinki consists of green spaces and parks.",
            "Helsinki is home to Suomenlinna, a UNESCO World Heritage sea fortress.",
            "Helsinki has the world's northernmost metro system.",
            "Tap water in Helsinki is of such high quality that it is exported.",
            "Helsinki was the World Design Capital in 2012.",
            "Helsinki was the host city for the Summer Olympic Games in 1952."
        ],
        title: "Helsinki Day 2026",
        btnLocation: "<i class='fa-solid fa-location-arrow'></i> My Location",
        btnRecenter: "<i class='fa-solid fa-crosshairs'></i> Recenter",
        searchPlaceholder: "Search Helsinki Day events...",
        filterInfo: "<span><i class='fa-regular fa-calendar'></i> Friday, June 12</span><span><i class='fa-solid fa-ticket'></i> Free Admission</span>",
        allEvents: "All Events",
        other: "Other",
        statsTotal: "events loaded",
        statsFiltered: "Showing {count} results",
        hudTitle: "<i class='fa-solid fa-person-walking animate-pulse'></i> Keyboard Pan & Orbit",
        hudWalk: "Pan Map",
        hudLook: "Rotate Map",
        hudTilt: "Tilt Up / Down",
        hudFooter: "Right-click & drag to orbit | Scroll to zoom",
        routeActive: "<i class='fa-solid fa-route-highway animate-pulse'></i> Route Active",
        distance: "Distance",
        estWalk: "Est. Walk",
        min: "min",
        cancel: "Cancel",
        detailTime: "Time",
        detailVenue: "Venue",
        detailAddress: "Address",
        detailAdmission: "Admission",
        detailDistance: "Distance from You",
        visitWebsite: "<i class='fa-solid fa-arrow-up-right-from-square'></i> Visit Event Website",
        flyToMap: "<i class='fa-solid fa-location-crosshairs'></i> Fly to Map Location",
        freeAdmission: "Free Admission",
        paidAdmission: "Paid Admission",
        scheduleNotSpecified: "Schedule not specified",
        locationNotSpecified: "Location not specified",
        noEvents: "No events match your active filters.",
        resetFilters: "Reset Filters",
        markVisited: "<i class='fa-regular fa-square-check'></i> Mark Visited",
        visited: "<i class='fa-solid fa-square-check'></i> Visited!",
        visitedTitle: "<i class='fa-solid fa-trophy'></i> Explorer Progress",
        visitedCount: "{visited} / {total} Visited"
    },
    fi: {
        bannerText: "🥳 🎉 Hyvää Helsinki-päivää 2026 🥳 🎉",
        helsinkiFacts: [
            "Kustaa Vaasa perusti Helsingin vuonna 1550.",
            "Helsingin saaristossa on yli 300 saarta.",
            "Noin kolmasosa Helsingistä on viheralueita ja puistoja.",
            "Helsingissä sijaitsee Suomenlinna, joka on UNESCO:n maailmanperintökohde.",
            "Helsingissä on maailman pohjoisin metrojärjestelmä.",
            "Helsingin vesijohtovesi on niin puhdasta, että sitä viedään ulkomaille.",
            "Helsinki oli maailman muotoilupääkaupunki (World Design Capital) vuonna 2012.",
            "Helsinki isännöi kesäolympialaisia vuonna 1952."
        ],
        title: "Helsinki-päivä 2026",
        btnLocation: "<i class='fa-solid fa-location-arrow'></i> Sijaintini",
        btnRecenter: "<i class='fa-solid fa-crosshairs'></i> Keskitä",
        searchPlaceholder: "Hae Helsinki-päivän tapahtumia...",
        filterInfo: "<span><i class='fa-regular fa-calendar'></i> Perjantai 12. kesäkuuta</span><span><i class='fa-solid fa-ticket'></i> Vapaa pääsy</span>",
        allEvents: "Kaikki tapahtumat",
        other: "Muut",
        statsTotal: "tapahtumaa ladattu",
        statsFiltered: "Näytetään {count} tulosta",
        hudTitle: "<i class='fa-solid fa-person-walking animate-pulse'></i> Pikanäppäimet",
        hudWalk: "Siirry kartalla",
        hudLook: "Käännä karttaa",
        hudTilt: "Kallista ylös / alas",
        hudFooter: "Oikea hiiripainike raahaa: pyöritä | Rulla: zoomaa",
        routeActive: "<i class='fa-solid fa-route-highway animate-pulse'></i> Reitti aktiivinen",
        distance: "Etäisyys",
        estWalk: "Kävelyaika",
        min: "min",
        cancel: "Peruuta",
        detailTime: "Aika",
        detailVenue: "Tapahtumapaikka",
        detailAddress: "Osoite",
        detailAdmission: "Pääsymaksu",
        detailDistance: "Etäisyys sinusta",
        visitWebsite: "<i class='fa-solid fa-arrow-up-right-from-square'></i> Siirry tapahtuman sivuille",
        flyToMap: "<i class='fa-solid fa-location-crosshairs'></i> Lennä kohteeseen",
        freeAdmission: "Vapaa pääsy",
        paidAdmission: "Maksullinen tapahtuma",
        scheduleNotSpecified: "Aikataulua ei määritelty",
        locationNotSpecified: "Sijaintia ei määritelty",
        noEvents: "Ei hakuehtoja vastaavia tapahtumia.",
        resetFilters: "Tyhjennä haku",
        markVisited: "<i class='fa-regular fa-square-check'></i> Merkitse käydyksi",
        visited: "<i class='fa-solid fa-square-check'></i> Käyty!",
        visitedTitle: "<i class='fa-solid fa-trophy'></i> Tutkimusmatkan edistyminen",
        visitedCount: "{visited} / {total} Käyty"
    }
};

function getCategoryLabel(category) {
    if (currentLang === 'fi') {
        return CATEGORY_TRANSLATIONS_FI[category] || category;
    }
    return category;
}

function initLanguageSwitcher() {
    const langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'fi' : 'en';
            langBtn.innerHTML = `<i class="fa-solid fa-language"></i> ${currentLang.toUpperCase()}`;
            updateLanguageUI();
        });
    }
}

function generateTickerContent(lang) {
    const mainText = TRANSLATIONS[lang].bannerText;
    const facts = TRANSLATIONS[lang].helsinkiFacts;
    
    // Shuffle facts
    const shuffled = [...facts].sort(() => 0.5 - Math.random());
    const selectedFacts = shuffled.slice(0, 4);
    
    const separator = " &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp; ";
    let content = "";
    selectedFacts.forEach(fact => {
        content += `${mainText}${separator}💡 ${fact}${separator}`;
    });
    
    content += mainText;
    return content;
}

function updateLanguageUI() {
    // Ticker banner
    const bannerTextEl = document.querySelector('.ticker-text');
    if (bannerTextEl) {
        bannerTextEl.innerHTML = generateTickerContent(currentLang);
        
        setTimeout(() => {
            const textWidth = bannerTextEl.offsetWidth || 2000;
            const viewportWidth = window.innerWidth;
            const totalDistance = textWidth + viewportWidth;
            const speed = 75; // pixels per second
            const duration = totalDistance / speed;
            bannerTextEl.style.animationDuration = `${duration}s`;
        }, 50);
    }

    // Title
    const titleEl = document.getElementById('main-heading');
    if (titleEl) titleEl.textContent = TRANSLATIONS[currentLang].title;
    
    // Action buttons
    const userLocBtn = document.getElementById('btn-user-location');
    if (userLocBtn) userLocBtn.innerHTML = TRANSLATIONS[currentLang].btnLocation;
    
    const recenterBtn = document.getElementById('btn-recenter');
    if (recenterBtn) recenterBtn.innerHTML = TRANSLATIONS[currentLang].btnRecenter;
    
    // Search Bar
    const searchBar = document.getElementById('search-bar');
    if (searchBar) searchBar.placeholder = TRANSLATIONS[currentLang].searchPlaceholder;
    
    // Static Badge Info
    const badgeEl = document.querySelector('.filters-info-badge');
    if (badgeEl) badgeEl.innerHTML = TRANSLATIONS[currentLang].filterInfo;
    
    // Details Modal Labels
    const modalLabels = document.querySelectorAll('#details-modal .meta-item-label');
    if (modalLabels.length >= 4) {
        modalLabels[0].textContent = TRANSLATIONS[currentLang].detailTime;
        modalLabels[1].textContent = TRANSLATIONS[currentLang].detailVenue;
        modalLabels[2].textContent = TRANSLATIONS[currentLang].detailAddress;
        modalLabels[3].textContent = TRANSLATIONS[currentLang].detailAdmission;
        if (modalLabels.length >= 5) {
            modalLabels[4].textContent = TRANSLATIONS[currentLang].detailDistance;
        }
    }
    
    const webBtn = document.getElementById('detail-link-website');
    if (webBtn) webBtn.innerHTML = TRANSLATIONS[currentLang].visitWebsite;
    
    const flyBtn = document.getElementById('detail-btn-show-map');
    if (flyBtn) flyBtn.innerHTML = TRANSLATIONS[currentLang].flyToMap;

    // Distance Card
    const distTitle = document.querySelector('.distance-title');
    if (distTitle) distTitle.innerHTML = TRANSLATIONS[currentLang].routeActive;
    
    const distLabels = document.querySelectorAll('.map-distance-card .distance-label');
    if (distLabels.length >= 2) {
        distLabels[0].textContent = TRANSLATIONS[currentLang].distance;
        distLabels[1].textContent = TRANSLATIONS[currentLang].estWalk;
    }
    
    // HUD Card
    const hudTitle = document.querySelector('.explore-hud-card .hud-title');
    if (hudTitle) hudTitle.innerHTML = TRANSLATIONS[currentLang].hudTitle;
    
    const hudActions = document.querySelectorAll('.explore-hud-card .hud-action');
    if (hudActions.length >= 3) {
        hudActions[0].textContent = TRANSLATIONS[currentLang].hudWalk;
        hudActions[1].textContent = TRANSLATIONS[currentLang].hudLook;
        hudActions[2].textContent = TRANSLATIONS[currentLang].hudTilt;
    }
    
    const hudFoot = document.querySelector('.hud-footer');
    if (hudFoot) hudFoot.textContent = TRANSLATIONS[currentLang].hudFooter;

    // Explorer progress
    const visitedTitleEl = document.getElementById('text-visited-title');
    if (visitedTitleEl) {
        visitedTitleEl.innerHTML = TRANSLATIONS[currentLang].visitedTitle;
    }
    updateVisitedProgressBar();
    if (activeEventId) {
        updateVisitedButtonState(activeEventId);
    }

    // Re-render category pills and cards if data is loaded
    if (allEvents && allEvents.length > 0) {
        renderCategoryPills();
        renderEventList();
        updateStats();
    }
}

// ==========================================================================
// Initialization & Loading Data
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initLanguageSwitcher();
    initializeMapLibreMap();
    loadEventsData();
    updateLanguageUI();
});

// ==========================================================================
// MapLibre Map Setup & Styles Config
// ==========================================================================
const STYLE_STREETS = {
    version: 8,
    sources: {
        'raster-tiles': {
            type: 'raster',
            tiles: [
                'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © CARTO'
        }
    },
    layers: [
        {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 20
        }
    ]
};

const STYLE_SATELLITE = {
    version: 8,
    sources: {
        'raster-tiles': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        }
    },
    layers: [
        {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 19
        }
    ]
};

const STYLE_DARK = {
    version: 8,
    sources: {
        'raster-tiles': {
            type: 'raster',
            tiles: [
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © CARTO'
        }
    },
    layers: [
        {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 20
        }
    ]
};

function initializeMapLibreMap() {
    try {
        map = new maplibregl.Map({
            container: 'map',
            style: STYLE_STREETS,
            center: [HELSINKI_CENTER.lng, HELSINKI_CENTER.lat],
            zoom: HELSINKI_CENTER.zoom,
            pitch: HELSINKI_CENTER.pitch,
            bearing: HELSINKI_CENTER.bearing,
            maxPitch: 85,
            attributionControl: true
        });

        map.on('load', () => {
            isMapLoaded = true;
            // Setup controls
            bindMapControls();
            bindStyleSwitcher();
            
            // Start tracking user location automatically on load
            startTrackingUserLocation();

            // Initialize keyboard controls
            initKeyboardControls();
            animationFrameId = requestAnimationFrame(updateCameraFromKeyboard);
        });

        // Listen for style load (recreates vector layers when map base style changes)
        map.on('style.load', () => {
            if (activeEventId) {
                const event = allEvents.find(e => e.id === activeEventId);
                if (event && event.location2 && event.location2.lat && event.location2.lng) {
                    drawPathToEvent(parseFloat(event.location2.lat), parseFloat(event.location2.lng));
                }
            }
        });

        // Click outside on map canvas clears selection
        map.on('click', (e) => {
            const targetClass = e.originalEvent.target.className;
            if (typeof targetClass === 'string' && !targetClass.includes('maplibre-event-marker') && !targetClass.includes('user-location-marker')) {
                clearActiveSelection();
            }
        });

    } catch (e) {
        console.error("MapLibre Viewer initialization failed:", e);
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="position: absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; color:var(--text-secondary); max-width:400px; padding:20px;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size:3rem; color:var(--accent-danger); margin-bottom:15px;"></i>
                    <h3>Map Library Failed</h3>
                    <p style="margin:10px 0 20px;">WebGL might be disabled, or the map source is offline.</p>
                </div>
            `;
        }
    }
}

function switchImageryLayer(styleType) {
    if (!map) return;
    
    document.querySelectorAll('#style-switcher-group .control-btn').forEach(btn => btn.classList.remove('active'));

    let targetStyle;
    if (styleType === 'streets') {
        document.getElementById('btn-style-streets').classList.add('active');
        targetStyle = STYLE_STREETS;
    } else if (styleType === 'satellite') {
        document.getElementById('btn-style-satellite').classList.add('active');
        targetStyle = STYLE_SATELLITE;
    } else if (styleType === 'dark') {
        document.getElementById('btn-style-dark').classList.add('active');
        targetStyle = STYLE_DARK;
    }

    map.setStyle(targetStyle);
}

function bindMapControls() {
    // Recenter
    document.getElementById('btn-recenter').onclick = () => {
        if (!map) return;
        map.flyTo({
            center: [HELSINKI_CENTER.lng, HELSINKI_CENTER.lat],
            zoom: HELSINKI_CENTER.zoom,
            pitch: HELSINKI_CENTER.pitch,
            bearing: HELSINKI_CENTER.bearing,
            duration: 2000
        });
    };

    // Zoom
    document.getElementById('btn-zoom-in').onclick = () => {
        if (map) map.zoomIn();
    };
    document.getElementById('btn-zoom-out').onclick = () => {
        if (map) map.zoomOut();
    };

    // North
    document.getElementById('btn-reset-north').onclick = () => {
        if (map) map.easeTo({ bearing: 0, duration: 800 });
    };

    // Perspective (3D vs 2D Flat Toggle)
    let is3d = true;
    const toggle3dBtn = document.getElementById('btn-toggle-3d');
    toggle3dBtn.onclick = () => {
        is3d = !is3d;
        if (is3d) {
            map.easeTo({ pitch: 55, duration: 1000 });
            toggle3dBtn.classList.add('active');
        } else {
            map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
            toggle3dBtn.classList.remove('active');
        }
    };
    toggle3dBtn.classList.add('active');

    // My Location Click handler
    const userLocBtn = document.getElementById('btn-user-location');
    if (userLocBtn) {
        userLocBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert("Geolocation is not supported by your browser.");
                return;
            }

            const icon = userLocBtn.querySelector('i');
            if (icon) {
                icon.className = 'fa-solid fa-spinner fa-spin';
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (icon) icon.className = 'fa-solid fa-location-arrow';
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    updateUserLocationMarker(lat, lng);
                    
                    map.flyTo({
                        center: [lng, lat],
                        zoom: 15.5,
                        pitch: 45,
                        duration: 2000
                    });
                },
                (error) => {
                    if (icon) icon.className = 'fa-solid fa-location-arrow';
                    alert(`Could not get your location: ${error.message}`);
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        });
    }
}

function bindStyleSwitcher() {
    document.getElementById('btn-style-streets').onclick = () => switchImageryLayer('streets');
    document.getElementById('btn-style-satellite').onclick = () => switchImageryLayer('satellite');
    document.getElementById('btn-style-dark').onclick = () => switchImageryLayer('dark');
}

// ==========================================================================
// Marker / Custom Pin Management
// ==========================================================================
function addMapMarkers() {
    if (!map) return;

    markersMap.forEach(marker => marker.remove());
    markersMap.clear();

    filteredEvents.forEach(event => {
        const lat = parseFloat(event.location2.lat);
        const lng = parseFloat(event.location2.lng);

        if (isNaN(lat) || isNaN(lng)) return;

        const categoryEng = getEventCategoryEng(event);
        const isSelected = (activeEventId === event.id);
        const color = isSelected ? '#ff4a4a' : (CATEGORY_COLORS[categoryEng] || CATEGORY_COLORS['Other']);
        const emoji = CATEGORY_EMOJIS[categoryEng] || CATEGORY_EMOJIS['Other'];
        
        const el = document.createElement('div');
        el.className = 'maplibre-event-marker-wrapper';
        el.id = `marker-${event.id}`;
        el.style.width = '48px';
        el.style.height = '48px';
        
        const inner = document.createElement('div');
        inner.className = 'maplibre-event-marker-inner';
        if (isSelected) {
            inner.classList.add('selected');
        }
        inner.style.backgroundImage = `url(${createPinCanvas(color, emoji)})`;
        inner.style.backgroundSize = 'contain';
        inner.style.backgroundRepeat = 'no-repeat';
        inner.style.backgroundPosition = 'center bottom';
        inner.style.width = '100%';
        inner.style.height = '100%';
        el.appendChild(inner);
        
        // Bind hover events for floating tooltip
        el.addEventListener('mouseenter', (e) => showTooltip(event, e));
        el.addEventListener('mousemove', (e) => showTooltip(event, e));
        el.addEventListener('mouseleave', hideTooltip);

        // Click handler
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            selectEvent(event.id, false);
        });

        const marker = new maplibregl.Marker({
            element: el,
            anchor: 'bottom'
        })
        .setLngLat([lng, lat])
        .addTo(map);

        markersMap.set(event.id, marker);
    });
}

function createPinCanvas(color = '#00d2ff', symbol = '📍') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 12;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(128, 80, 64, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(64, 80);
    ctx.lineTo(128, 208);
    ctx.lineTo(192, 80);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 80, 64, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '80px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 128, 80);

    return canvas.toDataURL();
}

function showTooltip(event, mouseEvent) {
    const tooltip = document.getElementById('map-hover-tooltip');
    const tooltipImg = document.getElementById('tooltip-img');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipVenue = document.getElementById('tooltip-venue');
    
    if (!tooltip || !tooltipImg || !tooltipTitle || !tooltipVenue) return;
    
    let imgUrl = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=300&auto=format&fit=crop';
    if (event.image && event.image.default) {
        imgUrl = event.image.default.startsWith('http') ? event.image.default : `https://helsinkipaiva.fi${event.image.default}`;
    }
    
    tooltipImg.src = imgUrl;
    tooltipTitle.textContent = event.name;
    tooltipVenue.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> ${event.location || 'Helsinki'}`;
    
    const mapContainer = document.getElementById('map');
    const rect = mapContainer.getBoundingClientRect();
    
    let leftPos = mouseEvent.clientX - rect.left + 15;
    let topPos = mouseEvent.clientY - rect.top + 15;
    
    if (leftPos + 250 > rect.width) {
        leftPos = mouseEvent.clientX - rect.left - 255;
    }
    if (topPos + 180 > rect.height) {
        topPos = mouseEvent.clientY - rect.top - 195;
    }
    
    tooltip.style.left = `${leftPos}px`;
    tooltip.style.top = `${topPos}px`;
    tooltip.style.display = 'block';
}

function hideTooltip() {
    const tooltip = document.getElementById('map-hover-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

// ==========================================================================
// Filter Panel Logic
// ==========================================================================
function getEventCategoryEng(event) {
    if (!event.categories || event.categories.length === 0) return 'Other';
    const slug = event.categories[0].slug;
    return CATEGORY_TRANSLATIONS[slug] || event.categories[0].name;
}

function loadEventsData() {
    fetch('helsinki_day_events.json')
        .then(response => {
            if (!response.ok) throw new Error("Could not load events data");
            return response.json();
        })
        .then(data => {
            allEvents = data.filter(e => {
                const hasCoords = e.location2 && e.location2.lat && e.location2.lng;
                const isOnJune12 = e.dates && e.dates.some(d => d.name === '2026-06-12');
                const isFree = e.free_entry === true || (e.price && e.price.toLowerCase().includes('ilmainen')) || (!e.price && !e.free_entry);
                return hasCoords && isOnJune12 && isFree;
            });
            filteredEvents = [...allEvents];
            
            initFilterPanel();
            renderEventList();
            updateVisitedProgressBar();
            addMapMarkers();
        })
        .catch(err => {
            console.error(err);
            document.getElementById('event-list-container').innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--accent-danger);">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                    <p>Failed to load Helsinki Day events data. Please make sure the JSON file is present in the workspace.</p>
                </div>
            `;
        });
}

function initFilterPanel() {
    renderCategoryPills();

    const categoriesContainer = document.getElementById('categories-container');
    categoriesContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.category-pill');
        if (!pill) return;

        categoriesContainer.querySelectorAll('.category-pill').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });

        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');

        filters.category = pill.getAttribute('data-category');
        applyFilters();
    });

    document.getElementById('search-bar').addEventListener('input', (e) => {
        filters.searchQuery = e.target.value.toLowerCase().trim();
        applyFilters();
    });

    updateStats();
}

function renderCategoryPills() {
    const categoriesSet = new Set();
    allEvents.forEach(event => {
        categoriesSet.add(getEventCategoryEng(event));
    });

    const categoryList = Array.from(categoriesSet).sort();
    const categoriesContainer = document.getElementById('categories-container');
    
    categoriesContainer.innerHTML = '';

    const allBtn = document.createElement('button');
    const isAllActive = (filters.category === 'all');
    allBtn.className = `category-pill ${isAllActive ? 'active' : ''}`;
    allBtn.setAttribute('data-category', 'all');
    allBtn.setAttribute('role', 'tab');
    allBtn.setAttribute('aria-selected', isAllActive ? 'true' : 'false');
    allBtn.textContent = TRANSLATIONS[currentLang].allEvents;
    categoriesContainer.appendChild(allBtn);

    categoryList.forEach(category => {
        const btn = document.createElement('button');
        const isActive = (filters.category === category);
        btn.className = `category-pill ${isActive ? 'active' : ''}`;
        btn.setAttribute('data-category', category);
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        btn.textContent = getCategoryLabel(category);
        categoriesContainer.appendChild(btn);
    });
}

function applyFilters() {
    filteredEvents = allEvents.filter(event => {
        const nameMatch = event.name && event.name.toLowerCase().includes(filters.searchQuery);
        const locMatch = event.location && event.location.toLowerCase().includes(filters.searchQuery);
        const descMatch = event.content && event.content.toLowerCase().includes(filters.searchQuery);
        
        const matchesSearch = filters.searchQuery === '' || (nameMatch || locMatch || descMatch);
        const matchesCategory = filters.category === 'all' || getEventCategoryEng(event) === filters.category;

        return matchesSearch && matchesCategory;
    });

    renderEventList();
    addMapMarkers();
    updateStats();
}

function updateStats() {
    const totalEl = document.getElementById('stats-total');
    const filteredEl = document.getElementById('stats-filtered');

    totalEl.textContent = `${allEvents.length} ${TRANSLATIONS[currentLang].statsTotal}`;
    
    if (filteredEvents.length === allEvents.length) {
        filteredEl.textContent = '';
    } else {
        filteredEl.textContent = TRANSLATIONS[currentLang].statsFiltered.replace('{count}', filteredEvents.length);
    }
}

// ==========================================================================
// Visited Progress Gamification Logic
// ==========================================================================
const visitedEventIds = new Set(JSON.parse(localStorage.getItem('visited_event_ids') || '[]'));

function updateVisitedProgressBar() {
    const total = allEvents.length;
    const visited = allEvents.filter(e => visitedEventIds.has(e.id)).length;
    const percent = total > 0 ? (visited / total) * 100 : 0;
    
    const countTextEl = document.getElementById('visited-count-text');
    if (countTextEl) {
        countTextEl.textContent = TRANSLATIONS[currentLang].visitedCount
            .replace('{visited}', visited)
            .replace('{total}', total);
    }
    
    const barFillEl = document.getElementById('visited-progress-fill');
    if (barFillEl) {
        barFillEl.style.width = `${percent}%`;
    }
}

function toggleEventVisited(eventId) {
    if (visitedEventIds.has(eventId)) {
        visitedEventIds.delete(eventId);
    } else {
        visitedEventIds.add(eventId);
    }
    
    localStorage.setItem('visited_event_ids', JSON.stringify(Array.from(visitedEventIds)));
    updateVisitedProgressBar();
    updateVisitedButtonState(eventId);
    
    const card = document.getElementById(`card-${eventId}`);
    if (card) {
        const oldBadge = card.querySelector('.card-visited-badge');
        if (oldBadge) oldBadge.remove();
        
        if (visitedEventIds.has(eventId)) {
            const badge = document.createElement('div');
            badge.className = 'card-visited-badge';
            badge.title = currentLang === 'fi' ? 'Käyty' : 'Visited';
            badge.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
            card.appendChild(badge);
        }
    }
}

function updateVisitedButtonState(eventId) {
    const btn = document.getElementById('detail-btn-visited');
    if (!btn) return;
    
    const isVisited = visitedEventIds.has(eventId);
    if (isVisited) {
        btn.classList.add('completed-state');
        btn.innerHTML = TRANSLATIONS[currentLang].visited;
    } else {
        btn.classList.remove('completed-state');
        btn.innerHTML = TRANSLATIONS[currentLang].markVisited;
    }
}

// ==========================================================================
// Helper to format event times
// ==========================================================================
function formatEventTime(event) {
    let rawTime = event.time || event.timefirst || (currentLang === 'fi' ? 'Koko päivä' : 'All day');
    rawTime = rawTime.replace(/&ndash;/g, '–');
    const datePattern = /^\d{1,2}\.\d{1,2}\.\d{4}\s*|^\d{1,2}\.\d{1,2}\.\s*/;
    rawTime = rawTime.replace(datePattern, '');
    const result = rawTime.trim();
    return result || (currentLang === 'fi' ? 'Koko päivä' : 'All day');
}

// ==========================================================================
// Sidebar UI Rendering
// ==========================================================================
function renderEventList() {
    const container = document.getElementById('event-list-container');
    
    if (filteredEvents.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <i class="fa-solid fa-magnifying-glass-minus" style="font-size: 2.5rem; margin-bottom: 15px; color: var(--text-muted);"></i>
                <p>${TRANSLATIONS[currentLang].noEvents}</p>
                <button class="btn-header" style="margin: 15px auto 0;" onclick="resetFilters()">${TRANSLATIONS[currentLang].resetFilters}</button>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    filteredEvents.forEach(event => {
        const card = document.createElement('div');
        card.className = `event-card ${activeEventId === event.id ? 'selected' : ''}`;
        card.id = `card-${event.id}`;
        card.setAttribute('role', 'listitem');

        let imgUrl = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=300&auto=format&fit=crop';
        if (event.image && event.image.default) {
            imgUrl = event.image.default.startsWith('http') ? event.image.default : `https://helsinkipaiva.fi${event.image.default}`;
        }

        const isVisited = visitedEventIds.has(event.id);
        const visitedBadgeHtml = isVisited ? `<div class="card-visited-badge" title="${currentLang === 'fi' ? 'Käyty' : 'Visited'}"><i class="fa-solid fa-circle-check"></i></div>` : '';

        card.innerHTML = `
            <img class="event-thumb" src="${imgUrl}" alt="${event.name}" onerror="this.src='https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=150&auto=format&fit=crop'">
            <div class="event-info">
                <div>
                    <h3 class="event-title">${event.name}</h3>
                    <div class="event-meta">
                        <span><i class="fa-regular fa-clock"></i> ${formatEventTime(event)}</span>
                        <span class="event-location-text"><i class="fa-solid fa-location-dot"></i> ${event.location || 'Helsinki'}</span>
                    </div>
                </div>
            </div>
            ${visitedBadgeHtml}
        `;

        card.addEventListener('click', () => {
            selectEvent(event.id, true);
        });

        container.appendChild(card);
    });
}

window.resetFilters = function() {
    filters.searchQuery = '';
    filters.category = 'all';
    document.getElementById('search-bar').value = '';

    const pillsContainer = document.getElementById('categories-container');
    pillsContainer.querySelectorAll('.category-pill').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === 'all') {
            btn.classList.add('active');
        }
    });

    applyFilters();
};

// ==========================================================================
// Select Event & Interaction
// ==========================================================================
function selectEvent(eventId, flyToLocation = true) {
    clearRouteLine();
    const distPanel = document.getElementById('map-distance-panel');
    if (distPanel) distPanel.style.display = 'none';

    if (activeEventId) {
        const oldEvent = allEvents.find(e => e.id === activeEventId);
        const oldMarker = markersMap.get(activeEventId);
        if (oldMarker && oldEvent) {
            const wrapper = oldMarker.getElement();
            const inner = wrapper.querySelector('.maplibre-event-marker-inner');
            if (inner) {
                const cat = getEventCategoryEng(oldEvent);
                const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];
                const emoji = CATEGORY_EMOJIS[cat] || CATEGORY_EMOJIS['Other'];
                inner.classList.remove('selected');
                inner.style.backgroundImage = `url(${createPinCanvas(color, emoji)})`;
            }
            wrapper.style.zIndex = '1';
        }
        const prevCard = document.getElementById(`card-${activeEventId}`);
        if (prevCard) prevCard.classList.remove('selected');
    }

    activeEventId = eventId;
    
    const card = document.getElementById(`card-${eventId}`);
    if (card) {
        card.classList.add('selected');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const newMarker = markersMap.get(eventId);
    const event = allEvents.find(e => e.id === eventId);
    if (newMarker && event) {
        const wrapper = newMarker.getElement();
        const inner = wrapper.querySelector('.maplibre-event-marker-inner');
        if (inner) {
            const cat = getEventCategoryEng(event);
            const emoji = CATEGORY_EMOJIS[cat] || CATEGORY_EMOJIS['Other'];
            inner.classList.add('selected');
            inner.style.backgroundImage = `url(${createPinCanvas('#ff4a4a', emoji)})`;
        }
        wrapper.style.zIndex = '999';
    }

    if (!event) return;

    if (userLocation && event.location2 && event.location2.lat && event.location2.lng) {
        drawPathToEvent(parseFloat(event.location2.lat), parseFloat(event.location2.lng));
    }

    if (flyToLocation && map) {
        const lat = parseFloat(event.location2.lat);
        const lng = parseFloat(event.location2.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
            map.flyTo({
                center: [lng, lat - 0.00015],
                zoom: 16.8,
                pitch: 55,
                bearing: 0,
                duration: 2500,
                essential: true
            });
            
            const hud = document.getElementById('explore-hud-panel');
            if (hud) hud.style.display = 'flex';
        }
    }

    setTimeout(() => {
        openDetailModal(event);
    }, 500);
}

// ==========================================================================
// Detail Modal Management
// ==========================================================================
function openDetailModal(event) {
    const modal = document.getElementById('details-modal');
    
    const imgEl = document.getElementById('detail-img');
    if (event.image && event.image.default) {
        imgEl.src = event.image.default.startsWith('http') ? event.image.default : `https://helsinkipaiva.fi${event.image.default}`;
    } else {
        imgEl.src = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=700&auto=format&fit=crop';
    }
    
    document.getElementById('detail-title-label').textContent = event.name;
    document.getElementById('detail-time').textContent = formatEventTime(event);
    document.getElementById('detail-venue').textContent = event.location || 'Helsinki Day Location';
    document.getElementById('detail-address').textContent = event.location2.address || 'Helsinki, Suomi';
    
    const priceText = event.free_entry ? TRANSLATIONS[currentLang].freeAdmission : TRANSLATIONS[currentLang].paidAdmission;
    document.getElementById('detail-price').textContent = priceText;

    const detailDistRow = document.getElementById('detail-distance-row');
    const detailDistVal = document.getElementById('detail-distance');
    if (userLocation && event.location2 && event.location2.lat && event.location2.lng) {
        const distanceMeters = calculateDistance(userLocation.lat, userLocation.lng, parseFloat(event.location2.lat), parseFloat(event.location2.lng));
        let distanceStr = "";
        if (distanceMeters < 1000) {
            distanceStr = `${Math.round(distanceMeters)} m`;
        } else {
            distanceStr = `${(distanceMeters / 1000).toFixed(1)} km`;
        }
        if (detailDistVal && detailDistRow) {
            detailDistVal.textContent = distanceStr;
            detailDistRow.style.display = 'flex';
        }
    } else {
        if (detailDistRow) detailDistRow.style.display = 'none';
    }

    const descEl = document.getElementById('detail-desc');
    let contentHtml = '';
    
    if (event.debug_group_content) {
        contentHtml = (currentLang === 'fi') ?
            (event.debug_group_content.fi || event.debug_group_content.en || event.debug_group_content.sv) :
            (event.debug_group_content.en || event.debug_group_content.fi || event.debug_group_content.sv);
    } else {
        contentHtml = event.content || '';
    }
    descEl.innerHTML = contentHtml;

    const tagsContainer = document.getElementById('detail-tags-container');
    tagsContainer.innerHTML = '';
    
    const catBadge = document.createElement('span');
    catBadge.className = 'event-badge badge-category';
    catBadge.textContent = getCategoryLabel(getEventCategoryEng(event));
    tagsContainer.appendChild(catBadge);
    
    if (event.free_entry) {
        const freeBadge = document.createElement('span');
        freeBadge.className = 'event-badge badge-free';
        freeBadge.textContent = TRANSLATIONS[currentLang].freeAdmission;
        tagsContainer.appendChild(freeBadge);
    }

    const linkBtn = document.getElementById('detail-link-website');
    if (event.link) {
        linkBtn.href = event.link;
        linkBtn.style.display = 'inline-flex';
    } else {
        linkBtn.style.display = 'none';
    }

    const showMapBtn = document.getElementById('detail-btn-show-map');
    showMapBtn.onclick = () => {
        modal.classList.remove('active');
        selectEvent(event.id, true);
    };

    const visitedBtn = document.getElementById('detail-btn-visited');
    if (visitedBtn) {
        updateVisitedButtonState(event.id);
        visitedBtn.onclick = () => {
            toggleEventVisited(event.id);
        };
    }

    modal.classList.add('active');

    const closeBtn = document.getElementById('details-close');
    closeBtn.onclick = () => modal.classList.remove('active');
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    };
}

// ==========================================================================
// Geolocation & User Tracking
// ==========================================================================
function startTrackingUserLocation() {
    if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by this browser.");
        return;
    }

    userLocationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            updateUserLocationMarker(lat, lng);

            if (activeEventId) {
                const event = allEvents.find(e => e.id === activeEventId);
                if (event && event.location2 && event.location2.lat && event.location2.lng) {
                    drawPathToEvent(parseFloat(event.location2.lat), parseFloat(event.location2.lng));
                }
            }
        },
        (error) => {
            console.warn("Geolocation watch error:", error.message);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 10000
        }
    );
}

function updateUserLocationMarker(lat, lng) {
    if (!map) return;

    userLocation = { lat, lng };

    if (userLocationMarker) {
        userLocationMarker.setLngLat([lng, lat]);
    } else {
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        
        userLocationMarker = new maplibregl.Marker({
            element: el,
            anchor: 'center'
        })
        .setLngLat([lng, lat])
        .addTo(map);
    }
}

// ==========================================================================
// Haversine Distance Calculator
// ==========================================================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function clearRouteLine() {
    if (!map) return;
    if (map.getLayer('route-line')) {
        map.removeLayer('route-line');
    }
    if (map.getSource('route')) {
        map.removeSource('route');
    }
}

function drawPathToEvent(eventLat, eventLng) {
    if (!map || !userLocation) return;

    try {
        const distanceMeters = calculateDistance(userLocation.lat, userLocation.lng, eventLat, eventLng);
        
        let distanceStr = "";
        if (distanceMeters < 1000) {
            distanceStr = `${Math.round(distanceMeters)} m`;
        } else {
            distanceStr = `${(distanceMeters / 1000).toFixed(1)} km`;
        }

        const walkingTimeMinutes = Math.round(distanceMeters / (1.4 * 60));
        let timeStr = "";
        if (walkingTimeMinutes < 60) {
            timeStr = `${walkingTimeMinutes} min`;
        } else {
            const hrs = Math.floor(walkingTimeMinutes / 60);
            const mins = walkingTimeMinutes % 60;
            timeStr = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
        }

        const routeGeoJSON = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [userLocation.lng, userLocation.lat],
                    [eventLng, eventLat]
                ]
            }
        };

        if (map.getSource('route')) {
            map.getSource('route').setData(routeGeoJSON);
        } else {
            map.addSource('route', {
                type: 'geojson',
                data: routeGeoJSON
            });
        }

        if (!map.getLayer('route-line')) {
            map.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#eab308',
                    'line-width': 6,
                    'line-opacity': 0.8
                }
            });
        }

        const distPanel = document.getElementById('map-distance-panel');
        const distValue = document.getElementById('map-distance-value');
        const distTime = document.getElementById('map-distance-time');
        const distDest = document.getElementById('map-distance-dest');

        const activeEvent = allEvents.find(e => e.id === activeEventId);
        const destinationName = activeEvent ? activeEvent.name : 'Selected Event';

        if (distPanel && distValue && distTime && distDest) {
            distValue.textContent = distanceStr;
            distTime.textContent = timeStr;
            distDest.textContent = `To: ${destinationName}`;
            distPanel.style.display = 'flex';
            
            const distCloseBtn = document.getElementById('distance-card-close');
            if (distCloseBtn) {
                distCloseBtn.onclick = (e) => {
                    e.stopPropagation();
                    clearActiveSelection();
                };
            }
        }
    } catch (err) {
        console.error("Error drawing path to event:", err);
    }
}

function clearActiveSelection() {
    if (activeEventId) {
        const oldEvent = allEvents.find(e => e.id === activeEventId);
        const oldMarker = markersMap.get(activeEventId);
        if (oldMarker && oldEvent) {
            const wrapper = oldMarker.getElement();
            const inner = wrapper.querySelector('.maplibre-event-marker-inner');
            if (inner) {
                const cat = getEventCategoryEng(oldEvent);
                const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];
                const emoji = CATEGORY_EMOJIS[cat] || CATEGORY_EMOJIS['Other'];
                inner.classList.remove('selected');
                inner.style.backgroundImage = `url(${createPinCanvas(color, emoji)})`;
            }
            wrapper.style.zIndex = '1';
        }

        const prevCard = document.getElementById(`card-${activeEventId}`);
        if (prevCard) prevCard.classList.remove('selected');
        
        activeEventId = null;
    }

    clearRouteLine();

    const distPanel = document.getElementById('map-distance-panel');
    if (distPanel) distPanel.style.display = 'none';
    
    const hud = document.getElementById('explore-hud-panel');
    if (hud) hud.style.display = 'none';

    if (map) {
        map.flyTo({
            center: [HELSINKI_CENTER.lng, HELSINKI_CENTER.lat],
            zoom: HELSINKI_CENTER.zoom,
            pitch: HELSINKI_CENTER.pitch,
            bearing: HELSINKI_CENTER.bearing,
            duration: 2000
        });
    }
}

// ==========================================================================
// Keyboard Controls
// ==========================================================================
function initKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
            return;
        }
        
        const key = e.key.toLowerCase();
        activeKeys.add(key);
        
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase()) && activeEventId) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        activeKeys.delete(e.key.toLowerCase());
    });
}

function updateCameraFromKeyboard() {
    if (!map) return;

    if (activeKeys.size > 0) {
        const panSpeed = 6;
        const rotateSpeed = 1.2;
        const pitchSpeed = 0.8;
        
        let dx = 0;
        let dy = 0;
        let dbearing = 0;
        let dpitch = 0;
        
        if (activeKeys.has('w')) dy -= panSpeed;
        if (activeKeys.has('s')) dy += panSpeed;
        if (activeKeys.has('a')) dx -= panSpeed;
        if (activeKeys.has('d')) dx += panSpeed;
        
        if (activeKeys.has('q') || activeKeys.has('arrowleft')) dbearing -= rotateSpeed;
        if (activeKeys.has('e') || activeKeys.has('arrowright')) dbearing += rotateSpeed;
        
        if (activeKeys.has('r') || activeKeys.has('arrowup')) dpitch += pitchSpeed;
        if (activeKeys.has('f') || activeKeys.has('arrowdown')) dpitch -= pitchSpeed;
        
        if (dx !== 0 || dy !== 0) {
            map.panBy([dx, dy], { duration: 0 });
        }
        if (dbearing !== 0) {
            map.setBearing(map.getBearing() + dbearing);
        }
        if (dpitch !== 0) {
            const newPitch = Math.max(0, Math.min(85, map.getPitch() + dpitch));
            map.setPitch(newPitch);
        }
    }

    animationFrameId = requestAnimationFrame(updateCameraFromKeyboard);
}
