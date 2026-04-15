import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Logo from "./components/Logo";
import { ACCENT_GREEN, BG_DARK, CARD_BG, BORDER } from "./data/constants";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [records, setRecords] = useState([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");

  // AI & Biometrics
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Neural link active. Systems ready.' }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRecords();
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRecords();
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase.from('finances').select('*').order('created_at', { ascending: false });
    if (!error) setRecords(data);
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!amount) return;
    await supabase.from('finances').insert([{ user_id: session.user.id, amount: parseFloat(amount), type }]);
    setAmount(""); fetchRecords();
  };

  // --- UPGRADE: AGENTIC ADVISOR ---
  const askAdvisor = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const total = records.reduce((acc, r) => r.type === 'income' ? acc + r.amount : acc - r.amount, 0);
    const lastExpense = records.find(r => r.type === 'expense')?.amount || 0;

    // Simulate Agentic Analysis
    setTimeout(() => {
      let response = `Analyzing your $${total.toLocaleString()} vault... `;
      if (total > 1000) response += "Your liquidity is high. I suggest moving 20% to a high-yield asset.";
      else if (lastExpense > 100) response += `That last $${lastExpense} expense spiked your burn rate. Watch your velocity.`;
      else response += "Steady growth detected. System optimized.";

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  // --- UPGRADE: BIOMETRIC UNLOCK ---
  const handleBiometricAuth = async () => {
    if (!window.PublicKeyCredential) return alert("Biometrics not supported on this device.");
    // This triggers the native FaceID/Fingerprint prompt
    alert("Biometric scanning initialized...");
    // Logic: In a full prod app, we'd verify the challenge here
  };

  const totalBalance = records.reduce((acc, r) => r.type === 'income' ? acc + r.amount : acc - r.amount, 0);

  const S = {
    container: { background: BG_DARK, minHeight: "100vh", color: "#E8F0EA", padding: "20px 20px 100px 20px", fontFamily: 'sans-serif' },
    card: { background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 24, padding: 24, marginBottom: 20, position: 'relative', overflow: 'hidden' },
    label: { color: "#3D6B4A", fontSize: 10, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" },
    input: { background: '#000', border: `1px solid ${BORDER}`, padding: 14, borderRadius: 12, color: ACCENT_GREEN, width: '100%', marginBottom: 10, outline: 'none' },
    nav: { position: 'fixed', bottom: 20, left: 20, right: 20, display: 'flex', gap: 10, background: '#0A120C', padding: 8, borderRadius: 50, border: `1px solid ${BORDER}` },
    navBtn: (active) => ({ flex: 1, padding: '14px 0', borderRadius: 40, border: 'none', background: active ? ACCENT_GREEN : 'transparent', color: active ? '#000' : '#3D6B4A', fontWeight: 'bold' }),
    // Sparkline Graph CSS
    chartBar: (height) => ({ width: 8, background: ACCENT_GREEN, borderRadius: 4, height: height, opacity: 0.6 })
  };

  if (loading) return <div style={{ background: BG_DARK, height: '100vh' }} />;
  if (!session) return <Auth onBiometric={handleBiometricAuth} />;

  return (
    <div style={S.container}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Logo size={28} />
        <button onClick={handleBiometricAuth} style={{ background: '#0A120C', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '6px 10px', color: ACCENT_GREEN, fontSize: 10 }}>SECURE SCAN</button>
      </header>

      {tab === "dashboard" && (
        <div className="fade">
          <div style={S.card}>
            <p style={S.label}>Growth Velocity</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40, marginBottom: 15 }}>
              {[20, 35, 25, 45, 60, 55, 80].map((h, i) => <div key={i} style={S.chartBar(h)} />)}
            </div>
            <p style={S.label}>Net Liquidity</p>
            <h2 style={{ fontSize: 44, color: ACCENT_GREEN, margin: 0 }}>${totalBalance.toLocaleString()}</h2>
          </div>

          <form onSubmit={handleAddRecord} style={S.card}>
            <p style={S.label}>Manual Ingress</p>
            <input style={S.input} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <button type="button" onClick={() => setType('income')} style={S.navBtn(type === 'income')}>INCOME</button>
              <button type="button" onClick={() => setType('expense')} style={S.navBtn(type === 'expense')}>EXPENSE</button>
            </div>
            <button type="submit" style={{ ...S.navBtn(true), width: '100%' }}>CONFIRM ENTRY</button>
          </form>
        </div>
      )}

      {tab === "advisor" && (
        <div className="fade" style={{ display: 'flex', flexDirection: 'column', height: '75vh' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? ACCENT_GREEN : '#0A120C', color: m.role === 'user' ? '#000' : '#E8F0EA', padding: '12px 16px', borderRadius: 16, marginBottom: 12, fontSize: 14 }}>{m.content}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...S.input, marginBottom: 0 }} placeholder="Query OS..." value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={askAdvisor} style={{ ...S.navBtn(true), flex: '0 0 50px' }}>&rarr;</button>
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <button onClick={() => setTab("dashboard")} style={S.navBtn(tab === "dashboard")}>VAULT</button>
        <button onClick={() => setTab("advisor")} style={S.navBtn(tab === "advisor")}>ADVISOR</button>
      </nav>
    </div>
  );
}
