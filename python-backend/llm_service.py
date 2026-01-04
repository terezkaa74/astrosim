import os
from typing import Optional
from llama_cpp import Llama

class LLMService:
    def __init__(self, models_path: str):
        self.models_path = models_path
        self.llm: Optional[Llama] = None
        self.model_name = None
        self._load_model()

    def _find_model_file(self):
        if not os.path.exists(self.models_path):
            print(f"Models directory not found: {self.models_path}")
            return None

        supported_extensions = ['.gguf', '.bin']

        for file in os.listdir(self.models_path):
            if any(file.endswith(ext) for ext in supported_extensions):
                return os.path.join(self.models_path, file)

        return None

    def _load_model(self):
        model_path = self._find_model_file()

        if not model_path:
            print("No model file found. Please place a GGUF model in the models directory.")
            print(f"Expected path: {self.models_path}")
            return

        try:
            print(f"Loading model from: {model_path}")
            self.llm = Llama(
                model_path=model_path,
                n_ctx=4096,
                n_threads=4,
                n_gpu_layers=0,
                verbose=False
            )
            self.model_name = os.path.basename(model_path)
            print(f"Model loaded successfully: {self.model_name}")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.llm = None

    def is_model_loaded(self) -> bool:
        return self.llm is not None

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
            response_text = output['choices'][0]['text'].strip()

            if not response_text or len(response_text) < 10:
                return "I apologize, but I was unable to generate a proper response. Please try rephrasing your question."

            return response_text
        except Exception as e:
            print(f"LLM generation error: {e}")
            return f"Error generating response: {str(e)}"

    def summarize(self, text: str, max_length: int = 300) -> str:
        if len(text) > 8000:
            text = text[:8000]

        prompt = f"""You are a helpful assistant. Create a concise summary of the following document.

Document:
{text}

Provide a clear summary covering the main points, key findings, and conclusions:"""

        return self._generate(prompt, max_tokens=500)

    def answer_question(self, question: str, context: str) -> str:
        if len(context) > 6000:
            context = context[:6000]

        prompt = f"""Answer the following question based only on the provided context from a document.

Context:
{context}

Question: {question}

Answer:"""

        return self._generate(prompt, max_tokens=350)

    def chat(self, message: str, document_context: str) -> str:
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
