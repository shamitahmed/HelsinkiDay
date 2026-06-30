// Helsinki Day 3D Geospatial Visualizer - CesiumJS Application Script

// ==========================================================================
// Configurations & Global State
// ==========================================================================
const DEFAULT_CESIUM_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmNGU0YThhMy1mYWJkLTQzOWItYWU0Mi1kOGI4OTg3ZjBkZDgiLCJpZCI6MTU5MzYxLCJpYXQiOjE3MTU5MTMxOTl9.zN9602u36wS090u82e2s11_gO4tXfGGtYfJ74A'; // Default Cesium Ion Token

let viewer = null;
let activeTileset = null;
let currentImageryLayer = null;
let allEvents = [];
let filteredEvents = [];
let activeEventId = null;
let entitiesMap = new Map(); // Store Cesium entities keyed by event ID
let userLocationEntity = null;
let userLocationWatchId = null;
let routePolylineEntity = null;
const activeKeys = new Set();

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

const CATEGORY_ICONS = {
    'Music': 'fa-music',
    'Children': 'fa-child',
    'Open Doors & Exhibitions': 'fa-door-open',
    'Design & Workshops': 'fa-palette',
    'Nature & Environment': 'fa-tree',
    'Literature': 'fa-book',
    'Dance & Theatre': 'fa-masks-theater',
    'Sports & Wellness': 'fa-heart-pulse',
    'Food': 'fa-utensils',
    'The Sea': 'fa-ship',
    'Seniors': 'fa-person-cane',
    'Youth': 'fa-people-group',
    'Classics': 'fa-landmark',
    'Night Events': 'fa-moon'
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
    height: 450 // camera height in meters
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
        btnSettings: "<i class='fa-solid fa-gear'></i> 3D Map Keys",
        searchPlaceholder: "Search Helsinki Day events...",
        filterInfo: "<span><i class='fa-regular fa-calendar'></i> Friday, June 12</span><span><i class='fa-solid fa-ticket'></i> Free Admission</span>",
        allEvents: "All Events",
        other: "Other",
        statsTotal: "events loaded",
        statsFiltered: "Showing {count} results",
        hudTitle: "<i class='fa-solid fa-person-walking animate-pulse'></i> First-Person Explore",
        hudWalk: "Walk / Strafe",
        hudLook: "Look Around",
        hudTilt: "Tilt Up / Down",
        hudFooter: "Mouse drag to orbit | Scroll to zoom",
        routeActive: "<i class='fa-solid fa-route-highway animate-pulse'></i> Route Active",
        distance: "Distance",
        estWalk: "Est. Walk",
        min: "min",
        settingsTitle: "Configure 3D Map",
        cesiumLabel: "Cesium Ion Access Token",
        googleLabel: "Google Map Tiles API Key (Optional)",
        cesiumHelp: "An Ion token enables high-resolution Cesium World Terrain and global 3D OSM buildings. Get a free token at <a href='https://cesium.com/ion' target='_blank' rel='noopener noreferrer'>cesium.com/ion</a>.",
        googleHelp: "Provide a Google Maps API key to overlay **Google Photorealistic 3D Tiles** (Google Earth mesh) directly in the viewer! Enable the 'Map Tiles API' on your Google Cloud Console.",
        cancel: "Cancel",
        save: "Save Settings",
        detailTime: "Time",
        detailVenue: "Venue",
        detailAddress: "Address",
        detailAdmission: "Admission",
        detailDistance: "Distance from You",
        visitWebsite: "<i class='fa-solid fa-arrow-up-right-from-square'></i> Visit Event Website",
        flyToMap: "<i class='fa-solid fa-location-crosshairs'></i> Fly to Map Location",
        freeAdmission: "Free Admission",
        scheduleNotSpecified: "Schedule not specified",
        locationNotSpecified: "Location not specified",
        noEvents: "No events match your active filters.",
        resetFilters: "Reset Filters",
        markVisited: "<i class='fa-regular fa-square-check'></i> Mark Visited",
        visited: "<i class='fa-solid fa-square-check'></i> Visited!",
        visitedTitle: "<i class='fa-solid fa-trophy'></i> Explorer Progress",
        visitedCount: "{visited} / {total} Visited",
        qualityLabel: "Map Render Quality",
        qualityHigh: "High Quality (Sharp, High-DPI)",
        qualityMedium: "Balanced (Sharp & Smoother)",
        qualityLow: "High Performance (Fastest)",
        qualityHelp: "If the 3D map is laggy when moving, change this to Balanced or High Performance."
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
        btnSettings: "<i class='fa-solid fa-gear'></i> 3D-kartan avaimet",
        searchPlaceholder: "Hae Helsinki-päivän tapahtumia...",
        filterInfo: "<span><i class='fa-regular fa-calendar'></i> Perjantai 12. kesäkuuta</span><span><i class='fa-solid fa-ticket'></i> Vapaa pääsy</span>",
        allEvents: "Kaikki tapahtumat",
        other: "Muut",
        statsTotal: "tapahtumaa ladattu",
        statsFiltered: "Näytetään {count} tulosta",
        hudTitle: "<i class='fa-solid fa-person-walking animate-pulse'></i> Katunäkymä -ohjaus",
        hudWalk: "Kävele / Väistä",
        hudLook: "Katso ympärille",
        hudTilt: "Kallista ylös / alas",
        hudFooter: "Hiiri raahaa: pyöritä | Rulla: zoomaa",
        routeActive: "<i class='fa-solid fa-route-highway animate-pulse'></i> Reitti aktiivinen",
        distance: "Etäisyys",
        estWalk: "Kävelyaika",
        min: "min",
        settingsTitle: "Määritä 3D-kartta",
        cesiumLabel: "Cesium Ion -käyttöavain",
        googleLabel: "Google Map Tiles -avain (Valinnainen)",
        cesiumHelp: "Ion-avain mahdollistaa tarkan Cesium World Terrainin ja maailmanlaajuiset 3D OSM -rakennukset. Hanki ilmainen avain osoitteesta <a href='https://cesium.com/ion' target='_blank' rel='noopener noreferrer'>cesium.com/ion</a>.",
        googleHelp: "Anna Google Maps -avain nähdäksesi **Google Photorealistic 3D Tiles** (Google Earth -3D-malli) suoraan kartalla! Ota käyttöön 'Map Tiles API' Google Cloud Consolessa.",
        cancel: "Peruuta",
        save: "Tallenna asetukset",
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
        visitedCount: "{visited} / {total} Käyty",
        qualityLabel: "Kartan kuvanlaatu",
        qualityHigh: "Korkea laatu (Tarkka, High-DPI)",
        qualityMedium: "Tasapainoinen (Tarkka ja sujuvampi)",
        qualityLow: "Korkea suorituskyky (Nopein)",
        qualityHelp: "Jos 3D-kartta on hidas tai nykii, vaihda tasapainoiseen tai korkeaan suorituskykyyn."
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
    // 0. Celebration banner text
    const bannerTextEl = document.querySelector('.ticker-text');
    if (bannerTextEl) {
        bannerTextEl.innerHTML = generateTickerContent(currentLang);
        
        // Adjust animation speed to keep velocity constant
        setTimeout(() => {
            const textWidth = bannerTextEl.offsetWidth || 2000;
            const viewportWidth = window.innerWidth;
            const totalDistance = textWidth + viewportWidth;
            const speed = 75; // pixels per second
            const duration = totalDistance / speed;
            bannerTextEl.style.animationDuration = `${duration}s`;
        }, 50);
    }

    // 1. Header brand title
    const titleEl = document.getElementById('main-heading');
    if (titleEl) titleEl.textContent = TRANSLATIONS[currentLang].title;
    
    // 2. Action buttons
    const userLocBtn = document.getElementById('btn-user-location');
    if (userLocBtn) userLocBtn.innerHTML = TRANSLATIONS[currentLang].btnLocation;
    
    const recenterBtn = document.getElementById('btn-recenter');
    if (recenterBtn) recenterBtn.innerHTML = TRANSLATIONS[currentLang].btnRecenter;
    
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) settingsBtn.innerHTML = TRANSLATIONS[currentLang].btnSettings;
    
    // 3. Search Bar
    const searchBar = document.getElementById('search-bar');
    if (searchBar) searchBar.placeholder = TRANSLATIONS[currentLang].searchPlaceholder;
    
    // 4. Static Badge Info
    const badgeEl = document.querySelector('.filters-info-badge');
    if (badgeEl) badgeEl.innerHTML = TRANSLATIONS[currentLang].filterInfo;
    
    // 5. Settings Modal
    const setModalTitle = document.getElementById('settings-title');
    if (setModalTitle) setModalTitle.textContent = TRANSLATIONS[currentLang].settingsTitle;
    
    const cesiumLbl = document.querySelector('label[for="cesium-token-input"]');
    if (cesiumLbl) cesiumLbl.textContent = TRANSLATIONS[currentLang].cesiumLabel;
    
    const googleLbl = document.querySelector('label[for="google-key-input"]');
    if (googleLbl) googleLbl.textContent = TRANSLATIONS[currentLang].googleLabel;
    
    const modalHelps = document.querySelectorAll('#settings-modal .form-help');
    if (modalHelps.length >= 2) {
        modalHelps[0].innerHTML = TRANSLATIONS[currentLang].cesiumHelp;
        modalHelps[1].innerHTML = TRANSLATIONS[currentLang].googleHelp;
    }
    
    // Quality select localization
    const labelQuality = document.getElementById('label-quality');
    if (labelQuality) labelQuality.textContent = TRANSLATIONS[currentLang].qualityLabel;
    
    const optHigh = document.getElementById('opt-quality-high');
    if (optHigh) optHigh.textContent = TRANSLATIONS[currentLang].qualityHigh;
    
    const optMedium = document.getElementById('opt-quality-medium');
    if (optMedium) optMedium.textContent = TRANSLATIONS[currentLang].qualityMedium;
    
    const optLow = document.getElementById('opt-quality-low');
    if (optLow) optLow.textContent = TRANSLATIONS[currentLang].qualityLow;
    
    const helpQuality = document.getElementById('help-quality');
    if (helpQuality) helpQuality.textContent = TRANSLATIONS[currentLang].qualityHelp;
    
    const setCancel = document.getElementById('settings-cancel');
    if (setCancel) setCancel.textContent = TRANSLATIONS[currentLang].cancel;
    
    const setSave = document.getElementById('settings-save');
    if (setSave) setSave.textContent = TRANSLATIONS[currentLang].save;
    
    // 6. Details Modal Labels
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

    // 7. Distance Card
    const distTitle = document.querySelector('.distance-title');
    if (distTitle) distTitle.innerHTML = TRANSLATIONS[currentLang].routeActive;
    
    const distLabels = document.querySelectorAll('.map-distance-card .distance-label');
    if (distLabels.length >= 2) {
        distLabels[0].textContent = TRANSLATIONS[currentLang].distance;
        distLabels[1].textContent = TRANSLATIONS[currentLang].estWalk;
    }
    
    // 8. HUD Card
    const hudTitle = document.querySelector('.hud-title');
    if (hudTitle) hudTitle.innerHTML = TRANSLATIONS[currentLang].hudTitle;
    
    const hudActions = document.querySelectorAll('.explore-hud-card .hud-action');
    if (hudActions.length >= 3) {
        hudActions[0].textContent = TRANSLATIONS[currentLang].hudWalk;
        hudActions[1].textContent = TRANSLATIONS[currentLang].hudLook;
        hudActions[2].textContent = TRANSLATIONS[currentLang].hudTilt;
    }
    
    const hudFoot = document.querySelector('.hud-footer');
    if (hudFoot) hudFoot.textContent = TRANSLATIONS[currentLang].hudFooter;

    // 8.5 Visited Progress Title and button state
    const visitedTitleEl = document.getElementById('text-visited-title');
    if (visitedTitleEl) {
        visitedTitleEl.innerHTML = TRANSLATIONS[currentLang].visitedTitle;
    }
    updateVisitedProgressBar();
    if (activeEventId) {
        updateVisitedButtonState(activeEventId);
    }

    // 9. Re-render category pills and cards if data is loaded
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
    initSettingsModal();
    initLanguageSwitcher();
    initializeCesiumViewer();
    loadEventsData();
    updateLanguageUI();
});

// Settings / API Keys Setup
function getCesiumToken() {
    const savedToken = localStorage.getItem('cesium_ion_token');
    return savedToken && savedToken.trim() !== '' ? savedToken : DEFAULT_CESIUM_TOKEN;
}

function initSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('btn-settings');
    const settingsClose = document.getElementById('settings-close');
    const settingsCancel = document.getElementById('settings-cancel');
    const settingsSave = document.getElementById('settings-save');
    const tokenInput = document.getElementById('cesium-token-input');
    const googleInput = document.getElementById('google-key-input');
    const qualitySelect = document.getElementById('quality-select');

    settingsBtn.addEventListener('click', () => {
        tokenInput.value = localStorage.getItem('cesium_ion_token') || '';
        googleInput.value = localStorage.getItem('google_maps_api_key') || '';
        if (qualitySelect) {
            qualitySelect.value = localStorage.getItem('map_quality') || 'high';
        }
        settingsModal.classList.add('active');
    });

    const closeModal = () => settingsModal.classList.remove('active');
    settingsClose.addEventListener('click', closeModal);
    settingsCancel.addEventListener('click', closeModal);

    settingsSave.addEventListener('click', () => {
        const token = tokenInput.value.trim();
        const googleKey = googleInput.value.trim();
        const quality = qualitySelect ? qualitySelect.value : 'high';
        
        if (token) localStorage.setItem('cesium_ion_token', token);
        else localStorage.removeItem('cesium_ion_token');
        
        if (googleKey) localStorage.setItem('google_maps_api_key', googleKey);
        else localStorage.removeItem('google_maps_api_key');

        localStorage.setItem('map_quality', quality);
        
        closeModal();
        window.location.reload(); // Reload page to apply new tokens and quality settings
    });
}

function initializeCesiumViewer() {
    // Set Cesium Ion Access Token
    Cesium.Ion.defaultAccessToken = getCesiumToken();

    const quality = localStorage.getItem('map_quality') || 'high';

    try {
        // Initialize Cesium 3D Globe Viewer with high-performance contexts
        viewer = new Cesium.Viewer('map', {
            terrain: Cesium.Terrain.fromWorldTerrain({
                requestVertexNormals: (quality !== 'low') // Disabling terrain shading normals yields a massive render speedup on Low Quality
            }),
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            navigationHelpButton: false,
            sceneModePicker: false,
            selectionIndicator: false,
            timeline: false,
            animation: false,
            fullscreenButton: false,
            scene3DOnly: true,
            contextOptions: {
                webgl: {
                    powerPreference: "high-performance" // Instructs browser to request dedicated GPU if available
                }
            }
        });

        // Apply quality settings dynamically
        if (quality === 'high') {
            viewer.resolutionScale = Math.min(window.devicePixelRatio, 2.0); // Retina/High-DPI resolution
            viewer.scene.msaaSamples = 4; // High Quality Anti-aliasing
            viewer.scene.globe.maximumScreenSpaceError = 2; // High detail terrain
            viewer.scene.globe.showGroundAtmosphere = true; // Haze shading enabled
        } else if (quality === 'medium') {
            viewer.resolutionScale = Math.min(window.devicePixelRatio, 1.5); // Balanced resolution
            viewer.scene.msaaSamples = 2; // Balanced anti-aliasing
            viewer.scene.globe.maximumScreenSpaceError = 3; // Medium detail terrain
            viewer.scene.globe.showGroundAtmosphere = false; // Disable ground atmosphere
        } else { // 'low'
            viewer.resolutionScale = 1.0; // Standard resolution
            viewer.scene.msaaSamples = 1; // Anti-aliasing disabled
            viewer.scene.globe.maximumScreenSpaceError = 5; // Low detail terrain
            viewer.scene.globe.showGroundAtmosphere = false; // Disable ground atmosphere
        }

        // Performance Optimizations
        viewer.scene.globe.tileCacheSize = 256; // Cache loaded tiles to avoid re-requests
        viewer.scene.requestRenderMode = true; // Render frames only when needed, reducing CPU/GPU overhead

        // Hide default credentials footer
        if (viewer.bottomContainer) {
            viewer.bottomContainer.style.display = 'none';
        }

        // Enable atmospheric lighting and shadows
        viewer.scene.globe.enableLighting = true;
        viewer.scene.fog.enabled = true;

        // Set camera starting position
        viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(HELSINKI_CENTER.lng, HELSINKI_CENTER.lat - 0.006, HELSINKI_CENTER.height),
            orientation: {
                heading: Cesium.Math.toRadians(0.0), // Look North
                pitch: Cesium.Math.toRadians(-40.0), // Look down
                roll: 0.0
            }
        });

        // Load 3D Meshes (Google 3D Tiles vs Cesium OSM Buildings)
        load3DBuildings();

        // Load Default base layer (Carto Voyager Streets)
        switchImageryLayer('streets');

        // Bind control buttons
        bindMapControls();
        bindStyleSwitcher();
        
        // Listen for user clicks on entities
        bindMapClicks();

        // Start tracking user location automatically on load
        startTrackingUserLocation();

        // Initialize keyboard controls for first-person exploration
        initKeyboardControls();
        
        // Listen to scene clock tick to update camera positions
        viewer.clock.onTick.addEventListener(updateCameraFromKeyboard);

    } catch (e) {
        console.error("Cesium Viewer initialization failed:", e);
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="position: absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; color:var(--text-secondary); max-width:400px; padding:20px;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size:3rem; color:var(--accent-danger); margin-bottom:15px;"></i>
                    <h3>Cesium 3D Globe Failed</h3>
                    <p style="margin:10px 0 20px;">WebGL might be disabled, or the library failed to load. Make sure you have an active internet connection.</p>
                </div>
            `;
        }
    }
}

// ==========================================================================
// 3D Meshes, Imagery and Toggles
// ==========================================================================
async function load3DBuildings() {
    if (activeTileset) {
        viewer.scene.primitives.remove(activeTileset);
        activeTileset = null;
    }

    const googleKey = localStorage.getItem('google_maps_api_key');
    const badge = document.querySelector('.brand-badge');
    const quality = localStorage.getItem('map_quality') || 'high';

    if (googleKey && googleKey.trim() !== '') {
        try {
            Cesium.GoogleMaps.defaultApiKey = googleKey;
            const googleTileset = await Cesium.createGooglePhotorealistic3DTileset();
            
            if (quality === 'high') {
                googleTileset.maximumScreenSpaceError = 16;
                googleTileset.progressiveResolutionHeightFraction = 0.3;
            } else if (quality === 'medium') {
                googleTileset.maximumScreenSpaceError = 32;
                googleTileset.progressiveResolutionHeightFraction = 0.4;
            } else {
                googleTileset.maximumScreenSpaceError = 64;
                googleTileset.progressiveResolutionHeightFraction = 0.5;
            }
            
            activeTileset = viewer.scene.primitives.add(googleTileset);
            
            if (badge) {
                badge.textContent = "Google 3D";
                badge.style.background = "rgba(0, 210, 255, 0.15)";
                badge.style.color = "var(--accent-blue)";
                badge.style.borderColor = "rgba(0, 210, 255, 0.3)";
            }
            showCesiumNotification("Running on Google Photorealistic 3D Tiles. Enjoy photorealistic city details!");
        } catch (err) {
            console.warn("Failed to load Google 3D Tiles, falling back to OSM buildings:", err);
            await loadOsmBuildings();
        }
    } else {
        await loadOsmBuildings();
    }
}

async function loadOsmBuildings() {
    try {
        const osmBuildings = await Cesium.createOsmBuildingsAsync();
        const quality = localStorage.getItem('map_quality') || 'high';
        
        if (quality === 'high') {
            osmBuildings.maximumScreenSpaceError = 16;
            osmBuildings.progressiveResolutionHeightFraction = 0.3;
        } else if (quality === 'medium') {
            osmBuildings.maximumScreenSpaceError = 32;
            osmBuildings.progressiveResolutionHeightFraction = 0.4;
        } else {
            osmBuildings.maximumScreenSpaceError = 64;
            osmBuildings.progressiveResolutionHeightFraction = 0.5;
        }
        
        activeTileset = viewer.scene.primitives.add(osmBuildings);
        
        const badge = document.querySelector('.brand-badge');
        if (badge) {
            badge.textContent = "OSM 3D Buildings";
            badge.style.background = "rgba(148, 163, 184, 0.1)";
            badge.style.color = "var(--text-secondary)";
            badge.style.borderColor = "rgba(148, 163, 184, 0.2)";
        }
        showCesiumNotification("Running on free Cesium OSM Buildings. Add Google API Key in settings for full photorealism.");
    } catch (err) {
        console.error("OSM Buildings failed to bind:", err);
    }
}

function switchImageryLayer(styleType) {
    if (!viewer) return;
    const layers = viewer.imageryLayers;
    
    if (currentImageryLayer) {
        layers.remove(currentImageryLayer);
        currentImageryLayer = null;
    }

    document.querySelectorAll('#style-switcher-group .control-btn').forEach(btn => btn.classList.remove('active'));

    if (styleType === 'streets') {
        document.getElementById('btn-style-streets').classList.add('active');
        currentImageryLayer = layers.addImageryProvider(
            new Cesium.UrlTemplateImageryProvider({
                url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                subdomains: ['a', 'b', 'c', 'd'],
                credit: '© OpenStreetMap contributors, © CARTO'
            })
        );
    } else if (styleType === 'satellite') {
        document.getElementById('btn-style-satellite').classList.add('active');
        currentImageryLayer = layers.addImageryProvider(
            new Cesium.UrlTemplateImageryProvider({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                credit: 'Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            })
        );
    } else if (styleType === 'dark') {
        document.getElementById('btn-style-dark').classList.add('active');
        currentImageryLayer = layers.addImageryProvider(
            new Cesium.UrlTemplateImageryProvider({
                url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                subdomains: ['a', 'b', 'c', 'd'],
                credit: '© OpenStreetMap contributors, © CARTO'
            })
        );
    }
}

function bindMapControls() {
    document.getElementById('btn-recenter').onclick = () => {
        if (!viewer) return;
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(HELSINKI_CENTER.lng, HELSINKI_CENTER.lat - 0.006, HELSINKI_CENTER.height),
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-40.0),
                roll: 0.0
            },
            duration: 2.0
        });
    };

    document.getElementById('btn-zoom-in').onclick = () => {
        if (viewer) viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.3);
    };
    document.getElementById('btn-zoom-out').onclick = () => {
        if (viewer) viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.35);
    };

    document.getElementById('btn-reset-north').onclick = () => {
        if (!viewer) return;
        viewer.camera.flyTo({
            destination: viewer.camera.position,
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: viewer.camera.pitch,
                roll: 0.0
            },
            duration: 1.0
        });
    };

    let buildingsVisible = true;
    const toggle3dBtn = document.getElementById('btn-toggle-3d');
    toggle3dBtn.onclick = () => {
        buildingsVisible = !buildingsVisible;
        if (activeTileset) activeTileset.show = buildingsVisible;
        if (buildingsVisible) toggle3dBtn.classList.add('active');
        else toggle3dBtn.classList.remove('active');
    };
    toggle3dBtn.classList.add('active');

    let terrainVisible = true;
    const toggleTerrainBtn = document.getElementById('btn-toggle-terrain');
    toggleTerrainBtn.onclick = async () => {
        terrainVisible = !terrainVisible;
        if (terrainVisible) {
            try {
                viewer.terrainProvider = await Cesium.createWorldTerrainAsync({ requestVertexNormals: true });
                toggleTerrainBtn.classList.add('active');
            } catch (err) {
                console.error("Failed to load terrain:", err);
                terrainVisible = false;
                toggleTerrainBtn.classList.remove('active');
            }
        } else {
            viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
            toggleTerrainBtn.classList.remove('active');
        }
    };
    toggleTerrainBtn.classList.add('active');

    const userLocBtn = document.getElementById('btn-user-location');
    if (userLocBtn) {
        userLocBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert("Geolocation is not supported by your browser.");
                return;
            }

            const icon = userLocBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-spinner fa-spin';

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (icon) icon.className = 'fa-solid fa-location-arrow';
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    updateUserLocationMarker(lat, lng);
                    
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(lng, lat - 0.002, 250.0),
                        orientation: {
                            heading: Cesium.Math.toRadians(0.0),
                            pitch: Cesium.Math.toRadians(-35.0),
                            roll: 0.0
                        },
                        duration: 2.0
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

function showCesiumNotification(text) {
    const mapWrapper = document.querySelector('.map-wrapper');
    if (!mapWrapper) return;
    
    const oldCesiumBanner = document.getElementById('cesium-banner');
    if (oldCesiumBanner) oldCesiumBanner.remove();

    const banner = document.createElement('div');
    banner.id = 'cesium-banner';
    banner.style.position = 'absolute';
    banner.style.bottom = '20px';
    banner.style.left = '20px';
    banner.style.background = 'rgba(13, 19, 31, 0.95)';
    banner.style.border = '1px solid var(--border-color)';
    banner.style.borderRadius = 'var(--border-radius-md)';
    banner.style.padding = '12px 16px';
    banner.style.fontSize = '0.78rem';
    banner.style.color = 'var(--text-secondary)';
    banner.style.zIndex = '99';
    banner.style.backdropFilter = 'blur(8px)';
    banner.style.maxWidth = '320px';
    banner.style.boxShadow = 'var(--shadow-premium)';
    banner.innerHTML = `
        <span style="color: var(--accent-blue); font-weight:600;"><i class="fa-solid fa-cube"></i> Cesium 3D Globe Active</span><br/>
        ${text}
    `;
    mapWrapper.appendChild(banner);
}

// ==========================================================================
// Marker/Entity Management
// ==========================================================================
function addMapMarkers() {
    if (!viewer) return;

    entitiesMap.forEach(entity => viewer.entities.remove(entity));
    entitiesMap.clear();

    filteredEvents.forEach(event => {
        const lat = parseFloat(event.location2.lat);
        const lng = parseFloat(event.location2.lng);

        if (isNaN(lat) || isNaN(lng)) return;

        const categoryEng = getEventCategoryEng(event);
        const isSelected = (activeEventId === event.id);
        const color = isSelected ? '#ff4a4a' : (CATEGORY_COLORS[categoryEng] || CATEGORY_COLORS['Other']);
        const emoji = CATEGORY_EMOJIS[categoryEng] || CATEGORY_EMOJIS['Other'];
        
        const pinImage = createPinCanvas(color, emoji);

        const entity = viewer.entities.add({
            id: `event-${event.id}`,
            position: Cesium.Cartesian3.fromDegrees(lng, lat, 0.0),
            billboard: {
                image: pinImage,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                scale: isSelected ? 0.3125 : 0.25,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            properties: {
                eventId: event.id
            }
        });

        entitiesMap.set(event.id, entity);
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

function bindMapClicks() {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    
    handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.position);
        if (Cesium.defined(pickedObject) && pickedObject.id) {
            const entity = pickedObject.id;
            if (entity.properties && entity.properties.eventId) {
                const eventId = entity.properties.eventId.getValue();
                selectEvent(eventId, false);
            }
        } else {
            clearActiveSelection();
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    const tooltip = document.getElementById('map-hover-tooltip');
    const tooltipImg = document.getElementById('tooltip-img');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipVenue = document.getElementById('tooltip-venue');

    handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.endPosition);
        if (Cesium.defined(pickedObject) && pickedObject.id) {
            const entity = pickedObject.id;
            if (entity.properties && entity.properties.eventId) {
                const eventId = entity.properties.eventId.getValue();
                const event = allEvents.find(e => e.id === eventId);
                if (event && tooltip && tooltipImg && tooltipTitle && tooltipVenue) {
                    let imgUrl = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=300&auto=format&fit=crop';
                    if (event.image && event.image.default) {
                        imgUrl = event.image.default.startsWith('http') ? event.image.default : `https://helsinkipaiva.fi${event.image.default}`;
                    }
                    
                    tooltipImg.src = imgUrl;
                    tooltipTitle.textContent = event.name;
                    tooltipVenue.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> ${event.location || 'Helsinki'}`;
                    
                    let leftPos = movement.endPosition.x + 15;
                    let topPos = movement.endPosition.y + 15;
                    
                    const containerWidth = viewer.scene.canvas.clientWidth;
                    const containerHeight = viewer.scene.canvas.clientHeight;
                    
                    if (leftPos + 250 > containerWidth) leftPos = movement.endPosition.x - 265;
                    if (topPos + 180 > containerHeight) topPos = movement.endPosition.y - 195;
                    
                    tooltip.style.left = `${leftPos}px`;
                    tooltip.style.top = `${topPos}px`;
                    tooltip.style.display = 'block';
                    
                    viewer.scene.canvas.style.cursor = 'pointer';
                    return;
                }
            }
        }
        
        if (tooltip) tooltip.style.display = 'none';
        viewer.scene.canvas.style.cursor = 'default';
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
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
    if (barFillEl) barFillEl.style.width = `${percent}%`;
}

function toggleEventVisited(eventId) {
    if (visitedEventIds.has(eventId)) visitedEventIds.delete(eventId);
    else visitedEventIds.add(eventId);
    
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

        card.addEventListener('click', () => selectEvent(event.id, true));
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
        if (btn.getAttribute('data-category') === 'all') btn.classList.add('active');
    });

    applyFilters();
};

// ==========================================================================
// Select Event & Interaction
// ==========================================================================
function selectEvent(eventId, flyToLocation = true) {
    if (routePolylineEntity && viewer) {
        viewer.entities.remove(routePolylineEntity);
        routePolylineEntity = null;
    }
    const distPanel = document.getElementById('map-distance-panel');
    if (distPanel) distPanel.style.display = 'none';

    if (activeEventId) {
        const oldEvent = allEvents.find(e => e.id === activeEventId);
        if (oldEvent) {
            const oldEntity = entitiesMap.get(activeEventId);
            if (oldEntity) {
                const cat = getEventCategoryEng(oldEvent);
                const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];
                const emoji = CATEGORY_EMOJIS[cat] || CATEGORY_EMOJIS['Other'];
                oldEntity.billboard.image = createPinCanvas(color, emoji);
                oldEntity.billboard.scale = 0.25;
            }
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

    const entity = entitiesMap.get(eventId);
    if (entity) {
        const event = allEvents.find(e => e.id === eventId);
        const cat = event ? getEventCategoryEng(event) : 'Other';
        const emoji = CATEGORY_EMOJIS[cat] || CATEGORY_EMOJIS['Other'];
        entity.billboard.image = createPinCanvas('#ff4a4a', emoji);
        entity.billboard.scale = 0.3125;
    }

    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;

    if (userLocationEntity && event.location2 && event.location2.lat && event.location2.lng) {
        drawPathToEvent(parseFloat(event.location2.lat), parseFloat(event.location2.lng));
    }

    if (flyToLocation && viewer) {
        const lat = parseFloat(event.location2.lat);
        const lng = parseFloat(event.location2.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
            const cartographic = Cesium.Cartographic.fromDegrees(lng, lat);
            let terrainHeight = viewer.scene.globe.getHeight(cartographic) || 0.0;
            if (terrainHeight < 0) terrainHeight = 0;
            
            const cameraHeight = terrainHeight + 12.0;
            const destination = Cesium.Cartesian3.fromDegrees(lng, lat - 0.00025, cameraHeight);

            viewer.camera.flyTo({
                destination: destination,
                orientation: {
                    heading: Cesium.Math.toRadians(0.0),
                    pitch: Cesium.Math.toRadians(-5.0),
                    roll: 0.0
                },
                duration: 2.5,
                essential: true
            });
            
            const hud = document.getElementById('explore-hud-panel');
            if (hud) hud.style.display = 'flex';
        }
    }

    setTimeout(() => openDetailModal(event), 500);
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
    if (userLocationEntity && event.location2 && event.location2.lat && event.location2.lng) {
        try {
            const userPosition = userLocationEntity.position.getValue(Cesium.JulianDate.now());
            const eventPosition = Cesium.Cartesian3.fromDegrees(parseFloat(event.location2.lng), parseFloat(event.location2.lat));
            const distanceMeters = Cesium.Cartesian3.distance(userPosition, eventPosition);
            let distanceStr = "";
            if (distanceMeters < 1000) distanceStr = `${Math.round(distanceMeters)} m`;
            else distanceStr = `${(distanceMeters / 1000).toFixed(1)} km`;
            
            if (detailDistVal && detailDistRow) {
                detailDistVal.textContent = distanceStr;
                detailDistRow.style.display = 'flex';
            }
        } catch (e) {
            if (detailDistRow) detailDistRow.style.display = 'none';
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
        visitedBtn.onclick = () => toggleEventVisited(event.id);
    }

    modal.classList.add('active');

    const closeBtn = document.getElementById('details-close');
    closeBtn.onclick = () => modal.classList.remove('active');
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('active');
    };
}

// ==========================================================================
// Geolocation & User Tracking
// ==========================================================================
function createUserLocationCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 210, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(64, 64, 48, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 64, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0084ff';
    ctx.beginPath();
    ctx.arc(64, 64, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 64, 20, 0, Math.PI * 2);
    ctx.stroke();

    return canvas.toDataURL();
}

function startTrackingUserLocation() {
    if (!navigator.geolocation) return;

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
        (error) => console.warn("Geolocation watch error:", error.message),
        { enableHighAccuracy: true, maximumAge: 10000 }
    );
}

function updateUserLocationMarker(lat, lng) {
    if (!viewer) return;
    const position = Cesium.Cartesian3.fromDegrees(lng, lat);

    if (userLocationEntity) {
        userLocationEntity.position = position;
    } else {
        userLocationEntity = viewer.entities.add({
            id: 'user-location-marker',
            position: position,
            billboard: {
                image: createUserLocationCanvas(),
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                scale: 0.375,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
    }
}

function drawPathToEvent(eventLat, eventLng) {
    if (!viewer || !userLocationEntity) return;

    try {
        const userPosition = userLocationEntity.position.getValue(Cesium.JulianDate.now());
        const eventPosition = Cesium.Cartesian3.fromDegrees(eventLng, eventLat);

        if (routePolylineEntity) {
            viewer.entities.remove(routePolylineEntity);
            routePolylineEntity = null;
        }

        const distanceMeters = Cesium.Cartesian3.distance(userPosition, eventPosition);
        let distanceStr = "";
        if (distanceMeters < 1000) distanceStr = `${Math.round(distanceMeters)} m`;
        else distanceStr = `${(distanceMeters / 1000).toFixed(1)} km`;

        const walkingTimeMinutes = Math.round(distanceMeters / (1.4 * 60));
        let timeStr = "";
        if (walkingTimeMinutes < 60) timeStr = `${walkingTimeMinutes} min`;
        else {
            const hrs = Math.floor(walkingTimeMinutes / 60);
            const mins = walkingTimeMinutes % 60;
            timeStr = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
        }

        routePolylineEntity = viewer.entities.add({
            id: 'route-polyline',
            polyline: {
                positions: [userPosition, eventPosition],
                width: 6,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.25,
                    color: Cesium.Color.fromCssColorString('#eab308')
                }),
                clampToGround: true
            }
        });

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
        if (oldEvent) {
            const oldEntity = entitiesMap.get(activeEventId);
            if (oldEntity) {
                const cat = getEventCategoryEng(oldEvent);
                const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];
                const emoji = CATEGORY_EMOJIS[cat] || CATEGORY_EMOJIS['Other'];
                oldEntity.billboard.image = createPinCanvas(color, emoji);
                oldEntity.billboard.scale = 0.25;
            }
        }
        const prevCard = document.getElementById(`card-${activeEventId}`);
        if (prevCard) prevCard.classList.remove('selected');
        activeEventId = null;
    }

    if (routePolylineEntity && viewer) {
        viewer.entities.remove(routePolylineEntity);
        routePolylineEntity = null;
    }

    const distPanel = document.getElementById('map-distance-panel');
    if (distPanel) distPanel.style.display = 'none';
    
    const hud = document.getElementById('explore-hud-panel');
    if (hud) hud.style.display = 'none';

    if (viewer) {
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(HELSINKI_CENTER.lng, HELSINKI_CENTER.lat - 0.006, HELSINKI_CENTER.height),
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-40.0),
                roll: 0.0
            },
            duration: 2.0
        });
    }
}

function initKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) return;
        
        const key = e.key.toLowerCase();
        activeKeys.add(key);
        
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase()) && activeEventId) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => activeKeys.delete(e.key.toLowerCase()));
}

function updateCameraFromKeyboard() {
    if (!viewer || activeKeys.size === 0) return;

    const camera = viewer.camera;
    const height = camera.positionCartographic.height;
    
    const baseSpeed = Math.max(0.6, height * 0.04);
    const turnSpeed = 0.016;

    if (activeKeys.has('w') || activeKeys.has('arrowup')) camera.moveForward(baseSpeed);
    if (activeKeys.has('s') || activeKeys.has('arrowdown')) camera.moveBackward(baseSpeed);
    if (activeKeys.has('a')) camera.moveLeft(baseSpeed);
    if (activeKeys.has('d')) camera.moveRight(baseSpeed);
    if (activeKeys.has('q') || activeKeys.has('arrowleft')) camera.lookLeft(turnSpeed);
    if (activeKeys.has('e') || activeKeys.has('arrowright')) camera.lookRight(turnSpeed);
    if (activeKeys.has('r')) camera.lookUp(turnSpeed * 0.65);
    if (activeKeys.has('f')) camera.lookDown(turnSpeed * 0.65);

    viewer.scene.requestRender();
}
