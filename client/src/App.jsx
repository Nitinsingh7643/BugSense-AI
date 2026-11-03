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
  Circle,
  Play,
  ChevronRight,
  Lock,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import './App.css';
import LandingPage from './LandingPage.jsx';

const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;
  if (envUrl && !envUrl.includes('bugsense-ai-server.onrender.com')) {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://bugsense-ai-mn2p.onrender.com/api';
  }
  return 'http://localhost:5000/api';
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
  const [activeTab, setActiveTab] = useState('landing'); // 'landing' | 'explainer' | 'kb' | 'history' | 'analytics'
  const [mongoStatus, setMongoStatus] = useState({ connected: false, databaseName: 'bugsense_ai' });
  
  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bugsense_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Developer');
  const [authLang, setAuthLang] = useState('javascript');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dark & Light Mode Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('bugsense_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('bugsense_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };
  
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
  const [formValidationErrors, setFormValidationErrors] = useState(null);

  // Architecture & Requirements Specs Modal
  const [showReqModal, setShowReqModal] = useState(false);

  // MongoDB Aggregation Pipelines Inspector State
  const [pipelinesList, setPipelinesList] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('languageStats');
  const [activePipelineData, setActivePipelineData] = useState(null);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineViewerTab, setPipelineViewerTab] = useState('output'); // 'output' | 'definition'

  const runPipeline = async (id) => {
    const pipeId = id || selectedPipelineId;
    setSelectedPipelineId(pipeId);
    setIsRunningPipeline(true);
    try {
      const res = await fetch(`${API_BASE}/analytics/pipelines/run/${pipeId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setActivePipelineData(data);
      }
    } catch (err) {
      console.error('Run pipeline failed:', err);
    } finally {
      setIsRunningPipeline(false);
    }
  };

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
      const [statsRes, pipeRes] = await Promise.all([
        fetch(`${API_BASE}/analytics`),
        fetch(`${API_BASE}/analytics/pipelines`)
      ]);
      const statsData = await statsRes.json();
      if (statsData?.stats) {
        setAnalyticsData(statsData.stats);
      }
      const pipeData = await pipeRes.json();
      if (pipeData?.pipelines) {
        setPipelinesList(pipeData.pipelines);
        if (pipeData.pipelines.length > 0) {
          runPipeline(pipeData.pipelines[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load analytics & pipelines:', err);
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`${API_BASE}/errors/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          errorText,
          codeSnippet,
          language,
          userApiKey,
          chosenSimilarId
        })
      });
      clearTimeout(timeoutId);

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

  // Clear Workbench
  const handleClearAll = () => {
    setErrorText('');
    setCodeSnippet('');
    setSimilarMatches([]);
    setActiveSolution(null);
    setSolutionSource(null);
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

  // Auth Handlers (Sign In, Register, Demo, Logout)
  const handleLogin = async (e) => {
    e?.preventDefault();
    setIsSubmittingAuth(true);
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('bugsense_user', JSON.stringify(data.user));
        setAuthSuccess(`Welcome back, ${data.user.name}! Opening workspace...`);
        setTimeout(() => {
          setActiveTab('explainer');
          setAuthSuccess('');
        }, 600);
      } else {
        setAuthError(data.error || 'Failed to sign in. Please verify your credentials.');
      }
    } catch (err) {
      console.warn('Backend offline, using guest session:', err);
      const fallback = {
        id: 'local-' + Date.now().toString(36),
        name: authEmail.split('@')[0] || 'Developer',
        email: authEmail,
        role: 'Developer',
        primaryLanguage: 'javascript'
      };
      setCurrentUser(fallback);
      localStorage.setItem('bugsense_user', JSON.stringify(fallback));
      setActiveTab('explainer');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setIsSubmittingAuth(true);
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
          role: authRole,
          primaryLanguage: authLang
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('bugsense_user', JSON.stringify(data.user));
        setAuthSuccess('Account registered successfully! Launching workspace...');
        setTimeout(() => {
          setActiveTab('explainer');
          setAuthSuccess('');
        }, 600);
      } else {
        setAuthError(data.error || 'Registration failed. Please check form details.');
      }
    } catch (err) {
      console.warn('Backend offline, using guest session:', err);
      const fallback = {
        id: 'local-' + Date.now().toString(36),
        name: authName || 'Developer',
        email: authEmail,
        role: authRole,
        primaryLanguage: authLang
      };
      setCurrentUser(fallback);
      localStorage.setItem('bugsense_user', JSON.stringify(fallback));
      setActiveTab('explainer');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmittingAuth(true);
    try {
      const res = await fetch(`${API_BASE}/auth/demo`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('bugsense_user', JSON.stringify(data.user));
        setActiveTab('explainer');
        return;
      }
    } catch {
      // ignore
    } finally {
      setIsSubmittingAuth(false);
    }
    const guestUser = {
      id: 'guest-' + Date.now().toString(36),
      name: 'Guest Developer',
      email: 'demo@bugsense.ai',
      role: 'Developer',
      primaryLanguage: 'python'
    };
    setCurrentUser(guestUser);
    localStorage.setItem('bugsense_user', JSON.stringify(guestUser));
    setActiveTab('explainer');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('bugsense_user');
    setActiveTab('landing');
  };

  /**
   * navigateToTab — guards all workspace tabs behind authentication.
   * If the user is logged in, switches immediately.
   * Otherwise, redirects to the landing page and scrolls to the auth portal.
   */
  const GATED_TABS = ['explainer', 'kb', 'history', 'analytics'];
  const navigateToTab = (tab) => {
    if (!GATED_TABS.includes(tab) || currentUser) {
      setActiveTab(tab);
      return;
    }
    // Not authenticated — show landing and prompt sign-in
    setAuthMode('login');
    setAuthError('Please sign in or use Instant Demo to access the workspace.');
    setActiveTab('landing');
    setTimeout(() => {
      const el = document.getElementById('auth-portal');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 120);
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
    setFormValidationErrors(null);
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (item, e) => {
    e?.stopPropagation();
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
    setFormValidationErrors(null);
    setShowAddEditModal(true);
  };

  const handleSaveErrorCase = async (e) => {
    e?.preventDefault();
    setFormValidationErrors(null);

    // Client-side schema validation checks
    const localErrors = [];
    if (!formErrorMessage.trim() || formErrorMessage.trim().length < 3) {
      localErrors.push('Error message is required and must be at least 3 characters.');
    }
    if (!formExplanation.trim() || formExplanation.trim().length < 10) {
      localErrors.push('Root cause explanation is required and must be at least 10 characters.');
    }
    if (!formFixedCode.trim()) {
      localErrors.push('Verified fix solution code is required.');
    }

    if (localErrors.length > 0) {
      setFormValidationErrors(localErrors);
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
        if (res.ok && data.success && data.errorCase) {
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
          const errs = data.validationErrors?.map(v => `${v.field}: ${v.message}`)
            || data.errors?.map(v => `${v.field}: ${v.message}`)
            || [data.message || data.error || 'Failed to update error case in MongoDB.'];
          setFormValidationErrors(errs);
        }
      } else {
        // CREATE (POST)
        const res = await fetch(`${API_BASE}/errors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success && data.errorCase) {
          setKbItems(prev => [data.errorCase, ...prev]);
          setShowAddEditModal(false);
          checkMongoStatus();
          loadAnalytics();
        } else {
          const errs = data.validationErrors?.map(v => `${v.field}: ${v.message}`)
            || data.errors?.map(v => `${v.field}: ${v.message}`)
            || [data.message || data.error || 'Failed to create error case in MongoDB.'];
          setFormValidationErrors(errs);
        }
      }
    } catch (err) {
      console.error('Save error case failed:', err);
      setFormValidationErrors(['Failed to connect to server: ' + err.message]);
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
      {/* ── Modern Premium Header ───────────────────────────────────── */}
      <header className="app-header">

        {/* Brand */}
        <div className="brand-wrapper" onClick={() => setActiveTab('landing')}>
          <div className="brand-icon">
            <Bug size={18} />
          </div>
          <div className="brand-title">
            BugSense
            <span className="brand-badge">PRO</span>
          </div>
        </div>

        {/* Navigation Tabs Dock */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'landing' ? 'active' : ''}`}
            onClick={() => setActiveTab('landing')}
          >
            <Layers size={13} /><span>Overview</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'explainer' ? 'active' : ''}`}
            onClick={() => navigateToTab('explainer')}
            title={!currentUser ? 'Sign in to access' : undefined}
          >
            <Sparkles size={13} /><span>AI Explainer</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'kb' ? 'active' : ''}`}
            onClick={() => navigateToTab('kb')}
            title={!currentUser ? 'Sign in to access' : undefined}
          >
            <Database size={13} /><span>Solved DB</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => navigateToTab('history')}
            title={!currentUser ? 'Sign in to access' : undefined}
          >
            <History size={13} /><span>History</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => navigateToTab('analytics')}
            title={!currentUser ? 'Sign in to access' : undefined}
          >
            <BarChart3 size={13} /><span>Analytics</span>
          </button>
        </nav>

        {/* Right Toolbar Actions */}
        <div className="header-actions">

          {/* MongoDB Status Pill */}
          <div
            className={`mongo-status-pill ${mongoStatus.connected ? '' : 'disconnected'}`}
            title={mongoStatus.connected ? 'MongoDB Atlas: Connected' : 'MongoDB: Offline'}
          >
            <span className={`pulse-dot ${mongoStatus.connected ? '' : 'disconnected'}`}></span>
            <span className="mongo-status-label">{mongoStatus.connected ? 'Online' : 'Offline'}</span>
          </div>

          <div className="header-divider" />

          {/* Quick Actions Icon Dock */}
          <div className="header-icon-group">
            <button
              className="header-icon-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
            </button>
            <button
              className="header-icon-btn"
              onClick={() => setShowReqModal(true)}
              title="Architecture & Project Specs"
            >
              <ShieldCheck size={15} color="#818cf8" />
            </button>
            <button
              className="header-icon-btn"
              onClick={() => setShowSettingsModal(true)}
              title="Settings & Diagnostics"
            >
              <Settings size={15} />
            </button>
          </div>

          <div className="header-divider" />

          {/* User Profile or Sign-In */}
          {currentUser ? (
            <div className="user-profile-badge" title={`Signed in as ${currentUser.name} (${currentUser.email})`}>
              <div className="user-avatar-circle">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="user-name-text">
                {currentUser.name ? currentUser.name.split(' ')[0] : 'User'}
              </span>
              <button className="btn-logout-mini" title="Sign Out" onClick={handleLogout}>
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-signin-header"
              onClick={() => {
                setActiveTab('landing');
                setTimeout(() => document.getElementById('auth-portal')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
            >
              <Lock size={12} /> Sign In
            </button>
          )}

        </div>
      </header>

      {/* Main Workspace */}
      <main className="main-wrapper">
        {/* TAB 0: MODERN LANDING PAGE */}
        {activeTab === 'landing' && (
          <LandingPage
            onLaunchExplainer={() => navigateToTab('explainer')}
            onBrowseDatabase={() => navigateToTab('kb')}
            currentUser={currentUser}
            onLogout={handleLogout}
            authMode={authMode}
            setAuthMode={setAuthMode}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authName={authName}
            setAuthName={setAuthName}
            authRole={authRole}
            setAuthRole={setAuthRole}
            authLang={authLang}
            setAuthLang={setAuthLang}
            authError={authError}
            authSuccess={authSuccess}
            isSubmittingAuth={isSubmittingAuth}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            handleLogin={handleLogin}
            handleRegister={handleRegister}
            handleDemoLogin={handleDemoLogin}
            mongoStatus={mongoStatus}
          />
        )}
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
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleClearAll}
                    title="Clear input fields and analysis"
                    style={{ gap: '5px', borderColor: 'rgba(244,63,94,0.3)', color: '#fda4af' }}
                  >
                    <Trash2 size={13} />
                    <span>Clear</span>
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

                <button
                  className="btn btn-secondary"
                  onClick={handleClearAll}
                  title="Clear inputs and diagnosis results"
                  style={{ gap: '6px', padding: '12px 18px', fontWeight: 600, borderColor: 'rgba(244,63,94,0.35)', color: '#fda4af' }}
                >
                  <Trash2 size={16} />
                  <span>Clear</span>
                </button>
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '8px' }}>
                  Browse verified, community-tested error solutions indexed in MongoDB.
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="crud-pill crud-create" title="POST /api/errors">[C] CREATE</span>
                  <span className="crud-pill crud-read" title="GET /api/errors">[R] READ</span>
                  <span className="crud-pill crud-update" title="PUT /api/errors/:id">[U] UPDATE</span>
                  <span className="crud-pill crud-delete" title="DELETE /api/errors/:id">[D] DELETE</span>
                </div>
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
            ) : kbItems.length === 0 ? (
              <div className="kb-empty-state-card">
                <div className="kb-empty-icon">
                  <Database size={32} />
                </div>
                <h3 className="kb-empty-title">
                  {!mongoStatus.connected ? 'MongoDB is Offline or Unreachable' : 'No Solved Errors Found'}
                </h3>
                <p className="kb-empty-desc">
                  {!mongoStatus.connected
                    ? 'The backend server or MongoDB Atlas is currently disconnected. Ensure the backend is running and connected to MongoDB, or click below to retry and seed verified cases.'
                    : `No error cases match your current filter (Language: "${kbFilterLang}", Search: "${kbSearch || 'None'}"). Reset your filters or seed the database.`}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {(!mongoStatus.connected || kbFilterLang !== 'all' || kbSearch) && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setKbFilterLang('all');
                        setKbSearch('');
                        loadKbItems();
                        checkMongoStatus();
                      }}
                    >
                      Reset Filters & Retry
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={handleReSeed}>
                    Seed Verified Error Cases
                  </button>
                  <button className="btn btn-secondary" onClick={handleOpenAddModal}>
                    + Create New Case
                  </button>
                </div>
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

            {/* 1. Unwound Tags Cloud Aggregation ($unwind + $group) */}
            {analyticsData?.topTags && analyticsData.topTags.length > 0 && (
              <div className="glass-panel" style={{ padding: '20px', marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>Top Unwound Tags</h3>
                    <span className="stage-badge">$unwind + $group + $sort</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aggregated live from ErrorCase.tags array</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {analyticsData.topTags.map(tag => (
                    <span
                      key={tag._id}
                      className="badge"
                      style={{
                        background: 'rgba(99, 102, 241, 0.14)',
                        color: '#cbd5e1',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>#{tag._id}</span>
                      <strong style={{ color: '#818cf8' }}>({tag.count})</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Interactive MongoDB Aggregation Pipelines Inspector */}
            <div className="pipeline-inspector">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Zap size={22} color="#818cf8" />
                    <h3 style={{ fontSize: '1.18rem', margin: 0 }}>Interactive MongoDB Aggregation Pipeline Inspector</h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', marginBottom: 0 }}>
                    Select and execute real-time multi-stage MongoDB aggregations directly on Atlas collections.
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={isRunningPipeline}
                  onClick={() => runPipeline(selectedPipelineId)}
                  style={{ gap: '6px' }}
                >
                  {isRunningPipeline ? (
                    <><RefreshCw size={14} className="spinner" /> Executing...</>
                  ) : (
                    <><Play size={14} /> Run Live Pipeline</>
                  )}
                </button>
              </div>

              {/* Pipeline Selector Tabs */}
              <div className="pipeline-tab-group">
                {pipelinesList.map(pipe => (
                  <button
                    key={pipe.id}
                    className={`pipeline-tab-btn ${selectedPipelineId === pipe.id ? 'active' : ''}`}
                    onClick={() => runPipeline(pipe.id)}
                  >
                    <span>{pipe.name}</span>
                  </button>
                ))}
              </div>

              {/* Active Pipeline Card */}
              {activePipelineData && (
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#fff' }}>
                        {activePipelineData.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Target Collection: <strong style={{ color: '#38bdf8' }}>{activePipelineData.collection}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {activePipelineData.durationMs !== undefined && (
                        <span className="badge badge-emerald" style={{ fontSize: '0.78rem' }}>
                          ⚡ {activePipelineData.durationMs} ms
                        </span>
                      )}
                      <span className="badge badge-indigo" style={{ fontSize: '0.78rem' }}>
                        {activePipelineData.resultCount ?? (Array.isArray(activePipelineData.result) ? activePipelineData.result.length : 1)} documents returned
                      </span>
                    </div>
                  </div>

                  {/* Stages Used */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pipeline Stages:</span>
                    {activePipelineData.stagesUsed?.map((stg, i) => (
                      <span key={i} className="stage-badge">{stg}</span>
                    ))}
                  </div>

                  <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
                    {activePipelineData.description}
                  </p>

                  {/* Toggle Live Output vs Definition */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <button
                      className={`btn btn-sm ${pipelineViewerTab === 'output' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setPipelineViewerTab('output')}
                      style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                    >
                      Live MongoDB Output (JSON)
                    </button>
                    <button
                      className={`btn btn-sm ${pipelineViewerTab === 'definition' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setPipelineViewerTab('definition')}
                      style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                    >
                      Pipeline Query Definition (Stages)
                    </button>
                  </div>

                  {pipelineViewerTab === 'output' ? (
                    <pre className="code-preview-box">
                      {JSON.stringify(activePipelineData.result, null, 2)}
                    </pre>
                  ) : (
                    <pre className="code-preview-box">
                      {JSON.stringify(activePipelineData.pipelineDefinition, null, 2)}
                    </pre>
                  )}
                </div>
              )}
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

              {/* Appearance / Theme */}
              <div>
                <label className="input-label" style={{ marginBottom: '8px' }}>
                  {theme === 'dark' ? <Moon size={15} color="var(--primary)" /> : <Sun size={15} color="#f59e0b" />}
                  Theme &amp; Appearance
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTheme('dark')}
                    style={{ flex: 1, gap: 8 }}
                  >
                    <Moon size={14} /> Dark Mode
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTheme('light')}
                    style={{ flex: 1, gap: 8 }}
                  >
                    <Sun size={14} /> Light Mode
                  </button>
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
                <span className={`crud-pill ${editingItem ? 'crud-update' : 'crud-create'}`}>
                  {editingItem ? 'UPDATE (PUT)' : 'CREATE (POST)'}
                </span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddEditModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveErrorCase}>
              <div className="modal-body">
                {/* Schema & Input Validation Error Alert */}
                {formValidationErrors && formValidationErrors.length > 0 && (
                  <div className="validation-error-box">
                    <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={16} /> Schema Validation Alert:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
                      {formValidationErrors.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}
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

      {/* MODAL 4: ARCHITECTURE & REQUIREMENTS SPECS (VALIDATION, CRUD, AGGREGATION) */}
      {showReqModal && (
        <div className="modal-overlay" onClick={() => setShowReqModal(false)}>
          <div className="modal-content" style={{ maxWidth: '840px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="#818cf8" />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Project Architecture & Technical Specifications</h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Core Pillars: MongoDB Schema Validation &bull; Full CRUD Operations &bull; Aggregation Pipelines
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReqModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ gap: '22px' }}>
              {/* PILLAR 1: VALIDATION */}
              <div className="glass-panel" style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color="#818cf8" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>1. Validation System</h3>
                  </div>
                  <span className="badge badge-indigo">Multi-Layered Enforcement</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.82rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: '6px' }}>Mongoose Schema Validation:</strong>
                    <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.6, color: '#cbd5e1' }}>
                      <li><code>errorMessage</code>: Required, minlength 3, maxlength 500</li>
                      <li><code>language</code>: Required enum whitelist (15 languages)</li>
                      <li><code>severity</code>: Enum (Critical, High, Medium, Low)</li>
                      <li><code>explanation</code>: Required, minlength 10</li>
                      <li><code>suggestedFix.fixedCode</code>: Required non-empty</li>
                      <li><code>tags</code>: Array validator (non-empty strings &le; 40 chars)</li>
                      <li><code>rating</code>: Integer bounds [1, 5] on Feedback</li>
                      <li><code>studentLevel</code>: Enum (Beginner, Intermediate, Advanced)</li>
                    </ul>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '6px' }}>API & Middleware Validation:</strong>
                    <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.6, color: '#cbd5e1' }}>
                      <li><code>validateErrorCasePayload()</code> Express middleware checks input types</li>
                      <li><code>validateFeedbackPayload()</code> validates ratings and levels</li>
                      <li><code>validateObjectId()</code> enforces valid 24-character hexadecimal MongoDB ObjectIds</li>
                      <li><code>errorHandler.js</code> intercepts Mongoose <code>ValidationError</code> & <code>CastError</code> to return structured 400 Bad Request maps</li>
                      <li>Client-side live input validation with inline warning alerts</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* PILLAR 2: CRUD OPERATIONS */}
              <div className="glass-panel" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={20} color="#34d399" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>2. CRUD Operations (Create, Read, Update, Delete)</h3>
                  </div>
                  <span className="badge badge-emerald">100% Complete</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '6px 8px' }}>Operation</th>
                        <th style={{ padding: '6px 8px' }}>Method</th>
                        <th style={{ padding: '6px 8px' }}>Endpoint</th>
                        <th style={{ padding: '6px 8px' }}>Collection</th>
                        <th style={{ padding: '6px 8px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px' }}><span className="crud-pill crud-create">CREATE</span></td>
                        <td style={{ padding: '6px 8px' }}><code>POST</code></td>
                        <td style={{ padding: '6px 8px' }}><code>/api/errors</code></td>
                        <td style={{ padding: '6px 8px' }}>ErrorCase</td>
                        <td style={{ padding: '6px 8px' }}>Manual solution creation with schema validation</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px' }}><span className="crud-pill crud-create">CREATE</span></td>
                        <td style={{ padding: '6px 8px' }}><code>POST</code></td>
                        <td style={{ padding: '6px 8px' }}><code>/api/errors/analyze</code></td>
                        <td style={{ padding: '6px 8px' }}>ErrorCase</td>
                        <td style={{ padding: '6px 8px' }}>AI / Heuristic error diagnostic & auto-persistence</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px' }}><span className="crud-pill crud-create">CREATE</span></td>
                        <td style={{ padding: '6px 8px' }}><code>POST</code></td>
                        <td style={{ padding: '6px 8px' }}><code>/api/errors/:id/feedback</code></td>
                        <td style={{ padding: '6px 8px' }}>Feedback</td>
                        <td style={{ padding: '6px 8px' }}>Record star ratings linked by ObjectId</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px' }}><span className="crud-pill crud-read">READ</span></td>
                        <td style={{ padding: '6px 8px' }}><code>GET</code></td>
                        <td style={{ padding: '6px 8px' }}><code>/api/errors</code></td>
                        <td style={{ padding: '6px 8px' }}>ErrorCase</td>
                        <td style={{ padding: '6px 8px' }}>Query, pagination, language filter, regex search</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px' }}><span className="crud-pill crud-read">READ</span></td>
                        <td style={{ padding: '6px 8px' }}><code>GET</code></td>
                        <td style={{ padding: '6px 8px' }}><code>/api/errors/:id</code></td>
                        <td style={{ padding: '6px 8px' }}>ErrorCase</td>
                        <td style={{ padding: '6px 8px' }}>Fetch single error case & track query frequency</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px' }}><span className="crud-pill crud-read">READ</span></td>
                        <td style={{ padding: '6px 8px' }}><code>GET</code></td>
                        <td style={{ padding: '6px 8px' }}><code>/api/history</code></td>
                        <td style={{ padding: '6px 8px' }}>QueryHistory</td>
                        <td style={{ padding: '6px 8px' }}>Populated query history with referenced solutions</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px' }}><span className="crud-pill crud-update">UPDATE</span></td>
                        <td style={{ padding: '6px 8px' }}><code>PUT</code></td>
                        <td style={{ padding: '6px 8px' }}><code>/api/errors/:id</code></td>
                        <td style={{ padding: '6px 8px' }}>ErrorCase</td>
                        <td style={{ padding: '6px 8px' }}>Full update of title, explanation, fix, tips, tags</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px' }}><span className="crud-pill crud-update">UPDATE</span></td>
                        <td style={{ padding: '6px 8px' }}><code>PATCH</code></td>
                        <td style={{ padding: '6px 8px' }}><code>/api/history/:id</code></td>
                        <td style={{ padding: '6px 8px' }}>QueryHistory</td>
                        <td style={{ padding: '6px 8px' }}>Toggle resolved status (true/false)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px' }}><span className="crud-pill crud-delete">DELETE</span></td>
                        <td style={{ padding: '6px 8px' }}><code>DELETE</code></td>
                        <td style={{ padding: '6px 8px' }}><code>/api/errors/:id</code></td>
                        <td style={{ padding: '6px 8px' }}>ErrorCase + Feedback</td>
                        <td style={{ padding: '6px 8px' }}>Cascading deletion of case and related feedback</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 8px' }}><span className="crud-pill crud-delete">DELETE</span></td>
                        <td style={{ padding: '6px 8px' }}><code>DELETE</code></td>
                        <td style={{ padding: '6px 8px' }}><code>/api/history/:id</code></td>
                        <td style={{ padding: '6px 8px' }}>QueryHistory</td>
                        <td style={{ padding: '6px 8px' }}>Remove single history record / clear all records</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PILLAR 3: AGGREGATION */}
              <div className="glass-panel" style={{ padding: '20px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={20} color="#22d3ee" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>3. MongoDB Aggregation Pipelines</h3>
                  </div>
                  <span className="badge badge-cyan">5 Advanced Pipelines</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#38bdf8' }}>🏷️ Tag Frequency Pipeline:</strong>
                      <span className="stage-badge">$unwind &bull; $group &bull; $sort &bull; $limit</span>
                    </div>
                    <p style={{ margin: 0, color: '#94a3b8' }}>Unwinds embedded tags array, groups unique tags, aggregates distinct languages with <code>$addToSet</code>, and sorts top tags.</p>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#818cf8' }}>🔗 Relational Join ($lookup) Pipeline:</strong>
                      <span className="stage-badge">$lookup &bull; $project &bull; $filter &bull; $avg</span>
                    </div>
                    <p style={{ margin: 0, color: '#94a3b8' }}>Performs a left outer join between ErrorCase and Feedback documents, computing average rating and filtered resolution counts without application-side joins.</p>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#34d399' }}>🔀 Multi-Faceted Pipeline ($facet):</strong>
                      <span className="stage-badge">$facet &bull; $group &bull; $sort &bull; $project</span>
                    </div>
                    <p style={{ margin: 0, color: '#94a3b8' }}>Runs 4 sub-pipelines simultaneously in a single round-trip: severity breakdown, category distribution, KPI metrics, and top solved leaderboard.</p>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#fbbf24' }}>🌐 Language Resolution Pipeline:</strong>
                      <span className="stage-badge">$group &bull; $project &bull; $round &bull; $divide</span>
                    </div>
                    <p style={{ margin: 0, color: '#94a3b8' }}>Groups error cases by language and calculates percentage resolution rates using <code>$divide</code> and <code>$multiply</code> math expressions.</p>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#f472b6' }}>📅 Daily Trends Pipeline:</strong>
                      <span className="stage-badge">$dateToString &bull; $group &bull; $sort</span>
                    </div>
                    <p style={{ margin: 0, color: '#94a3b8' }}>Extracts formatted YYYY-MM-DD date strings from ISO timestamps on QueryHistory, aggregating daily query counts and cache-hit ratios.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
