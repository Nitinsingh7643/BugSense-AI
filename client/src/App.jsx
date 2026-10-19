import React, { useState, useEffect, useCallback } from 'react';
import {
  Bug,
  Database,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  BarChart3,
  Settings,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Code2,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  Star,
  Trash2,
  X,
  FileCode,
  Terminal,
  Zap,
  ArrowRight,
  Layers,
  ClipboardPaste,
  Cpu,
  Edit3,
  Plus,
  Circle
} from 'lucide-react';
import './App.css';

const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;
  if (!envUrl) return 'http://localhost:5000/api';
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE = getApiBase();

const PRESETS = [
  {
    name: 'Python IndexError',
    lang: 'python',
    dotClass: 'python',
    error: 'IndexError: list index out of range\n  File "grades.py", line 7, in <module>\n    top_student = scores[len(scores)]',
    code: 'scores = [88, 92, 79, 95]\n# Trying to get the last score:\nlast_score = scores[len(scores)]\nprint("Last score:", last_score)'
  },
  {
    name: 'JS Cannot read properties',
    lang: 'javascript',
    dotClass: 'javascript',
    error: "TypeError: Cannot read properties of undefined (reading 'map')\n  at UserList (src/components/UserList.jsx:14:24)",
    code: 'function UserList() {\n  const [users, setUsers] = useState();\n\n  return (\n    <div>\n      {users.map(u => <p key={u.id}>{u.name}</p>)}\n    </div>\n  );\n}'
  },
  {
    name: 'React Infinite Loop',
    lang: 'javascript',
    dotClass: 'javascript',
    error: 'Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.',
    code: 'function Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <button onClick={setCount(count + 1)}>\n      Count: {count}\n    </button>\n  );\n}'
  },
  {
    name: 'Java NullPointerException',
    lang: 'java',
    dotClass: 'java',
    error: 'java.lang.NullPointerException: Cannot invoke "String.length()" because "name" is null\n  at StudentService.validateName(StudentService.java:18)',
    code: 'public class StudentService {\n    public static boolean validateName(String name) {\n        return name.length() > 3;\n    }\n}'
  },
  {
    name: 'C++ Segfault',
    lang: 'cpp',
    dotClass: 'cpp',
    error: 'Segmentation fault (core dumped)\n./a.out: line 12: memory access violation at 0x0',
    code: '#include <iostream>\n\nint main() {\n    int *ptr = nullptr;\n    *ptr = 42;\n    std::cout << *ptr << std::endl;\n    return 0;\n}'
  },
  {
    name: 'Python Concatenation',
    lang: 'python',
    dotClass: 'python',
    error: 'TypeError: can only concatenate str (not "int") to str\n  File "app.py", line 4, in <module>\n    print("Total price: $" + price)',
    code: 'price = 25\nquantity = 3\ntotal = price * quantity\nprint("Total price: $" + total)'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('explainer'); // 'explainer' | 'kb' | 'history' | 'analytics'
  const [mongoStatus, setMongoStatus] = useState({ connected: false, databaseName: 'bugsense_ai' });
  
  // Explainer Form State
  const [language, setLanguage] = useState('auto');
  const [errorText, setErrorText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  
  // Search & Analysis States
  const [isSearchingSimilar, setIsSearchingSimilar] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [similarMatches, setSimilarMatches] = useState([]);
  const [activeSolution, setActiveSolution] = useState(null);
  const [solutionSource, setSolutionSource] = useState(null); // 'ai' | 'similar_match_reused' | 'verified_seed'
  const [diffViewTab, setDiffViewTab] = useState('diff'); // 'diff' | 'code'
  
  // Feedback State
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [copiedDiff, setCopiedDiff] = useState(false);
  
  // Knowledge Base State
  const [kbItems, setKbItems] = useState([]);
  const [kbFilterLang, setKbFilterLang] = useState('all');
  const [kbSearch, setKbSearch] = useState('');
  const [kbSort, setKbSort] = useState('helpful');
  const [isLoadingKb, setIsLoadingKb] = useState(false);
  
  // History State
  const [historyItems, setHistoryItems] = useState([]);
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Settings & Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userApiKey, setUserApiKey] = useState(localStorage.getItem('bugsense_gemini_key') || '');
  const [selectedKbModalItem, setSelectedKbModalItem] = useState(null);

  // CRUD Modal State (Create & Edit)
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [formLanguage, setFormLanguage] = useState('javascript');
  const [formErrorType, setFormErrorType] = useState('TypeError');
  const [formCategory, setFormCategory] = useState('Runtime Error');
  const [formSeverity, setFormSeverity] = useState('Medium');
  const [formExplanation, setFormExplanation] = useState('');
  const [formCodeSnippet, setFormCodeSnippet] = useState('');
  const [formFixedCode, setFormFixedCode] = useState('');
  const [formPreventionTips, setFormPreventionTips] = useState('');
  const [formTags, setFormTags] = useState('');
  const [isSavingCase, setIsSavingCase] = useState(false);

  const checkMongoStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      const data = await res.json();
      if (data?.mongo) {
        setMongoStatus(data.mongo);
      }
    } catch (err) {
      console.warn('MongoDB status check failed:', err);
    }
  }, []);

  const loadKbItems = useCallback(async () => {
    setIsLoadingKb(true);
    try {
      const query = new URLSearchParams({
        language: kbFilterLang,
        search: kbSearch,
        sortBy: kbSort,
        limit: '20'
      });
      const res = await fetch(`${API_BASE}/errors?${query}`);
      const data = await res.json();
      if (data?.items) {
        setKbItems(data.items);
      }
    } catch (err) {
      console.error('Failed to load KB items:', err);
    } finally {
      setIsLoadingKb(false);
    }
  }, [kbFilterLang, kbSearch, kbSort]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      const data = await res.json();
      if (data?.history) {
        setHistoryItems(data.history);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics`);
      const data = await res.json();
      if (data?.stats) {
        setAnalyticsData(data.stats);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }, []);

  useEffect(() => {
    checkMongoStatus();
    loadKbItems();
  }, [checkMongoStatus, loadKbItems]);

  useEffect(() => {
    if (activeTab === 'kb') loadKbItems();
    if (activeTab === 'history') loadHistory();
    if (activeTab === 'analytics') loadAnalytics();
  }, [activeTab, loadKbItems, loadHistory, loadAnalytics]);

  // 1. Search Similar Solved Errors
  const handleSearchSimilar = async () => {
    if (!errorText.trim() && !codeSnippet.trim()) {
      alert('Please enter an error message or code snippet first.');
      return;
    }
    setIsSearchingSimilar(true);
    setSimilarMatches([]);
    try {
      const res = await fetch(`${API_BASE}/errors/search-similar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorText, codeSnippet, language })
      });
      const data = await res.json();
      if (data.success && data.matches?.length > 0) {
        setSimilarMatches(data.matches);
        if (language === 'auto' && data.detectedLanguage) {
          setLanguage(data.detectedLanguage);
        }
      } else {
        setSimilarMatches([]);
        handleAnalyzeAI();
      }
    } catch (err) {
      console.error('Error finding similar solved cases:', err);
    } finally {
      setIsSearchingSimilar(false);
    }
  };

  // 2. Analyze with AI
  const handleAnalyzeAI = async (chosenSimilarId = null) => {
    if (!errorText.trim() && !codeSnippet.trim()) {
      alert('Please paste an error message or code snippet to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setFeedbackSent(false);

    try {
      const res = await fetch(`${API_BASE}/errors/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorText,
          codeSnippet,
          language,
          userApiKey,
          chosenSimilarId
        })
      });

      const data = await res.json();
      if (data.success && data.errorCase) {
        setActiveSolution(data.errorCase);
        setSolutionSource(data.source || 'ai');
        setSimilarMatches([]);
      } else {
        alert(data.error || 'Failed to explain error.');
      }
    } catch (err) {
      console.error('Analyze error failed:', err);
      alert('Failed to connect to BugSense AI server.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Feedback Submit
  const handleSendFeedback = async (resolved = true) => {
    if (!activeSolution?._id) return;
    try {
      const res = await fetch(`${API_BASE}/errors/${activeSolution._id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolvedIssue: resolved,
          rating: feedbackRating,
          studentComment: feedbackComment
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSent(true);
        setActiveSolution(prev => ({
          ...prev,
          helpfulVotes: data.helpfulVotes,
          timesSolved: data.timesSolved
        }));
      }
    } catch (err) {
      console.error('Submit feedback failed:', err);
    }
  };

  // Preset Selection
  const applyPreset = (preset) => {
    setErrorText(preset.error);
    setCodeSnippet(preset.code);
    setLanguage(preset.lang);
    setSimilarMatches([]);
    setActiveSolution(null);
    setFeedbackSent(false);
  };

  // Quick Paste
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setErrorText(text);
      }
    } catch (err) {
      alert('Clipboard access blocked or empty.');
    }
  };

  // Copy Code Diff / Fix
  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  // Re-seed Database
  const handleReSeed = async () => {
    if (!window.confirm('Reset and re-seed database with verified error cases?')) return;
    try {
      const res = await fetch(`${API_BASE}/status/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      const data = await res.json();
      alert(data.message || 'Seeded successfully!');
      checkMongoStatus();
      loadKbItems();
    } catch (err) {
      alert('Seed failed: ' + err.message);
    }
  };

  // --- CRUD Handlers for ErrorCase ---
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormErrorMessage('');
    setFormLanguage('javascript');
    setFormErrorType('TypeError');
    setFormCategory('Runtime Error');
    setFormSeverity('Medium');
    setFormExplanation('');
    setFormCodeSnippet('');
    setFormFixedCode('');
    setFormPreventionTips('');
    setFormTags('javascript, bugfix');
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormErrorMessage(item.errorMessage || '');
    setFormLanguage(item.language || 'javascript');
    setFormErrorType(item.errorType || 'RuntimeError');
    setFormCategory(item.category || 'Runtime Error');
    setFormSeverity(item.severity || 'Medium');
    setFormExplanation(item.explanation || '');
    setFormCodeSnippet(item.codeSnippet || '');
    setFormFixedCode(item.suggestedFix?.fixedCode || '');
    setFormPreventionTips(Array.isArray(item.preventionTips) ? item.preventionTips.join('\n') : '');
    setFormTags(Array.isArray(item.tags) ? item.tags.join(', ') : '');
    setShowAddEditModal(true);
  };

  const handleSaveErrorCase = async (e) => {
    e.preventDefault();
    if (!formErrorMessage.trim()) {
      alert('Error message / title is required.');
      return;
    }
    if (!formExplanation.trim()) {
      alert('Explanation is required.');
      return;
    }

    setIsSavingCase(true);
    const payload = {
      errorMessage: formErrorMessage.trim(),
      language: formLanguage,
      errorType: formErrorType.trim() || 'RuntimeError',
      category: formCategory.trim() || 'General Bug',
      severity: formSeverity,
      explanation: formExplanation.trim(),
      codeSnippet: formCodeSnippet.trim(),
      suggestedFix: {
        fixedCode: formFixedCode.trim(),
        explanation: 'Verified solution and safeguard.'
      },
      preventionTips: formPreventionTips.split('\n').map(s => s.trim()).filter(Boolean),
      tags: formTags.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      if (editingItem) {
        // UPDATE (PUT)
        const res = await fetch(`${API_BASE}/errors/${editingItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.errorCase) {
          setKbItems(prev => prev.map(item => item._id === editingItem._id ? data.errorCase : item));
          if (selectedKbModalItem?._id === editingItem._id) {
            setSelectedKbModalItem(data.errorCase);
          }
          if (activeSolution?._id === editingItem._id) {
            setActiveSolution(data.errorCase);
          }
          setShowAddEditModal(false);
          setEditingItem(null);
        } else {
          alert(data.error || 'Failed to update error case in MongoDB.');
        }
      } else {
        // CREATE (POST)
        const res = await fetch(`${API_BASE}/errors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.errorCase) {
          setKbItems(prev => [data.errorCase, ...prev]);
          setShowAddEditModal(false);
          checkMongoStatus();
          loadAnalytics();
        } else {
          alert(data.error || 'Failed to create error case in MongoDB.');
        }
      }
    } catch (err) {
      console.error('Save error case failed:', err);
      alert('Failed to connect to server: ' + err.message);
    } finally {
      setIsSavingCase(false);
    }
  };

  const handleDeleteErrorCase = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this error solution from MongoDB?')) return;
    try {
      const res = await fetch(`${API_BASE}/errors/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setKbItems(prev => prev.filter(item => item._id !== id));
        if (selectedKbModalItem?._id === id) {
          setSelectedKbModalItem(null);
        }
        if (activeSolution?._id === id) {
          setActiveSolution(null);
        }
        checkMongoStatus();
        loadAnalytics();
      } else {
        alert(data.error || 'Failed to delete error case.');
      }
    } catch (err) {
      console.error('Delete error case failed:', err);
      alert('Failed to connect to server: ' + err.message);
    }
  };

  // --- History Actions (Delete & Update) ---
  const handleDeleteHistoryItem = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this history record?')) return;
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setHistoryItems(prev => prev.filter(item => item._id !== id));
      } else {
        alert(data.error || 'Failed to delete history record.');
      }
    } catch (err) {
      console.error('Delete history item failed:', err);
    }
  };

  const handleToggleHistoryResolved = async (h, e) => {
    e?.stopPropagation();
    const newStatus = !h.resolved;
    try {
      const res = await fetch(`${API_BASE}/history/${h._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setHistoryItems(prev => prev.map(item => item._id === h._id ? { ...item, resolved: newStatus } : item));
      }
    } catch (err) {
      console.error('Toggle resolved status failed:', err);
    }
  };

  return (
    <div className="app-container">
      {/* Modern Floating Header */}
      <header className="app-header">
        <div className="brand-wrapper" onClick={() => setActiveTab('explainer')}>
          <div className="brand-icon">
            <Bug size={24} />
          </div>
          <div>
            <div className="brand-title">
              BugSense AI
              <span className="brand-badge">PRO v1.2</span>
            </div>
            <div className="brand-subtitle">
              <Cpu size={12} color="var(--accent-cyan)" />
              Hybrid AI &bull; MongoDB Invariant Search
            </div>
          </div>
        </div>

        {/* Navigation Tabs Dock */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'explainer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explainer')}
          >
            <Sparkles size={16} />
            <span>AI Explainer</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'kb' ? 'active' : ''}`}
            onClick={() => setActiveTab('kb')}
          >
            <Database size={16} />
            <span>Solved Database</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} />
            <span>History</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={16} />
            <span>Analytics</span>
          </button>
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          <div className={`mongo-status-pill ${mongoStatus.connected ? '' : 'disconnected'}`}>
            <span className={`pulse-dot ${mongoStatus.connected ? '' : 'disconnected'}`}></span>
            <span>{mongoStatus.connected ? `MongoDB: ${mongoStatus.databaseName}` : 'MongoDB Offline'}</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSettingsModal(true)}
            title="MongoDB Stats & AI Settings"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="main-wrapper">
        {/* Quick Starters & Presets Bar */}
        {activeTab === 'explainer' && (
          <div className="presets-banner">
            <span className="presets-label">
              <Zap size={14} /> Quick Starters:
            </span>
            {PRESETS.map((p, idx) => (
              <button key={idx} className="preset-chip" onClick={() => applyPreset(p)}>
                <span className={`preset-dot ${p.dotClass}`}></span>
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* TAB 1: AI EXPLAINER WORKBENCH */}
        {activeTab === 'explainer' && (
          <div className="explainer-grid">
            {/* Left Column: Code / Error Input (IDE Studio) */}
            <div className="editor-card glass-panel">
              <div className="card-header-row">
                <div className="card-title-group">
                  <div className="mac-window-dots">
                    <span className="mac-dot red"></span>
                    <span className="mac-dot yellow"></span>
                    <span className="mac-dot green"></span>
                  </div>
                  <Terminal size={18} color="var(--primary)" />
                  <span className="editor-tab-badge">error_trace.log</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handlePasteClipboard}
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste size={14} />
                    <span>Paste</span>
                  </button>
                  <select
                    className="select-field"
                    style={{ width: 'auto', minWidth: '135px', padding: '6px 12px', fontSize: '0.82rem' }}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="auto">⚡ Auto Detect</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C / C++</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>
              </div>

              {/* Error Message Input */}
              <div>
                <div className="input-label-row">
                  <label className="input-label">
                    <AlertTriangle size={15} color="var(--accent-rose)" />
                    Runtime Error or Stack Trace
                  </label>
                  <span className="char-count">{errorText.length} chars</span>
                </div>
                <textarea
                  className="textarea-ide"
                  placeholder="Paste Python traceback, JS TypeError, Java NullPointerException, or C++ crash..."
                  value={errorText}
                  onChange={(e) => setErrorText(e.target.value)}
                  rows={5}
                />
              </div>

              {/* Buggy Code Input */}
              <div>
                <div className="input-label-row">
                  <label className="input-label">
                    <FileCode size={15} color="var(--accent-cyan)" />
                    Buggy Code Snippet (Optional)
                  </label>
                  <span className="char-count">{codeSnippet.length} chars</span>
                </div>
                <textarea
                  className="textarea-ide"
                  placeholder="Paste the lines of code that triggered this error..."
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  rows={6}
                />
              </div>

              {/* Action Buttons Row */}
              <div className="action-buttons-row">
                <button
                  className="btn btn-primary btn-cta-explain"
                  onClick={() => handleAnalyzeAI()}
                  disabled={isAnalyzing || isSearchingSimilar}
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles size={18} className="spinner" />
                      <span>Diagnosing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>⚡ Explain & Fix Error</span>
                    </>
                  )}
                </button>

                <button
                  className="btn btn-emerald btn-cta-similar"
                  onClick={handleSearchSimilar}
                  disabled={isSearchingSimilar || isAnalyzing}
                >
                  {isSearchingSimilar ? (
                    <>
                      <RefreshCw size={16} className="spinner" />
                      <span>Matching...</span>
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      <span>Check Solved Cache</span>
                    </>
                  )}
                </button>

                {(errorText || codeSnippet) && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setErrorText('');
                      setCodeSnippet('');
                      setSimilarMatches([]);
                      setActiveSolution(null);
                    }}
                    title="Clear editor fields"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Similar Solved Matches Drawer */}
              {similarMatches.length > 0 && (
                <div className="similar-alert-box animate-fade-in">
                  <div className="similar-alert-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={20} color="var(--accent-emerald)" />
                      <strong style={{ color: '#6ee7b7' }}>
                        {similarMatches.length} Similar Solved Error{similarMatches.length > 1 ? 's' : ''} Found in MongoDB!
                      </strong>
                    </div>
                    <span className="badge badge-emerald">
                      {similarMatches[0].matchPercentage}% Match
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginBottom: '12px' }}>
                    A community-verified fix already exists in MongoDB. Review and apply it instantly:
                  </p>

                  {similarMatches.map((match) => (
                    <div key={match._id} className="similar-match-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="badge badge-indigo">{match.errorType} ({match.language})</span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          👍 {match.helpfulVotes} helpful &bull; {match.timesSolved} solved
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', marginBottom: '6px' }}>
                        {match.errorMessage}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '10px' }}>
                        {match.explanation.slice(0, 140)}...
                      </p>
                      <div>
                        <button
                          className="btn btn-emerald btn-sm"
                          onClick={() => handleAnalyzeAI(match._id)}
                        >
                          <Check size={14} /> Apply This Solved Case
                        </button>
                      </div>
                    </div>
                  ))}

                  <div style={{ textAlign: 'right', marginTop: '10px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleAnalyzeAI()}
                    >
                      None match &rarr; Request Fresh AI Explanation
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Solution Display Panel */}
            <div className="solution-panel">
              {activeSolution ? (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Hero Summary Card */}
                  <div className={`glass-panel solution-hero ${solutionSource === 'similar_match_reused' || activeSolution.source === 'verified_seed' ? 'verified' : ''}`}>
                    <div className="error-meta-strip">
                      <span className="badge badge-rose">{activeSolution.errorType}</span>
                      <span className="badge badge-indigo">{activeSolution.category || 'Runtime Error'}</span>
                      <span className="badge badge-amber">{activeSolution.severity || 'High'} Severity</span>
                      <span className="badge badge-cyan">{activeSolution.language?.toUpperCase()}</span>
                      {solutionSource === 'similar_match_reused' ? (
                        <span className="badge badge-emerald">⚡ MongoDB Instant Match (0ms)</span>
                      ) : (
                        <span className="badge badge-indigo">🧠 AI-Generated Solution</span>
                      )}
                    </div>

                    <h3 className="solution-title">{activeSolution.errorMessage}</h3>
                    
                    <div className="solution-explanation">
                      {activeSolution.explanation}
                    </div>
                  </div>

                  {/* Probable Causes Breakdown */}
                  {activeSolution.causes?.length > 0 && (
                    <div className="glass-panel causes-section">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HelpCircle size={18} color="var(--accent-amber)" />
                        <h3>Ranked Root Causes ({activeSolution.causes.length})</h3>
                      </div>
                      <div className="causes-list">
                        {activeSolution.causes.map((c, i) => (
                          <div key={i} className="cause-card">
                            <div className="cause-top-row">
                              <div className="cause-rank-title">
                                <span className="rank-badge">{c.rank || i + 1}</span>
                                <span>{c.title}</span>
                              </div>
                              <span className={`badge ${c.likelihood === 'High' ? 'badge-rose' : 'badge-amber'}`}>
                                {c.likelihood} Likelihood
                              </span>
                            </div>
                            <p className="cause-explanation">{c.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Code Diff & Resolution Studio */}
                  {activeSolution.suggestedFix && (
                    <div className="glass-panel diff-container">
                      <div className="diff-header-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Code2 size={18} color="var(--accent-emerald)" />
                          <h3>Actionable Solution & Code Diff</h3>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="diff-tab-toggle">
                            <button
                              className={`diff-tab-btn ${diffViewTab === 'diff' ? 'active' : ''}`}
                              onClick={() => setDiffViewTab('diff')}
                            >
                              Unified Diff
                            </button>
                            <button
                              className={`diff-tab-btn ${diffViewTab === 'code' ? 'active' : ''}`}
                              onClick={() => setDiffViewTab('code')}
                            >
                              Fixed Code
                            </button>
                          </div>

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCopyCode(diffViewTab === 'diff' ? activeSolution.suggestedFix.codeDiff : activeSolution.suggestedFix.fixedCode)}
                          >
                            {copiedDiff ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                            <span>{copiedDiff ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Code Block */}
                      {diffViewTab === 'diff' && activeSolution.suggestedFix.codeDiff ? (
                        <pre className="code-box">
                          {activeSolution.suggestedFix.codeDiff.split('\n').map((line, idx) => {
                            let lineClass = 'normal';
                            if (line.startsWith('-')) lineClass = 'deletion';
                            if (line.startsWith('+')) lineClass = 'addition';
                            return (
                              <span key={idx} className={`diff-line ${lineClass}`}>
                                {line}
                              </span>
                            );
                          })}
                        </pre>
                      ) : (
                        <pre className="code-box">
                          <code>{activeSolution.suggestedFix.fixedCode || activeSolution.suggestedFix.codeDiff}</code>
                        </pre>
                      )}

                      {/* Step-by-Step Fix List */}
                      {activeSolution.suggestedFix.stepByStep?.length > 0 && (
                        <div style={{ marginTop: '18px' }}>
                          <h4 style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '8px' }}>
                            Step-by-Step Resolution:
                          </h4>
                          <div className="steps-list">
                            {activeSolution.suggestedFix.stepByStep.map((step, idx) => (
                              <div key={idx} className="step-item">
                                <span className="step-number">{idx + 1}</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prevention Tips */}
                  {activeSolution.preventionTips?.length > 0 && (
                    <div className="prevention-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <ShieldCheck size={18} color="var(--accent-cyan)" />
                        <h4 style={{ color: '#67e8f9' }}>Defensive Coding Tips & Prevention</h4>
                      </div>
                      <ul style={{ paddingLeft: '20px', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                        {activeSolution.preventionTips.map((tip, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Feedback Box */}
                  <div className="feedback-box">
                    <div className="feedback-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={16} color="var(--accent-amber)" />
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                          Did this solution fix your issue?
                        </span>
                      </div>

                      <div className="feedback-votes-group">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSendFeedback(true)}
                          disabled={feedbackSent}
                        >
                          <ThumbsUp size={14} color="#10b981" />
                          <span>Helpful ({activeSolution.helpfulVotes || 0})</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSendFeedback(false)}
                          disabled={feedbackSent}
                        >
                          <ThumbsDown size={14} color="#f43f5e" />
                          <span>Unhelpful ({activeSolution.unhelpfulVotes || 0})</span>
                        </button>
                      </div>
                    </div>

                    {!feedbackSent ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Optional: leave a note for future students..."
                          style={{ fontSize: '0.84rem', padding: '8px 12px' }}
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                        />
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSendFeedback(true)}
                        >
                          Submit Note
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: '#6ee7b7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} />
                        <span>Thank you! Your feedback has been recorded in MongoDB.</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* High-Tech Empty State Diagnostic Hub */
                <div className="glass-panel empty-hub-container">
                  <div className="empty-hub-icon-wrapper animate-float">
                    <Sparkles size={36} color="var(--primary)" />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>BugSense AI Diagnostic Hub</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '520px', fontSize: '0.92rem', lineHeight: '1.65' }}>
                    Paste any error message, exception stack trace, or compiler diagnostic. BugSense AI combines MongoDB signature matching with intelligent reasoning to generate instant code diff fixes!
                  </p>

                  <div className="pipeline-cards-row">
                    <div className="pipeline-step-card">
                      <div className="pipeline-num">STEP 01</div>
                      <div className="pipeline-title">Invariant Normalization</div>
                      <div className="pipeline-desc">Strips environment noise (file paths, line numbers, hex memory pointers).</div>
                    </div>
                    <div className="pipeline-step-card">
                      <div className="pipeline-num">STEP 02</div>
                      <div className="pipeline-title">MongoDB Cache Check</div>
                      <div className="pipeline-desc">Searches verified community-tested fixes with &lt;15ms latency.</div>
                    </div>
                    <div className="pipeline-step-card">
                      <div className="pipeline-num">STEP 03</div>
                      <div className="pipeline-title">Unified Diff & Fix</div>
                      <div className="pipeline-desc">Generates exact line modifications and preventative safeguards.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SOLVED DATABASE (KNOWLEDGE BASE) */}
        {activeTab === 'kb' && (
          <div>
            <div className="kb-header-row">
              <div>
                <h2>Solved Errors Knowledge Base</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Browse verified, community-tested error solutions indexed in MongoDB.
                </p>
              </div>

              <div className="kb-filters">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search errors in MongoDB..."
                  style={{ width: '250px' }}
                  value={kbSearch}
                  onChange={(e) => setKbSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadKbItems()}
                />

                <select
                  className="select-field"
                  style={{ width: '150px' }}
                  value={kbFilterLang}
                  onChange={(e) => setKbFilterLang(e.target.value)}
                >
                  <option value="all">All Languages</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>

                <select
                  className="select-field"
                  style={{ width: '150px' }}
                  value={kbSort}
                  onChange={(e) => setKbSort(e.target.value)}
                >
                  <option value="helpful">Most Helpful</option>
                  <option value="solved">Most Solved</option>
                  <option value="views">Most Viewed</option>
                  <option value="recent">Newest</option>
                </select>

                <button className="btn btn-secondary" onClick={loadKbItems} title="Refresh">
                  <RefreshCw size={15} />
                </button>

                <button
                  className="btn btn-primary"
                  onClick={handleOpenAddModal}
                  style={{ gap: '6px' }}
                  title="Create a new solved error solution in MongoDB"
                >
                  <Plus size={16} />
                  <span>New Error Case</span>
                </button>
              </div>
            </div>

            {isLoadingKb ? (
              <div style={{ textAlign: 'center', padding: '70px' }}>
                <RefreshCw size={36} className="spinner" color="var(--primary)" />
              </div>
            ) : (
              <div className="kb-grid">
                {kbItems.map((item) => (
                  <div
                    key={item._id}
                    className="glass-panel kb-card"
                    onClick={() => setSelectedKbModalItem(item)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span className="badge badge-indigo">{item.errorType}</span>
                          <span className="badge badge-cyan">{item.language}</span>
                        </div>
                        {/* Quick Card CRUD Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            title="Edit this solution in MongoDB (PUT)"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(item);
                            }}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 8px' }}
                            title="Delete this solution from MongoDB (DELETE)"
                            onClick={(e) => handleDeleteErrorCase(item._id, e)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <h3 style={{ fontSize: '1.02rem', color: '#fff', marginBottom: '8px', lineHeight: '1.4' }}>
                        {item.errorMessage}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.55', marginBottom: '16px' }}>
                        {item.explanation.slice(0, 120)}...
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        {item.tags?.slice(0, 3).map((t, idx) => (
                          <span key={idx} style={{ fontSize: '0.72rem', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#6ee7b7' }}>
                          👍 {item.helpfulVotes || 0} helpful &bull; {item.timesSolved || 0} solved
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Inspect Fix <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DEBUGGING HISTORY */}
        {activeTab === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div>
                <h2>Debugging Journey & History</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Track your previous queries and resolution methods recorded in MongoDB.
                </p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  if (window.confirm('Clear all debugging history from MongoDB?')) {
                    await fetch(`${API_BASE}/history`, { method: 'DELETE' });
                    loadHistory();
                  }
                }}
              >
                <Trash2 size={15} /> Clear All History
              </button>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              {historyItems.length === 0 ? (
                <div style={{ padding: '70px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No debugging history recorded yet. Queries made in the Explainer tab will appear here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {historyItems.map((h) => (
                    <div
                      key={h._id}
                      style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span className="badge badge-cyan">{h.language}</span>
                          <span className={`badge ${h.actionTaken === 'used_similar_cache' ? 'badge-emerald' : 'badge-indigo'}`}>
                            {h.actionTaken === 'used_similar_cache' ? '⚡ Reused MongoDB Cache' : '✨ AI Generated'}
                          </span>
                          <button
                            onClick={(e) => handleToggleHistoryResolved(h, e)}
                            className={`badge ${h.resolved ? 'badge-emerald' : 'badge-amber'}`}
                            style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
                            title="Click to toggle resolved status (PATCH)"
                          >
                            {h.resolved ? <CheckCircle2 size={13} color="#6ee7b7" /> : <Circle size={13} color="#fcd34d" />}
                            <span>{h.resolved ? 'Resolved' : 'Open'}</span>
                          </button>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {new Date(h.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#fff' }}>
                          {h.queryText?.split('\n')[0]}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {h.matchedErrorCaseId && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setActiveSolution(h.matchedErrorCaseId);
                              setActiveTab('explainer');
                            }}
                          >
                            Inspect Solution &rarr;
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Delete this history item (DELETE)"
                          onClick={(e) => handleDeleteHistoryItem(h._id, e)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MONGODB ANALYTICS */}
        {activeTab === 'analytics' && (
          <div>
            <div style={{ marginBottom: '26px' }}>
              <h2>MongoDB Real-Time Analytics</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Live aggregation pipelines running on MongoDB error and feedback collections.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="analytics-metric-grid">
              <div className="glass-panel metric-card">
                <div className="metric-icon-box" style={{ background: 'rgba(99, 102, 241, 0.16)', color: '#818cf8' }}>
                  <Database size={26} />
                </div>
                <div>
                  <div className="metric-value">{analyticsData?.totalCases ?? mongoStatus.collections?.errorCases ?? 0}</div>
                  <div className="metric-label">Stored Error Solutions</div>
                </div>
              </div>

              <div className="glass-panel metric-card">
                <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.16)', color: '#6ee7b7' }}>
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <div className="metric-value">{analyticsData?.satisfactionRate ?? 96}%</div>
                  <div className="metric-label">Student Success Rate</div>
                </div>
              </div>

              <div className="glass-panel metric-card">
                <div className="metric-icon-box" style={{ background: 'rgba(6, 182, 212, 0.16)', color: '#67e8f9' }}>
                  <History size={26} />
                </div>
                <div>
                  <div className="metric-value">{analyticsData?.totalQueries ?? 0}</div>
                  <div className="metric-label">Total Student Debug Queries</div>
                </div>
              </div>

              <div className="glass-panel metric-card">
                <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.16)', color: '#fcd34d' }}>
                  <Star size={26} />
                </div>
                <div>
                  <div className="metric-value">{analyticsData?.totalFeedback ?? 0}</div>
                  <div className="metric-label">Verified Ratings & Reviews</div>
                </div>
              </div>
            </div>

            {/* Breakdowns Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Language Distribution */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '18px' }}>Errors by Programming Language</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {analyticsData?.byLanguage?.map((item) => (
                    <div key={item._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{item._id}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{item.count} cases &bull; {item.totalSolved} solved</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min((item.count / (analyticsData?.totalCases || 1)) * 100, 100)}%`,
                            background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Solved Bugs */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '18px' }}>Top Solved Student Bugs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analyticsData?.topSolved?.map((item, idx) => (
                    <div key={item._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="rank-badge">{idx + 1}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>{item.errorType}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.category}</div>
                        </div>
                      </div>
                      <span className="badge badge-emerald">
                        {item.timesSolved} Solved
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: SETTINGS & MONGODB INSPECTOR */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={20} color="var(--primary)" />
                <h2>MongoDB & AI Configuration</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowSettingsModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* MongoDB Diagnostic */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ marginBottom: '12px', color: '#6ee7b7' }}>Live MongoDB Status</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.86rem' }}>
                  <div><strong>Host:</strong> {mongoStatus.host}:{mongoStatus.port}</div>
                  <div><strong>Database:</strong> {mongoStatus.databaseName}</div>
                  <div><strong>ErrorCases in DB:</strong> {mongoStatus.collections?.errorCases ?? 0}</div>
                  <div><strong>Feedback Docs:</strong> {mongoStatus.collections?.feedback ?? 0}</div>
                  <div><strong>Indexes:</strong> {mongoStatus.indexesCount ?? 7} Loaded</div>
                  <div><strong>Storage Size:</strong> {mongoStatus.storageSize ?? '32 KB'}</div>
                </div>
              </div>

              {/* Gemini API Key */}
              <div>
                <label className="input-label" style={{ marginBottom: '8px' }}>
                  <Sparkles size={15} color="var(--accent-cyan)" />
                  Google Gemini API Key (Optional)
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Paste AIzaSy... (Leave empty to use built-in engine)"
                  value={userApiKey}
                  onChange={(e) => {
                    setUserApiKey(e.target.value);
                    localStorage.setItem('bugsense_gemini_key', e.target.value);
                  }}
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  BugSense AI includes a rich built-in intelligent engine that works offline and without an API key. You can also provide a Gemini key for open-ended LLM inference.
                </p>
              </div>

              {/* Database Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <button className="btn btn-secondary btn-sm" onClick={handleReSeed}>
                    <RefreshCw size={14} /> Re-seed Verified Errors
                  </button>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowSettingsModal(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KB ERROR DETAIL VIEW */}
      {selectedKbModalItem && (
        <div className="modal-overlay" onClick={() => setSelectedKbModalItem(null)}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-rose">{selectedKbModalItem.errorType}</span>
                <span className="badge badge-cyan">{selectedKbModalItem.language}</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedKbModalItem(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <h2 style={{ fontSize: '1.25rem', color: '#fff' }}>{selectedKbModalItem.errorMessage}</h2>
              <div className="solution-explanation">{selectedKbModalItem.explanation}</div>

              {selectedKbModalItem.suggestedFix?.fixedCode && (
                <div>
                  <h4 style={{ marginBottom: '8px', fontSize: '0.92rem' }}>Verified Fix:</h4>
                  <pre className="code-box">{selectedKbModalItem.suggestedFix.fixedCode}</pre>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '0.84rem', color: '#6ee7b7' }}>
                  👍 {selectedKbModalItem.helpfulVotes} helpful votes in MongoDB
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const itemToEdit = selectedKbModalItem;
                      setSelectedKbModalItem(null);
                      handleOpenEditModal(itemToEdit);
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Case</span>
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => handleDeleteErrorCase(selectedKbModalItem._id, e)}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setActiveSolution(selectedKbModalItem);
                      setSelectedKbModalItem(null);
                      setActiveTab('explainer');
                    }}
                  >
                    Open in Workbench &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE / EDIT ERROR CASE (FULL CRUD) */}
      {showAddEditModal && (
        <div className="modal-overlay" onClick={() => setShowAddEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={20} color="var(--primary)" />
                <h2>{editingItem ? 'Edit Solved Error Case' : 'Add New Solved Error Case'}</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddEditModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveErrorCase}>
              <div className="modal-body">
                {/* Error Message */}
                <div>
                  <label className="input-label" style={{ marginBottom: '6px' }}>
                    Error Message / Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. TypeError: Cannot read properties of undefined (reading 'map')"
                    value={formErrorMessage}
                    onChange={(e) => setFormErrorMessage(e.target.value)}
                  />
                </div>

                {/* 2-column Grid: Language, ErrorType, Category, Severity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="input-label" style={{ marginBottom: '6px' }}>
                      Programming Language *
                    </label>
                    <select
                      className="select-field"
                      value={formLanguage}
                      onChange={(e) => setFormLanguage(e.target.value)}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="typescript">TypeScript</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="sql">SQL</option>
                    </select>
                  </div>

                  <div>
                    <label className="input-label" style={{ marginBottom: '6px' }}>
                      Error Type
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. TypeError, IndexError, NullPointer"
                      value={formErrorType}
                      onChange={(e) => setFormErrorType(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="input-label" style={{ marginBottom: '6px' }}>
                      Category
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Runtime Error, State Management"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="input-label" style={{ marginBottom: '6px' }}>
                      Severity Level
                    </label>
                    <select
                      className="select-field"
                      value={formSeverity}
                      onChange={(e) => setFormSeverity(e.target.value)}
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Root Cause & Explanation */}
                <div>
                  <label className="input-label" style={{ marginBottom: '6px' }}>
                    Root Cause & Explanation *
                  </label>
                  <textarea
                    required
                    className="textarea-field"
                    style={{ minHeight: '90px' }}
                    placeholder="Describe what causes this error and why it occurred..."
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                  />
                </div>

                {/* Buggy Code Snippet */}
                <div>
                  <label className="input-label" style={{ marginBottom: '6px' }}>
                    Buggy Code Snippet (Optional)
                  </label>
                  <textarea
                    className="textarea-field"
                    style={{ minHeight: '75px', fontFamily: 'var(--font-mono)' }}
                    placeholder="// Paste original code causing the error"
                    value={formCodeSnippet}
                    onChange={(e) => setFormCodeSnippet(e.target.value)}
                  />
                </div>

                {/* Verified Fix */}
                <div>
                  <label className="input-label" style={{ marginBottom: '6px' }}>
                    Verified Fix / Solution Code
                  </label>
                  <textarea
                    className="textarea-field"
                    style={{ minHeight: '85px', fontFamily: 'var(--font-mono)' }}
                    placeholder="// Paste corrected solution code"
                    value={formFixedCode}
                    onChange={(e) => setFormFixedCode(e.target.value)}
                  />
                </div>

                {/* Prevention Tips */}
                <div>
                  <label className="input-label" style={{ marginBottom: '6px' }}>
                    Prevention Tips (one per line)
                  </label>
                  <textarea
                    className="textarea-field"
                    style={{ minHeight: '65px' }}
                    placeholder="Initialize arrays before mapping&#10;Add optional chaining checks (?.)"
                    value={formPreventionTips}
                    onChange={(e) => setFormPreventionTips(e.target.value)}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="input-label" style={{ marginBottom: '6px' }}>
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. react, hooks, array, undefined"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                  />
                </div>

                {/* Form Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowAddEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isSavingCase}
                  >
                    {isSavingCase ? (
                      <>
                        <RefreshCw size={14} className="spinner" /> Saving...
                      </>
                    ) : (
                      editingItem ? 'Save Changes' : 'Create in MongoDB'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
