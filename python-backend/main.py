"""
Offline PDF Reader with Local LLM - Backend Server
Copyright (c) 2024-2026 Tereza Gorgolova
All rights reserved.

This file is part of Offline PDF Reader created by Tereza Gorgolova
"""

import os
import sys
import socket
import argparse
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
from typing import Optional
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

llm_service = None
pdf_service = None

def check_port_available(host: str, port: int) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    try:
        sock.bind((host, port))
        sock.close()
        return True
    except OSError:
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm_service, pdf_service

    from pdf_service import PDFService

    logger.info("Starting backend initialization...")

    pdf_service = PDFService()
    logger.info("PDF service initialized")

    models_path = os.environ.get("MODELS_PATH", "./models")
    abs_models_path = os.path.abspath(models_path)
    logger.info(f"Models path: {abs_models_path}")

    if not os.path.exists(abs_models_path):
        logger.warning(f"Models directory does not exist: {abs_models_path}")
        logger.warning("Creating models directory...")
        try:
            os.makedirs(abs_models_path, exist_ok=True)
        except Exception as e:
            logger.error(f"Failed to create models directory: {e}")

    try:
        from llm_service import LLMService
        llm_service = LLMService(abs_models_path)
        if llm_service.is_model_loaded():
            logger.info(f"LLM service ready with model: {llm_service.model_name}")
        else:
            logger.warning("LLM service started but no model loaded")
            logger.warning("Place a .gguf model file in the models directory")
    except Exception as e:
        logger.error(f"Failed to initialize LLM service: {e}")
        logger.warning("Backend will run without LLM capabilities")
        llm_service = None

    logger.info("Backend initialization complete")
    logger.info("Server is ready to accept requests")

    yield

    logger.info("Shutting down backend...")
    llm_service = None
    pdf_service = None
    logger.info("Backend shutdown complete")

app = FastAPI(
    title="Offline PDF Reader Backend",
    description="Local LLM-powered PDF analysis - Created by Tereza Gorgolova",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str
    context: str

class SummaryRequest(BaseModel):
    text: str

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "status": "running",
        "message": "PDF Reader Backend with Local LLM",
        "author": "Tereza Gorgolova"
    }

@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    model_loaded = llm_service is not None and llm_service.is_model_loaded()
    model_name = None
    if llm_service and hasattr(llm_service, 'model_name'):
        model_name = llm_service.model_name

    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "model_name": model_name,
        "pdf_service": pdf_service is not None
    }

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    if pdf_service is None:
        raise HTTPException(status_code=503, detail="PDF service not initialized")

    try:
        contents = await file.read()
        text = pdf_service.extract_text(contents)
        return {"text": text, "filename": file.filename}
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summarize(request: SummaryRequest):
    if llm_service is None or not llm_service.is_model_loaded():
        raise HTTPException(
            status_code=503,
            detail="LLM model not loaded. Place a .gguf model in the models directory."
        )

    try:
        summary = llm_service.summarize(request.text)
        return {"summary": summary}
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/answer")
async def answer_question(request: QuestionRequest):
    if llm_service is None or not llm_service.is_model_loaded():
        raise HTTPException(
            status_code=503,
            detail="LLM model not loaded. Place a .gguf model in the models directory."
        )

    try:
        answer = llm_service.answer_question(request.question, request.context)
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Question answering error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/answer-stream")
async def answer_question_stream(request: QuestionRequest):
    if llm_service is None or not llm_service.is_model_loaded():
        raise HTTPException(
            status_code=503,
            detail="LLM model not loaded. Place a .gguf model in the models directory."
        )

    def generate():
        try:
            for chunk in llm_service.answer_question_stream(request.question, request.context):
                data = json.dumps({"chunk": chunk}) + "\n"
                yield data
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            error_data = json.dumps({"error": str(e)}) + "\n"
            yield error_data

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/chat")
async def chat(request: QuestionRequest):
    if llm_service is None or not llm_service.is_model_loaded():
        raise HTTPException(
            status_code=503,
            detail="LLM model not loaded. Place a .gguf model in the models directory."
        )

    try:
        response = llm_service.chat(request.question, request.context)
        return {"response": response}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def main():
    parser = argparse.ArgumentParser(description="PDF Reader Backend Server")
    parser.add_argument(
        "--models-path",
        default="./models",
        help="Path to models directory"
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host to bind to"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind to"
    )
    args = parser.parse_args()

    os.environ["MODELS_PATH"] = args.models_path

    if not check_port_available(args.host, args.port):
        logger.error(f"Port {args.port} is already in use!")
        logger.error("Another backend instance may be running.")
        logger.error("The existing instance will be used.")
        sys.exit(0)

    logger.info(f"Starting server on {args.host}:{args.port}")

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="warning",
        access_log=False
    )

if __name__ == "__main__":
    main()
