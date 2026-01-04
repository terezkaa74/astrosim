# Quick Start Guide

Get the Offline PDF Reader with Local LLM running in 5 minutes.

## Prerequisites

- Windows 10/11
- Node.js 18+
- Python 3.10 or 3.11

## Installation Steps

### 1. Clone and Install

```bash
git clone <repository-url>
cd offline-pdf-reader
npm install
```

### 2. Set Up Python Backend

```bash
cd python-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Download a Model

```bash
python download_model.py
```

Choose **phi-2** for a good balance of size (1.6GB) and quality.

### 4. Run the App

**Single Command - Starts Everything:**
```bash
npm run electron:dev
```

This automatically:
- ✅ Checks and cleans up any port conflicts
- ✅ Kills existing backend processes (prevents crashes)
- ✅ Starts the Python backend in the correct virtual environment
- ✅ Starts the Vite development server
- ✅ Opens the Electron desktop app

**Note:** The backend starts automatically with smart conflict resolution! No more port errors, 405 spam, or multiple instances running.

## First Use

1. The app opens in a desktop window
2. Check the footer for "LLM Ready" status (green)
3. Drag and drop a PDF file
4. Wait for processing (shows in bottom status)
5. Explore the three tabs:
   - **Document**: View extracted text and structure
   - **Summary**: Get AI-generated summary
   - **Ask Questions**: Chat with the document

## Try It Out

Use the sample questions:
- "What is the main topic of this paper?"
- "What methods were used?"
- "What are the key findings?"

## What Makes This Different

Unlike the previous version that used TF-IDF and keyword matching, this version uses a real Large Language Model running locally:

- **Real AI Understanding**: Phi-2/Mistral can comprehend context and reasoning
- **Natural Language**: Answers written in complete, coherent sentences
- **Summarization**: Generates actual summaries, not just extracted sentences
- **Better Context**: Understands relationships between concepts

## Performance Tips

### Faster Responses
- Use smaller models (TinyLlama for testing)
- Reduce context length in `llm_service.py`
- Close other applications

### Better Quality
- Use larger models (Mistral 7B)
- Provide more context (increase n_ctx)
- Ask specific questions

## Building for Distribution

To create a Windows .exe installer:

```bash
build-windows.bat
```

The installer will be in the `dist` directory.

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed build instructions.

## Troubleshooting

### "Virtual Environment Not Found"
The auto-start script couldn't find the Python venv. Make sure you completed step 2:
```bash
cd python-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### "ModuleNotFoundError: No module named 'fastapi'"
Dependencies aren't installed. Reinstall them:
```bash
cd python-backend
venv\Scripts\activate
pip install -r requirements.txt
```

### "Model Not Found"
Place a `.gguf` file in the `models` directory and restart:
```bash
cd python-backend
python download_model.py
```

### "Port 8000 Already in Use"
Another backend instance is running. Kill it:
```bash
# Windows
taskkill /F /IM python.exe

# Linux/Mac
pkill -f "python.*main.py"
```

### Slow Performance
- Try TinyLlama (669MB) instead of larger models
- Reduce n_threads in `llm_service.py` if CPU usage is too high
- Ensure you have at least 4GB free RAM

### Installation Issues
- Use Python 3.10 or 3.11 (not 3.12)
- Reinstall dependencies: `pip install -r requirements.txt --force-reinstall`
- For llama-cpp-python issues, ensure Visual C++ build tools are installed

### Need More Help?
See [AUTO_BACKEND_SETUP.md](AUTO_BACKEND_SETUP.md) for detailed troubleshooting of the automatic backend startup.

## Next Steps

- Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed configuration
- Try different models to find the best balance for your needs
- Customize prompts in `llm_service.py` for specific document types

## Support

For issues:
1. Check the Electron console (View > Toggle Developer Tools)
2. Check Python backend logs (Terminal 1)
3. Verify model file is valid (re-download if needed)
