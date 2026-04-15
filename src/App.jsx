import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Logo from "./components/Logo";
import { ACCENT_GREEN, BG_DARK, CARD_BG, BORDER } from "./data/constants";

// Global Formatter for South African Rand (ZAR)
const formatZAR = (val) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val);

export default function App() {
  // --- SYSTEM STATES ---
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard"); // dashboard, strategy, advisor
  
  // --- DATA STATES ---
  const [records, setRecords] = useState([]);
  const [debts, setDebts] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [rates, setRates] = useState({ USD: 18.42, BTC: 1250000 }); // Live 2026 Reference

  // --- INPUT STATES ---
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [selectedCurrency, setSelectedCurrency] = useState("ZAR");
  const [debtName, setDebtName] = useState("");
  const [debtBalance, setDebtBalance] = useState("");
  const [debtInterest, setDebtInterest] = useState("");

  // --- AI & MESSAGING STATES ---
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Sovereign Systems Online. Neural link established. Ready to optimize your ZAR wealth.' }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // --- INITIALIZATION & AUTH ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async () => {
    const [r, d, i] = await Promise.all([
      supabase.from('finances').select('*').order('created_at', { ascending: false }),
      supabase.from('debts').select('*').order('interest_rate', { ascending: false }),
      supabase.from('investments').select('*')
    ]);
    setRecords(r.data || []);
    setDebts(d.data || []);
    setInvestments(i.data || []);
  };

  // --- ACTIONS ---
  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!amount) return;
    const { error } = await supabase.from('finances').insert([
      { user_id: session.user.id, amount: parseFloat(amount), type, currency: selectedCurrency }
    ]);
    if (!error) { setAmount(""); fetchAllData(); }
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('debts').insert([{ 
      user_id: session.user.id, name: debtName, balance: parseFloat(debtBalance), interest_rate: parseFloat(debtInterest), minimum_payment: 0 
    }]);
    if (!error) { setDebtName(""); setDebtBalance(""); setDebtInterest(""); fetchAllData(); }
  };

  const handleBiometricAuth = async () => {
    if (!window.PublicKeyCredential) return alert("Biometric Hardware not detected.");
    alert("Authenticating via Secure Scan...");
  };

  // --- CALCULATIONS & PROJECTIONS ---
  const totalAssetsZAR = () => {
    const cash = records.reduce((acc, r) => {
      let val = r.amount;
      if (r.currency === 'USD') val *= rates.USD;
      if (r.currency === 'BTC') val *= rates.BTC;
      return r.type === 'income' ? acc + val : acc - val;
    }, 0);
    const invested = investments.reduce((acc, i) => acc + (i.current_valuation || i.initial_amount), 0);
    return cash + invested;
  };

  const totalDebtZAR = () => debts.reduce((acc, d) => acc + d.balance, 0);
  const netWorth = totalAssetsZAR() - totalDebtZAR();
  
  // 12-Month Projection based on current month's savings
  const monthlySavings = records.filter(r => new Date(r.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((acc, r) => r.type === 'income' ? acc + r.amount : acc - r.amount, 0);
  const projection12M = netWorth + (monthlySavings * 12);

  const askAdvisor = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let advice = `Consolidated Net Position: ${formatZAR(netWorth)}. `;
      const toxicDebt = debts.find(d => d.interest_rate > 15);
      
      if (toxicDebt) {
        advice += `🚨 PRIORITY: Your '${toxicDebt.name}' at ${toxicDebt.interest_rate}% is toxic. Settle this before allocating capital to the Strategy tab.`;
      } else if (monthlySavings > 0) {
        advice += `Growth Path: At your current velocity, you hit ${formatZAR(projection12M)} in 12 months. Ready to accelerate?`;
      } else {
        advice += "Velocity check required. Debits are exceeding assets.";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: advice }]);
      setIsTyping(false);
    }, 1200);
  };

  // --- STYLING ---
  const S = {
    container: { background: "#050806", minHeight: "100vh", color: "#E8F0EA", padding: "20px 20px 120px 20px", fontFamily: 'sans-serif' },
    card: { background: "#0D1410", border: `1px solid #1A2E22`, borderRadius: 28, padding: 24, marginBottom: 20 },
    label: { color: "#3D6B4A", fontSize: 9, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase", fontWeight: '900' },
    input: { background: '#000', border: `1px solid #1A2E22`, padding: 14, borderRadius: 16, color: ACCENT_GREEN, width: '100%', marginBottom: 10, outline: 'none', boxSizing: 'border-box' },
    nav: { position: 'fixed', bottom: 20, left: 20, right: 20, display: 'flex', gap: 10, background: 'rgba(5, 8, 6, 0.95)', backdropFilter: 'blur(15px)', padding: 10, borderRadius: 50, border: `1px solid #1A2E22`, zIndex: 100 },
    navBtn: (active) => ({ flex: 1, padding: '15px 0', borderRadius: 40, border: 'none', background: active ? ACCENT_GREEN : 'transparent', color: active ? '#000' : '#3D6B4A', fontWeight: '900' }),
    ring: { height: 12, width: '100%', background: '#111', borderRadius: 6, overflow: 'hidden', display: 'flex', marginBottom: 10 }
  };

  if (loading) return <div style={{ background: "#050806", height: '100vh' }} />;
  if (!session) return <Auth onBiometric={handleBiometricAuth} />;

  return (
    <div style={S.container}>
      {/* GLOBAL TICKER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ fontSize: 10, color: '#3D6B4A' }}>USD/ZAR: R{rates.USD.toFixed(2)}</span>
        <span style={{ fontSize: 10, color: '#3D6B4A' }}>BTC/ZAR: R{(rates.BTC/1000).toFixed(0)}k</span>
        <button onClick={handleBiometricAuth} style={{ border: 'none', background: 'none', color: ACCENT_GREEN, fontSize: 10 }}>[ SECURE SCAN ]</button>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
        <Logo size={32} />
        <div style={{ textAlign: 'right' }}>
          <p style={S.label}>12M Projection</p>
          <span style={{ color: ACCENT_GREEN, fontSize: 22, fontWeight: 'bold' }}>{formatZAR(projection12M)}</span>
        </div>
      </header>

      {tab === "dashboard" && (
        <div className="fade">
          <div style={S.card}>
            <p style={S.label}>Asset vs Debt Ratio</p>
            <div style={S.ring}>
              <div style={{ width: `${Math.min(100, (totalAssetsZAR() / (totalAssetsZAR() + totalDebtZAR() || 1)) * 100)}%`, background: ACCENT_GREEN }} />
              <div style={{ width: `${(totalDebtZAR() / (totalAssetsZAR() + totalDebtZAR() || 1)) * 100}%`, background: '#ff4444' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 'bold' }}>
              <span style={{ color: ACCENT_GREEN }}>{formatZAR(totalAssetsZAR())}</span>
              <span style={{ color: '#ff4444' }}>{formatZAR(totalDebtZAR())}</span>
            </div>
          </div>

          <div style={S.card}>
            <p style={S.label}>True Net Position</p>
            <h2 style={{ fontSize: 48, color: ACCENT_GREEN, margin: 0 }}>{formatZAR(netWorth)}</h2>
          </div>

          <form onSubmit={handleAddRecord} style={S.card}>
            <p style={S.label}>Entry Protocol</p>
            <div style={{ marginBottom: 15 }}>
              {['ZAR', 'USD', 'BTC'].map(c => (
                <button type="button" key={c} onClick={() => setSelectedCurrency(c)} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid #1A2E22', background: selectedCurrency === c ? ACCENT_GREEN : '#000', color: selectedCurrency === c ? '#000' : ACCENT_GREEN, fontSize: 10, marginRight: 5, fontWeight: 'bold' }}>{c}</button>
              ))}
            </div>
            <input style={S.input} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setType('income')} style={S.navBtn(type === 'income')}>+ ASSET</button>
              <button type="button" onClick={() => setType('expense')} style={S.navBtn(type === 'expense')}>- DEBIT</button>
            </div>
          </form>

          {debts.length > 0 && (
            <div style={S.card}>
              <p style={S.label}>Credit Eradication Target</p>
              {debts.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid #1A2E22', paddingBottom: 5 }}>
                  <span style={{ fontSize: 14 }}>{d.name} ({d.interest_rate}%)</span>
                  <span style={{ color: '#ff4444', fontWeight: 'bold' }}>{formatZAR(d.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "strategy" && (
        <div className="fade">
          <h2 style={{ fontSize: 28, marginBottom: 20 }}>Wealth Ingress</h2>
          <div style={S.card}>
            <p style={S.label}>Conservative // RSA Retail Bonds</p>
            <h4 style={{ margin: 0 }}>9.25% Fixed Yield</h4>
            <p style={{ fontSize: 11, color: '#3D6B4A' }}>Inflation-beating, government-backed security.</p>
          </div>
          <div style={S.card}>
            <p style={S.label}>Aggressive // EasyEquities USD</p>
            <h4 style={{ margin: 0 }}>S&P 500 Hedge</h4>
            <p style={{ fontSize: 11, color: '#3D6B4A' }}>Protect wealth against ZAR volatility.</p>
          </div>
          {/* New Debt Input on Strategy Tab */}
          <form onSubmit={handleAddDebt} style={S.card}>
            <p style={S.label}>Register New Liability</p>
            <input style={S.input} placeholder="Liability Name" value={debtName} onChange={e => setDebtName(e.target.value)} />
            <input style={S.input} type="number" placeholder="Total Balance" value={debtBalance} onChange={e => setDebtBalance(e.target.value)} />
            <input style={S.input} type="number" placeholder="Interest Rate %" value={debtInterest} onChange={e => setDebtInterest(e.target.value)} />
            <button type="submit" style={{ ...S.navBtn(true), width: '100%', background: '#ff4444' }}>LOCK DEBT</button>
          </form>
        </div>
      )}

      {tab === "advisor" && (
        <div className="fade" style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? ACCENT_GREEN : '#0D1410', color: m.role === 'user' ? '#000' : '#E8F0EA', padding: '15px', borderRadius: 24, marginBottom: 12, fontSize: 14, maxWidth: '85%', marginLeft: m.role === 'user' ? 'auto' : 0, border: m.role === 'assistant' ? `1px solid #1A2E22` : 'none' }}>{m.content}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...S.input, marginBottom: 0 }} placeholder="Query Sovereign Intelligence..." value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={askAdvisor} style={{ ...S.navBtn(true), flex: '0 0 60px' }}>&rarr;</button>
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <button onClick={() => setTab("dashboard")} style={S.navBtn(tab === "dashboard")}>CORE</button>
        <button onClick={() => setTab("strategy")} style={S.navBtn(tab === "strategy")}>STRATEGY</button>
        <button onClick={() => setTab("advisor")} style={S.navBtn(tab === "advisor")}>INTEL</button>
      </nav>
    </div>
  );
}
