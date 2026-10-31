$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $RepoRoot "frontend"
$VenvPython = Join-Path $RepoRoot ".venv\Scripts\python.exe"

function Test-BackendDeps([string]$PyExe) {
    if (-not $PyExe -or -not (Test-Path $PyExe)) { return $false }
    & $PyExe -c "import fastapi, uvicorn, httpx, numpy, pandas, scipy, statsmodels, pymannkendall" 2>$null
    return ($LASTEXITCODE -eq 0)
}

function Resolve-PythonInterpreter {
    if (Test-BackendDeps $VenvPython) {
        return $VenvPython
    }

    $candidates = New-Object System.Collections.Generic.List[string]

    if ($env:LOCALAPPDATA) {
        $localPy = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA "Programs\Python\Python3*\python.exe") -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending
        foreach ($item in $localPy) { $candidates.Add($item.FullName) }
    }

    $progFilesPy = Get-ChildItem -Path "C:\Program Files\Python3*\python.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending
    foreach ($item in $progFilesPy) { $candidates.Add($item.FullName) }

    $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
    if ($pyLauncher) {
        $resolved = & py -3 -c "import sys; print(sys.executable)" 2>$null
        if ($LASTEXITCODE -eq 0 -and $resolved) {
            $candidates.Add($resolved.Trim())
        }
    }

    $pathPy = Get-Command python -ErrorAction SilentlyContinue
    if ($pathPy -and $pathPy.Source -notmatch "WindowsApps") {
        $candidates.Add($pathPy.Source)
    }

    foreach ($cand in $candidates) {
        if (Test-BackendDeps $cand) {
            return $cand
        }
    }

    foreach ($cand in $candidates) {
        if ((Test-Path $cand) -and ($cand -notmatch "msys64|mingw")) {
            Write-Host "Creating Python virtual environment (.venv) using $cand ..." -ForegroundColor Yellow
            & $cand -m venv (Join-Path $RepoRoot ".venv")
            & $VenvPython -m pip install --upgrade pip
            & $VenvPython -m pip install -r (Join-Path $RepoRoot "requirements.txt")
            return $VenvPython
        }
    }

    throw "Python 3.11+ was not found. Install official Python from https://www.python.org/downloads/ and re-run."
}

$PythonExe = Resolve-PythonInterpreter
Write-Host "Using Python interpreter: $PythonExe" -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Host "Installing frontend dependencies (npm install)..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    try {
        npm install
    } finally {
        Pop-Location
    }
}

Write-Host "Starting Backend (FastAPI on http://localhost:8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RepoRoot'; & '$PythonExe' -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "Starting Frontend (Vite on http://localhost:5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$FrontendDir'; npm run dev"

Write-Host "Servers launched. Open http://localhost:5173 in your browser." -ForegroundColor Green
