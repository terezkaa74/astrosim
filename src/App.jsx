/*
 * Offline PDF Reader with Local LLM
 * Copyright (c) 2024-2026 Tereza Gorgolova
 * All rights reserved.
 *
 * This file is part of Offline PDF Reader created by Tereza Gorgolova
 */

import { useState, useEffect, useCallback } from 'react';
import PDFUploader from './components/PDFUploader';
import DocumentPanel from './components/DocumentPanel';
import ChatPanel from './components/ChatPanel';
import SummaryPanel from './components/SummaryPanel';
import { detectStructure, extractTables } from './utils/pdfProcessor';
import { exportAsText, exportAsMarkdown, exportTablesAsCSV, downloadFile } from './utils/exportUtils';
import { checkHealth, extractText, generateSummary, askQuestion, askQuestionStream } from './utils/apiClient';
import './App.css';

function App() {
  const [pdfData, setPdfData] = useState(null);
  const [structure, setStructure] = useState(null);
  const [tables, setTables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [view, setView] = useState('document');
  const [modelStatus, setModelStatus] = useState('checking');

  useEffect(() => {
    performHealthCheck();
    const interval = setInterval(performHealthCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  const performHealthCheck = async () => {
    const health = await checkHealth();

    if (!health.healthy) {
      setModelStatus('error');
    } else if (!health.modelLoaded) {
      setModelStatus('not_loaded');
    } else {
      setModelStatus('ready');
    }
  };

  const handleGenerateSummary = useCallback(async (text) => {
    if (!text || text.trim().length === 0) {
      setSummaryError('No text available to summarize.');
      return;
    }

    setIsSummarizing(true);
    setSummary(null);
    setSummaryError(null);

    console.log('Generating summary...');

    const result = await generateSummary(text);

    if (result.success && result.summary) {
      console.log('Summary generated successfully');
      setSummary(result.summary);
      setSummaryError(null);
    } else {
      console.error('Summary generation failed:', result.error);
      setSummary(null);
      setSummaryError(result.error || 'Failed to generate summary. Please try again.');
    }

    setIsSummarizing(false);
  }, []);

  const handleUpload = async (file) => {
    setIsProcessing(true);
    setMessages([]);
    setSummary(null);
    setSummaryError(null);

    try {
      console.log('Uploading PDF:', file.name);

      const { text, filename } = await extractText(file);

      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from this PDF. It may be image-based or encrypted.');
      }

      console.log('PDF text extracted, length:', text.length);

      const detectedStructure = detectStructure(text);
      const detectedTables = extractTables(text);

      setPdfData({ fullText: text, filename });
      setStructure(detectedStructure);
      setTables(detectedTables);
      setView('document');

      setIsProcessing(false);

      handleGenerateSummary(text);

    } catch (error) {
      console.error('Upload error:', error);
      alert(`Error: ${error.message}`);
      setPdfData(null);
      setStructure(null);
      setTables([]);
      setSummary(null);
      setSummaryError(null);
      setIsProcessing(false);
    }
  };

  const handleRetryGenrateSummary = useCallback(() => {
    if (pdfData && pdfData.fullText) {
      handleGenerateSummary(pdfData.fullText);
    }
  }, [pdfData, handleGenerateSummary]);

  const handleAskQuestion = async (question) => {
    if (!pdfData || !pdfData.fullText) {
      console.error('No PDF data available');
      return;
    }

    if (modelStatus !== 'ready') {
      setMessages(prev => [...prev,
        { type: 'question', content: question },
        { type: 'answer', content: 'The AI model is not ready. Please check that a .gguf model file is loaded in the models directory.', isError: true }
      ]);
      return;
    }

    setMessages(prev => [...prev, { type: 'question', content: question }]);
    setIsAnswering(true);

    console.log('Asking question with streaming:', question);

    let streamedAnswer = '';
    const answerIndex = messages.length + 1;

    askQuestionStream(
      question,
      pdfData.fullText,
      (chunk) => {
        streamedAnswer += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const existingAnswerIndex = newMessages.findIndex(
            (msg, idx) => idx === answerIndex && msg.type === 'answer'
          );

          if (existingAnswerIndex !== -1) {
            newMessages[existingAnswerIndex] = {
              type: 'answer',
              content: streamedAnswer,
              isStreaming: true
            };
          } else {
            newMessages.push({
              type: 'answer',
              content: streamedAnswer,
              isStreaming: true
            });
          }

          return newMessages;
        });
      },
      () => {
        console.log('Answer streaming completed');
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.isStreaming) {
            lastMsg.isStreaming = false;
          }
          return newMessages;
        });
        setIsAnswering(false);
      },
      (error) => {
        console.error('Streaming error:', error);
        setMessages(prev => [...prev, {
          type: 'answer',
          content: error || 'Failed to get an answer. Please try again.',
          isError: true
        }]);
        setIsAnswering(false);
      }
    );
  };

  const handleExport = (format) => {
    if (!structure) return;

    const baseFilename = pdfData?.filename?.replace('.pdf', '') || 'document';

    switch (format) {
      case 'txt':
        const textContent = exportAsText(structure, summary || '');
        downloadFile(textContent, `${baseFilename}_summary.txt`, 'text/plain');
        break;
      case 'md':
        const mdContent = exportAsMarkdown(structure, summary || '');
        downloadFile(mdContent, `${baseFilename}_summary.md`, 'text/markdown');
        break;
      case 'csv':
        const csvContent = exportTablesAsCSV(tables);
        downloadFile(csvContent, `${baseFilename}_tables.csv`, 'text/csv');
        break;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h1>Offline PDF Research Reader</h1>
          </div>
          {pdfData && (
            <div className="header-actions">
              <label htmlFor="new-pdf-upload" className="upload-new-btn">
                Upload New PDF
                <input
                  type="file"
                  id="new-pdf-upload"
                  accept="application/pdf"
                  onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}
        </div>
      </header>

      {!pdfData ? (
        <main className="main-upload">
          <PDFUploader onUpload={handleUpload} isProcessing={isProcessing} />
        </main>
      ) : (
        <>
          <nav className="view-tabs">
            <button
              className={view === 'document' ? 'active' : ''}
              onClick={() => setView('document')}
            >
              Document
            </button>
            <button
              className={view === 'summary' ? 'active' : ''}
              onClick={() => setView('summary')}
            >
              Summary
              {isSummarizing && <span className="tab-loading"></span>}
            </button>
            <button
              className={view === 'chat' ? 'active' : ''}
              onClick={() => setView('chat')}
            >
              Ask Questions
            </button>
          </nav>

          <main className="main-content">
            <div className="content-grid">
              {view === 'document' && (
                <DocumentPanel pdfData={pdfData} structure={structure} tables={tables} />
              )}
              {view === 'summary' && (
                <SummaryPanel
                  summary={summary}
                  summaryError={summaryError}
                  onExport={handleExport}
                  isLoading={isSummarizing}
                  onRetry={handleRetryGenrateSummary}
                />
              )}
              {view === 'chat' && (
                <ChatPanel
                  onAskQuestion={handleAskQuestion}
                  messages={messages}
                  isProcessing={isAnswering}
                />
              )}
            </div>
          </main>
        </>
      )}

      <footer className="app-footer">
        <p>100% Offline • Local LLM • No Internet Required • Created by Tereza Gorgolova</p>
        <div className="model-status">
          {modelStatus === 'ready' && <span className="status-ready">LLM Ready</span>}
          {modelStatus === 'not_loaded' && <span className="status-warning">Model Not Found - Place GGUF in models/</span>}
          {modelStatus === 'error' && <span className="status-error">Backend Not Running</span>}
          {modelStatus === 'checking' && <span className="status-checking">Checking...</span>}
        </div>
      </footer>
    </div>
  );
}

export default App;
