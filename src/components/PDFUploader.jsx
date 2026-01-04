import { useState } from 'react';

export default function PDFUploader({ onUpload, isProcessing }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onUpload(file);
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        onUpload(file);
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  return (
    <div
      className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="pdf-upload"
        accept="application/pdf"
        onChange={handleChange}
        disabled={isProcessing}
        style={{ display: 'none' }}
      />
      <label htmlFor="pdf-upload" className="upload-label">
        {isProcessing ? (
          <>
            <div className="spinner"></div>
            <p>Processing PDF...</p>
          </>
        ) : (
          <>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <h2>Upload Research PDF</h2>
            <p>Drag and drop or click to browse</p>
            <p className="upload-hint">Supports academic papers and research documents</p>
          </>
        )}
      </label>
    </div>
  );
}
