# Architecture Overview

This document provides a technical overview of the Offline PDF Reader with Local LLM.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Electron Shell                      │
│  ┌───────────────────────────────────────────────┐  │
│  │            React Frontend (Vite)              │  │
│  │  - PDF Upload UI                              │  │
│  │  - Document Viewer                            │  │
│  │  - Chat Interface                             │  │
│  │  - Summary Display                            │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │ HTTP (localhost:8000)            │
│  ┌───────────────▼───────────────────────────────┐  │
│  │         Python Backend (FastAPI)              │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  PDF Service (PyPDF2)                   │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  LLM Service (llama-cpp-python)         │  │  │
│  │  │  - Model Loading                        │  │  │
│  │  │  - Inference                            │  │  │
│  │  │  - Prompt Engineering                   │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │ File System Access               │
│  ┌───────────────▼───────────────────────────────┐  │
│  │         GGUF Model File (.gguf)               │  │
│  │  - Phi-2 / Phi-3 / Mistral / TinyLlama        │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Component Details

### 1. Electron Shell

**Purpose**: Desktop application wrapper and process manager

**Files**:
- `electron/main.cjs` - Main process entry point
- `electron/preload.cjs` - Preload script for secure IPC

**Responsibilities**:
- Launch Python backend subprocess
- Create application window
- Manage Python process lifecycle
- Provide secure IPC bridge
- Handle application quit events

**Key Features**:
- Automatically starts Python backend on app launch
- Kills Python process on app exit
- Loads Vite dev server in development
- Loads built static files in production

### 2. React Frontend

**Purpose**: User interface

**Files**:
- `src/App.jsx` - Main application component
- `src/components/PDFUploader.jsx` - File upload
- `src/components/DocumentPanel.jsx` - Document display
- `src/components/ChatPanel.jsx` - Q&A interface
- `src/components/SummaryPanel.jsx` - Summary display
- `src/utils/pdfProcessor.js` - Structure detection
- `src/utils/textAnalyzer.js` - Legacy (now unused)
- `src/utils/exportUtils.js` - Export functionality

**Communication**:
- HTTP REST API to Python backend (localhost:8000)
- FormData for PDF uploads
- JSON for LLM requests/responses

**State Management**:
- React useState hooks
- No external state management library
- Simple prop drilling

### 3. Python Backend

**Purpose**: API server and LLM inference

**Files**:
- `main.py` - FastAPI application
- `llm_service.py` - LLM wrapper
- `pdf_service.py` - PDF text extraction

**Endpoints**:

```
GET  /health           - Health check and model status
POST /extract-text     - Extract text from PDF
POST /summarize        - Generate summary
POST /answer           - Answer question
POST /chat             - General chat
```

**LLM Integration**:
- Uses llama-cpp-python bindings
- Loads GGUF models from models/ directory
- CPU-only inference (n_gpu_layers=0)
- 4096 token context window
- 4 threads for parallel processing

### 4. LLM Service

**Purpose**: Model loading and inference

**Model Discovery**:
1. Check `models/` directory
2. Find first `.gguf` or `.bin` file
3. Load with llama.cpp

**Prompt Templates**:

**Summary**:
```
<|system|>
You are a helpful assistant that creates concise summaries...
</|system|>

<|user|>
Please provide a concise summary...
Text: {context}
</|user|>

<|assistant|>
```

**Question Answering**:
```
<|system|>
You are a helpful assistant that answers questions...
</|system|>

<|user|>
Context: {document_context}
Question: {question}
</|user|>

<|assistant|>
```

**Generation Parameters**:
- Temperature: 0.7
- Top-p: 0.9
- Max tokens: 300-512 (varies by task)
- Stop sequences: `</s>`, `Human:`, `User:`

## Data Flow

### PDF Upload and Processing

```
1. User drags PDF → PDFUploader component
2. File sent to /extract-text endpoint
3. Python backend:
   - PyPDF2 extracts raw text
   - Returns text + filename
4. Frontend:
   - Detects structure (patterns)
   - Extracts tables (basic parsing)
5. Text sent to /summarize endpoint
6. LLM generates summary
7. Display in UI
```

### Question Answering

```
1. User types question → ChatPanel
2. Frontend sends to /answer endpoint with:
   - question: string
   - context: document text (first 6000 chars)
3. Python backend:
   - Constructs prompt with context + question
   - Runs LLM inference
   - Returns answer
4. Display in chat interface
```

## Build Process

### Development Build

```bash
# Terminal 1: Python backend
cd python-backend
venv/Scripts/activate
python main.py

# Terminal 2: Electron + React
npm run electron:dev
```

### Production Build

```bash
# 1. Build React frontend
npm run build
→ Creates dist/ with static files

# 2. Build Python backend
cd python-backend
pyinstaller main.spec
→ Creates dist/main.exe

# 3. Build Electron app
electron-builder
→ Packages everything into installer
→ Bundles:
  - dist/ (frontend)
  - python-backend/dist/main.exe
  - models/*.gguf
```

### Build Output

```
dist/
├── Offline PDF Reader Setup.exe    # Windows installer
└── win-unpacked/                   # Unpacked app
    ├── resources/
    │   ├── app.asar                # Frontend + Electron
    │   ├── python-backend/
    │   │   └── main.exe            # Python backend
    │   └── models/
    │       └── model.gguf          # LLM model
    └── Offline PDF Reader.exe       # App launcher
```

## Security Considerations

### Sandboxing

- Electron runs with `contextIsolation: true`
- No `nodeIntegration` in renderer
- IPC through secure preload script

### Data Privacy

- All processing local (no network calls)
- No telemetry or tracking
- No data persistence (session only)

### File System Access

- Python backend has full file system access
- Frontend isolated, only HTTP to localhost
- Models loaded from trusted directory only

## Performance Optimization

### LLM Inference

**Quantization**: 4-bit (Q4_K_M) reduces size by ~75%
**Context Window**: Limited to 4096 tokens to reduce memory
**Threading**: 4 threads balances speed vs CPU usage
**Caching**: Model stays loaded in memory between requests

### Frontend

**Lazy Loading**: Components loaded on demand
**Text Truncation**: Large documents truncated before sending to LLM
**No Re-rendering**: Chat history uses keyed lists

### Memory Management

**Typical Memory Usage**:
- Electron: ~200MB
- Python Backend: ~100MB base
- Model (Phi-2 Q4): ~1.6GB
- **Total**: ~2GB RAM

## Extensibility

### Adding New Models

1. Place `.gguf` file in `models/`
2. App auto-detects and loads
3. Adjust prompts in `llm_service.py` if needed

### Custom Prompts

Edit `llm_service.py`:
```python
def summarize(self, text: str):
    prompt = f"""Your custom prompt here
    Text: {text}
    Summary:"""
    return self._generate(prompt)
```

### Adding Endpoints

Edit `main.py`:
```python
@app.post("/custom-endpoint")
async def custom_handler(request: CustomRequest):
    result = llm_service.custom_function(request.data)
    return {"result": result}
```

### Multi-Platform Support

To support Mac/Linux:
1. Update `electron/main.cjs` platform detection
2. Build Python backend for target platform
3. Configure electron-builder for target
4. Test model compatibility

## Known Limitations

### Technical Limitations

- **Model Size**: Large models (7B+) require 8GB+ RAM
- **Speed**: CPU inference is slow (5-30s per response)
- **Context**: Limited to 4096 tokens (~3000 words)
- **Quality**: Smaller models less capable than GPT-4

### Architectural Limitations

- **Single User**: No multi-user support
- **No Persistence**: No chat history saved
- **No Streaming**: Responses arrive all at once
- **Windows Only**: Build configured for Windows

## Future Improvements

### Potential Enhancements

1. **GPU Acceleration**: Rebuild llama-cpp-python with CUDA
2. **Streaming**: Implement SSE for token streaming
3. **Persistence**: SQLite for chat history
4. **Multi-Document**: Compare multiple PDFs
5. **RAG**: Vector database for semantic search
6. **Model Manager**: Download/switch models in-app
7. **Cross-Platform**: Mac and Linux builds

### Performance Improvements

1. **Model Quantization**: Try Q3 or Q2 for speed
2. **Batch Processing**: Process multiple requests together
3. **Caching**: Cache common responses
4. **Progressive Loading**: Show partial results while processing

## Troubleshooting Guide

### Build Issues

**PyInstaller Fails**:
- Use Python 3.10/3.11 (not 3.12)
- Clear build cache: `pyinstaller --clean main.spec`

**Electron Builder Fails**:
- Clear cache: `rm -rf node_modules dist`
- Reinstall: `npm install`

**Model Not Found**:
- Check `models/` directory exists
- Verify `.gguf` file present
- Check file permissions

### Runtime Issues

**Backend Won't Start**:
- Port 8000 may be in use
- Check Python executable permissions
- View Electron console logs

**Slow Performance**:
- Try smaller model (TinyLlama)
- Reduce n_threads in `llm_service.py`
- Increase RAM if possible

**Crashes**:
- Usually out of memory
- Try smaller model
- Close other applications

## Development Tips

### Hot Reload

Frontend has Vite hot reload. Backend requires restart.

### Debugging

**Frontend**: Chrome DevTools in Electron
**Backend**: Print statements in Terminal 1
**Electron**: Main process logs in Terminal 2

### Testing Models

Use TinyLlama (669MB) for faster iteration during development.

### Code Organization

- Keep components small and focused
- Extract reusable logic to utils/
- Keep backend endpoints thin (logic in services)

## Deployment Checklist

- [ ] Model file in `models/` directory
- [ ] Python backend builds successfully
- [ ] Frontend builds without errors
- [ ] Electron packager includes all resources
- [ ] Test installer on clean Windows machine
- [ ] Verify model loads correctly
- [ ] Test PDF upload and processing
- [ ] Test Q&A and summarization
- [ ] Check error handling
- [ ] Verify no internet calls made

## Resources

- [llama.cpp Documentation](https://github.com/ggerganov/llama.cpp)
- [Electron Documentation](https://www.electronjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PyInstaller Manual](https://pyinstaller.org/en/stable/)
- [GGUF Model Hub](https://huggingface.co/models?library=gguf)
