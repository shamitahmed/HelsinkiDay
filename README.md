# Helsinki Day Event Explorer

An interactive, responsive geospatial web application designed to help locals and visitors discover, navigate, and track events across the city during **Helsinki Day 2026**.

The project is fully optimized for public use, requiring **no API keys or tokens** for its default deployment. It also includes an offline backup version powered by CesiumJS for advanced 3D visualization.

<img width="1901" height="867" alt="helsinki1" src="https://github.com/user-attachments/assets/aa2691f9-36c1-4969-80b2-74c5a95b12ae" />

## 🌟 Key Features

* **Interactive Geospatial Visualizer**: Browse events on a fast, modern map with seamless zoom, panning, and automatic fly-to animations.
* **Custom Map Pin Markers**: Unique high-DPI canvas map pins color-coded by event categories with embedded emojis representing each activity type.
* **Smart Filtering & Search**: Find events instantly using keyword search and category filters (e.g., Music, Children, Nature, Food, Night Events).
* **Explorer Progress (Gamification)**: Keep track of events you visit! Check off completed events in the sidebar to fill up your dynamic explorer progress bar (persisted via local storage).
* **Walking Routes & Distance**: Calculates real-time geodesic distance (via the Haversine formula) and estimated walk times between your GPS location and selected events, rendered on the map as a glowing path.
* **Hover Tooltips**: Hover over map markers to quickly preview the event's hero image, title, and venue before opening full details.
* **Bilingual Support**: Instant toggle between English (EN) and Finnish (FI) translations across the entire interface.
* **Keyboard Navigation**: Navigate the map using standard gaming controls (`W`, `A`, `S`, `D` to pan, `Q`, `E` or arrow keys to rotate, and `R`, `F` to tilt).

---

## 🗺️ Map Engines

The project features two distinct map engines to support both lightweight public hosting and high-fidelity 3D rendering:

### 1. Default Version (MapLibre GL JS)
* **Files**: `index.html` & `app.js`
* **Features**: Uses open-source **MapLibre GL JS** with free raster tiles (Carto Voyager Streets, ESRI Satellite, and Carto Positron). 
* **Key Benefit**: Requires **zero API keys or configuration**, loads instantly, and runs at 60fps on mobile viewports. **Perfect for public web deployments.**

### 2. Advanced 3D Version (CesiumJS)
* **Files**: `index_cesium.html` & `app_cesium.js`
* **Features**: Powered by **CesiumJS** and optionally integrates Google Photorealistic 3D Tiles (Google Earth mesh) or Cesium OSM Buildings and World Terrain.
* **Key Benefit**: Provides advanced 3D geospatial visuals. Access tokens and API keys can be configured directly inside the map settings modal.

---

## 📂 Project Structure

```
├── index.html               # Default entry point (MapLibre Version)
├── app.js                   # Default core script (MapLibre Version)
├── index_cesium.html        # CesiumJS entry point (Backup Version)
├── app_cesium.js            # CesiumJS script (Backup Version)
├── styles.css               # Shared premium design system (CSS)
├── helsinki_day_events.json # Static events database (June 12 events)
├── .gitignore               # Configured to ignore Vercel configs
└── README.md                # Project documentation
```

---

## 🚀 How to Run Locally

Since the application consists of static HTML, CSS, and JS, you can run it using any simple local web server:

1. **Serve the project**:
   ```bash
   # Using Node (npx)
   npx serve ./
   
   # Or using Python
   python -m http.server 8000
   ```
2. **Access the map**:
   * For the **Free MapLibre version**: Open `http://localhost:3000/` (or `http://localhost:8000/index.html`).
   * For the **CesiumJS version**: Open `http://localhost:3000/index_cesium.html`.

---

## 🌐 Deployment

This project is configured for instant deployment to static hosting providers:

* **Vercel**: Deployments are automated via Vercel config. The live production instance is hosted at [helsinkiday.vercel.app](https://helsinkiday.vercel.app/).
