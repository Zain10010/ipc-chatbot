import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Scale, 
  FileText, 
  Smile, 
  Languages, 
  Send, 
  Trash2, 
  Sparkles,
  ArrowRightLeft,
  RefreshCw,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';

const API_BASE = 'https://zain05-ipc-chatbot.hf.space/api';

const getErrorMessage = (err, defaultMsg) => {
  if (err.response && err.response.data && err.response.data.detail) {
    return err.response.data.detail;
  }
  return defaultMsg;
};

function App() {
  const [activeTab, setActiveTab] = useState('chatbot');

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">
            <Scale size={22} />
          </div>
          <span className="logo-text">LegalAI Suite</span>
        </div>

        <ul className="nav-links">
          <li className="nav-item">
            <button 
              className={`nav-btn ${activeTab === 'chatbot' ? 'active' : ''}`}
              onClick={() => setActiveTab('chatbot')}
            >
              <Scale size={18} />
              <span>IPC Chatbot</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${activeTab === 'summarizer' ? 'active' : ''}`}
              onClick={() => setActiveTab('summarizer')}
            >
              <FileText size={18} />
              <span>Text Summarizer</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${activeTab === 'sentiment' ? 'active' : ''}`}
              onClick={() => setActiveTab('sentiment')}
            >
              <Smile size={18} />
              <span>Sentiment Analyzer</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-btn ${activeTab === 'translator' ? 'active' : ''}`}
              onClick={() => setActiveTab('translator')}
            >
              <Languages size={18} />
              <span>Translator</span>
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          <p>Powered by Llama-3.1 & Groq</p>
          <p style={{ marginTop: '4px', fontSize: '11px', opacity: 0.6 }}>v1.0.0</p>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        {activeTab === 'chatbot' && <IPCChatbot />}
        {activeTab === 'summarizer' && <TextSummarizer />}
        {activeTab === 'sentiment' && <SentimentAnalyzer />}
        {activeTab === 'translator' && <LanguageTranslator />}
      </main>
    </div>
  );
}

/* ==========================================================================
   1. IPC Chatbot Component
   ========================================================================== */
function IPCChatbot() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your Indian Penal Code (IPC) Legal Assistant. How can I help you today? You can ask about specific sections, punishments, or general legal queries.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        message: userMessage,
        mode: 'ipc_chat'
      });
      setMessages(prev => [...prev, { role: 'bot', text: response.data.response }]);
    } catch (err) {
      console.error(err);
      const errorText = getErrorMessage(err, 'Error connecting to backend server. Make sure the FastAPI server is running on port 8000.');
      setMessages(prev => [...prev, { role: 'bot', text: errorText, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await axios.delete(`${API_BASE}/chat/history`);
      setMessages([
        { role: 'bot', text: 'Conversation history cleared. How can I assist you with IPC queries now?' }
      ]);
    } catch (err) {
      console.error(err);
      alert('Failed to clear history on backend.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">IPC Chatbot</h1>
          <p className="page-desc">Ask queries regarding the Indian Penal Code, Sections, and Punishments</p>
        </div>
        <button className="btn btn-secondary" onClick={handleClear} title="Clear Chat History">
          <Trash2 size={16} />
          <span>Clear History</span>
        </button>
      </div>

      <div className="glass-panel chat-container">
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <div className={`chat-avatar ${msg.role}`}>
                {msg.role === 'user' ? 'U' : <Scale size={16} />}
              </div>
              <div className="chat-bubble" style={msg.isError ? { border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)', color: '#f87171' } : {}}>
                {msg.text.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message bot">
              <div className="chat-avatar bot">
                <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
              </div>
              <div className="chat-bubble" style={{ opacity: 0.7 }}>
                Searching legal database and drafting response...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-area">
          <input
            type="text"
            className="text-input"
            placeholder="e.g., What is Section 302 of IPC?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn" disabled={loading || !input.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. Text Summarizer Component
   ========================================================================== */
function TextSummarizer() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSummarize = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setSummary('');
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        message: text,
        mode: 'summarize'
      });
      setSummary(response.data.response);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Failed to generate summary. Please check your connection.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Text Summarizer</h1>
        <p className="page-desc">Condense large legal documents, case briefings, or articles into concise points</p>
      </div>

      <div className="glass-panel">
        <div className="form-group">
          <label className="form-label">Input Text</label>
          <textarea
            className="text-input textarea-input"
            placeholder="Paste your legal document, article, or paragraph here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
          />
        </div>

        <button 
          className="btn" 
          onClick={handleSummarize} 
          disabled={loading || !text.trim()}
        >
          {loading ? (
            <>
              <RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
              <span>Summarizing...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Summarize Text</span>
            </>
          )}
        </button>

        {error && (
          <div className="result-panel" style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div className="result-title" style={{ color: '#f87171' }}>
              <AlertCircle size={18} />
              <span>Error</span>
            </div>
            <div className="result-content" style={{ color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
              {error}
            </div>
          </div>
        )}

        {summary && (
          <div className="result-panel">
            <div className="result-title">
              <Sparkles size={18} />
              <span>Summary Result</span>
            </div>
            <div className="result-content">
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   3. Sentiment Analyzer Component
   ========================================================================== */
function SentimentAnalyzer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        message: text,
        mode: 'sentiment'
      });
      
      const fullResponse = response.data.response;
      let sentiment = 'neutral';
      let explanation = fullResponse;

      if (fullResponse.toUpperCase().includes('[POSITIVE]')) {
        sentiment = 'positive';
        explanation = fullResponse.replace(/\[POSITIVE\]/i, '').trim();
      } else if (fullResponse.toUpperCase().includes('[NEGATIVE]')) {
        sentiment = 'negative';
        explanation = fullResponse.replace(/\[NEGATIVE\]/i, '').trim();
      } else if (fullResponse.toUpperCase().includes('[NEUTRAL]')) {
        sentiment = 'neutral';
        explanation = fullResponse.replace(/\[NEUTRAL\]/i, '').trim();
      }

      setResult({ sentiment, explanation });
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Error processing sentiment analysis.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sentiment Analyzer</h1>
        <p className="page-desc">Analyze user statements, testimony transcriptions, or comments for emotional tone</p>
      </div>

      <div className="glass-panel">
        <div className="form-group">
          <label className="form-label">Input Text</label>
          <textarea
            className="text-input textarea-input"
            style={{ minHeight: '120px' }}
            placeholder="Type or paste the sentence or testimonial to analyze..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
          />
        </div>

        <button 
          className="btn" 
          onClick={handleAnalyze} 
          disabled={loading || !text.trim()}
        >
          {loading ? (
            <>
              <RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Smile size={18} />
              <span>Analyze Tone</span>
            </>
          )}
        </button>

        {error && (
          <div className="result-panel" style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div className="result-title" style={{ color: '#f87171' }}>
              <AlertCircle size={18} />
              <span>Error</span>
            </div>
            <div className="result-content" style={{ color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
              {error}
            </div>
          </div>
        )}

        {result && (
          <div className="result-panel">
            <div className="result-title">
              <Smile size={18} />
              <span>Analysis Report</span>
            </div>
            
            <div className={`sentiment-badge sentiment-${result.sentiment}`}>
              {result.sentiment}
            </div>

            <div className="result-content">
              {result.explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   4. Language Translator Component
   ========================================================================== */
const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'Hindi' },
  { code: 'Spanish', label: 'Spanish' },
  { code: 'French', label: 'French' },
  { code: 'German', label: 'German' },
  { code: 'Japanese', label: 'Japanese' },
  { code: 'Chinese', label: 'Chinese' }
];

function LanguageTranslator() {
  const [text, setText] = useState('');
  const [targetLang, setTargetLang] = useState('Hindi');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setTranslation('');
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        message: `Translate the following text to ${targetLang}:\n\n${text}`,
        mode: 'translate'
      });
      setTranslation(response.data.response);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Error executing translation.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Language Translator</h1>
        <p className="page-desc">Translate phrases or legal paragraphs into target languages</p>
      </div>

      <div className="glass-panel">
        <div className="form-group">
          <label className="form-label">Target Language</label>
          <select 
            className="select-input"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            disabled={loading}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Text to Translate</label>
          <textarea
            className="text-input textarea-input"
            placeholder="Type your sentence here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
          />
        </div>

        <button 
          className="btn" 
          onClick={handleTranslate} 
          disabled={loading || !text.trim()}
        >
          {loading ? (
            <>
              <RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
              <span>Translating...</span>
            </>
          ) : (
            <>
              <Languages size={18} />
              <span>Translate Text</span>
            </>
          )}
        </button>

        {error && (
          <div className="result-panel" style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div className="result-title" style={{ color: '#f87171' }}>
              <AlertCircle size={18} />
              <span>Error</span>
            </div>
            <div className="result-content" style={{ color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
              {error}
            </div>
          </div>
        )}

        {translation && (
          <div className="result-panel">
            <div className="result-title">
              <Languages size={18} />
              <span>Translation</span>
            </div>
            <div className="result-content">
              {translation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
