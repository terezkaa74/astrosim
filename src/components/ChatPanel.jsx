import { useState, useEffect, useRef } from 'react';

export default function ChatPanel({ onAskQuestion, messages, isProcessing }) {
  const [question, setQuestion] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        <p>Questions are answered using the local LLM based on the PDF content</p>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Ask questions about the research paper</p>
            <div className="sample-questions">
              <p className="sample-label">Try asking:</p>
              <ul>
                <li>What is the main finding of this paper?</li>
                <li>What methods or approaches were used?</li>
                <li>What are the key conclusions?</li>
                <li>What problem does this paper address?</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type} ${msg.isError ? 'error' : ''}`}>
                <div className="message-label">
                  {msg.type === 'question' ? 'You' : msg.isError ? 'Error' : 'LLM Answer'}
                </div>
                <div className="message-content">
                  {msg.content.split('\n').map((line, i) => (
                    line.trim() && <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="message answer">
                <div className="message-label">LLM Answer</div>
                <div className="message-content message-loading">
                  <div className="spinner-small"></div>
                  <span>Generating answer... This may take 5-30 seconds</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
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
