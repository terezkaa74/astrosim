"""
Offline PDF Reader with Local LLM - Backend Server
Copyright (c) 2024-2026 Tereza Gorgolova
All rights reserved.

This file is part of Offline PDF Reader created by Tereza Gorgolova
"""

import os
import sys
import argparse
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import Optional

from llm_service import LLMService
from pdf_service import PDFService

llm_service: Optional[LLMService] = None
pdf_service = PDFService()

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

@app.get("/")
@app.head("/")
async def root():
    return {"status": "running", "message": "PDF Reader Backend with Local LLM"}

@app.get("/health")
@app.head("/health")
async def health():
    model_loaded = llm_service is not None and llm_service.is_model_loaded()
    return {
        "status": "ok",
        "model_loaded": model_loaded
    }

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        text = pdf_service.extract_text(contents)
        return {"text": text, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summarize(request: SummaryRequest):
    try:
        if not llm_service or not llm_service.is_model_loaded():
            raise HTTPException(status_code=503, detail="LLM model not loaded")

        summary = llm_service.summarize(request.text)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/answer")
async def answer_question(request: QuestionRequest):
    try:
        if not llm_service or not llm_service.is_model_loaded():
            raise HTTPException(status_code=503, detail="LLM model not loaded")

        answer = llm_service.answer_question(request.question, request.context)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: QuestionRequest):
    try:
        if not llm_service or not llm_service.is_model_loaded():
            raise HTTPException(status_code=503, detail="LLM model not loaded")

        response = llm_service.chat(request.question, request.context)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--models-path", default="./models", help="Path to models directory")
    args = parser.parse_args()

    os.environ["MODELS_PATH"] = args.models_path

    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
