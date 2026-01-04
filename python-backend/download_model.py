import os
import sys
import urllib.request
from pathlib import Path

MODELS = {
    "phi-2": {
        "name": "Phi-2 (2.7B) - Q4_K_M",
        "url": "https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf",
        "size": "1.6 GB",
        "filename": "phi-2.Q4_K_M.gguf"
    },
    "phi-3-mini": {
        "name": "Phi-3 Mini (3.8B) - Q4_K_M",
        "url": "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf",
        "size": "2.2 GB",
        "filename": "phi-3-mini-4k-instruct-q4.gguf"
    },
    "mistral": {
        "name": "Mistral 7B Instruct - Q4_K_M",
        "url": "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
        "size": "4.4 GB",
        "filename": "mistral-7b-instruct-v0.2.Q4_K_M.gguf"
    },
    "tinyllama": {
        "name": "TinyLlama 1.1B - Q4_K_M",
        "url": "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
        "size": "669 MB",
        "filename": "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
    }
}

def download_with_progress(url, dest_path):
    def report_progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        percent = min(downloaded * 100 / total_size, 100)
        downloaded_mb = downloaded / (1024 * 1024)
        total_mb = total_size / (1024 * 1024)
        sys.stdout.write(f"\rDownloading: {percent:.1f}% ({downloaded_mb:.1f}/{total_mb:.1f} MB)")
        sys.stdout.flush()

    urllib.request.urlretrieve(url, dest_path, report_progress)
    print()

def main():
    models_dir = Path(__file__).parent.parent / "models"
    models_dir.mkdir(exist_ok=True)

    print("Available Models:")
    print("-" * 50)
    for key, model in MODELS.items():
        print(f"{key}: {model['name']} ({model['size']})")
    print("-" * 50)

    choice = input("\nEnter model key to download (or 'exit' to quit): ").strip().lower()

    if choice == 'exit':
        print("Exiting...")
        return

    if choice not in MODELS:
        print(f"Invalid choice. Please select from: {', '.join(MODELS.keys())}")
        return

    model = MODELS[choice]
    dest_path = models_dir / model['filename']

    if dest_path.exists():
        overwrite = input(f"\n{model['filename']} already exists. Overwrite? (y/n): ").strip().lower()
        if overwrite != 'y':
            print("Download cancelled.")
            return

    print(f"\nDownloading {model['name']}...")
    print(f"Size: {model['size']}")
    print(f"Destination: {dest_path}")
    print()

    try:
        download_with_progress(model['url'], dest_path)
        print(f"\nSuccessfully downloaded {model['name']}")
        print(f"Location: {dest_path}")
    except Exception as e:
        print(f"\nError downloading model: {e}")
        if dest_path.exists():
            dest_path.unlink()

if __name__ == "__main__":
    main()
