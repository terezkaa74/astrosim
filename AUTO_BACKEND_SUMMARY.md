# Automatic Backend Startup - Summary

## Problem Solved

**Before:** Running `npm run electron:dev` failed with:
```
ModuleNotFoundError: No module named 'fastapi'
```

This happened because the Python backend wasn't running in the virtual environment where dependencies are installed.

**After:** Running `npm run electron:dev` now automatically:
1. ✅ Activates the Python virtual environment
2. ✅ Starts the backend server on port 8000
3. ✅ Starts the Vite dev server on port 5173
4. ✅ Waits for both to be ready
5. ✅ Opens the Electron app

## What Changed

### 1. New File: `start-backend.js`

A cross-platform Node.js script that:
- Detects Windows/Linux/Mac automatically
- Finds the Python executable in the venv
- Starts the backend with proper environment
- Provides helpful error messages
- Handles graceful shutdown

**Location:** Project root
**Size:** ~100 lines
**Language:** JavaScript (Node.js)

### 2. Updated: `package.json`

**Before:**
```json
{
  "scripts": {
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\""
  }
}
```

**After:**
```json
{
  "scripts": {
    "backend": "node start-backend.js",
    "electron:dev": "concurrently \"npm run backend\" \"vite\" \"wait-on http://localhost:8000 http://localhost:5173 && electron .\""
  }
}
```

**Changes:**
- Added `"backend": "node start-backend.js"` script
- Updated `electron:dev` to start backend first
- Added wait-on for port 8000 (backend health check)

### 3. Updated: `QUICKSTART.md`

Simplified the "Run the App" section from requiring two terminals to just one command:

**Before:**
```bash
# Terminal 1
cd python-backend
venv\Scripts\activate
python main.py

# Terminal 2
npm run electron:dev
```

**After:**
```bash
npm run electron:dev
```

Added troubleshooting for the new automatic startup.

### 4. New Documentation: `AUTO_BACKEND_SETUP.md`

Complete guide covering:
- How the auto-startup works
- Error messages and solutions
- Platform-specific details
- Troubleshooting guide
- Technical implementation details

## How to Use

### First-Time Setup (Once)

```bash
# 1. Install npm dependencies
npm install

# 2. Set up Python backend
cd python-backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt

# 3. Download a model
python download_model.py
cd ..
```

### Every Time You Develop

```bash
npm run electron:dev
```

That's it! One command starts everything.

## What Happens When You Run `npm run electron:dev`

### Terminal Output Example

```bash
> npm run electron:dev

[0] 🚀 Starting Python backend...
[0]    Platform: Windows
[0]    Python: C:\project\python-backend\venv\Scripts\python.exe
[0]    Script: C:\project\python-backend\main.py
[0]
[0] Loading model from: ../models/phi-2-gguf-Q4_K_M.gguf
[0] Model loaded successfully: phi-2-gguf-Q4_K_M.gguf
[0] INFO:     Uvicorn running on http://127.0.0.1:8000
[1]
[1] VITE v5.4.21  ready in 347 ms
[1]
[1] ➜  Local:   http://localhost:5173/
[2]
[2] Waiting for http://localhost:8000...
[2] Waiting for http://localhost:5173...
[2] Both servers ready! Starting Electron...
[2]
[Electron window opens]
```

### Process Flow

```
npm run electron:dev
    ↓
concurrently runs 3 processes in parallel:
    ↓
    ├─> [0] npm run backend
    │       ↓
    │       node start-backend.js
    │       ↓
    │       Detects: Windows
    │       ↓
    │       Spawns: venv\Scripts\python.exe main.py
    │       ↓
    │       Backend starts on port 8000
    │
    ├─> [1] vite
    │       ↓
    │       Vite dev server starts on port 5173
    │
    └─> [2] wait-on http://localhost:8000 http://localhost:5173 && electron .
            ↓
            Polls both URLs until they respond
            ↓
            Backend ready (200 OK)
            Frontend ready (200 OK)
            ↓
            electron .
            ↓
            Electron app opens
```

## Error Handling

### Virtual Environment Not Found

```
❌ Python virtual environment not found!

Please set up the backend first:
  cd python-backend
  python -m venv venv
  venv\Scripts\activate
  pip install -r requirements.txt

Then try again: npm run electron:dev
```

**Script exits with code 1** - prevents silent failures

### Backend Crashes

```
❌ Python backend exited with code 1

Common issues:
  1. Missing dependencies: cd python-backend && pip install -r requirements.txt
  2. Port already in use: Check if another process is using port 8000
  3. Missing model file: Download a GGUF model to the models/ directory
```

**Script provides actionable solutions**

### Port Already in Use

If port 8000 or 5173 is already in use:

**Windows:**
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -i :8000
kill -9 <PID>
```

## Platform Support

### Windows
- ✅ Tested and working
- Uses: `venv\Scripts\python.exe`
- Paths: Backslashes handled automatically

### Linux/Mac
- ✅ Cross-platform compatible
- Uses: `venv/bin/python`
- Paths: Forward slashes handled automatically

### Why It Works Everywhere

The `start-backend.js` script uses Node.js's built-in modules:
- `path.join()` - Handles path separators per platform
- `process.platform` - Detects OS automatically
- `spawn()` - Works on all platforms without shell

## Benefits

### Developer Experience

✅ **One command** - No more juggling terminals
✅ **No manual activation** - Venv handled automatically
✅ **Clear errors** - Know exactly what went wrong
✅ **Fast workflow** - Start coding immediately
✅ **Graceful shutdown** - Ctrl+C cleans up everything

### Technical Benefits

✅ **Cross-platform** - Same command on Windows/Linux/Mac
✅ **No shell required** - Direct process execution
✅ **Proper cleanup** - SIGTERM → SIGKILL cascade
✅ **Inherited stdio** - See all backend logs
✅ **Health checks** - wait-on ensures both servers ready

## Comparison: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Commands** | 2 terminals, 4 commands | 1 terminal, 1 command |
| **Manual steps** | Activate venv, cd, run script | None |
| **Error visibility** | Hidden until app opens | Clear messages immediately |
| **Platform** | Different commands per OS | Same command everywhere |
| **Cleanup** | Manual kill processes | Automatic on Ctrl+C |
| **New user experience** | Confusing, error-prone | Straightforward |

### Before (Old Way)

```bash
# Terminal 1
cd python-backend
venv\Scripts\activate           # or source venv/bin/activate
python main.py
# Keep this open...

# Terminal 2
npm run electron:dev
# Hope backend is ready...
```

**Problems:**
- Forgot to activate venv → ModuleNotFoundError
- Started frontend before backend → Connection errors
- Need two terminals → Confusing for new developers
- Different activation commands per OS → Documentation split

### After (New Way)

```bash
npm run electron:dev
```

**Benefits:**
- Venv activated automatically
- Backend starts first, frontend waits
- One terminal, one command
- Same command on all platforms
- Errors show immediately with solutions

## Testing the Changes

### Verify It Works

1. **Clean start:**
   ```bash
   npm run electron:dev
   ```

2. **Check terminal output:**
   - `[0]` prefix = Backend logs
   - `[1]` prefix = Vite logs
   - `[2]` prefix = Electron launcher

3. **Verify backend:**
   - Open browser: http://localhost:8000/health
   - Should return: `{"status": "ok"}`

4. **Verify frontend:**
   - Electron window opens automatically
   - Footer shows "LLM Ready" (green)

5. **Test hot reload:**
   - Edit `src/App.jsx`
   - Frontend reloads automatically
   - Backend stays running

6. **Test cleanup:**
   - Press Ctrl+C
   - All processes should stop
   - No orphan Python processes

### Manual Backend Test

You can still run the backend manually if needed:

```bash
npm run backend
```

This is useful for:
- Testing backend changes without frontend
- Debugging backend issues
- Running backend separately

### Production Build

The `npm run build` command is unchanged:
- Still builds Vite bundle
- Still packages Electron app
- Auto-startup only affects development

## Files Changed

| File | Status | Purpose |
|------|--------|---------|
| `start-backend.js` | **NEW** | Cross-platform backend launcher |
| `package.json` | **MODIFIED** | Added backend script and updated electron:dev |
| `QUICKSTART.md` | **MODIFIED** | Simplified run instructions |
| `AUTO_BACKEND_SETUP.md` | **NEW** | Detailed documentation |
| `AUTO_BACKEND_SUMMARY.md` | **NEW** | This file (overview) |

**Lines changed:** ~15 in package.json + ~100 new lines in start-backend.js
**Breaking changes:** None (backward compatible)
**Build system:** Unchanged (npm run build still works)

## Backward Compatibility

All existing workflows still work:

✅ `npm run dev` - Vite only (frontend dev)
✅ `npm run build` - Production build
✅ `npm run preview` - Preview production build
✅ Manual backend start - Still possible if preferred

The only change is `npm run electron:dev` now does more (starts backend too).

## Future Improvements

Possible enhancements (not required):

1. **Auto-install dependencies** - Check if requirements.txt changed
2. **Model auto-download** - Prompt to download if missing
3. **Port conflict resolution** - Automatically try different ports
4. **Backend reload** - Restart backend on file changes
5. **Environment validation** - Check Python version, disk space, etc.

These are optional improvements that could be added later.

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Venv not found | Run setup: `cd python-backend && python -m venv venv && pip install -r requirements.txt` |
| ModuleNotFoundError | Reinstall: `pip install -r requirements.txt` |
| Port in use | Kill process: `taskkill /F /IM python.exe` (Win) or `pkill python` (Linux) |
| Model not found | Download: `cd python-backend && python download_model.py` |
| Backend crashes | Check logs in terminal [0] output |
| Electron won't open | Check wait-on succeeded (both servers started) |

See `AUTO_BACKEND_SETUP.md` for detailed troubleshooting.

## Summary

The Offline PDF Reader now has a **one-command development workflow** that automatically manages the Python backend environment. This eliminates the "ModuleNotFoundError" and makes development much simpler, especially for new contributors.

**Before:** Multiple terminals, manual venv activation, platform-specific commands
**After:** `npm run electron:dev` - that's it!

✅ **Build passes** - All tests pass, no breaking changes
✅ **Documentation updated** - QUICKSTART.md simplified
✅ **Cross-platform** - Works on Windows, Linux, Mac
✅ **Error handling** - Clear messages and solutions
✅ **Backward compatible** - Existing workflows unchanged

Ready to use!
