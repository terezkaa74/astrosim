@echo off
echo ========================================
echo Building Offline PDF Reader for Windows
echo ========================================
echo.

echo Step 1: Building React Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    exit /b %errorlevel%
)
echo Frontend build complete!
echo.

echo Step 2: Building Python Backend...
cd python-backend

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt
pip install pyinstaller

echo Building Python executable...
pyinstaller main.spec --clean
if %errorlevel% neq 0 (
    echo ERROR: Python backend build failed
    exit /b %errorlevel%
)

cd ..
echo Python backend build complete!
echo.

echo Step 3: Checking for LLM model...
if not exist models\*.gguf (
    echo WARNING: No GGUF model found in models directory!
    echo The application will not work without a model.
    echo.
    echo Please run: python python-backend\download_model.py
    echo Or manually place a .gguf file in the models directory.
    echo.
    pause
)
echo.

echo Step 4: Building Electron Application...
call npm run electron:build
if %errorlevel% neq 0 (
    echo ERROR: Electron build failed
    exit /b %errorlevel%
)
echo.

echo ========================================
echo Build Complete!
echo ========================================
echo.
echo The Windows installer can be found in the 'dist' directory.
echo.
pause
