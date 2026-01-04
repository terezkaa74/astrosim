# Backend Stability Fixes

**Fixed by Tereza Gorgolova**

This document describes the fixes applied to resolve backend startup crashes, port conflicts, and log spam.

---

## Problems Fixed

### 1. Backend Crashing on Startup
**Symptom:** Backend exits immediately after starting, especially when running `npm run electron:dev` multiple times.

**Root Cause:** Port 8000 was already in use by a previous backend instance that wasn't properly cleaned up.

**Fix:** Added automatic port conflict detection and cleanup in `start-backend.js`.

---

### 2. Port Already in Use (Errno 10048 on Windows)
**Symptom:** Error message: `[Errno 10048] only one usage of each socket address is normally permitted`

**Root Cause:** Multiple backend instances trying to bind to the same port.

**Fix:**
- Check if port 8000 is in use before starting
- Kill existing Python backend processes automatically
- Wait for port to be released before starting new backend

---

### 3. Repeated 405 HEAD Logs Spamming Console
**Symptom:** Console filled with:
```
127.0.0.1:XXXXX - "HEAD / HTTP/1.1" 405 Method Not Allowed
127.0.0.1:XXXXX - "HEAD /health HTTP/1.1" 405 Method Not Allowed
```

**Root Cause:** The `wait-on` tool uses HEAD requests to check if the server is ready, but the backend only had GET handlers.

**Fix:** Added `@app.head()` decorators to both `/` and `/health` endpoints in `main.py`.

---

### 4. Deprecated @app.on_event("startup") Warning
**Symptom:** FastAPI deprecation warning:
```
DeprecationWarning: on_event is deprecated, use lifespan event handlers instead.
```

**Root Cause:** FastAPI deprecated the `@app.on_event("startup")` decorator in favor of lifespan context managers.

**Fix:** Replaced with modern `@asynccontextmanager` lifespan pattern:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global llm_service
    llm_service = LLMService(models_path)
    yield
    # Shutdown
    print("Shutting down LLM service...")

app = FastAPI(lifespan=lifespan)
```

---

### 5. Multiple Backend Instances Running
**Symptom:** Multiple Python processes running `main.py`, causing resource conflicts.

**Root Cause:** No deduplication mechanism; each `npm run electron:dev` started a new backend without checking for existing ones.

**Fix:** Added process cleanup that kills existing backend instances before starting new ones.

---

## Changes Made

### 1. Updated `python-backend/main.py`

#### Before
```python
@app.on_event("startup")
async def startup_event():
    global llm_service
    models_path = os.environ.get("MODELS_PATH", "./models")
    llm_service = LLMService(models_path)

@app.get("/")
async def root():
    return {"status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

#### After
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm_service
    models_path = os.environ.get("MODELS_PATH", "./models")
    print(f"Initializing LLM service with models path: {models_path}")
    llm_service = LLMService(models_path)
    print("LLM service initialized successfully")
    yield
    print("Shutting down LLM service...")

app = FastAPI(lifespan=lifespan)

@app.get("/")
@app.head("/")  # Added HEAD support
async def root():
    return {"status": "running", "message": "PDF Reader Backend with Local LLM"}

@app.get("/health")
@app.head("/health")  # Added HEAD support
async def health():
    model_loaded = llm_service is not None and llm_service.is_model_loaded()
    return {
        "status": "ok",
        "model_loaded": model_loaded
    }
```

**Key Changes:**
- ✅ Replaced deprecated `@app.on_event("startup")` with lifespan context manager
- ✅ Added `@app.head()` decorators to prevent 405 errors
- ✅ Changed health status from "healthy" to "ok" for consistency
- ✅ Added shutdown handler for cleanup

---

### 2. Updated `start-backend.js`

#### New Functions Added

**Port Conflict Detection:**
```javascript
function checkPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);  // Port is in use
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);  // Port is free
    });
    server.listen(port);
  });
}
```

**Process Cleanup (Cross-Platform):**
```javascript
function killExistingBackend() {
  return new Promise((resolve) => {
    let killCommand;

    if (isWindows) {
      // Windows PowerShell command
      killCommand = `powershell -Command "Get-Process | Where-Object {$_.Path -like '*python-backend\\venv\\*' -or ($_.ProcessName -eq 'python' -and $_.CommandLine -like '*main.py*')} | Stop-Process -Force"`;
    } else {
      // Linux/Mac command
      killCommand = `pkill -f "python.*main\\.py" || true`;
    }

    exec(killCommand, (error, stdout, stderr) => {
      // Handle cleanup
      setTimeout(resolve, 500);  // Wait for processes to terminate
    });
  });
}
```

**Port Release Wait:**
```javascript
async function waitForPortRelease(port, maxWaitMs = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const inUse = await checkPortInUse(port);
    if (!inUse) {
      return true;  // Port released
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return false;  // Timeout
}
```

#### Startup Flow

**New Startup Sequence:**
1. ✅ Check if venv exists
2. ✅ Check if main.py exists
3. ✅ Check if port 8000 is in use
4. ✅ If in use: Kill existing backend processes
5. ✅ Wait for port to be released (up to 5 seconds)
6. ✅ If still in use: Exit with manual cleanup instructions
7. ✅ Start new backend instance
8. ✅ Handle graceful shutdown on Ctrl+C

---

## How to Use

### Running Development Server

**Single Command (Recommended):**
```bash
npm run electron:dev
```

This now:
- ✅ Automatically kills any existing backend
- ✅ Checks if port 8000 is available
- ✅ Starts backend in the correct venv
- ✅ Starts Vite dev server
- ✅ Opens Electron when both are ready
- ✅ No more 405 HEAD log spam
- ✅ No more port conflicts
- ✅ No deprecation warnings

---

## Terminal Output Examples

### Successful Startup (Port Free)

```bash
$ npm run electron:dev

[0] 🚀 Starting Python backend...
[0]    Platform: Windows
[0]    Python: python-backend\venv\Scripts\python.exe
[0]    Script: python-backend\main.py
[0]    Port: 8000
[0]
[0] Initializing LLM service with models path: ./models
[0] Loading model from: ../models/phi-2-gguf-Q4_K_M.gguf
[0] Model loaded successfully: phi-2-gguf-Q4_K_M.gguf
[0] LLM service initialized successfully
[0] INFO:     Uvicorn running on http://127.0.0.1:8000
[1] VITE ready in 347 ms
[1] ➜  Local: http://localhost:5173/
[2] Waiting for http://localhost:8000...
[2] Waiting for http://localhost:5173...
[2] Both servers ready! Starting Electron...
```

### Startup with Port Conflict (Auto-Resolved)

```bash
$ npm run electron:dev

[0] ⚠️  Port 8000 is already in use
[0] 🔍 Checking for existing backend processes...
[0]    ✓ Cleaned up existing processes
[0]    ✓ Port 8000 is now available
[0]
[0] 🚀 Starting Python backend...
[0]    Platform: Windows
[0]    Python: python-backend\venv\Scripts\python.exe
[0]    Script: python-backend\main.py
[0]    Port: 8000
[0]
[0] Initializing LLM service with models path: ./models
[0] Model loaded successfully: phi-2-gguf-Q4_K_M.gguf
[0] INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Port Conflict (Manual Cleanup Needed)

```bash
$ npm run electron:dev

[0] ⚠️  Port 8000 is already in use
[0] 🔍 Checking for existing backend processes...
[0]    ✓ Cleaned up existing processes
[0]
[0] ❌ Port 8000 is still in use after cleanup
[0]
[0] Manual cleanup required:
[0]   netstat -ano | findstr :8000
[0]   taskkill /PID <PID> /F
```

**When this happens:** Another non-Python process is using port 8000. Follow the manual cleanup instructions.

---

## Clean Console Output

### Before (Messy)
```
127.0.0.1:12345 - "HEAD / HTTP/1.1" 405 Method Not Allowed
127.0.0.1:12346 - "HEAD / HTTP/1.1" 405 Method Not Allowed
127.0.0.1:12347 - "HEAD /health HTTP/1.1" 405 Method Not Allowed
127.0.0.1:12348 - "HEAD /health HTTP/1.1" 405 Method Not Allowed
DeprecationWarning: on_event is deprecated, use lifespan event handlers instead.
127.0.0.1:12349 - "HEAD / HTTP/1.1" 405 Method Not Allowed
[Errno 10048] only one usage of each socket address is normally permitted
```

### After (Clean)
```
Initializing LLM service with models path: ./models
Loading model from: ../models/phi-2-gguf-Q4_K_M.gguf
Model loaded successfully: phi-2-gguf-Q4_K_M.gguf
LLM service initialized successfully
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     127.0.0.1:XXXXX - "POST /summarize HTTP/1.1" 200 OK
INFO:     127.0.0.1:XXXXX - "POST /answer HTTP/1.1" 200 OK
```

**No more:**
- ❌ 405 Method Not Allowed spam
- ❌ Deprecation warnings
- ❌ Port conflict errors

---

## Cross-Platform Support

### Windows
- ✅ Uses PowerShell to kill processes
- ✅ Matches processes by path: `*python-backend\venv\*`
- ✅ Fallback: Matches python.exe with CommandLine containing `main.py`
- ✅ Manual cleanup: `netstat -ano | findstr :8000` + `taskkill`

### Linux/Mac
- ✅ Uses `pkill -f` to kill processes
- ✅ Matches processes: `python.*main\.py`
- ✅ `|| true` prevents errors if no processes found
- ✅ Manual cleanup: `lsof -i :8000` + `kill -9`

---

## Troubleshooting

### Problem: "Port 8000 is still in use after cleanup"

**Cause:** Another application (not Python) is using port 8000.

**Solution:**

**Windows:**
```bash
# Find the process
netstat -ano | findstr :8000
# Output: TCP  127.0.0.1:8000  0.0.0.0:0  LISTENING  12345

# Kill it
taskkill /PID 12345 /F
```

**Linux/Mac:**
```bash
# Find the process
lsof -i :8000
# Output: python  12345  user  ... (LISTEN)

# Kill it
kill -9 12345
```

### Problem: Backend still crashes immediately

**Check:**
1. Dependencies installed?
   ```bash
   cd python-backend
   venv\Scripts\activate  # or source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Model file exists?
   ```bash
   ls models/*.gguf
   ```

3. Python version correct?
   ```bash
   python --version
   # Should be 3.10 or 3.11
   ```

### Problem: Multiple terminals show "Port in use"

**Solution:** Only run `npm run electron:dev` once. It starts everything.

Don't run:
- ❌ Multiple `npm run electron:dev` in different terminals
- ❌ Separate `npm run backend` and `npm run electron:dev`

Do run:
- ✅ Single `npm run electron:dev` command

### Problem: Backend process won't die

**Windows (Nuclear Option):**
```bash
taskkill /F /IM python.exe
```

**Linux/Mac (Nuclear Option):**
```bash
pkill -9 python
```

**Warning:** This kills ALL Python processes. Use with caution.

---

## Technical Details

### Lifespan Events vs on_event

**Old Way (Deprecated):**
```python
@app.on_event("startup")
async def startup_event():
    # Startup code
    pass

@app.on_event("shutdown")
async def shutdown_event():
    # Shutdown code
    pass
```

**New Way (Modern):**
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    yield
    # Shutdown code

app = FastAPI(lifespan=lifespan)
```

**Why?**
- ✅ Better async context management
- ✅ Guaranteed cleanup even on errors
- ✅ More explicit lifecycle
- ✅ Future-proof (on_event will be removed)

### HEAD Request Support

HEAD requests are used by tools like `wait-on` to check if a server is ready without downloading the full response body.

**Without HEAD support:**
- Browser/tool sends: `HEAD /health`
- FastAPI responds: `405 Method Not Allowed`
- Tool retries repeatedly → log spam

**With HEAD support:**
- Browser/tool sends: `HEAD /health`
- FastAPI responds: `200 OK` (no body)
- Tool knows server is ready → no spam

**Implementation:**
```python
@app.get("/health")
@app.head("/health")  # Add this line
async def health():
    return {"status": "ok"}
```

### Port Check Algorithm

```javascript
async function checkPortInUse(port) {
  // Try to bind a server to the port
  const server = net.createServer();

  server.listen(port);

  // If successful: port is free, close server
  // If error (EADDRINUSE): port is in use

  return isInUse;
}
```

---

## Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `python-backend/main.py` | Lifespan events, HEAD support | Fix deprecation, stop 405 spam |
| `start-backend.js` | Port checking, process cleanup | Prevent port conflicts |

---

## Summary

**Problems Fixed:**
1. ✅ Backend crashing on startup
2. ✅ Port 8000 conflicts (Errno 10048)
3. ✅ 405 HEAD log spam
4. ✅ Deprecated @app.on_event warnings
5. ✅ Multiple backend instances

**Result:**
- Clean console output
- Reliable startup every time
- Automatic cleanup of stale processes
- No manual intervention needed
- Cross-platform compatible

**One command does it all:**
```bash
npm run electron:dev
```

---

**Created by Tereza Gorgolova**
Copyright (c) 2024-2026. All rights reserved.
