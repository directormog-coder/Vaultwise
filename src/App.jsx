import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Logo from "./components/Logo";
import { ACCENT_GREEN, BG_DARK, CARD_BG, BORDER } from "./data/constants";

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
  const [rates, setRates] = useState({ USD: 18.50, BTC: 1200000 }); // Default 2026 Fallbacks
  const [loading, setLoading] = useState(true);

  // Input states
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [selectedCurrency, setSelectedCurrency] = useState("ZAR");

  // AI states
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Global markets synced. Local ZAR liquidity secured.' }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchRecords();
        fetchRates();
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRecords();
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch Live Exchange Rates (Free API example)
  const fetchRates = async () => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await res.json();
      // Calculate BTC to ZAR (Estimated for 2026)
      setRates({ USD: data.rates.ZAR, BTC: 1250000 }); 
    } catch (e) {
      console.warn("Using offline rates");
    }
  };

  const fetchRecords = async () => {
    const { data, error } = await supabase.from('finances').select('*').order('created_at', { ascending: false });
    if (!error) setRecords(data);
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!amount) return;
    await supabase.from('finances').insert([
      { user_id: session.user.id, amount: parseFloat(amount), type, currency: selectedCurrency }
    ]);
    setAmount(""); fetchRecords();
  };

  // Calculate Net Worth in ZAR
  const calculateTotalZAR = () => {
    return records.reduce((acc, r) => {
      let valInZAR = r.amount;
      if (r.currency === 'USD') valInZAR = r.amount * rates.USD;
      if (r.currency === 'BTC') valInZAR = r.amount * rates.BTC;
      return r.type === 'income' ? acc + valInZAR : acc - valInZAR;
    }, 0);
  };

  const askAdvisor = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput("");
    setIsTyping(true);

    const netZAR = calculateTotalZAR();

    setTimeout(() => {
      let advice = `Market Analysis: USD/ZAR is at R${rates.USD.toFixed(2)}. Your consolidated net worth is ${formatCurrency(netZAR, 'ZAR')}. `;
      if (rates.USD > 19) advice += "The Rand is weakening; consider hedging into more USD assets.";
      else advice += "ZAR strength detected. It might be a good time to settle local debts.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: advice }]);
      setIsTyping(false);
    }, 1200);
  };

  if (!session) return <Auth />;

  const netZAR = calculateTotalZAR();

  const S = {
    container: { background: BG_DARK, minHeight: "100vh", color: "#E8F0EA", padding: "20px 20px 120px 20px" },
    card: { background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 28, padding: 24, marginBottom: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    label: { color: "#3D6B4A", fontSize: 10, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase", fontWeight: 'bold' },
    input: { background: '#000', border: `1px solid ${BORDER}`, padding: 16, borderRadius: 16, color: ACCENT_GREEN, width: '100%', marginBottom: 12, outline: 'none', boxSizing: 'border-box' },
    nav: { position: 'fixed', bottom: 20, left: 20, right: 20, display: 'flex', gap: 10, background: 'rgba(10, 18, 12, 0.8)', backdropFilter: 'blur(10px)', padding: 8, borderRadius: 50, border: `1px solid ${BORDER}`, zIndex: 100 },
    navBtn: (active) => ({ flex: 1, padding: '15px 0', borderRadius: 40, border: 'none', background: active ? ACCENT_GREEN : 'transparent', color: active ? '#000' : '#3D6B4A', fontWeight: 'bold' }),
    pill: (active) => ({ padding: '8px 14px', borderRadius: 20, fontSize: 11, background: active ? ACCENT_GREEN : '#000', color: active ? '#000' : ACCENT_GREEN, border: `1px solid ${BORDER}`, marginRight: 6, fontWeight: 'bold' })
  };

  return (
    <div style={S.container}>
      {/* GLOBAL STATUS BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 5 }}>
        <span style={{ fontSize: 10, color: '#3D6B4A' }}>USD/ZAR: R{rates.USD.toFixed(2)}</span>
        <span style={{ fontSize: 10, color: '#3D6B4A' }}>BTC/ZAR: R{(rates.BTC/1000).toFixed(0)}k</span>
        <span style={{ fontSize: 10, color: ACCENT_GREEN }}>SYSTEM: OPTIMIZED</span>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
        <Logo size={32} />
        <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: 10, fontWeight: 'bold' }}>TERMINATE SESSION</button>
      </header>

      {tab === "dashboard" && (
        <div className="fade">
          <div style={S.card}>
            <p style={S.label}>Consolidated Wealth (ZAR)</p>
            <h2 style={{ fontSize: 42, color: ACCENT_GREEN, margin: 0, fontFamily: 'monospace' }}>{formatCurrency(netZAR, 'ZAR')}</h2>
            <div style={{ marginTop: 10, height: 2, background: BORDER, width: '100%' }}>
              <div style={{ height: '100%', background: ACCENT_GREEN, width: '65%' }}></div>
            </div>
          </div>

          <form onSubmit={handleAddRecord} style={S.card}>
            <p style={S.label}>Entry Protocol</p>
            <div style={{ marginBottom: 15, display: 'flex' }}>
              {['ZAR', 'USD', 'BTC'].map(c => (
                <button type="button" key={c} onClick={() => setSelectedCurrency(c)} style={S.pill(selectedCurrency === c)}>{c}</button>
              ))}
            </div>
            <input style={S.input} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <button type="button" onClick={() => setType('income')} style={S.navBtn(type === 'income')}>ASSET</button>
              <button type="button" onClick={() => setType('expense')} style={S.navBtn(type === 'expense')}>LIABILITY</button>
            </div>
            <button type="submit" style={{ ...S.navBtn(true), width: '100%', letterSpacing: 2 }}>EXECUTE ENTRY</button>
          </form>

          <p style={S.label}>Recent Ingress/Egress</p>
          {records.slice(0, 4).map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{r.type === 'income' ? 'CREDIT' : 'DEBIT'}</div>
                <div style={{ fontSize: 10, color: '#3D6B4A' }}>{r.currency} @ R{r.currency === 'USD' ? rates.USD : rates.BTC}</div>
              </div>
              <span style={{ color: r.type === 'income' ? ACCENT_GREEN : '#ff4444', fontSize: 16, fontWeight: 'bold' }}>
                {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount, r.currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "advisor" && (
        <div className="fade" style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? ACCENT_GREEN : '#0A120C', color: m.role === 'user' ? '#000' : '#E8F0EA', padding: '14px 18px', borderRadius: 20, marginBottom: 12, fontSize: 14, maxWidth: '85%', marginLeft: m.role === 'user' ? 'auto' : 0, border: m.role === 'assistant' ? `1px solid ${BORDER}` : 'none' }}>{m.content}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...S.input, marginBottom: 0 }} placeholder="Request Intelligence..." value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={askAdvisor} style={{ ...S.navBtn(true), flex: '0 0 55px' }}>&rarr;</button>
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <button onClick={() => setTab("dashboard")} style={S.navBtn(tab === "dashboard")}>CORE</button>
        <button onClick={() => setTab("advisor")} style={S.navBtn(tab === "advisor")}>INTEL</button>
      </nav>
    </div>
  );
}
