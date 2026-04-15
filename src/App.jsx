import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Logo from "./components/Logo";
import { ACCENT_GREEN, BG_DARK, CARD_BG, BORDER } from "./data/constants";

export default function App() {
  // --- SYSTEM & PWA STATES ---
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [installPrompt, setInstallPrompt] = useState(null);
  
  // --- DATA STATES ---
  const [records, setRecords] = useState([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");

  // --- AI ADVISOR STATES ---
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Vaultwise OS online. Ready to optimize your capital.' }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRecords();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRecords();
    });

    // 2. PWA Install Listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('finances')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setRecords(data);
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!amount) return;
    const { error } = await supabase.from('finances').insert([
      { user_id: session.user.id, amount: parseFloat(amount), type }
    ]);
    if (!error) { setAmount(""); fetchRecords(); }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const askAdvisor = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Analysis complete. Based on your current liquidity of $" + totalBalance.toLocaleString() + ", you have a 12% surplus for high-yield allocations." 
      }]);
      setIsTyping(false);
    }, 1200);
  };

  // --- STYLES ---
  const S = {
    container: { background: BG_DARK, minHeight: "100vh", color: "#E8F0EA", padding: "20px 20px 120px 20px", fontFamily: 'sans-serif' },
    card: { background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 24, padding: 24, marginBottom: 20 },
    label: { color: "#3D6B4A", fontSize: 10, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" },
    input: { background: '#000', border: `1px solid ${BORDER}`, padding: 14, borderRadius: 12, color: ACCENT_GREEN, width: '100%', marginBottom: 10, fontSize: 18, outline: 'none' },
    nav: { position: 'fixed', bottom: 20, left: 20, right: 20, display: 'flex', gap: 10, background: '#0A120C', padding: 8, borderRadius: 50, border: `1px solid ${BORDER}`, zIndex: 100 },
    navBtn: (active) => ({ flex: 1, padding: '14px 0', borderRadius: 40, border: 'none', background: active ? ACCENT_GREEN : 'transparent', color: active ? '#000' : '#3D6B4A', fontWeight: 'bold' }),
    chatBubble: (role) => ({ alignSelf: role === 'user' ? 'flex-end' : 'flex-start', background: role === 'user' ? ACCENT_GREEN : '#0A120C', color: role === 'user' ? '#000' : '#E8F0EA', padding: '12px 16px', borderRadius: 16, maxWidth: '85%', marginBottom: 12, fontSize: 14, border: role === 'assistant' ? `1px solid ${BORDER}` : 'none' }),
    installBanner: { background: ACCENT_GREEN, color: '#000', padding: '12px', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, fontWeight: 'bold', fontSize: 14 }
  };

  if (loading) return <div style={{ background: BG_DARK, height: '100vh' }} />;
  if (!session) return <Auth />;

  const totalBalance = records.reduce((acc, r) => r.type === 'income' ? acc + r.amount : acc - r.amount, 0);

  return (
    <div style={S.container}>
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Logo size={28} />
        <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', border: 'none', color: '#3D6B4A', fontSize: 11 }}>LOGOUT</button>
      </header>

      {/* INSTALL PROMPT */}
      {installPrompt && (
        <div style={S.installBanner}>
          <span>Install Vaultwise to your Home Screen</span>
          <button onClick={handleInstall} style={{ background: '#000', color: ACCENT_GREEN, border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 'bold' }}>INSTALL</button>
        </div>
      )}

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div className="fade">
          <div style={S.card}>
            <p style={S.label}>Net Liquidity</p>
            <h2 style={{ fontSize: 44, color: ACCENT_GREEN, margin: 0 }}>${totalBalance.toLocaleString()}</h2>
          </div>

          <form onSubmit={handleAddRecord} style={S.card}>
            <p style={S.label}>Add Transaction</p>
            <input style={S.input} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <button type="button" onClick={() => setType('income')} style={S.navBtn(type === 'income')}>INCOME</button>
              <button type="button" onClick={() => setType('expense')} style={S.navBtn(type === 'expense')}>EXPENSE</button>
            </div>
            <button type="submit" style={{ ...S.navBtn(true), width: '100%' }}>SECURE DATA</button>
          </form>

          <p style={S.label}>Recent Activity</p>
          {records.slice(0, 5).map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 14 }}>{r.type.toUpperCase()}</span>
              <span style={{ color: r.type === 'income' ? ACCENT_GREEN : '#ff4444', fontWeight: 'bold' }}>
                {r.type === 'income' ? '+' : '-'}${r.amount}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ADVISOR */}
      {tab === "advisor" && (
        <div className="fade" style={{ display: 'flex', flexDirection: 'column', height: '75vh' }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column' }}>
            {messages.map((m, i) => (
              <div key={i} style={S.chatBubble(m.role)}>{m.content}</div>
            ))}
            {isTyping && <div style={{ ...S.chatBubble('assistant'), opacity: 0.5 }}>Processing...</div>}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              style={{ ...S.input, marginBottom: 0 }} 
              placeholder="Query Advisor..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && askAdvisor()}
            />
            <button onClick={askAdvisor} style={{ ...S.navBtn(true), flex: '0 0 50px' }}>&rarr;</button>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={S.nav}>
        <button onClick={() => setTab("dashboard")} style={S.navBtn(tab === "dashboard")}>VAULT</button>
        <button onClick={() => setTab("advisor")} style={S.navBtn(tab === "advisor")}>ADVISOR</button>
      </nav>
    </div>
  );
}
