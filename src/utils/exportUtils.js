export function exportAsText(structure, summary) {
  let content = '';

  if (structure.title) {
    content += `${structure.title}\n`;
    content += '='.repeat(structure.title.length) + '\n\n';
  }

  content += 'SUMMARY\n';
  content += '-------\n\n';

  if (summary.mainIdea) {
    content += `Main Idea:\n${summary.mainIdea}\n\n`;
  }

  if (summary.methods) {
    content += `Methods:\n${summary.methods}\n\n`;
  }

  if (summary.results) {
    content += `Results:\n${summary.results}\n\n`;
  }

  if (summary.conclusion) {
    content += `Conclusion:\n${summary.conclusion}\n\n`;
  }

  if (structure.abstract) {
    content += '\nABSTRACT\n';
    content += '--------\n';
    content += `${structure.abstract}\n\n`;
  }

  if (structure.sections.length > 0) {
    content += '\nSECTIONS\n';
    content += '--------\n\n';

    structure.sections.forEach(section => {
      content += `${section.heading}\n`;
      content += `${section.content.join(' ')}\n\n`;
    });
  }

  return content;
}

export function exportAsMarkdown(structure, summary) {
  let content = '';

  if (structure.title) {
    content += `# ${structure.title}\n\n`;
  }

  content += '## Summary\n\n';

  if (summary.mainIdea) {
    content += `**Main Idea:** ${summary.mainIdea}\n\n`;
  }

  if (summary.methods) {
    content += `**Methods:** ${summary.methods}\n\n`;
  }

  if (summary.results) {
    content += `**Results:** ${summary.results}\n\n`;
  }

  if (summary.conclusion) {
    content += `**Conclusion:** ${summary.conclusion}\n\n`;
  }

  if (structure.abstract) {
    content += '## Abstract\n\n';
    content += `${structure.abstract}\n\n`;
  }

  if (structure.sections.length > 0) {
    content += '## Sections\n\n';

    structure.sections.forEach(section => {
      content += `### ${section.heading}\n\n`;
      content += `${section.content.join(' ')}\n\n`;
    });
  }

  return content;
}

export function exportTablesAsCSV(tables) {
  if (tables.length === 0) {
    return 'No tables found in the document.';
  }

  let csv = '';

  tables.forEach((table, index) => {
    if (index > 0) csv += '\n\n';

    csv += `Table ${index + 1}\n`;
    csv += table.headers.join(',') + '\n';

    table.rows.forEach(row => {
      csv += row.join(',') + '\n';
    });
  });

  return csv;
}

export function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
