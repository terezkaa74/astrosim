export default function SummaryPanel({ summary, onExport }) {
  if (!summary) {
    return (
      <div className="empty-state">
        <p>Summary will appear here after uploading a PDF</p>
      </div>
    );
  }

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
      </div>
    </div>
  );
}
