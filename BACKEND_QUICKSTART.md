# Backend Fix Quick Start

**Fixed by Tereza Gorgolova**

Your backend startup issues are now fixed! Here's what you need to know.

---

## What Was Fixed

✅ **No more port conflicts** - Automatically kills old backend processes
✅ **No more 405 HEAD spam** - Added HEAD request handlers
✅ **No more deprecation warnings** - Updated to FastAPI lifespan events
✅ **No more crashes** - Smart port checking and cleanup
✅ **Cross-platform** - Works on Windows, Linux, and Mac

---

## How to Use

### Just run this:

```bash
npm run electron:dev
```

That's it! The script now:
1. Checks if port 8000 is in use
2. Kills any existing backend processes
3. Waits for the port to be free
4. Starts the backend in your venv
5. Starts the frontend
6. Opens Electron

---

## What You'll See

### Clean Startup
```bash
$ npm run electron:dev

[0] 🚀 Starting Python backend...
[0]    Platform: Windows
[0]    Port: 8000
[0]
[0] Initializing LLM service...
[0] Model loaded successfully
[0] INFO:     Uvicorn running on http://127.0.0.1:8000
[1] VITE ready in 347 ms
[2] Both servers ready! Starting Electron...
```

### Port Was In Use (Auto-Fixed)
```bash
[0] ⚠️  Port 8000 is already in use
[0] 🔍 Checking for existing backend processes...
[0]    ✓ Cleaned up existing processes
[0]    ✓ Port 8000 is now available
[0]
[0] 🚀 Starting Python backend...
```

---

## Troubleshooting

### "Port 8000 is still in use after cleanup"

Something else (not Python) is using the port.

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

### Backend keeps crashing

1. Check dependencies:
   ```bash
   cd python-backend
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Check model file exists:
   ```bash
   ls models/*.gguf
   ```

3. Check Python version (should be 3.10 or 3.11):
   ```bash
   python --version
   ```

### Multiple backends running

Only run `npm run electron:dev` ONCE. Don't open multiple terminals.

To kill all Python processes:

**Windows:**
```bash
taskkill /F /IM python.exe
```

**Linux/Mac:**
```bash
pkill -9 python
```

---

## Technical Changes

### 1. `main.py` - FastAPI Backend

**Replaced deprecated on_event:**
```python
# OLD (deprecated)
@app.on_event("startup")
async def startup_event():
    llm_service = LLMService(models_path)

# NEW (modern)
@asynccontextmanager
async def lifespan(app: FastAPI):
    llm_service = LLMService(models_path)
    yield
    # Cleanup on shutdown

app = FastAPI(lifespan=lifespan)
```

**Added HEAD request support:**
```python
@app.get("/health")
@app.head("/health")  # Stops 405 errors
async def health():
    return {"status": "ok"}
```

### 2. `start-backend.js` - Startup Script

**Added:**
- Port availability checking
- Existing process cleanup
- Cross-platform kill commands
- Port release waiting
- Better error messages

---

## No More Issues

### Before
- ❌ Backend crashes on port conflict
- ❌ Multiple backends running at once
- ❌ Console spammed with 405 HEAD errors
- ❌ Deprecation warnings
- ❌ Manual process killing required

### After
- ✅ Automatic port conflict resolution
- ✅ Only one backend runs at a time
- ✅ Clean console output
- ✅ No warnings
- ✅ Fully automated

---

## Files Changed

- `python-backend/main.py` - FastAPI lifespan + HEAD support
- `start-backend.js` - Port checking + process cleanup

---

## Need More Info?

See **BACKEND_FIXES.md** for detailed technical documentation.

---

**Created by Tereza Gorgolova**
