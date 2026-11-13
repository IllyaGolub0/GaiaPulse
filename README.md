# GaiaPulse — NASA Earth System Trend Detective (v2.1)

**[English Version](#english-version) | [Українська версія](#українська-версія)**

---

<a id="english-version"></a>

## English Version

### Overview

**GaiaPulse (Earth System Trend Detective v2.1)** is a full-stack geospatial and statistical analytics platform developed for the **NASA Space Apps Challenge 2026 ("Be an Earth System Trend Detective", authored by Dr. James Acker — NASA Goddard Space Flight Center)**.

The platform integrates official satellite, reanalysis, radar, and station resources from **NASA**, **NOAA**, **KNMI**, and the **Canadian Space Agency (CSA)** to help students, researchers, and Earth system detectives distinguish statistically significant climate and ecological trends (`p < 0.05`) from natural seasonal and interannual noise.

---

### Key Capabilities

1. **13 Multi-Agency Satellite & Reanalysis Variables (NASA, NOAA, CSA)**:
   - `SEAWIFS_CHLA` — Coastal & Estuarine Chlorophyll-a (`mg/m³`, NASA SeaWiFS / MODIS Aqua / Giovanni)
   - `SWOT_WSE` — Water Surface Elevation for Lakes, Rivers & Reservoirs (`m above reference ellipsoid`, NASA / CNES / CSA SWOT Mission)
   - `RCM_SAR_BACKSCATTER` — C-Band SAR Surface Moisture, Flood & Sea Ice Index (`dB σ°`, CSA RADARSAT Constellation Mission / Geo.ca)
   - `AOD` — Aerosol Optical Depth 550 nm (`AOD`, NASA MODIS Aqua)
   - `SO2` — Sulfur Dioxide Column Amount (`DU`, NASA Aura OMI)
   - `T2M` — Surface Air Temperature at 2m (`°C`, NASA MERRA-2 / Aqua AIRS)
   - `PRECTOTCORR` — Corrected Precipitation Rate (`mm/day`, NASA GPM IMERG / MERRA-2)
   - `GWETROOT` — Root Zone Soil Moisture (`fraction 0-1`, NASA GLDAS / SMAP)
   - `QRUNOFF` — Surface & Subsurface Streamflow Runoff (`mm/day`, NASA GES DISC Hydrology / GLDAS)
   - `EVPTRNS` — Evapotranspiration Flux (`mm/day`, NASA GLDAS)
   - `ALLSKY_SFC_SW_DWN` — Surface Shortwave Solar Radiation (`W/m²`, NASA CERES / FLASHFlux)
   - `SNODP` — Snow Depth & Cryosphere Cover (`m`, NASA MODIS / MERRA-2)
   - `SST` — Sea / Skin Surface Temperature (`°C`, NASA GHRSST / MODIS)

2. **Curated Historical Phenomena & Live NASA EONET v3 Feed (`GET /api/v2/fetch-phenomena`)**:
   - **7 Curated Scientific Scenarios**:
     1. *Canadian Wildfires & Smoke Transport over Wisconsin (2002–2026)* — MODIS Aqua `AOD`, Summer `JJA` vs. Winter `DJF`
     2. *Acker's SeaWiFS Coastal Chlorophyll Study (NASA NTRS 20090042747)* — Mississippi River Plume / Chesapeake Bay vs. Open Gulf of Mexico Shelf (`SEAWIFS_CHLA` & `QRUNOFF` Dipole)
     3. *CSA SWOT & RADARSAT Canadian Water & Ice Monitor* — Hudson Bay & Boreal Lakes (`SWOT_WSE` & `RCM_SAR_BACKSCATTER`)
     4. *Kasatochi Eruption & Sulfur Cooling Trap (Aleutian Islands)* — Aura OMI `SO2` & CERES `ALLSKY_SFC_SW_DWN`
     5. *El Nino / Southern Oscillation (ENSO) Hydrological Dipole* — Peru/Ecuador Coast vs. Indonesia/Northern Australia (`PRECTOTCORR`, `DJF`)
     6. *Arctic Amplification vs. North Atlantic Warming Hole* — Svalbard vs. Subpolar North Atlantic (`T2M`, `deseasonalized`)
     7. *Ukraine Southern Steppe Soil Moisture & Evaporation* — Emerging trend (`p ≈ 0.07`) showcasing the **Time-to-Significance Calculator**
   - **Live NASA EONET v3 Events**: Asynchronous real-time ingestion from `https://eonet.gsfc.nasa.gov/api/v3/events` with automatic mapping of Wildfires, Volcanoes, Floods, Severe Storms, Drought, and Sea Ice to corresponding satellite channels and offline caching.

3. **Mathematical & Statistical Verification Engine (`POST /api/v2/analyze`)**:
   - **Seasonal & Deseasonalized Filtering (`season_mode`)**: `raw` (all months), `deseasonalized` (climatological monthly cycle removed), `DJF` (Winter), `MAM` (Spring), `JJA` (Summer), `SON` (Autumn).
   - **Parametric & Non-Parametric Tests**: Ordinary Least Squares (OLS), `Student's t-test` (`t_stat`, `p_value`, degrees of freedom), `Mann-Kendall monotonic trend test` (`z_score`, `p_value`), and `Theil-Sen robust slope estimator` (per year & per decade with `95% Confidence Intervals`).
   - **Time-to-Significance Calculator**: Based on Weatherhead et al. ($N^{3/2}$ scaling), estimates how many additional years of satellite observations are needed to reach `p < 0.05` when a trend is still emerging.
   - **STL Decomposition & Dipole Engine**: Seasonal-Trend decomposition using LOESS (`statsmodels`) and cross-regional Pearson ($r$) & Spearman ($\rho$) dipole correlation.

4. **CSV Importer for NASA Giovanni, AppEEARS, GES DISC & NOAA CDO (`POST /api/v2/analyze-csv`)**:
   - Drag-and-drop CSV upload or 1-click official templates (`Date`/`Year`/`time` + `Value`/`data` columns) with automatic `#` comment stripping, deseasonalization, and full statistical verification.

5. **Official NASA, NOAA, KNMI & CSA Resources Hub (13 Portals) & Context Deep-Links**:
   - Structured catalog of 13 verified agency portals across 3 categories (*NASA & NOAA Data*, *Partner & Statistical Methodology*, *CSA Canadian Space Agency*) plus contextual verification links under every chart (*Verify in NASA Giovanni*, *Explore in AppEEARS*, *Check in KNMI Climate Explorer*, *GES DISC Hydrology*, *NOAA CDO*, *CSA SWOT / RCM*).

---

### Technology Stack

- **Backend**: Python 3.12, FastAPI, Uvicorn, HTTPX, NumPy, Pandas, SciPy, PyMannKendall, Statsmodels.
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS (Catppuccin Mocha palette), React-Leaflet (2D Map), MapLibre GL JS (3D Globe), Plotly.js (`react-plotly.js`), Lucide React.
- **Deployment**: Single-service Heroku buildpipeline (`package.json` `heroku-postbuild` + `Procfile` + `.python-version` serving the compiled React SPA directly via FastAPI), Docker, and Docker Compose.

---

### Repository Structure

```text
.
├── main.py                  # FastAPI server, /api/v2/* routes, CSV parser & production SPA static server
├── phenomena_service.py     # Curated historical cases (Dr. Acker & CSA) + live NASA EONET v3 fetcher
├── nasa_client.py           # Async NASA POWER API client, caching & calibrated satellite time series
├── statistics_engine.py     # Seasonal filter, Student's t-test, Mann-Kendall, Sen's slope, STL, TTS
├── presets.py               # Catalog of 13 NASA/CSA variables, 13 official resources & GIBS metadata
├── requirements.txt         # Python backend dependencies
├── package.json             # Root build script (heroku-postbuild) for single-service cloud deployment
├── Procfile                 # Heroku / PaaS web process definition
├── .python-version          # Python 3.12 runtime pin
├── Dockerfile               # Container image definition
├── docker-compose.yml       # Multi-container orchestration
├── start.ps1                # Automated one-command launcher for Windows PowerShell
├── start.bat                # Automated launcher for Windows CMD
├── start.sh                 # Automated launcher for macOS / Linux / WSL
└── frontend/                # React 18 + TypeScript + Vite client application
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── index.css
        ├── types/
        │   └── climate.ts
        ├── services/
        │   └── api.ts
        └── components/
            ├── DetectiveStepper.tsx
            ├── PhenomenaDrawer.tsx
            ├── OfficialResourcesHub.tsx
            ├── EarthMap.tsx
            ├── Globe3DView.tsx
            ├── VerdictCard.tsx
            └── TrendCharts.tsx
```

---

### Quick Start & Deployment

#### Option 1: Single-Service Cloud Deployment (Heroku / Render / Railway)
The repository is configured for zero-configuration single-service deployment using both Node.js and Python buildpacks:
1. During `heroku-postbuild` (defined in root `package.json`), Node.js installs frontend dependencies and builds the production bundle into `frontend/dist`.
2. `Procfile` launches `uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}`, which serves both the `/api/v2/*` REST endpoints and the compiled React SPA (`frontend/dist/index.html`).

#### Option 2: Automated Local Launch (One Command)
- **Windows (PowerShell or double-click `start.bat`)**:
  ```powershell
  .\start.ps1
  ```
- **macOS / Linux / WSL**:
  ```bash
  chmod +x start.sh
  ./start.sh
  ```

#### Option 3: Manual Development Setup
1. **Backend (Port `8000`)**:
   ```bash
   python -m venv .venv
   # Windows PowerShell:
   .\.venv\Scripts\Activate.ps1
   # macOS / Linux:
   # source .venv/bin/activate

   pip install -r requirements.txt
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. **Frontend (Port `5173`)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Web Application: `http://127.0.0.1:5173`
   - OpenAPI / Swagger UI: `http://127.0.0.1:8000/docs`

#### Option 4: Docker Compose
```bash
docker compose up --build
```

---

### API Reference Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v2/fetch-phenomena` | Returns 7 curated NASA/CSA scenarios + live NASA EONET v3 events |
| `POST` | `/api/v2/analyze` | Executes seasonal filtering, OLS, Student's t-test, Mann-Kendall, 95% CI, STL & Time-to-Significance |
| `POST` | `/api/v2/analyze-csv` | Parses and analyzes CSV time series from Giovanni, AppEEARS, GES DISC, or NOAA CDO |
| `GET` | `/api/v2/resources` | Returns the 13 official NASA, NOAA, KNMI & CSA resources and official disclaimer |
| `GET` | `/api/variables` | Returns metadata, units, student definitions, and biomes for all 13 variables |
| `GET` | `/api/v2/health` | Health status and in-memory cache telemetry |

---

### Official Disclaimer

> Disclaimer: NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. For non-U.S. Government websites, participants must comply with any data use parameters of that specific website.

---
---

<a id="українська-версія"></a>

## Українська версія

### Огляд проєкту

**GaiaPulse (Earth System Trend Detective v2.1)** — повнофункціональна геопросторова та статистична аналітична платформа, розроблена для **NASA Space Apps Challenge 2026 ("Be an Earth System Trend Detective", автор челенджу д-р Джеймс Екер — NASA Goddard Space Flight Center)**.

Додаток об'єднує офіційні супутникові, радарні та метеорологічні ресурси **NASA**, **NOAA**, **KNMI** та **Канадського космічного агентства (CSA)**, дозволяючи дослідникам та студентам статистично відділяти реальні довгострокові кліматичні й екологічні тренди (`p < 0.05`) від природного сезонного та міжрічного шуму.

---

### Ключові можливості

1. **Каталог із 13 змінних місій NASA, NOAA та CSA (з фільтрацією за біомами та поясненнями для студентів)**:
   - `SEAWIFS_CHLA` — Прибережний та естуарійний хлорофіл-а (`mg/m³`, NASA SeaWiFS / MODIS Aqua / Giovanni)
   - `SWOT_WSE` — Висота водної поверхні річок, озер та водосховищ (`m above reference ellipsoid`, місія NASA / CNES / CSA SWOT)
   - `RCM_SAR_BACKSCATTER` — Радарний індекс вологості поверхні, повеней та морського льоду (`dB σ°`, CSA RADARSAT Constellation Mission / Geo.ca)
   - `AOD` — Оптична товщина аерозолів та диму пожеж 550 нм (`AOD`, NASA MODIS Aqua)
   - `SO2` — Загальний вміст діоксиду сірки у стовпі атмосфери (`DU`, NASA Aura OMI)
   - `T2M` — Приземна температура повітря на висоті 2 м (`°C`, NASA MERRA-2 / Aqua AIRS)
   - `PRECTOTCORR` — Скоригована інтенсивність опадів (`mm/day`, NASA GPM IMERG / MERRA-2)
   - `GWETROOT` — Вологість ґрунту в кореневій зоні (`fraction 0-1`, NASA GLDAS / SMAP)
   - `QRUNOFF` — Поверхневий та річковий гідрологічний стік (`mm/day`, NASA GES DISC Hydrology / GLDAS)
   - `EVPTRNS` — Евапотранспірація та випаровування (`mm/day`, NASA GLDAS)
   - `ALLSKY_SFC_SW_DWN` — Сонячна короткохвильова радіація на поверхні (`W/m²`, NASA CERES / FLASHFlux)
   - `SNODP` — Товщина снігового покриву (`m`, NASA MODIS / MERRA-2)
   - `SST` — Радіаційна температура поверхні океану та суші (`°C`, NASA GHRSST / MODIS)

2. **Історичні феномени та живі події NASA EONET v3 API (`GET /api/v2/fetch-phenomena`)**:
   - **7 курованих наукових сценаріїв**:
     1. *Canadian Wildfires & Smoke Transport over Wisconsin (2002–2026)* — MODIS Aqua `AOD`, порівняння літнього сезону `JJA` із зимовим `DJF`
     2. *Acker's SeaWiFS Coastal Chlorophyll Study (NASA NTRS 20090042747)* — Гирло Міссісіпі / Чесапікська затока проти Відкритого шельфу Мексиканської затоки (`SEAWIFS_CHLA` ↔ `QRUNOFF`)
     3. *CSA SWOT & RADARSAT Canadian Water & Ice Monitor* — Північна Канада / Гудзонова затока (`SWOT_WSE` ↔ `RCM_SAR_BACKSCATTER`)
     4. *Kasatochi Eruption & Sulfur Cooling Trap (Aleutian Islands)* — Aura OMI `SO2` та радіаційне охолодження `ALLSKY_SFC_SW_DWN`
     5. *El Nino / Southern Oscillation (ENSO) Hydrological Dipole* — Узбережжя Перу/Еквадору проти Індонезії/Австралії (`PRECTOTCORR`, сезон `DJF`)
     6. *Arctic Amplification vs. North Atlantic Warming Hole* — Шпіцберген проти Субполярної Північної Атлантики (`T2M`, `deseasonalized`)
     7. *Ukraine Southern Steppe Soil Moisture & Evaporation* — демонстрація тренду на межі значущості (`p ≈ 0.07`) для калькулятора **Time-to-Significance**
   - **Жива інтеграція з NASA EONET v3 API**: автоматичне отримання актуальних природних подій (лісові пожежі, вулкани, шторми, повені, посухи, морський лід) та їх конвертація у сценарії аналізу трендів.

3. **Математичний та статистичний рушій (`POST /api/v2/analyze`)**:
   - **Сезонна фільтрація (`season_mode`)**: `raw` (усі місяці як є), `deseasonalized` (видалення кліматологічного річного циклу), `DJF` (зима), `MAM` (весна), `JJA` (літо), `SON` (осінь).
   - **Статистичні тести**: лінійна регресія (OLS), параметричний критерій Стьюдента (`Student's t-test`), непараметричний тест Манна-Кендалла (`Mann-Kendall`), робастний нахил Сена (`Theil-Sen slope`), `95% довірчі інтервали` та `STL`-декомпозиція (Тренд / Сезонність / Шум).
   - **Калькулятор Time-to-Significance**: розраховує кількість додаткових років супутникових спостережень, необхідних для досягнення порогу `p < 0.05`.

4. **Імпорт CSV із NASA Giovanni, AppEEARS, GES DISC та NOAA CDO (`POST /api/v2/analyze-csv`)**:
   - Завантаження будь-якого CSV-файлу з колонками дати (`Date` / `Year` / `time`) та значення (`Value` / `data`), автоматичне очищення службових заголовків `#`, десезоналізація та повний розрахунок статистичних критеріїв.

5. **Інтерактивний хаб із 13 офіційних ресурсів космічних агенцій + Context Deep-Links**:
   - Вбудований модуль **Official NASA, NOAA, KNMI & CSA Space Agency Resources Hub** із групуванням за 3 категоріями та контекстними кнопками верифікації під графіками (*Verify in NASA Giovanni*, *Explore in AppEEARS*, *Check in KNMI Climate Explorer*, *GES DISC Hydrology*, *NOAA CDO*, *CSA SWOT / RCM*).

---

### Швидкий старт та деплой

#### Варіант 1: Хмарний деплой одним сервісом (Heroku / Render / Railway)
Репозиторій налаштовано для автоматичного розгортання як єдиного веб-сервісу:
1. Під час виконання `heroku-postbuild` (у кореневому `package.json`) встановлюються залежності фронтенду та виконується збірка `frontend/dist`.
2. Процес із `Procfile` (`web: uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}`) одночасно обслуговує REST API (`/api/v2/*`, `/docs`) та скомпільований клієнтський інтерфейс React SPA.

#### Варіант 2: Автоматичний локальний запуск одним скриптом
- **Windows (PowerShell або подвійний клік по `start.bat`)**:
  ```powershell
  .\start.ps1
  ```
- **macOS / Linux / WSL**:
  ```bash
  chmod +x start.sh
  ./start.sh
  ```

#### Варіант 3: Ручний запуск для розробки
1. **Запуск Backend (порт `8000`)**:
   ```bash
   python -m venv .venv
   # Windows PowerShell:
   .\.venv\Scripts\Activate.ps1
   # macOS / Linux:
   # source .venv/bin/activate

   pip install -r requirements.txt
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. **Запуск Frontend (порт `5173`)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Веб-інтерфейс: `http://127.0.0.1:5173`
   - Документація Swagger UI: `http://127.0.0.1:8000/docs`

#### Варіант 4: Запуск через Docker Compose
```bash
docker compose up --build
```

---

### Офіційне застереження (Disclaimer)

> Disclaimer: NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. For non-U.S. Government websites, participants must comply with any data use parameters of that specific website.
