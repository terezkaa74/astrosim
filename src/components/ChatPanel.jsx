import { useState } from 'react';

export default function ChatPanel({ onAskQuestion, messages, isProcessing }) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim() && !isProcessing) {
      onAskQuestion(question);
      setQuestion('');
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Ask Questions</h3>
        <p>Questions are answered using only the PDF content</p>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Ask questions about the research paper</p>
            <div className="sample-questions">
              <p className="sample-label">Try asking:</p>
              <ul>
                <li>What is the main finding?</li>
                <li>What methods were used?</li>
                <li>What are the conclusions?</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              <div className="message-label">
                {msg.type === 'question' ? 'You' : 'Answer'}
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the document..."
          disabled={isProcessing}
          className="chat-input"
        />
        <button type="submit" disabled={!question.trim() || isProcessing} className="send-button">
          {isProcessing ? (
            <span className="spinner-small"></span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
