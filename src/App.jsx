import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Logo from "./components/Logo";
import { ACCENT_GREEN, BG_DARK, CARD_BG, BORDER } from "./data/constants";

const formatZAR = (val) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val);

export default function App() {
  // --- SYSTEM STATES ---
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard"); 
  
  // --- DATA STATES ---
  const [records, setRecords] = useState([]);
  const [debts, setDebts] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [rates] = useState({ USD: 18.42, BTC: 1250000 });

  // --- INPUT STATES ---
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [selectedCurrency, setSelectedCurrency] = useState("ZAR");
  const [debtName, setDebtName] = useState("");
  const [debtBalance, setDebtBalance] = useState("");
  const [debtInterest, setDebtInterest] = useState("");

  // --- AI & UX ---
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Sovereign Ultra Online. Analyzing wage velocity for maximum debt-crushing.' }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // --- PERFORMANCE: REAL-TIME SYNC ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      setLoading(false);
    });

    // Real-time listener: App updates instantly if data changes in the DB
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchAllData())
      .subscribe();

    return () => supabase.removeChannel(channel);
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

  // --- MEMOIZED CALCULATIONS (Ultra Performance) ---
  const { netWorth, totalDebt, surplus, freedomProgress } = useMemo(() => {
    const cash = records.reduce((acc, r) => {
      let val = r.amount;
      if (r.currency === 'USD') val *= rates.USD;
      if (r.currency === 'BTC') val *= rates.BTC;
      return r.type === 'income' ? acc + val : acc - val;
    }, 0);
    const invested = investments.reduce((acc, i) => acc + (i.current_valuation || i.initial_amount), 0);
    const dTotal = debts.reduce((acc, d) => acc + d.balance, 0);
    
    const sMonthly = records.filter(r => new Date(r.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((acc, r) => r.type === 'income' ? acc + r.amount : acc - r.amount, 0);

    const progress = dTotal > 0 ? Math.max(0, 100 - (dTotal / (cash + invested + dTotal) * 100)) : 100;

    return { netWorth: (cash + invested) - dTotal, totalDebt: dTotal, surplus: sMonthly, freedomProgress: progress };
  }, [records, debts, investments, rates]);

  // --- ACTIONS ---
  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!amount) return;
    await supabase.from('finances').insert([{ user_id: session.user.id, amount: parseFloat(amount), type, currency: selectedCurrency }]);
    setAmount("");
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    await supabase.from('debts').insert([{ user_id: session.user.id, name: debtName, balance: parseFloat(debtBalance), interest_rate: parseFloat(debtInterest), minimum_payment: 0 }]);
    setDebtName(""); setDebtBalance(""); setDebtInterest("");
  };

  const askAdvisor = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let strategy = "";
      if (totalDebt > 0 && surplus > 0) {
        const months = Math.ceil(totalDebt / surplus);
        strategy = `STRATEGY: Using your R${surplus} surplus, we can liquidate all debt in ${months} months. Prioritize '${debts[0].name}' to save on compounding interest.`;
      } else if (surplus <= 0) {
        strategy = "URGENT: Negative velocity detected. We must identify and cut non-essential debits to fuel the Freedom Plan.";
      } else {
        strategy = "VAULT SECURE: Debt-free status confirmed. Recommend transitioning 25% of surplus to RSA Retail Bonds.";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: strategy }]);
      setIsTyping(false);
    }, 1000);
  };

  const S = {
    container: { background: "#050806", minHeight: "100vh", color: "#E8F0EA", padding: "20px 20px 120px 20px" },
    card: { background: "#0D1410", border: `1px solid #1A2E22`, borderRadius: 28, padding: 24, marginBottom: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
    label: { color: "#3D6B4A", fontSize: 9, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase", fontWeight: '900' },
    input: { background: '#000', border: `1px solid #1A2E22`, padding: 14, borderRadius: 16, color: ACCENT_GREEN, width: '100%', marginBottom: 10, outline: 'none', boxSizing: 'border-box' },
    nav: { position: 'fixed', bottom: 20, left: 20, right: 20, display: 'flex', gap: 10, background: 'rgba(5, 8, 6, 0.98)', backdropFilter: 'blur(15px)', padding: 10, borderRadius: 50, border: `1px solid #1A2E22`, zIndex: 100 },
    navBtn: (active) => ({ flex: 1, padding: '15px 0', borderRadius: 40, border: 'none', background: active ? ACCENT_GREEN : 'transparent', color: active ? '#000' : '#3D6B4A', fontWeight: '900' }),
    bar: { height: 10, width: '100%', background: '#111', borderRadius: 5, overflow: 'hidden', marginTop: 10 }
  };

  if (loading) return <div style={{ background: "#050806", height: '100vh' }} />;
  if (!session) return <Auth onBiometric={() => alert("Secure Scan Ready.")} />;

  return (
    <div style={S.container}>
      {/* PERFORMANCE TICKER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ fontSize: 10, color: '#3D6B4A' }}>USD/ZAR: R{rates.USD}</span>
        <span style={{ fontSize: 10, color: '#3D6B4A' }}>BTC/ZAR: R{(rates.BTC/1000).toFixed(0)}k</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT_GREEN }}></div>
          <span style={{ fontSize: 10, color: ACCENT_GREEN }}>LIVE_SYNC</span>
        </div>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
        <Logo size={32} />
        <div style={{ textAlign: 'right' }}>
          <p style={S.label}>Freedom Velocity</p>
          <span style={{ color: ACCENT_GREEN, fontSize: 20, fontWeight: 'bold' }}>{freedomProgress.toFixed(1)}%</span>
        </div>
      </header>

      {tab === "dashboard" && (
        <div className="fade">
          <div style={S.card}>
            <p style={S.label}>Freedom Progress</p>
            <div style={S.bar}>
              <div style={{ width: `${freedomProgress}%`, background: ACCENT_GREEN, height: '100%', transition: '1s ease-in-out' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
               <span style={{ fontSize: 10, color: '#3D6B4A' }}>DEBT: {formatZAR(totalDebt)}</span>
               <span style={{ fontSize: 10, color: ACCENT_GREEN }}>NET: {formatZAR(netWorth)}</span>
            </div>
          </div>

          <form onSubmit={handleAddRecord} style={S.card}>
            <p style={S.label}>Entry Protocol</p>
            <div style={{ marginBottom: 15, display: 'flex', gap: 5 }}>
              {['ZAR', 'USD', 'BTC'].map(c => (
                <button type="button" key={c} onClick={() => setSelectedCurrency(c)} style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid #1A2E22', background: selectedCurrency === c ? ACCENT_GREEN : '#000', color: selectedCurrency === c ? '#000' : ACCENT_GREEN, fontSize: 10, fontWeight: 'bold' }}>{c}</button>
              ))}
            </div>
            <input style={S.input} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setType('income')} style={S.navBtn(type === 'income')}>+ INCOME</button>
              <button type="button" onClick={() => setType('expense')} style={S.navBtn(type === 'expense')}>- DEBIT</button>
            </div>
          </form>
        </div>
      )}

      {tab === "strategy" && (
        <div className="fade">
          <h2 style={{ fontSize: 26, marginBottom: 20 }}>The Freedom Plan</h2>
          {debts.map(d => (
            <div key={d.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>{d.name}</span>
                <span style={{ color: '#ff4444' }}>{formatZAR(d.balance)}</span>
              </div>
              <p style={{ fontSize: 11, color: '#3D6B4A', marginTop: 5 }}>Cost of Debt: {d.interest_rate}% APY</p>
            </div>
          ))}
          
          <form onSubmit={handleAddDebt} style={S.card}>
            <p style={S.label}>Register Liability</p>
            <input style={S.input} placeholder="Name (e.g. Loan)" value={debtName} onChange={e => setDebtName(e.target.value)} />
            <input style={S.input} type="number" placeholder="Balance" value={debtBalance} onChange={e => setDebtBalance(e.target.value)} />
            <input style={S.input} type="number" placeholder="Interest %" value={debtInterest} onChange={e => setDebtInterest(e.target.value)} />
            <button type="submit" style={{ ...S.navBtn(true), width: '100%', background: '#ff4444' }}>LOCK DEBT</button>
          </form>
        </div>
      )}

      {tab === "advisor" && (
        <div className="fade" style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? ACCENT_GREEN : '#0D1410', color: m.role === 'user' ? '#000' : '#E8F0EA', padding: '15px', borderRadius: 24, marginBottom: 12, fontSize: 14, maxWidth: '85%', marginLeft: m.role === 'user' ? 'auto' : 0, border: m.role === 'assistant' ? `1px solid #1A2E22` : 'none' }}>{m.content}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...S.input, marginBottom: 0 }} placeholder="Analyze Wealth Path..." value={input} onChange={(e) => setInput(e.target.value)} />
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
