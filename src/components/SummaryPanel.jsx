export default function SummaryPanel({ summary, onExport, isLoading }) {
  if (isLoading) {
    return (
      <div className="summary-panel">
        <div className="summary-header">
          <h3>Generating Summary...</h3>
        </div>
        <div className="summary-loading">
          <div className="spinner"></div>
          <p>The LLM is analyzing your document. This may take 10-30 seconds...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="empty-state">
        <p>Summary will appear here after uploading a PDF</p>
      </div>
    );
  }

  const isStringSummary = typeof summary === 'string';

  return (
    <div className="summary-panel">
      <div className="summary-header">
        <h3>Document Summary</h3>
        <div className="export-buttons">
          <button onClick={() => onExport('txt')} className="export-btn">
            Export .txt
          </button>
          <button onClick={() => onExport('md')} className="export-btn">
            Export .md
          </button>
          <button onClick={() => onExport('csv')} className="export-btn">
            Export Tables (CSV)
          </button>
        </div>
      </div>

      <div className="summary-content">
        {isStringSummary ? (
          <div className="summary-section">
            <h4>AI-Generated Summary</h4>
            <div className="summary-text">
              {summary.split('\n').map((paragraph, index) => (
                paragraph.trim() && <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        ) : (
          <>
            {summary.mainIdea && (
              <div className="summary-section">
                <h4>Main Idea</h4>
                <p>{summary.mainIdea}</p>
              </div>
            )}

            {summary.methods && (
              <div className="summary-section">
                <h4>Methods</h4>
                <p>{summary.methods}</p>
              </div>
            )}

            {summary.results && (
              <div className="summary-section">
                <h4>Results</h4>
                <p>{summary.results}</p>
              </div>
            )}

            {summary.conclusion && (
              <div className="summary-section">
                <h4>Conclusion</h4>
                <p>{summary.conclusion}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
