"""
Offline PDF Reader with Local LLM - LLM Service
Copyright (c) 2024-2026 Tereza Gorgolova
All rights reserved.

This file is part of Offline PDF Reader created by Tereza Gorgolova
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, models_path: str):
        self.models_path = os.path.abspath(models_path)
        self.llm = None
        self.model_name = None
        self._initialized = False
        self._load_model()

    def _find_model_file(self) -> Optional[str]:
        if not os.path.exists(self.models_path):
            logger.warning(f"Models directory not found: {self.models_path}")
            return None

        if not os.path.isdir(self.models_path):
            logger.warning(f"Models path is not a directory: {self.models_path}")
            return None

        supported_extensions = ['.gguf', '.bin']

        try:
            files = os.listdir(self.models_path)
        except PermissionError as e:
            logger.error(f"Permission denied accessing models directory: {e}")
            return None
        except Exception as e:
            logger.error(f"Error listing models directory: {e}")
            return None

        model_files = []
        for file in files:
            if any(file.lower().endswith(ext) for ext in supported_extensions):
                full_path = os.path.join(self.models_path, file)
                if os.path.isfile(full_path):
                    model_files.append(full_path)

        if not model_files:
            logger.info(f"No model files found in: {self.models_path}")
            logger.info(f"Supported extensions: {supported_extensions}")
            return None

        model_files.sort(key=lambda x: os.path.getsize(x), reverse=True)
        selected = model_files[0]
        logger.info(f"Found {len(model_files)} model file(s), using: {os.path.basename(selected)}")

        return selected

    def _load_model(self):
        model_path = self._find_model_file()

        if not model_path:
            logger.warning("No model file found")
            logger.warning(f"Place a .gguf model file in: {self.models_path}")
            self._initialized = True
            return

        if not os.path.exists(model_path):
            logger.error(f"Model file does not exist: {model_path}")
            self._initialized = True
            return

        file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
        logger.info(f"Loading model: {os.path.basename(model_path)} ({file_size_mb:.1f} MB)")

        try:
            from llama_cpp import Llama

            self.llm = Llama(
                model_path=model_path,
                n_ctx=4096,
                n_threads=4,
                n_gpu_layers=0,
                verbose=False
            )
            self.model_name = os.path.basename(model_path)
            logger.info(f"Model loaded successfully: {self.model_name}")

        except ImportError as e:
            logger.error(f"llama-cpp-python not installed: {e}")
            logger.error("Run: python -m pip install llama-cpp-python")
            self.llm = None

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.llm = None

        self._initialized = True

    def is_model_loaded(self) -> bool:
        return self.llm is not None

    def is_initialized(self) -> bool:
        return self._initialized

    def _generate(self, prompt: str, max_tokens: int = 512) -> str:
        if not self.is_model_loaded():
            return "Error: Model not loaded. Please ensure a GGUF model is placed in the models directory."

        try:
            output = self.llm(
                prompt,
                max_tokens=max_tokens,
                temperature=0.7,
                top_p=0.9,
                echo=False,
                stop=["</s>", "\n\nQuestion:", "\n\nContext:", "\n\nDocument:", "###"]
            )

            if not output or 'choices' not in output or not output['choices']:
                return "Unable to generate a response. Please try again."

            response_text = output['choices'][0].get('text', '').strip()

            if not response_text or len(response_text) < 10:
                return "I apologize, but I was unable to generate a proper response. Please try rephrasing your question."

            return response_text

        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            return f"Error generating response: {str(e)}"

    def summarize(self, text: str, max_length: int = 300) -> str:
        if not text or not text.strip():
            return "No text provided for summarization."

        if len(text) > 8000:
            text = text[:8000]

        prompt = f"""You are a helpful assistant. Create a concise summary of the following document.

Document:
{text}

Provide a clear summary covering the main points, key findings, and conclusions:"""

        return self._generate(prompt, max_tokens=500)

    def answer_question(self, question: str, context: str) -> str:
        if not question or not question.strip():
            return "No question provided."

        if not context or not context.strip():
            return "No context provided to answer the question."

        if len(context) > 6000:
            context = context[:6000]

        prompt = f"""Answer the following question based only on the provided context from a document.

Context:
{context}

Question: {question}

Answer:"""

        return self._generate(prompt, max_tokens=350)

    def chat(self, message: str, document_context: str) -> str:
        if not message or not message.strip():
            return "No message provided."

        if len(document_context) > 5000:
            document_context = document_context[:5000]

        prompt = f"""<|system|>
You are a helpful assistant discussing a document with the user. Use the document context to inform your responses.
</|system|>

<|user|>
Document Context:
{document_context}

User: {message}
</|user|>

<|assistant|>"""

        return self._generate(prompt, max_tokens=400)
