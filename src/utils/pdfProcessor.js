import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

export async function extractPDFContent(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const numPages = pdf.numPages;
    let fullText = '';
    const pages = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      pages.push(pageText);
      fullText += pageText + '\n\n';
    }

    return {
      fullText,
      pages,
      numPages,
      filename: file.name
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract PDF content. Please ensure the file is a valid PDF.');
  }
}

export function detectStructure(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const structure = {
    title: '',
    abstract: '',
    sections: [],
    paragraphs: []
  };

  if (lines.length > 0) {
    structure.title = lines[0].trim();
  }

  const abstractRegex = /abstract/i;
  const sectionRegex = /^(\d+\.?\s+|[A-Z][A-Z\s]+:|\b(introduction|methods?|results?|discussion|conclusion|references)\b)/i;

  let currentSection = null;
  let abstractFound = false;
  let abstractText = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!abstractFound && abstractRegex.test(line)) {
      abstractFound = true;
      continue;
    }

    if (abstractFound && !structure.abstract) {
      if (sectionRegex.test(line)) {
        structure.abstract = abstractText.join(' ').trim();
        abstractFound = false;
      } else {
        abstractText.push(line);
        if (abstractText.join(' ').length > 500) {
          structure.abstract = abstractText.join(' ').trim();
          abstractFound = false;
        }
      }
    }

    if (sectionRegex.test(line) && line.length < 100) {
      if (currentSection) {
        structure.sections.push(currentSection);
      }
      currentSection = {
        heading: line,
        content: []
      };
    } else if (currentSection) {
      currentSection.content.push(line);
    } else {
      structure.paragraphs.push(line);
    }
  }

  if (currentSection) {
    structure.sections.push(currentSection);
  }

  return structure;
}

export function extractTables(text) {
  const lines = text.split('\n');
  const tables = [];
  let currentTable = null;

  for (const line of lines) {
    const cellCount = (line.match(/\t/g) || []).length;

    if (cellCount >= 2) {
      const cells = line.split('\t').map(cell => cell.trim()).filter(cell => cell);

      if (!currentTable) {
        currentTable = {
          headers: cells,
          rows: []
        };
      } else {
        currentTable.rows.push(cells);
      }
    } else if (currentTable && currentTable.rows.length > 0) {
      tables.push(currentTable);
      currentTable = null;
    }
  }

  if (currentTable && currentTable.rows.length > 0) {
    tables.push(currentTable);
  }

  return tables;
}
