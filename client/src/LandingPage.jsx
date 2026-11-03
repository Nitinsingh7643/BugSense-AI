import React, { useState } from 'react';
import {
  Sparkles, Database, Cpu, ShieldCheck, Zap, BarChart3,
  ArrowRight, Lock, Mail, User as UserIcon, CheckCircle2,
  Layers, Eye, EyeOff, Play, LogIn, UserPlus, X, Bug,
  Code2, Terminal, Globe, Star, ChevronRight
} from 'lucide-react';
/* ─── Stat Counter ─────────────────────────────────────────────── */
function StatCard({ value, label, color = '#38bdf8' }) {
  return (
    <div className="hero-stat-card" style={{
      borderRadius: 20,
      padding: '22px 20px',
      textAlign: 'center',
      backdropFilter: 'blur(16px)',
      flex: '1 1 160px',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 800, color, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

/* ─── Feature Pillar Card ───────────────────────────────────────── */
function PillarCard({ icon, title, desc, tag, iconBg, iconColor, tagColor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="pillar-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 20,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg,#6366f1,#06b6d4)',
        opacity: hovered ? 1 : 0, transition: 'opacity 0.25s',
      }} />
      <div style={{
        width: 50, height: 50, borderRadius: 14,
        background: iconBg || 'rgba(99,102,241,0.14)',
        border: `1px solid ${iconColor || '#818cf8'}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: iconColor || '#818cf8',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
          {desc}
        </div>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: tagColor || '#38bdf8' }}>
        <CheckCircle2 size={13} />
        {tag}
      </div>
    </div>
  );
}

/* ─── Auth Form ─────────────────────────────────────────────────── */
function AuthForm({
  authMode, setAuthMode,
  authEmail, setAuthEmail,
  authPassword, setAuthPassword,
  authName, setAuthName,
  authRole, setAuthRole,
  authLang, setAuthLang,
  authError, authSuccess,
  isSubmittingAuth,
  showPassword, setShowPassword,
  handleLogin, handleRegister, handleDemoLogin,
  currentUser, onLogout, onLaunchExplainer,
}) {
  if (currentUser) {
    const initials = currentUser.name
      ? currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : 'U';
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px', fontSize: '1.5rem', fontWeight: 800, color: '#fff',
          boxShadow: '0 0 28px rgba(99,102,241,0.5)',
        }}>
          {initials}
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: 4 }}>
          {currentUser.name}
        </div>
        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          {currentUser.email} &bull;{' '}
          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 9999, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.35)', fontWeight: 700 }}>
            {currentUser.role || 'Developer'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onLaunchExplainer} style={{ gap: 8 }}>
            <Sparkles size={15} /> Open Workspace
          </button>
          <button className="btn btn-secondary" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Switcher */}
      <div style={{
        display: 'flex', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
        padding: 4, marginBottom: 22, gap: 4,
      }}>
        {[['login', <LogIn size={14} />, 'Sign In'], ['register', <UserPlus size={14} />, 'Create Account']].map(([mode, icon, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() => setAuthMode(mode)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 7, padding: '10px 12px', borderRadius: 10, fontWeight: 600,
              fontSize: '0.86rem', cursor: 'pointer', border: 'none',
              transition: 'all 0.18s ease',
              background: authMode === mode
                ? 'linear-gradient(135deg,rgba(99,102,241,0.35),rgba(6,182,212,0.2))'
                : 'transparent',
              color: authMode === mode ? '#fff' : 'var(--text-muted)',
              boxShadow: authMode === mode ? '0 2px 12px rgba(99,102,241,0.25)' : 'none',
              borderBottom: authMode === mode ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {authError && (
        <div style={{
          background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)',
          borderRadius: 10, padding: '11px 14px', color: '#fca5a5',
          fontSize: '0.83rem', marginBottom: 14,
        }}>
          {authError}
        </div>
      )}
      {authSuccess && (
        <div style={{
          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: 10, padding: '11px 14px', color: '#6ee7b7',
          fontSize: '0.83rem', marginBottom: 14,
        }}>
          {authSuccess}
        </div>
      )}

      {/* Form */}
      <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {authMode === 'register' && (
          <FieldGroup label="Full Name" icon={<UserIcon size={15} />}>
            <input
              type="text" className="auth-input" placeholder="Ada Lovelace"
              value={authName} onChange={e => setAuthName(e.target.value)} required
            />
          </FieldGroup>
        )}

        <FieldGroup label="Email Address" icon={<Mail size={15} />}>
          <input
            type="email" className="auth-input" placeholder="dev@example.com"
            value={authEmail} onChange={e => setAuthEmail(e.target.value)} required
          />
        </FieldGroup>

        <FieldGroup label="Password" icon={<Lock size={15} />} suffix={
          <button type="button" className="auth-toggle-pwd" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }>
          <input
            type={showPassword ? 'text' : 'password'} className="auth-input"
            placeholder="Minimum 6 characters"
            value={authPassword} onChange={e => setAuthPassword(e.target.value)} required
          />
        </FieldGroup>

        {authMode === 'register' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FieldGroup label="Role" compact>
              <select className="auth-input" value={authRole} onChange={e => setAuthRole(e.target.value)}>
                <option value="Developer">Developer</option>
                <option value="Student">Student</option>
                <option value="Instructor">Instructor</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Primary Stack" compact>
              <select className="auth-input" value={authLang} onChange={e => setAuthLang(e.target.value)}>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="typescript">TypeScript</option>
                <option value="go">Go</option>
              </select>
            </FieldGroup>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmittingAuth}
          style={{ width: '100%', padding: '13px', marginTop: 4, fontSize: '0.92rem' }}
        >
          {isSubmittingAuth ? 'Processing…' : authMode === 'login' ? 'Sign In to Workspace' : 'Create Free Account'}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0 14px', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* Demo Button */}
      <button
        type="button"
        onClick={handleDemoLogin}
        className="btn btn-secondary"
        style={{
          width: '100%', padding: 12, gap: 8, fontSize: '0.88rem',
          background: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.32)',
          color: '#67e8f9',
        }}
      >
        <Zap size={15} /> Instant Demo — No Sign-Up Required
      </button>
    </div>
  );
}

function FieldGroup({ label, icon, suffix, children, compact }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 13, color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex' }}>
            {icon}
          </span>
        )}
        <div style={{ width: '100%', paddingLeft: icon ? 38 : 0, paddingRight: suffix ? 40 : 0 }}>
          {children}
        </div>
        {suffix && (
          <span style={{ position: 'absolute', right: 10, display: 'flex' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Landing Page ─────────────────────────────────────────── */
export default function LandingPage({
  onLaunchExplainer, onBrowseDatabase, currentUser, onLogout,
  authMode, setAuthMode, authEmail, setAuthEmail,
  authPassword, setAuthPassword, authName, setAuthName,
  authRole, setAuthRole, authLang, setAuthLang,
  authError, authSuccess, isSubmittingAuth,
  showPassword, setShowPassword,
  handleLogin, handleRegister, handleDemoLogin, mongoStatus,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 72, paddingBottom: 80 }}>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', textAlign: 'center', padding: '64px 24px 52px', overflow: 'hidden' }}>
        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: '10%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(6,182,212,0.14) 0%,transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 18px', borderRadius: 9999, marginBottom: 28,
            background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.38)',
            color: '#c7d2fe', fontSize: '0.8rem', fontWeight: 700,
            boxShadow: '0 0 22px rgba(99,102,241,0.2)', letterSpacing: '0.03em',
          }}>
            <Sparkles size={14} color="#38bdf8" />
            Hybrid AI &bull; MongoDB Invariant Engine &bull; Real-Time Diffs
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.1rem, 5vw, 3.4rem)',
            fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.04em',
            color: 'var(--text-highlight)', marginBottom: 20,
          }}>
            Intelligent Error Explainer &amp;{' '}
            <span style={{ background: 'linear-gradient(135deg,#a5b4fc 0%,#818cf8 35%,#38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Unified Code Diff Resolver
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.72, maxWidth: 660, margin: '0 auto 36px', fontWeight: 400 }}>
            Stop pasting exceptions into random forums. BugSense AI strips environment noise, matches
            verified MongoDB solutions in <strong style={{ color: 'var(--text-highlight)' }}>&lt;15ms</strong>, and generates
            exact line-by-line diffs with Hybrid Generative AI.
          </p>

          {/* CTA Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: currentUser ? 52 : 24 }}>
            <button className="btn btn-primary" onClick={onLaunchExplainer} style={{ padding: '13px 28px', fontSize: '0.96rem', gap: 9 }}>
              {currentUser ? 'Open AI Explainer' : 'Get Started — Sign In'} <ArrowRight size={17} />
            </button>
            <button className="btn btn-secondary" onClick={onBrowseDatabase} style={{ padding: '13px 24px', gap: 8 }}>
              <Database size={16} /> Browse Solved DB
            </button>
            {!currentUser && (
              <a href="#auth-portal" className="btn btn-outline" style={{ padding: '13px 22px', gap: 8, textDecoration: 'none' }}>
                <UserIcon size={16} color="#a5b4fc" /> Sign In / Register
              </a>
            )}
          </div>

          {/* Auth-gate notice for unauthenticated visitors */}
          {!currentUser && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 10, marginBottom: 36,
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)',
              color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 500,
            }}>
              <Lock size={13} style={{ flexShrink: 0 }} />
              Sign in or use the free Instant Demo to access the AI Explainer, Solved Database, History, and Analytics.
            </div>
          )}

          {/* Stats Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            <StatCard value="< 15ms"   label="Cache Query Latency"      color="#38bdf8" />
            <StatCard value="100%"     label="Invariant Path Stripping"  color="#818cf8" />
            <StatCard value="6+"       label="Supported Languages"       color="#34d399" />
            <StatCard value={mongoStatus?.connected ? 'Online' : 'Offline'}
                      label="MongoDB Cluster"
                      color={mongoStatus?.connected ? '#34d399' : '#f87171'} />
          </div>
        </div>
      </section>

      {/* ── FEATURE PILLARS ────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            System Architecture
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem,3vw,2.1rem)', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: 10, letterSpacing: '-0.03em' }}>
            Built for Modern Developer Workflows
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            A dual-layer diagnostic platform combining deterministic MongoDB caching with Gemini Generative AI.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
          <PillarCard
            icon={<Layers size={24} />}
            title="Invariant Normalization"
            desc="Strips machine-specific file paths, line numbers, and hex memory pointers into canonical matching signatures."
            tag="Regex Invariant Engine"
            iconBg="rgba(99,102,241,0.14)" iconColor="#818cf8" tagColor="#a5b4fc"
          />
          <PillarCard
            icon={<Database size={24} />}
            title="MongoDB Knowledge Base"
            desc="Searchable community-vetted solutions with compound text indexes, full CRUD, and helpfulness voting."
            tag="Full CRUD + Indexing"
            iconBg="rgba(6,182,212,0.12)" iconColor="#22d3ee" tagColor="#22d3ee"
          />
          <PillarCard
            icon={<Zap size={24} />}
            title="Hybrid Generative AI"
            desc="When no cache hit, Gemini AI ranks top 3 probable root causes and generates diff patches with prevention tips."
            tag="Gemini 2.5 • Real-Time"
            iconBg="rgba(236,72,153,0.12)" iconColor="#f472b6" tagColor="#f472b6"
          />
          <PillarCard
            icon={<BarChart3 size={24} />}
            title="Aggregation Analytics"
            desc="Multi-stage pipelines ($match → $group → $facet) computing error frequency, resolution trends, and ranking."
            tag="Multi-Stage Aggregation"
            iconBg="rgba(16,185,129,0.12)" iconColor="#34d399" tagColor="#34d399"
          />
        </div>
      </section>

      {/* ── LIVE CODE SHOWCASE ─────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 24px' }}>
        <div className="interactive-showcase-panel" style={{
          borderRadius: 24, padding: '32px 32px 28px',
        }}>
          {/* Showcase Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Interactive Diagnostic Preview
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                From Raw Stack Trace to Unified Code Diff
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
            </div>
          </div>

          {/* Code Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Before */}
            <div style={{ background: '#040710', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '9px 16px', background: 'rgba(244,63,94,0.08)', borderBottom: '1px solid rgba(244,63,94,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)' }}>stack_trace.py</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Raw Runtime Output</span>
              </div>
              <pre style={{ padding: '18px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#fca5a5', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{`IndexError: list index out of range
  File "grades.py", line 7, in <module>
    top_student = scores[len(scores)]

scores = [88, 92, 79, 95]
last_score = scores[len(scores)]`}</pre>
            </div>

            {/* After */}
            <div style={{ background: '#040710', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '9px 16px', background: 'rgba(16,185,129,0.08)', borderBottom: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>bugsense_fix.diff</span>
                <span style={{ fontSize: '0.68rem', color: '#22d3ee', fontWeight: 600 }}>MongoDB Match &lt;12ms</span>
              </div>
              <pre style={{ padding: '18px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                <span style={{ color: '#67e8f9' }}>@@ -7,2 +7,2 @@{'\n'}</span>
                <span style={{ color: '#f87171' }}>- last_score = scores[len(scores)]{'\n'}</span>
                <span style={{ color: '#86efac' }}>+ last_score = scores[-1]{'\n'}</span>
                {'\n'}
                <span style={{ color: '#a5b4fc' }}>✓ Use negative indexing in Python for safe last-element access.{'\n'}</span>
                <span style={{ color: '#a5b4fc' }}>✓ Add bounds check: if scores: last_score = scores[-1]</span>
              </pre>
            </div>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button className="btn btn-primary" onClick={onLaunchExplainer} style={{ gap: 8 }}>
              <Play size={15} /> Try Live Diagnostic Hub
            </button>
          </div>
        </div>
      </section>

      {/* ── AUTH PORTAL ────────────────────────────────────────────── */}
      <section id="auth-portal" style={{ maxWidth: 480, margin: '0 auto', width: '100%', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            {currentUser ? 'Developer Profile' : 'Account Portal'}
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-highlight)', marginBottom: 8, letterSpacing: '-0.03em' }}>
            {currentUser ? currentUser.name : 'Sign In or Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {currentUser
              ? `Logged in as ${currentUser.role || 'Developer'}. Access your workspace and debugging history.`
              : 'Join to save error cases, submit feedback, and track analytics across sessions.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="auth-card" style={{
          borderRadius: 24,
          padding: '32px 28px',
          backdropFilter: 'blur(24px)',
        }}>
          <AuthForm
            authMode={authMode} setAuthMode={setAuthMode}
            authEmail={authEmail} setAuthEmail={setAuthEmail}
            authPassword={authPassword} setAuthPassword={setAuthPassword}
            authName={authName} setAuthName={setAuthName}
            authRole={authRole} setAuthRole={setAuthRole}
            authLang={authLang} setAuthLang={setAuthLang}
            authError={authError} authSuccess={authSuccess}
            isSubmittingAuth={isSubmittingAuth}
            showPassword={showPassword} setShowPassword={setShowPassword}
            handleLogin={handleLogin} handleRegister={handleRegister} handleDemoLogin={handleDemoLogin}
            currentUser={currentUser} onLogout={onLogout} onLaunchExplainer={onLaunchExplainer}
          />
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{
        maxWidth: 1200, margin: '0 auto', width: '100%', padding: '28px 32px 0',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bug size={14} color="#fff" />
          </div>
          <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
            <strong style={{ color: '#e2e8f0' }}>BugSense AI</strong> &bull; Hybrid AI + MongoDB Invariant Search
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>MongoDB: <strong style={{ color: mongoStatus?.connected ? '#34d399' : '#f87171' }}>
            {mongoStatus?.connected ? '● Online' : '● Offline'}
          </strong></span>
          <span>Mongoose v8 · Express v4 · React v19</span>
        </div>
      </footer>

    </div>
  );
}
