# Offline PDF Research Reader

A fully local, offline web application that helps you understand research PDFs using AI-style question answering without any external APIs or internet connection.

## Features

- **100% Offline** - Works completely offline after the first load
- **No APIs** - No OpenAI, Anthropic, or any cloud services
- **PDF Processing** - Extracts text, detects structure (title, abstract, sections), and identifies tables
- **Smart Q&A** - Ask questions and get answers using local text analysis (TF-IDF, keyword matching, context ranking)
- **Auto Summaries** - Generates structured summaries with main idea, methods, results, and conclusions
- **Export Options** - Export summaries as .txt, .md, or tables as .csv
- **Progressive Web App** - Install to your desktop like a native app

## How to Use

### For Users

1. Open the application in your browser
2. Click "Install" (if prompted) to add it to your desktop
3. Upload a research PDF
4. View the extracted document structure
5. Read the auto-generated summary
6. Ask questions about the document
7. Export summaries or tables

### Installation Options

#### Option 1: Use Online (Then Go Offline)
1. Visit the deployed URL
2. The app will cache itself
3. After the first visit, you can use it offline
4. Click "Install App" if prompted to add to desktop

#### Option 2: Run Locally
```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

#### Option 3: Build and Deploy
```bash
npm install
npm run build
```

The `dist` folder can be:
- Deployed to any static host (Netlify, Vercel, GitHub Pages)
- Served locally with `npm run preview`
- Opened directly from the file system

## How It Works

### PDF Extraction
- Uses PDF.js to extract text from PDFs
- Runs entirely in the browser
- No server-side processing

### Structure Detection
- Identifies title, abstract, sections, and tables
- Uses pattern matching and heuristics
- Works with most academic papers

### Question Answering
- Tokenizes and analyzes document content
- Uses TF-IDF for relevance scoring
- Computes cosine similarity between question and sentences
- Returns the most relevant excerpts
- No LLM required

### Summary Generation
- Automatically extracts key sections
- Identifies methods, results, and conclusions
- Formats into readable summaries

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool
- **PDF.js** - PDF parsing
- **Vite PWA Plugin** - Offline support
- **Vanilla JavaScript** - NLP algorithms

## Limitations

- Not as accurate as cloud LLMs, but works offline
- Best with well-structured academic papers
- Table extraction works best with tab-separated tables
- Question answering uses keyword/semantic matching, not true understanding

## Privacy

- No data leaves your device
- No tracking or analytics
- No external API calls
- Your PDFs never leave your browser

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 11.3+)

## License

MIT
