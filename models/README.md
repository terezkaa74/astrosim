# Models Directory

This directory should contain your GGUF format LLM model files.

## Getting Started

### Option 1: Use the Download Script (Easiest)

```bash
cd python-backend
python download_model.py
```

Select a model:
- **tinyllama** - 669 MB (fastest, basic quality)
- **phi-2** - 1.6 GB (recommended, good balance)
- **phi-3-mini** - 2.2 GB (better quality)
- **mistral** - 4.4 GB (best quality)

### Option 2: Manual Download

1. Visit Hugging Face:
   - [Phi-2 Models](https://huggingface.co/TheBloke/phi-2-GGUF)
   - [Phi-3 Models](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf)
   - [Mistral Models](https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF)
   - [TinyLlama Models](https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF)

2. Download a file ending in `.gguf` (preferably Q4_K_M quantization)

3. Place it in this directory

### Option 3: Use Your Own Model

Any GGUF format model will work. Just place the `.gguf` file here.

## Model Requirements

- Format: GGUF (not GGML, safetensors, or PyTorch)
- Quantization: Q4_K_M recommended for best size/quality balance
- Size: Depends on available disk space and RAM

## Verification

After placing a model, the application should show "LLM Ready" in the footer status.

If you see "Model Not Found", ensure:
1. File has `.gguf` extension
2. File is directly in this `models/` directory (not in a subdirectory)
3. File is not corrupted (try re-downloading)

## Notes

- Model files are NOT committed to git (too large)
- For distribution, include the model in the installer package
- Each user needs at least one model file to use the app
