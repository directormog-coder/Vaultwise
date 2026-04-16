import React, { useState, useEffect, useRef } from "react";
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

  // --- AI & MESSAGING ---
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Sovereign Systems Online. Wage allocation engine ready.' }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

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

  // --- CALCULATIONS ---
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
  
  // Salary/Wage Surplus Logic
  const monthlySavings = records.filter(r => new Date(r.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((acc, r) => r.type === 'income' ? acc + r.amount : acc - r.amount, 0);
  
  const freedomProgress = totalDebtZAR() > 0 ? Math.max(0, 100 - (totalDebtZAR() / (totalAssetsZAR() || 1) * 100)) : 100;

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!amount) return;
    await supabase.from('finances').insert([{ user_id: session.user.id, amount: parseFloat(amount), type, currency: selectedCurrency }]);
    setAmount(""); fetchAllData();
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    await supabase.from('debts').insert([{ user_id: session.user.id, name: debtName, balance: parseFloat(debtBalance), interest_rate: parseFloat(debtInterest), minimum_payment: 0 }]);
    setDebtName(""); setDebtBalance(""); setDebtInterest(""); fetchAllData();
  };

  const askAdvisor = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const surplus = monthlySavings;
      const debt = totalDebtZAR();
      let strategy = `Monthly Surplus (Fuel): ${formatZAR(surplus)}. `;
      
      if (debt > 0 && surplus > 0) {
        const months = Math.ceil(debt / surplus);
        const priority = debts[0];
        strategy += `Freedom Path: You are ${months} months from R0 debt. Action: Channel R${(surplus * 0.8).toFixed(0)} of your current wage into '${priority.name}' to maximize interest savings.`;
      } else if (surplus <= 0) {
        strategy = "Alert: Your expenses are exceeding your wage. Total Freedom Plan paused until we increase velocity.";
      } else {
        strategy = "System Clean. You are operating in 100% Wealth Building mode.";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: strategy }]);
      setIsTyping(false);
    }, 1200);
  };

  const S = {
    container: { background: "#050806", minHeight: "100vh", color: "#E8F0EA", padding: "20px 20px 120px 20px" },
    card: { background: "#0D1410", border: `1px solid #1A2E22`, borderRadius: 28, padding: 24, marginBottom: 20 },
    label: { color: "#3D6B4A", fontSize: 9, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase", fontWeight: '900' },
    input: { background: '#000', border: `1px solid #1A2E22`, padding: 14, borderRadius: 16, color: ACCENT_GREEN, width: '100%', marginBottom: 10, outline: 'none', boxSizing: 'border-box' },
    nav: { position: 'fixed', bottom: 20, left: 20, right: 20, display: 'flex', gap: 10, background: 'rgba(5, 8, 6, 0.95)', backdropFilter: 'blur(15px)', padding: 10, borderRadius: 50, border: `1px solid #1A2E22` },
    navBtn: (active) => ({ flex: 1, padding: '15px 0', borderRadius: 40, border: 'none', background: active ? ACCENT_GREEN : 'transparent', color: active ? '#000' : '#3D6B4A', fontWeight: '900' }),
    bar: { height: 8, width: '100%', background: '#111', borderRadius: 4, overflow: 'hidden', marginTop: 10 }
  };

  if (loading) return <div style={{ background: "#050806", height: '100vh' }} />;
  if (!session) return <Auth onBiometric={() => alert("Secure Scan Active.")} />;

  return (
    <div style={S.container}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
        <Logo size={32} />
        <div style={{ textAlign: 'right' }}>
          <p style={S.label}>Debt Freedom</p>
          <span style={{ color: ACCENT_GREEN, fontSize: 20, fontWeight: 'bold' }}>{freedomProgress.toFixed(1)}%</span>
        </div>
      </header>

      {tab === "dashboard" && (
        <div className="fade">
          <div style={S.card}>
            <p style={S.label}>Freedom Progress Bar</p>
            <div style={S.bar}>
              <div style={{ width: `${freedomProgress}%`, background: ACCENT_GREEN, height: '100%' }} />
            </div>
            <p style={{ fontSize: 10, color: '#3D6B4A', marginTop: 8 }}>TARGET: R0 LIABILITIES</p>
          </div>

          <div style={S.card}>
            <p style={S.label}>True Net Position</p>
            <h2 style={{ fontSize: 44, color: ACCENT_GREEN, margin: 0 }}>{formatZAR(netWorth)}</h2>
          </div>

          <form onSubmit={handleAddRecord} style={S.card}>
            <p style={S.label}>Input Wage or Expense</p>
            <div style={{ marginBottom: 15 }}>
              {['ZAR', 'USD', 'BTC'].map(c => (
                <button type="button" key={c} onClick={() => setSelectedCurrency(c)} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid #1A2E22', background: selectedCurrency === c ? ACCENT_GREEN : '#000', color: selectedCurrency === c ? '#000' : ACCENT_GREEN, fontSize: 10, marginRight: 5, fontWeight: 'bold' }}>{c}</button>
              ))}
            </div>
            <input style={S.input} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setType('income')} style={S.navBtn(type === 'income')}>+ INCOME</button>
              <button type="button" onClick={() => setType('expense')} style={S.navBtn(type === 'expense')}>- EXPENSE</button>
            </div>
          </form>
        </div>
      )}

      {tab === "strategy" && (
        <div className="fade">
          <h2 style={{ fontSize: 28, marginBottom: 20 }}>Debt-Exit Strategy</h2>
          {debts.map(d => (
            <div key={d.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontWeight: 'bold' }}>{d.name}</span>
                <span style={{ color: '#ff4444' }}>{formatZAR(d.balance)}</span>
              </div>
              <p style={{ fontSize: 11, color: '#3D6B4A', margin: 0 }}>Interest: {d.interest_rate}% // Monthly Cost: {formatZAR(d.balance * (d.interest_rate/100/12))}</p>
            </div>
          ))}
          
          <form onSubmit={handleAddDebt} style={S.card}>
            <p style={S.label}>Register New Credit</p>
            <input style={S.input} placeholder="Name (e.g. Credit Card)" value={debtName} onChange={e => setDebtName(e.target.value)} />
            <input style={S.input} type="number" placeholder="Total Balance" value={debtBalance} onChange={e => setDebtBalance(e.target.value)} />
            <input style={S.input} type="number" placeholder="Interest %" value={debtInterest} onChange={e => setDebtInterest(e.target.value)} />
            <button type="submit" style={{ ...S.navBtn(true), width: '100%', background: '#ff4444' }}>LOCK LIABILITY</button>
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
            <input style={{ ...S.input, marginBottom: 0 }} placeholder="Query Freedom Plan..." value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={askAdvisor} style={{ ...S.navBtn(true), flex: '0 0 60px' }}>&rarr;</button>
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <button onClick={() => setTab("dashboard")} style={S.navBtn(tab === "dashboard")}>VAULT</button>
        <button onClick={() => setTab("strategy")} style={S.navBtn(tab === "strategy")}>STRATEGY</button>
        <button onClick={() => setTab("advisor")} style={S.navBtn(tab === "advisor")}>INTEL</button>
      </nav>
    </div>
  );
}
