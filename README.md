# GaiaPulse — Earth System Trend Detective

Інтерактивна геопросторова аналітична платформа для статистичної верифікації кліматичних і екологічних трендів Землі, сезонної декомпозиції часових рядів та виявлення регіональних кліматичних диполів. Розроблено для **NASA Space Apps Challenge 2026 ("Be an Earth System Trend Detective")**.

---

## Технологічний стек

### Backend (Python 3.11+ / FastAPI)
- **FastAPI + Uvicorn** — асинхронний REST API з автогенерацією OpenAPI/Swagger документації (`/docs`).
- **HTTPX** — асинхронні запити до **NASA POWER API** (MERRA-2 / CERES) та **NASA EONET v3 API** з локальним кешуванням і офлайн-резервуванням.
- **SciPy + PyMannKendall + Statsmodels** — лінійна регресія (OLS), критерій Стьюдента (`Student's t-test`), непараметричний тест Манна-Кендалла (`Mann-Kendall`), оцінка нахилу Сена (`Theil-Sen Slope`), 95% довірчі інтервали, `STL`-декомпозиція часових рядів, крос-регіональна кореляція Пірсона/Спірмена та калькулятор `Time-to-Significance`.

### Frontend (React + TypeScript + Vite)
- **React 18 + TypeScript + TailwindCSS** — інтерфейс у палітрі **Catppuccin Mocha**.
- **React-Leaflet + MapLibre GL JS** — перемикання між 2D-картою та 3D-глобусом з накладанням супутникових тайлів **NASA GIBS WMTS** (MODIS, SMAP, GPM IMERG, ASTER GDEM) та візуалізацією зон ROI.
- **Plotly.js (`react-plotly.js`)** — наукові графіки часових рядів із довірчими смугами 95% CI, теплові шкали кліматичних аномалій (`Climate Stripes`) та графіки сезонної декомпозиції.
- **Lucide React** — векторна іконографіка інтерфейсу.

---

## Структура репозиторію

```text
.
├── main.py                  # FastAPI сервер та маршрути /api/v2/*
├── phenomena_service.py     # Історичні кейси челенджу + інтеграція з NASA EONET v3 API
├── nasa_client.py           # Клієнт NASA POWER API, кеш та калібровані супутникові ряди
├── statistics_engine.py     # Математичний рушій (сезонні зрізи, t-test, Mann-Kendall, STL, TTS)
├── presets.py               # Каталог 10 супутникових змінних NASA та метадані шарів GIBS
├── requirements.txt         # Залежності Python
├── Dockerfile               # Docker-образ бекенду
├── docker-compose.yml       # Запуск усієї системи через Docker Compose
├── start.bat                # Автозапуск для Windows (CMD / подвійний клік)
├── start.ps1                # Автозапуск для Windows (PowerShell, автостворення .venv)
├── start.sh                 # Автозапуск для macOS / Linux / WSL
└── frontend/                # Клієнтський додаток (React + Vite + TypeScript)
    ├── index.html
    ├── package.json
    ├── tailwind.config.js   # Конфігурація кольорів Catppuccin Mocha
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
            ├── EarthMap.tsx
            ├── Globe3DView.tsx
            ├── VerdictCard.tsx
            └── TrendCharts.tsx
```

---

## Швидкий старт для команди

### Попередні вимоги
- **Python 3.11 або 3.12** (на Windows рекомендовано офіційний інсталятор з `python.org`, не MSYS2/MinGW)
- **Node.js 18+ та npm**

### Варіант 1: Автоматичний запуск одним скриптом

**Windows (PowerShell або подвійний клік по `start.bat`):**
```powershell
.\start.ps1
```
Скрипт автоматично знайде встановлений Python, за потреби створить віртуальне середовище `.venv`, встановить пакети з `requirements.txt` і `npm install`, та відкриє два сервери.

**macOS / Linux / WSL:**
```bash
chmod +x start.sh
./start.sh
```

### Варіант 2: Ручний запуск (для розробки в терміналі IDE)

**1. Запуск Backend (порт `8000`):**
```bash
python -m venv .venv

# Активація на Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Активація на macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**2. Запуск Frontend (порт `5173`):**
```bash
cd frontend
npm install
npm run dev
```

Після запуску відкрийте:
- Веб-інтерфейс: `http://localhost:5173`
- Swagger UI документація API: `http://localhost:8000/docs`

### Варіант 3: Запуск через Docker Compose
```bash
docker compose up --build
```

---

## Основні ендпоінти API

- `GET /api/v2/fetch-phenomena` — повертає об'єднаний список курованих історичних феноменів (MODIS Aqua AOD, Aura OMI SO2, ENSO Dipole, Arctic/AMOC Dipole, GLDAS Soil Moisture) та живих подій із `NASA EONET v3 API`.
- `POST /api/v2/analyze` — виконує аналіз часового ряду з підтримкою параметра `season_mode` (`raw`, `deseasonalized`, `DJF`, `MAM`, `JJA`, `SON`), повертає метрики `Student's t-test`, `Mann-Kendall`, `95% CI`, `STL` та прогноз `Time-to-Significance`.
- `GET /api/variables` — повний перелік доступних супутникових змінних та їхніх одиниць вимірювання.
- `GET /api/health` — статус сервера та статистика кешу.

---

## Робота з Git у команді

1. Клонування репозиторію:
   ```bash
   git clone <URL_ВАШОГО_РЕПОЗИТОРІЮ>
   cd nasa
   ```
2. Створення нової гілки під фічу або виправлення:
   ```bash
   git checkout -b feature/назва-фічі
   ```
3. Перевірка збірки фронтенду перед комітом:
   ```bash
   cd frontend
   npm run build
   ```
4. Завантаження змін у GitHub:
   ```bash
   git add .
   git commit -m "Describe your change"
   git push -u origin feature/назва-фічі
   ```
