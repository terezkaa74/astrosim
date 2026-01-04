# Windows Desktop App Setup Guide

This guide covers setting up and building the Offline PDF Reader with Local LLM as a Windows desktop application.

## Architecture

The application consists of:
- **Electron**: Desktop wrapper for Windows .exe
- **React Frontend**: User interface (Vite)
- **Python Backend**: FastAPI server with llama-cpp-python for LLM inference
- **Local LLM**: GGUF format models (Phi-2, Phi-3, Mistral, etc.)

## Requirements

### Development Requirements
- Node.js 18+ and npm
- Python 3.10 or 3.11
- Windows 10/11 (for building Windows .exe)

### Runtime Requirements (End User)
- Windows 10/11
- 4GB+ RAM (8GB+ recommended)
- 4-8GB disk space (for model)

## Development Setup

### 1. Install Node Dependencies

```bash
npm install
```

### 2. Set Up Python Backend

#### Create Virtual Environment

```bash
cd python-backend
python -m venv venv
venv\Scripts\activate
```

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Note**: Installing `llama-cpp-python` may take several minutes as it compiles from source.

### 3. Download LLM Model

Choose one of these models based on your needs:

#### Option A: Use Download Script (Recommended)

```bash
python download_model.py
```

Available models:
- **tinyllama** - TinyLlama 1.1B (669 MB) - Fastest, basic quality
- **phi-2** - Phi-2 2.7B (1.6 GB) - Good balance
- **phi-3-mini** - Phi-3 Mini 3.8B (2.2 GB) - Better quality
- **mistral** - Mistral 7B (4.4 GB) - Best quality, slower

#### Option B: Manual Download

1. Create `models` directory in project root
2. Download a GGUF model from Hugging Face:
   - [Phi-2 Models](https://huggingface.co/TheBloke/phi-2-GGUF)
   - [Phi-3 Models](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf)
   - [Mistral Models](https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF)
3. Place the `.gguf` file in the `models` directory

### 4. Run Development Mode

#### Terminal 1: Start Python Backend

```bash
cd python-backend
venv\Scripts\activate
python main.py
```

#### Terminal 2: Start Electron App

```bash
npm run electron:dev
```

The app will open in a desktop window.

## Building Windows .exe

### 1. Build Python Backend Executable

First, install PyInstaller:

```bash
cd python-backend
venv\Scripts\activate
pip install pyinstaller
```

Create the executable:

```bash
pyinstaller --onefile --name main --add-data "*.py;." main.py
```

The executable will be in `python-backend/dist/main.exe`.

### 2. Prepare Models Directory

Ensure you have a model in the `models` directory. This will be bundled with the app.

### 3. Build Electron App

```bash
npm run electron:build
```

The Windows installer will be created in the `dist` directory.

## Distribution Package Structure

```
OfflinePDFReader-Setup.exe
├── resources/
│   ├── python-backend/
│   │   └── main.exe (Python backend)
│   └── models/
│       └── *.gguf (LLM model file)
└── app files...
```

## Deployment Considerations

### Model Size

The app installer will be large due to the bundled model:
- With TinyLlama (669 MB): ~1 GB installer
- With Phi-2 (1.6 GB): ~2 GB installer
- With Mistral (4.4 GB): ~5 GB installer

### Distribution Options

#### Option 1: Bundle Model (Recommended for Most Users)
- Include model in the installer
- One-click install, ready to use
- Large download size

#### Option 2: Separate Model Download
- Modify the app to download model on first run
- Smaller initial installer
- Requires internet connection on first launch

To implement Option 2, modify `electron/main.cjs` to check for model and prompt download if missing.

## Troubleshooting

### Python Backend Won't Start

1. Check if port 8000 is available
2. Verify Python dependencies are installed
3. Check `python-backend` logs in Electron console

### Model Not Loading

1. Ensure `.gguf` file is in `models` directory
2. Check file isn't corrupted (re-download if needed)
3. Verify you have enough RAM (4GB minimum)

### Build Errors

**PyInstaller Issues:**
- Use Python 3.10 or 3.11 (3.12 may have compatibility issues)
- Ensure all dependencies are installed in virtual environment

**Electron Builder Issues:**
- Run `npm install` again
- Clear `node_modules` and reinstall
- Check Windows build tools are installed

### Runtime Errors

**"Model Not Found":**
- Place a `.gguf` model file in the `models` directory
- Restart the application

**Slow Performance:**
- Try a smaller model (TinyLlama or Phi-2)
- Close other applications to free RAM
- Reduce context length in `llm_service.py`

## Performance Tuning

### CPU Threads

Adjust in `python-backend/llm_service.py`:

```python
self.llm = Llama(
    model_path=model_path,
    n_ctx=4096,      # Context window
    n_threads=4,     # Increase for more cores
    n_gpu_layers=0,  # Keep 0 for CPU-only
)
```

### Context Window

Smaller context = faster responses but less context for answers:
- 2048: Fast, limited context
- 4096: Balanced (default)
- 8192: Slow, maximum context

## Model Recommendations

### For Embedded Distribution
- **Phi-2 Q4_K_M** (1.6 GB) - Best balance of size and quality

### For Best Quality
- **Mistral 7B Q4_K_M** (4.4 GB) - Highest quality answers

### For Minimum Size
- **TinyLlama Q4_K_M** (669 MB) - Smallest, adequate for basic Q&A

### For Development/Testing
- **TinyLlama** - Fastest iteration, small download

## Security Notes

- All processing happens locally
- No data is sent to external servers
- No telemetry or analytics
- All models run offline after initial download

## License Compliance

When distributing:
- Check model licenses (most are Apache 2.0 or MIT)
- Include license files for bundled models
- Attribute model creators in About section

## Advanced: Custom Models

To use custom GGUF models:

1. Place `.gguf` file in `models` directory
2. Adjust prompt format in `llm_service.py` if needed
3. Test with various document types

Most instruction-tuned models work out of the box.
