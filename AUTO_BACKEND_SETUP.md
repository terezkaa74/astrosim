# Automatic Backend Startup

The project now automatically starts the Python backend when you run `npm run electron:dev`.

## How It Works

### The `start-backend.js` Script

This Node.js script:
- Detects your operating system (Windows/Linux/Mac)
- Locates the Python virtual environment in `python-backend/venv/`
- Uses the correct Python executable from the venv
- Starts `python-backend/main.py` with all dependencies available
- Forwards all backend output to your terminal
- Handles graceful shutdown when you press Ctrl+C

### The Updated npm Scripts

**`package.json` now includes:**

```json
{
  "scripts": {
    "backend": "node start-backend.js",
    "electron:dev": "concurrently \"npm run backend\" \"vite\" \"wait-on http://localhost:8000 http://localhost:5173 && electron .\""
  }
}
```

**What happens when you run `npm run electron:dev`:**

1. **Backend starts** via `start-backend.js` → Activates venv → Runs `main.py` on port 8000
2. **Vite dev server starts** → React frontend on port 5173
3. **wait-on waits** for both `http://localhost:8000` and `http://localhost:5173` to be ready
4. **Electron opens** → App loads with both frontend and backend ready

## First-Time Setup

Before using `npm run electron:dev`, you need to set up the Python backend once:

### Windows

```bash
cd python-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### Linux/Mac

```bash
cd python-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

## Usage

### Start Development (Everything Automatically)

```bash
npm run electron:dev
```

This single command:
- ✅ Starts Python backend in venv
- ✅ Starts Vite dev server
- ✅ Opens Electron app
- ✅ All hot-reload enabled

### Start Only Backend (Testing)

```bash
npm run backend
```

### Start Only Frontend (If Backend Running Separately)

```bash
npm run dev
```

## Error Messages

The script provides helpful error messages if something goes wrong:

### ❌ Virtual Environment Not Found

```
❌ Python virtual environment not found!

Please set up the backend first:
  cd python-backend
  python -m venv venv
  venv\Scripts\activate    (Windows)
  source venv/bin/activate (Linux/Mac)
  pip install -r requirements.txt
```

**Solution:** Run the first-time setup commands above.

### ❌ Backend Exited with Error Code

```
❌ Python backend exited with code 1

Common issues:
  1. Missing dependencies: cd python-backend && pip install -r requirements.txt
  2. Port already in use: Check if another process is using port 8000
  3. Missing model file: Download a GGUF model to the models/ directory
```

**Solutions:**
1. **Missing dependencies:** Reinstall requirements
   ```bash
   cd python-backend
   venv\Scripts\activate  # or source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Port 8000 in use:** Kill the other process or change the port
   ```bash
   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -i :8000
   kill -9 <PID>
   ```

3. **Missing model:** Download a GGUF model
   ```bash
   cd python-backend
   python download_model.py
   ```

### ❌ ModuleNotFoundError: No module named 'fastapi'

This error means the backend is not running in the virtual environment.

**Solution:** The `start-backend.js` script should prevent this. If you still see it:

1. Verify venv exists:
   ```bash
   ls python-backend/venv/Scripts/python.exe  # Windows
   ls python-backend/venv/bin/python          # Linux/Mac
   ```

2. Reinstall dependencies in the venv:
   ```bash
   cd python-backend
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Try again:
   ```bash
   npm run electron:dev
   ```

## Stopping the App

Press **Ctrl+C** in the terminal running `npm run electron:dev`.

The script will:
1. Send SIGTERM to the Python backend (graceful shutdown)
2. Wait up to 3 seconds
3. Force kill if still running (SIGKILL)
4. Stop all other processes (Vite, Electron)

## Platform-Specific Details

### Windows

- Uses: `python-backend\venv\Scripts\python.exe`
- Shell: Not used (direct process spawn)
- Line endings: Handles CRLF automatically

### Linux/Mac

- Uses: `python-backend/venv/bin/python`
- Shell: Not used (direct process spawn)
- Permissions: Ensure execute permissions on Python if needed

## Troubleshooting

### Backend Starts But Frontend Can't Connect

**Symptom:** Backend logs show it's running, but frontend shows "Backend unavailable"

**Check:**
1. Is backend actually running on port 8000?
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status": "ok"}
   ```

2. Check CORS settings in `python-backend/main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173", "http://localhost:5173/"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Multiple Backend Instances Running

**Symptom:** Error about port 8000 already in use

**Solution:** Kill all Python processes
```bash
# Windows
taskkill /F /IM python.exe

# Linux/Mac
pkill -f "python.*main.py"
```

Then restart: `npm run electron:dev`

### Script Doesn't Start on Linux/Mac

**Check permissions:**
```bash
chmod +x start-backend.js
```

### Backend Logs Not Showing

The script uses `stdio: 'inherit'` to forward all output. If you don't see backend logs:

1. Check if backend is actually starting
2. Look for errors in the console
3. Try running backend manually to see output:
   ```bash
   cd python-backend
   venv\Scripts\activate
   python main.py
   ```

## Benefits of This Approach

✅ **Cross-platform** - Works on Windows, Linux, Mac
✅ **No manual activation** - Venv activated automatically
✅ **Clear error messages** - Guides you to solutions
✅ **One command** - `npm run electron:dev` does everything
✅ **Proper cleanup** - Graceful shutdown on Ctrl+C
✅ **Development workflow** - Hot reload works for both frontend and backend

## Technical Details

### Why Not Use Shell Scripts?

- **Cross-platform issues:** `.sh` doesn't work on Windows, `.bat` doesn't work on Linux
- **Activation complexity:** Different activation commands per platform
- **Path handling:** Forward slashes vs backslashes

### Why Node.js Script?

- **Cross-platform:** Node.js runs everywhere
- **Already available:** npm requires Node.js, so it's always present
- **Easy path handling:** `path.join()` handles platform differences
- **Process control:** Full control over spawning and cleanup

### Direct Venv Python Execution

Instead of activating the venv and then running Python, we directly execute the Python binary from the venv:

```javascript
// Windows: python-backend/venv/Scripts/python.exe
// Linux/Mac: python-backend/venv/bin/python
const pythonExe = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');
```

This is equivalent to activation because the venv Python:
- Has access to all installed packages in `venv/Lib/site-packages/`
- Uses the correct sys.path
- Doesn't require shell environment variable changes

## Integration with Existing Workflow

This change doesn't break any existing scripts:

- ✅ `npm run dev` - Still runs just Vite (for frontend-only dev)
- ✅ `npm run build` - Still builds production bundle
- ✅ `npm run electron:build` - Still creates distributable
- ✅ Manual backend start - Still works if you prefer

The only change is `npm run electron:dev` now starts everything automatically.

## Next Steps

1. **First time?** Run the setup commands to create the venv
2. **Ready to develop?** Just run: `npm run electron:dev`
3. **Problems?** Check the error messages and this guide's troubleshooting section

Your Python backend will now start automatically with the correct environment every time!
