export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

export function calculateTFIDF(documents) {
  const tokenizedDocs = documents.map(doc => tokenize(doc));
  const allTokens = new Set(tokenizedDocs.flat());

  const tf = tokenizedDocs.map(tokens => {
    const freq = {};
    tokens.forEach(token => {
      freq[token] = (freq[token] || 0) + 1;
    });
    const maxFreq = Math.max(...Object.values(freq));
    Object.keys(freq).forEach(token => {
      freq[token] = freq[token] / maxFreq;
    });
    return freq;
  });

  const idf = {};
  allTokens.forEach(token => {
    const docsWithToken = tokenizedDocs.filter(tokens => tokens.includes(token)).length;
    idf[token] = Math.log(documents.length / (1 + docsWithToken));
  });

  return { tf, idf };
}

export function cosineSimilarity(vec1, vec2) {
  const intersection = Object.keys(vec1).filter(key => vec2[key]);

  if (intersection.length === 0) return 0;

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  intersection.forEach(key => {
    dotProduct += vec1[key] * vec2[key];
  });

  Object.values(vec1).forEach(val => mag1 += val * val);
  Object.values(vec2).forEach(val => mag2 += val * val);

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  if (mag1 === 0 || mag2 === 0) return 0;

  return dotProduct / (mag1 * mag2);
}

export function findRelevantContext(question, sections, fullText) {
  const questionTokens = tokenize(question);
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'this', 'that', 'these', 'those', 'what', 'how', 'why', 'when', 'where', 'who']);

  const keywords = questionTokens.filter(token => !stopWords.has(token));

  const sentences = fullText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  const scoredSentences = sentences.map(sentence => {
    const sentenceTokens = tokenize(sentence);
    const keywordMatches = keywords.filter(kw => sentenceTokens.includes(kw)).length;

    const allDocs = [question, sentence];
    const { tf, idf } = calculateTFIDF(allDocs);

    const questionVec = {};
    const sentenceVec = {};

    questionTokens.forEach(token => {
      if (idf[token]) {
        questionVec[token] = (tf[0][token] || 0) * idf[token];
      }
    });

    sentenceTokens.forEach(token => {
      if (idf[token]) {
        sentenceVec[token] = (tf[1][token] || 0) * idf[token];
      }
    });

    const similarity = cosineSimilarity(questionVec, sentenceVec);
    const score = (keywordMatches * 2) + (similarity * 10);

    return { sentence, score, keywordMatches };
  });

  scoredSentences.sort((a, b) => b.score - a.score);

  const topSentences = scoredSentences.slice(0, 5).filter(s => s.score > 0);

  if (topSentences.length === 0) {
    return null;
  }

  return topSentences.map(s => s.sentence).join(' ');
}

export function generateAnswer(question, context) {
  if (!context) {
    return "I couldn't find relevant information in the PDF to answer your question. Try rephrasing or asking about a different topic covered in the document.";
  }

  const questionLower = question.toLowerCase();

  if (questionLower.includes('what is') || questionLower.includes('what are')) {
    return `Based on the document: ${context}`;
  } else if (questionLower.includes('how')) {
    return `The document explains: ${context}`;
  } else if (questionLower.includes('why')) {
    return `According to the paper: ${context}`;
  } else if (questionLower.includes('when') || questionLower.includes('where')) {
    return `From the document: ${context}`;
  } else {
    return `Relevant excerpt: ${context}`;
  }
}

export function generateSummary(structure) {
  const summary = {
    mainIdea: '',
    methods: '',
    results: '',
    conclusion: ''
  };

  if (structure.abstract) {
    summary.mainIdea = structure.abstract.substring(0, 300) + (structure.abstract.length > 300 ? '...' : '');
  } else if (structure.paragraphs.length > 0) {
    const firstParagraphs = structure.paragraphs.slice(0, 3).join(' ');
    summary.mainIdea = firstParagraphs.substring(0, 300) + (firstParagraphs.length > 300 ? '...' : '');
  }

  structure.sections.forEach(section => {
    const heading = section.heading.toLowerCase();
    const content = section.content.join(' ').substring(0, 250);

    if (heading.includes('method')) {
      summary.methods = content;
    } else if (heading.includes('result')) {
      summary.results = content;
    } else if (heading.includes('conclusion') || heading.includes('discussion')) {
      summary.conclusion = content;
    }
  });

  return summary;
}
