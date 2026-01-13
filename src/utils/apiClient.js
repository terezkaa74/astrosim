/*
 * Offline PDF Reader with Local LLM - API Client
 * Copyright (c) 2024-2026 Tereza Gorgolova
 * All rights reserved.
 */

const BACKEND_URL = 'http://localhost:8000';
const DEFAULT_TIMEOUT = 60000;
const LLM_TIMEOUT = 120000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

class ApiError extends Error {
  constructor(message, status, isTimeout = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isTimeout = isTimeout;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out', 408, true);
    }
    throw error;
  }
}

async function checkHealth() {
  try {
    const response = await fetchWithTimeout(`${BACKEND_URL}/health`, {}, 5000);

    if (!response.ok) {
      return { healthy: false, modelLoaded: false, error: 'Backend not responding' };
    }

    const data = await response.json();
    return {
      healthy: true,
      modelLoaded: data.model_loaded === true,
      modelName: data.model_name,
      error: null,
    };
  } catch (error) {
    return {
      healthy: false,
      modelLoaded: false,
      error: error.message,
    };
  }
}

async function extractText(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithTimeout(
    `${BACKEND_URL}/extract-text`,
    { method: 'POST', body: formData },
    DEFAULT_TIMEOUT
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(`PDF extraction failed: ${errorText}`, response.status);
  }

  return response.json();
}

async function callLLMWithRetry(endpoint, body, retries = MAX_RETRIES) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`LLM request retry attempt ${attempt}/${retries}`);
        await sleep(RETRY_DELAY * attempt);
      }

      const healthCheck = await checkHealth();
      if (!healthCheck.healthy) {
        throw new ApiError('Backend is not available', 503);
      }
      if (!healthCheck.modelLoaded) {
        throw new ApiError('LLM model is not loaded. Place a .gguf file in the models directory.', 503);
      }

      const response = await fetchWithTimeout(
        `${BACKEND_URL}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        LLM_TIMEOUT
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(errorText, response.status);
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (error.isTimeout && attempt < retries) {
        console.warn(`LLM request timed out, will retry...`);
        continue;
      }

      if (error.status === 503) {
        throw error;
      }

      if (attempt === retries) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function generateSummary(text) {
  const truncatedText = text.substring(0, 8000);

  try {
    const result = await callLLMWithRetry('/summarize', { text: truncatedText });
    return {
      success: true,
      summary: cleanSummaryText(result.summary || result),
      error: null,
    };
  } catch (error) {
    console.error('Summary generation failed:', error);
    return {
      success: false,
      summary: null,
      error: getUserFriendlyError(error),
    };
  }
}

async function askQuestion(question, context) {
  const truncatedContext = context.substring(0, 6000);

  try {
    const result = await callLLMWithRetry('/answer', {
      question: question.trim(),
      context: truncatedContext,
    });
    return {
      success: true,
      answer: result.answer || result,
      error: null,
    };
  } catch (error) {
    console.error('Question answering failed:', error);
    return {
      success: false,
      answer: null,
      error: getUserFriendlyError(error),
    };
  }
}

async function askQuestionStream(question, context, onChunk, onComplete, onError) {
  const truncatedContext = context.substring(0, 6000);

  try {
    const healthCheck = await checkHealth();
    if (!healthCheck.healthy) {
      throw new ApiError('Backend is not available', 503);
    }
    if (!healthCheck.modelLoaded) {
      throw new ApiError('LLM model is not loaded. Place a .gguf file in the models directory.', 503);
    }

    const response = await fetchWithTimeout(
      `${BACKEND_URL}/answer-stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          context: truncatedContext,
        }),
      },
      LLM_TIMEOUT
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(errorText, response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.chunk) {
              onChunk(data.chunk);
            } else if (data.error) {
              onError(data.error);
              return;
            }
          } catch (e) {
            console.error('Failed to parse streaming response:', e);
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    console.error('Streaming question failed:', error);
    onError(getUserFriendlyError(error));
  }
}

function cleanSummaryText(rawSummary) {
  if (!rawSummary || typeof rawSummary !== 'string') {
    return null;
  }

  let cleaned = rawSummary.trim();

  cleaned = cleaned.replace(/^(Summary|Document Summary|Overview|Abstract)[:.]?\s*/i, '');

  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  cleaned = cleaned.replace(/^[-*•]\s*/gm, '');

  const lines = cleaned.split('\n');
  const seenLines = new Set();
  const uniqueLines = [];

  for (const line of lines) {
    const normalizedLine = line.trim().toLowerCase();
    if (normalizedLine && !seenLines.has(normalizedLine)) {
      seenLines.add(normalizedLine);
      uniqueLines.push(line);
    } else if (!normalizedLine && uniqueLines.length > 0) {
      const lastLine = uniqueLines[uniqueLines.length - 1];
      if (lastLine.trim()) {
        uniqueLines.push('');
      }
    }
  }

  cleaned = uniqueLines.join('\n').trim();

  if (cleaned.length < 50) {
    return null;
  }

  return cleaned;
}

function getUserFriendlyError(error) {
  if (error.isTimeout) {
    return 'The AI took too long to respond. This can happen with complex documents. Please try again.';
  }

  if (error.status === 503) {
    if (error.message.includes('model')) {
      return 'The AI model is not loaded. Please place a .gguf model file in the models directory and restart the backend.';
    }
    return 'The backend service is not available. Please ensure the backend is running.';
  }

  if (error.status === 500) {
    return 'The AI encountered an error while processing. Please try again with a shorter document.';
  }

  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    return 'Could not connect to the backend. Please ensure the backend is running on port 8000.';
  }

  return `An error occurred: ${error.message}`;
}

export {
  checkHealth,
  extractText,
  generateSummary,
  askQuestion,
  askQuestionStream,
  ApiError,
  BACKEND_URL,
};
