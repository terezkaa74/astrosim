import { useState, useEffect } from 'react';
import PDFUploader from './components/PDFUploader';
import DocumentPanel from './components/DocumentPanel';
import ChatPanel from './components/ChatPanel';
import SummaryPanel from './components/SummaryPanel';
import { detectStructure, extractTables } from './utils/pdfProcessor';
import { exportAsText, exportAsMarkdown, exportTablesAsCSV, downloadFile } from './utils/exportUtils';
import './App.css';

const BACKEND_URL = 'http://localhost:8000';

function App() {
  const [pdfData, setPdfData] = useState(null);
  const [structure, setStructure] = useState(null);
  const [tables, setTables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState('document');
  const [modelStatus, setModelStatus] = useState('checking');

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      const data = await response.json();
      setModelStatus(data.model_loaded ? 'ready' : 'not_loaded');
    } catch (error) {
      setModelStatus('error');
    }
  };

  const handleUpload = async (file) => {
    setIsProcessing(true);
    setMessages([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/extract-text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract PDF text');
      }

      const { text, filename } = await response.json();

      const detectedStructure = detectStructure(text);
      const detectedTables = extractTables(text);

      const summaryResponse = await fetch(`${BACKEND_URL}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.substring(0, 8000) }),
      });

      const { summary: generatedSummary } = await summaryResponse.json();

      setPdfData({ fullText: text, filename });
      setStructure(detectedStructure);
      setTables(detectedTables);
      setSummary(generatedSummary);
      setView('document');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskQuestion = async (question) => {
    if (!pdfData) return;

    setMessages(prev => [...prev, { type: 'question', content: question }]);

    try {
      const response = await fetch(`${BACKEND_URL}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: pdfData.fullText.substring(0, 6000),
        }),
      });

      const { answer } = await response.json();
      setMessages(prev => [...prev, { type: 'answer', content: answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { type: 'answer', content: 'Error: Failed to get answer from LLM.' }]);
    }
  };

  const handleExport = (format) => {
    if (!structure || !summary) return;

    const baseFilename = pdfData?.filename?.replace('.pdf', '') || 'document';

    switch (format) {
      case 'txt':
        const textContent = exportAsText(structure, summary);
        downloadFile(textContent, `${baseFilename}_summary.txt`, 'text/plain');
        break;
      case 'md':
        const mdContent = exportAsMarkdown(structure, summary);
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
                <SummaryPanel summary={summary} onExport={handleExport} />
              )}
              {view === 'chat' && (
                <ChatPanel
                  onAskQuestion={handleAskQuestion}
                  messages={messages}
                  isProcessing={false}
                />
              )}
            </div>
          </main>
        </>
      )}

      <footer className="app-footer">
        <p>100% Offline • Local LLM • No Internet Required</p>
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
