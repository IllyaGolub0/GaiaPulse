# NASA Space Apps Challenge 2026 — Project Submission Kit (`GaiaPulse`)

> Use this file to copy and paste verified, English-language answers directly into your team's **Project** tab on the NASA Space Apps Challenge website before **Sunday, November 15, 2026 at 11:59 p.m.** (your Local Event's time zone, or Team Owner's local time if registered for the Universal Event).

---

## 1. Ready-to-Paste Form Fields (English Required)

### Field 1: `Project Name`
```text
GaiaPulse — NASA Earth System Trend Detective
```

---

### Field 2: `High-Level Project Summary`
```text
GaiaPulse (Earth System Trend Detective) is a full-stack geospatial and statistical analytics web platform built for the NASA Space Apps Challenge 2026 ("Be an Earth System Trend Detective"). It connects interactive 2D/3D Earth visualization with live NASA and Space Agency Partner datasets to help students, educators, and researchers distinguish statistically significant long-term climate and ecological trends (p < 0.05) from seasonal cycles and interannual noise. Users can inspect 13 satellite and reanalysis variables (from MODIS Aqua, Aura OMI, SeaWiFS, GPM IMERG, MERRA-2, GLDAS, CERES, SWOT, and CSA RADARSAT), compare opposite regional climate dipoles, ingest live NASA EONET v3 natural events, upload CSV exports from NASA Giovanni/AppEEARS/NOAA CDO, and verify significance using Student's t-test, Hamed-Rao AR(1) Mann-Kendall, Theil-Sen slopes with 95% confidence intervals, Pettitt regime-shift detection, STL decomposition, and a Time-to-Significance calculator.
```

---

### Field 3: `Link to Project Demo`
> **Instructions (Pages 7, 10–11):** Paste a **publicly accessible link** (no login, password, or permission request required) to **either**:
> - A **≤ 7-slide presentation deck** (including title & intro slides — e.g., Google Slides set to *"Anyone with the link can view"*, Canva public view link, or PDF on GitHub/Drive), **OR**
> - A **≤ 30-second video** (YouTube Unlisted/Public or Google Drive public link; if spoken in Ukrainian, **English subtitles are mandatory**; **no persons under 18 years old** may appear).
>
> *Warning: Exceeding 7 slides or 30 seconds disqualifies the project from Global Judging!*

```text
<INSERT YOUR PUBLIC DEMO LINK HERE — e.g. https://youtu.be/... or https://docs.google.com/presentation/d/...>
```

---

### Field 4: `Link to Final Project`
> **Instructions (Pages 5–7):** Provide the publicly accessible URL to your live deployed web application and/or GitHub repository. If you host on a new custom domain, consider submitting a FortiGuard Web Filter Classification request (Category: `Education` or `Web-based Application`, Company Name: `N/A`) so judges' corporate/institutional firewalls do not block it.

```text
Live Web Application: <INSERT DEPLOYED URL HERE, e.g. https://gaiapulse-...herokuapp.com or Render/Railway URL>
Source Code Repository: https://github.com/IllyaGolub0/GaiaPulse
```

---

### Field 5: `Detailed Project Description`
```text
### What It Does
GaiaPulse turns the statistical detective workflow inspired by Dr. James Acker's NASA Goddard challenge ("Be an Earth System Trend Detective") into an interactive, reproducible workspace:
1. Interactive 2D & 3D Earth Explorer: Switch seamlessly between a 2D Leaflet map with NASA GIBS satellite imagery layers (VIIRS CityLights, Blue Marble, MODIS True Color, MODIS Land Surface Temperature, Aerosol Optical Depth) and an interactive 3D MapLibre globe. Click any coordinates on Earth—or select two regions simultaneously for cross-regional Dipole Comparison—with optional 5-point Region of Interest (ROI) spatial box averaging (center + ±0.5° lat/lon) to reduce single-pixel noise.
2. 13 Multi-Agency Satellite & Reanalysis Variables: Analyze SEAWIFS_CHLA (1998–2010), SWOT_WSE (2016–2026), RCM_SAR_BACKSCATTER (2019–2026), AOD, SO2, T2M, PRECTOTCORR, GWETROOT, QRUNOFF, EVPTRNS, ALLSKY_SFC_SW_DWN, SNODP, and SST, complete with biome filters and plain-language definitions for students.
3. Curated Case Studies & Live NASA EONET v3 Events: Explore 7 benchmark scenarios (including Dr. Acker's SeaWiFS coastal chlorophyll vs. open-shelf study from NASA NTRS 20090042747, Canadian wildfires & Wisconsin summer AOD smoke transport, CSA SWOT & RADARSAT boreal lake/sea-ice monitoring, Kasatochi SO2 radiative cooling, ENSO Pacific rainfall dipole, Arctic amplification vs. the North Atlantic warming hole, and an emerging soil-moisture trend in Southern Ukraine) or load live events directly from the NASA EONET v3 API.
4. Rigorous Statistical & Seasonal Filtering Engine: Switch between Raw, Deseasonalized (climatological cycle removed), DJF, MAM, JJA, and SON modes, or inspect the 6-Mode Seasonal Fingerprint Matrix at a glance. The engine runs OLS linear regression, Student's t-test, Hamed-Rao AR(1) autocorrelation-corrected Mann-Kendall trend tests, Theil-Sen robust slopes with 95% confidence intervals, Pettitt change-point detection, LOESS STL decomposition (Trend / Seasonal / Residual), Pearson & Spearman dipole correlation, and a Weatherhead-based Time-to-Significance calculator showing how many additional years of satellite observations are needed when p >= 0.05.
5. Direct CSV Ingestion & Official Verification Hub: Drag-and-drop CSV time series exported from NASA Giovanni, AppEEARS, GES DISC, or NOAA CDO (with automatic `#` metadata header stripping and `-900` fill-value filtering), export JSON/CSV or a printable PDF Mission Brief, and jump straight to 13 official NASA, NOAA, KNMI, and CSA verification portals via context-aware deep links pre-filled with the active bounding box and time window.

### How It Works
- Frontend: React 18, TypeScript, Vite, TailwindCSS, React-Leaflet, MapLibre GL JS, and Plotly.js (`react-plotly.js`), plus a `Ctrl+K` Command Palette, interactive first-visit Guided Tour, URL parameter synchronization, client-side LRU caching, and bilingual `EN | UA` switching (defaulting to English).
- Backend: Python 3.12 and FastAPI (`uvicorn`) with modular routers (`routers/analysis.py`, `routers/system.py`), Pydantic v2 validation (`schemas.py`), asynchronous `httpx` fetching from NASA POWER and NASA EONET v3 (`nasa_client.py`, `phenomena_service.py`) with 6-hour in-memory TTL caching and calibrated offline resilience, CSV parsing (`csv_parser.py`), and scientific computing (`numpy`, `pandas`, `scipy`, `pymannkendall`, `statsmodels`) in `statistics_engine.py`.
- Deployment & Quality: Single-service PaaS pipeline (`package.json`, `Procfile`, `Dockerfile`, `docker-compose.yml`) serving both the REST API (`/api/v2/*`, `/docs`) and the compiled SPA (`frontend/dist`), backed by GitHub Actions CI running `ruff`, `mypy`, `pytest`, `vitest`, and `vite build`.

### Benefits & Impact
Many students and non-specialists misread normal seasonal swings or single-year weather spikes as climate trends—or miss real emerging signals masked by seasonal noise. GaiaPulse makes formal trend significance testing visual, fast, and transparent: users immediately see whether an observed change passes `p < 0.05`, why seasonality matters, and how long satellites must observe before a trend becomes statistically separable from natural variability.
```

---

### Field 6: `Use of Super Intelligence (SI)`
> *(Note per Page 8: This question is for data-collection purposes, and we also disclose SI usage in `README.md`, `frontend/index.html` metadata, and the in-app Official Resources Hub. No NASA logos, flags, or mission identifiers were generated or modified by SI.)*

```text
Super Intelligence (SI) / AI coding assistants were NOT used to generate our challenge idea, scientific methodology, or dataset architecture—those were conceived and designed by our human team based on Dr. James Acker's Earth System Trend Detective challenge materials. SI tools (LLM coding assistants) were used strictly to accelerate boilerplate FastAPI/React scaffolding, TailwindCSS styling refinement, bilingual (EN/UA) UI translation, and unit test authoring. All statistical equations, NASA/CSA dataset bounds, API integrations, and outputs were manually reviewed, tested, and verified by the team. In compliance with the NASA Space Apps rules, no NASA branding, logos, flags, or mission identifiers were generated or modified using SI, and SI assistance is explicitly disclosed in our README.md, HTML metadata, and in-app Resources Hub.
```

---

### Field 7: `NASA Data`
```text
GaiaPulse integrates the following official NASA datasets, APIs, and research portals:
1. NASA POWER API (Prediction Of Worldwide Energy Resources — `https://power.larc.nasa.gov/api/temporal/monthly/point`): Asynchronous monthly & annual point/5-point ROI time series for MERRA-2, CERES/FLASHFlux, GPM IMERG, and GLDAS parameters (T2M, PRECTOTCORR, GWETROOT, QRUNOFF, EVPTRNS, ALLSKY_SFC_SW_DWN, SNODP, SST).
2. NASA EONET v3 API (`https://eonet.gsfc.nasa.gov/api/v3/events`): Live Earth Observatory Natural Event Tracker feed mapping active Wildfires, Volcanoes, Severe Storms, Floods, Drought, and Sea/Lake Ice events to matching satellite trend channels.
3. NASA GIBS WMTS (`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/...`): Satellite map tile layers including BlueMarble_NextGeneration, VIIRS_CityLights_2012, MODIS_Terra_CorrectedReflectance_TrueColor, MODIS_Terra_CorrectedReflectance_Bands721, MODIS_Terra_Land_Surface_Temp_Day, and MODIS_Terra_Aerosol.
4. NASA Giovanni (`https://giovanni.gsfc.nasa.gov/giovanni/`): Referenced for MODIS Aqua AOD 550nm, OrbView-2 SeaWiFS Coastal Chlorophyll-a (1998–2010), Aura OMI SO2, AIRS T2M, and GPM precipitation, plus context-aware deep links and Giovanni CSV import support.
5. NASA GES DISC Hydrology Time Series (`https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series`): GLDAS/NLDAS soil moisture, evapotranspiration, and streamflow runoff variables.
6. NASA AppEEARS (`https://appeears.earthdatacloud.nasa.gov/`): Referenced and supported for CSV point/polygon time-series extraction.
7. NASA NTRS Technical Report 20090042747 (`https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf` — Dr. James Acker's SeaWiFS coastal chlorophyll study): Used as our benchmark estuarine chlorophyll-a vs. river runoff case study.
8. NASA / CNES / CSA SWOT Mission (`SWOT_WSE`, 2016–2026): Water surface elevation analytics for lakes, rivers, and reservoirs.
```

---

### Field 8: `Space Agency Partner Data and Other References`
```text
Space Agency Partners:
- Canadian Space Agency (CSA):
  * RADARSAT Constellation Mission (RCM) Data (`https://donnees-data.asc-csa.gc.ca/en/dataset/rcm`) — C-band SAR backscatter (σ°, dB) for all-weather sea ice, flood, wetland, and surface moisture monitoring (2019–2026).
  * Geo.ca (`https://geo.ca/`) — Canada's open geospatial portal for boreal ecosystems, wildfire, and surface water reference context.
  * CSA SWOT Mission Portal (`https://www.asc-csa.gc.ca/eng/satellites/swot/`) — Surface Water and Ocean Topography mission context.
  * CSA "Monitoring and Protecting Our Ecosystems from Space" (`https://www.asc-csa.gc.ca/eng/satellites/everyday-lives/monitoring-and-protecting-our-ecosystems-from-space.asp`) and CSA SAR Python Tutorial (`https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial`).

Other Government & Scientific References:
- NOAA Climate Data Online (CDO) (`https://www.ncei.noaa.gov/cdo-web/`) — Ground weather station cross-validation and CSV import support.
- KNMI Climate Explorer (`https://climexp.knmi.nl/`) — Climate field correlation and dipole teleconnection reference.
- Statistical Methodology References: Dr. James Acker's challenge trend methodology, Weatherhead et al. (1998) Time-to-Significance formulation, Hamed & Rao (1998) modified Mann-Kendall test for autocorrelated series, Pettitt (1979) change-point test, Cleveland et al. STL decomposition, and open-source methodology guides referenced in our in-app hub.

Open-Source Software & Libraries:
- Backend: Python 3.12, FastAPI, Uvicorn, HTTPX, Pydantic, NumPy, Pandas, SciPy, PyMannKendall, Statsmodels, Pytest.
- Frontend: React 18, TypeScript, Vite, TailwindCSS, React-Leaflet, MapLibre GL JS, Plotly.js, Lucide React, Vitest.
```

---

## 2. Project Demo Blueprints (Choose ONE Format Only)

### Option A: 7-Slide Presentation Deck (Recommended if Short on Time)
> **Strict Limit:** Maximum **7 slides total** (including title slide). Keep text concise, font readable, and include screenshots of GaiaPulse in English (`?lang=en`).

1. **Slide 1 — Title & Team Intro**
   - **Project Name:** *GaiaPulse — NASA Earth System Trend Detective*
   - **Challenge:** *Be an Earth System Trend Detective*
   - **Team Name & Members:** `<Team Name>` — `<Member 1, Member 2, ...>`
   - **Tagline:** *Separating Real Climate Signals (`p < 0.05`) from Seasonal & Interannual Noise.*
2. **Slide 2 — The Problem & Inspiration**
   - Why raw satellite series mislead: natural summer/winter swings or single extreme years hide real trends (or create false alarms).
   - How Dr. James Acker's SeaWiFS coastal study & NASA/CSA datasets inspired a unified detective tool for students and researchers.
3. **Slide 3 — Solution & User Experience (Screenshot 1: Map/Globe + Verdict Hero)**
   - Show the live English UI (`VerdictHero`, 2D NASA GIBS map / 3D Globe, 13 variables).
   - 3-step UX: Pick coordinates or a live NASA EONET event → Choose seasonal filter (`Raw`, `Deseasonalized`, `DJF/MAM/JJA/SON`) → Get instant statistical verdict (`p-value`, confidence interval, regime shift).
4. **Slide 4 — Multi-Agency NASA & CSA Data Architecture**
   - Diagram/list showing: NASA POWER API, NASA EONET v3, NASA GIBS WMTS, NASA Giovanni/AppEEARS/GES DISC CSV import, plus CSA RADARSAT (`RCM`) & `SWOT` inland water/ice telemetry.
5. **Slide 5 — Statistical Verification Engine (Screenshot 2: Charts & 6-Season Matrix)**
   - Highlight the math: Student's t-test, Hamed-Rao AR(1) Mann-Kendall, Theil-Sen slope (95% CI), Pettitt regime-shift detector, STL decomposition, 5-pt ROI box averaging, and Weatherhead **Time-to-Significance** calculator.
6. **Slide 6 — Real Case Study: Regional Dipole & Emerging Trends (Screenshot 3: Dipole / PDF Brief)**
   - Showcase either the **Mississippi Plume vs. Open Gulf (`SEAWIFS_CHLA`)** or **Wisconsin Summer Smoke (`AOD`, `JJA` vs `DJF`)** or **ENSO Hydrological Dipole**, plus 1-click **PDF Mission Brief** export and **Verify in NASA Giovanni** deep links.
7. **Slide 7 — Impact, Tech Stack & Future Vision**
   - Tech stack: FastAPI + SciPy/Statsmodels/PyMannKendall + React/TypeScript/Plotly/Leaflet/MapLibre.
   - Impact: Making climate attribution literacy accessible to classrooms, citizen scientists, and local environmental monitors worldwide.

---

### Option B: 30-Second Video Pitch Script
> **Strict Limits:** **30 seconds or less** (aim for `0:27–0:29` so platform rounding stays `<= 0:30`). If speaking in Ukrainian, burn in **English subtitles**. Do **not** show anyone under 18 years old.

- **[0:00–0:03] Introduce Yourself & Challenge:**
  > *"Hi, we're Team `<Team Name>` from `<City/Country>` tackling NASA's 'Be an Earth System Trend Detective' challenge."*
  *(Visual: Quick title card + screen capture of GaiaPulse landing in English.)*
- **[0:03–0:08] Name Your Project & Hook:**
  > *"Meet GaiaPulse—an interactive Earth analytics detective that separates real climate trends from seasonal noise."*
  *(Visual: Switching between 2D NASA GIBS map and 3D Globe.)*
- **[0:08–0:21] Show How It Works + NASA & CSA Data:**
  > *"Using live NASA POWER, EONET, GIBS, and Canadian Space Agency SWOT and RADARSAT data, anyone can click a region, strip seasonal cycles or test a 6-season matrix, import Giovanni CSVs, and verify significance with Mann-Kendall, Theil-Sen slopes, and Time-to-Significance."*
  *(Visual: Clicking a preset like Wisconsin Wildfires JJA vs DJF, hovering the VerdictHero `p < 0.05` badge, STL chart, and Giovanni deep-link.)*
- **[0:21–0:29] Look Into the Future:**
  > *"GaiaPulse turns complex satellite archives into clear, verifiable evidence—empowering students and scientists everywhere to spot planetary change before it's too late."*
  *(Visual: Exporting PDF Mission Brief + final card with Project Name & GitHub/App URL.)*
