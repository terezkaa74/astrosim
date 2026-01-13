/*
 * Offline PDF Reader with Local LLM - PDF Processor
 * Copyright (c) 2024-2026 Tereza Gorgolova
 * All rights reserved.
 */

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
    fullText: text
  };

  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    structure.title = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
  }

  const abstractStart = text.toLowerCase().indexOf('abstract');
  if (abstractStart !== -1) {
    const abstractEnd = Math.min(abstractStart + 800, text.length);
    let abstract = text.substring(abstractStart, abstractEnd).trim();

    const nextSectionMatch = abstract.match(/\n\s*(introduction|background|methods?|1\.?\s)/i);
    if (nextSectionMatch) {
      abstract = abstract.substring(0, nextSectionMatch.index);
    }

    abstract = abstract.replace(/^abstract:?\s*/i, '').trim();
    structure.abstract = abstract;
  }

  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);

  const maxSections = 5;
  const sectionSize = Math.ceil(paragraphs.length / maxSections);

  for (let i = 0; i < maxSections && i * sectionSize < paragraphs.length; i++) {
    const startIdx = i * sectionSize;
    const endIdx = Math.min(startIdx + sectionSize, paragraphs.length);
    const sectionParagraphs = paragraphs.slice(startIdx, endIdx);

    if (sectionParagraphs.length > 0) {
      const heading = getSectionHeading(i, maxSections, sectionParagraphs[0]);
      const content = sectionParagraphs.join('\n\n');

      structure.sections.push({
        heading,
        content
      });
    }
  }

  return structure;
}

function getSectionHeading(index, total, firstParagraph) {
  if (index === 0) {
    return 'Beginning';
  } else if (index === total - 1) {
    return 'Conclusion';
  } else {
    const percentage = Math.round((index / (total - 1)) * 100);
    return `Section ${index + 1} (~${percentage}% through)`;
  }
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
