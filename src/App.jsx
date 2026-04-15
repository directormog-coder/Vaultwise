import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Logo from "./components/Logo";
import { ACCENT_GREEN, BG_DARK, CARD_BG, BORDER } from "./data/constants";

// Currency Formatter Utility
const formatCurrency = (val, currency = 'ZAR') => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(val);
};

export default function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [records, setRecords] = useState([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [selectedCurrency, setSelectedCurrency] = useState("ZAR");

  // AI & UI States
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Neural link established. Your ZAR Vault is secure.' }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRecords();
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
    const { error } = await supabase.from('finances').insert([
      { user_id: session.user.id, amount: parseFloat(amount), type, currency: selectedCurrency }
    ]);
    if (!error) { setAmount(""); fetchRecords(); }
  };

  const askAdvisor = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput("");
    setIsTyping(true);

    const total = records.reduce((acc, r) => r.type === 'income' ? acc + r.amount : acc - r.amount, 0);

    setTimeout(() => {
      let advice = `Vault Status: ${formatCurrency(total, 'ZAR')}. `;
      if (total > 5000) advice += "Your ZAR liquidity is strong. I recommend checking the current USD/ZAR pair for potential offshore diversification.";
      else advice += "Focus on minimizing R100+ recurring expenses to boost your velocity.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: advice }]);
      setIsTyping(false);
    }, 1200);
  };

  if (!session) return <Auth />;

  const totalBalance = records.reduce((acc, r) => r.type === 'income' ? acc + r.amount : acc - r.amount, 0);

  const S = {
    container: { background: BG_DARK, minHeight: "100vh", color: "#E8F0EA", padding: "20px 20px 120px 20px", fontFamily: 'sans-serif' },
    card: { background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 24, padding: 24, marginBottom: 20 },
    label: { color: "#3D6B4A", fontSize: 10, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" },
    input: { background: '#000', border: `1px solid ${BORDER}`, padding: 14, borderRadius: 12, color: ACCENT_GREEN, width: '100%', marginBottom: 10, outline: 'none' },
    nav: { position: 'fixed', bottom: 20, left: 20, right: 20, display: 'flex', gap: 10, background: '#0A120C', padding: 8, borderRadius: 50, border: `1px solid ${BORDER}`, zIndex: 100 },
    navBtn: (active) => ({ flex: 1, padding: '14px 0', borderRadius: 40, border: 'none', background: active ? ACCENT_GREEN : 'transparent', color: active ? '#000' : '#3D6B4A', fontWeight: 'bold' }),
    currencyPill: (active) => ({ padding: '6px 12px', borderRadius: 20, fontSize: 10, background: active ? ACCENT_GREEN : '#000', color: active ? '#000' : ACCENT_GREEN, border: `1px solid ${BORDER}`, marginRight: 5 })
  };

  return (
    <div style={S.container}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Logo size={28} />
        <div style={{ display: 'flex', gap: 5 }}>
          {['ZAR', 'USD', 'EUR', 'BTC'].map(c => (
            <button key={c} onClick={() => setSelectedCurrency(c)} style={S.currencyPill(selectedCurrency === c)}>{c}</button>
          ))}
        </div>
      </header>

      {tab === "dashboard" && (
        <div className="fade">
          <div style={S.card}>
            <p style={S.label}>Net Position (ZAR)</p>
            <h2 style={{ fontSize: 40, color: ACCENT_GREEN, margin: 0 }}>{formatCurrency(totalBalance, 'ZAR')}</h2>
          </div>

          <form onSubmit={handleAddRecord} style={S.card}>
            <p style={S.label}>Add {selectedCurrency} Entry</p>
            <input style={S.input} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <button type="button" onClick={() => setType('income')} style={S.navBtn(type === 'income')}>CREDIT</button>
              <button type="button" onClick={() => setType('expense')} style={S.navBtn(type === 'expense')}>DEBIT</button>
            </div>
            <button type="submit" style={{ ...S.navBtn(true), width: '100%' }}>SECURE TRANSACTION</button>
          </form>

          <p style={S.label}>Neural Activity History</p>
          {records.slice(0, 5).map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <div style={{ fontSize: 14 }}>{r.type.toUpperCase()}</div>
                <div style={{ fontSize: 10, color: '#3D6B4A' }}>{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <span style={{ color: r.type === 'income' ? ACCENT_GREEN : '#ff4444', fontWeight: 'bold' }}>
                {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount, r.currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "advisor" && (
        <div className="fade" style={{ display: 'flex', flexDirection: 'column', height: '75vh' }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? ACCENT_GREEN : '#0A120C', color: m.role === 'user' ? '#000' : '#E8F0EA', padding: '12px 16px', borderRadius: 16, marginBottom: 12, fontSize: 14, maxWidth: '85%', marginLeft: m.role === 'user' ? 'auto' : 0 }}>{m.content}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...S.input, marginBottom: 0 }} placeholder="Query Advisor..." value={input} onChange={(e) => setInput(e.target.value)} />
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
