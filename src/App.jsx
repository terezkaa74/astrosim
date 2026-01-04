import { useState } from 'react';
import PDFUploader from './components/PDFUploader';
import DocumentPanel from './components/DocumentPanel';
import ChatPanel from './components/ChatPanel';
import SummaryPanel from './components/SummaryPanel';
import { extractPDFContent, detectStructure, extractTables } from './utils/pdfProcessor';
import { findRelevantContext, generateAnswer, generateSummary } from './utils/textAnalyzer';
import { exportAsText, exportAsMarkdown, exportTablesAsCSV, downloadFile } from './utils/exportUtils';
import './App.css';

function App() {
  const [pdfData, setPdfData] = useState(null);
  const [structure, setStructure] = useState(null);
  const [tables, setTables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState('document');

  const handleUpload = async (file) => {
    setIsProcessing(true);
    setMessages([]);

    try {
      const extracted = await extractPDFContent(file);
      const detectedStructure = detectStructure(extracted.fullText);
      const detectedTables = extractTables(extracted.fullText);
      const generatedSummary = generateSummary(detectedStructure);

      setPdfData(extracted);
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

  const handleAskQuestion = (question) => {
    if (!pdfData) return;

    setMessages(prev => [...prev, { type: 'question', content: question }]);

    setTimeout(() => {
      const context = findRelevantContext(question, structure.sections, pdfData.fullText);
      const answer = generateAnswer(question, context);

      setMessages(prev => [...prev, { type: 'answer', content: answer }]);
    }, 500);
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
        <p>100% Offline • No APIs • No Internet Required</p>
      </footer>
    </div>
  );
}

export default App;
