export default function DocumentPanel({ pdfData, structure, tables }) {
  if (!pdfData) {
    return (
      <div className="empty-state">
        <p>Upload a PDF to view its contents</p>
      </div>
    );
  }

  return (
    <div className="document-panel">
      <div className="document-info">
        <h3>{structure.title || pdfData.filename}</h3>
        <p className="page-count">{pdfData.numPages} pages</p>
      </div>

      {structure.abstract && (
        <div className="section">
          <h4>Abstract</h4>
          <p>{structure.abstract}</p>
        </div>
      )}

      {structure.sections.length > 0 && (
        <div className="sections">
          <h4>Sections</h4>
          {structure.sections.map((section, index) => (
            <details key={index} className="section-detail">
              <summary>{section.heading}</summary>
              <p>{section.content.join(' ')}</p>
            </details>
          ))}
        </div>
      )}

      {tables.length > 0 && (
        <div className="tables-section">
          <h4>Tables ({tables.length})</h4>
          {tables.map((table, index) => (
            <div key={index} className="table-container">
              <p className="table-title">Table {index + 1}</p>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {table.headers.map((header, i) => (
                        <th key={i}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
