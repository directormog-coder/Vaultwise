import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Logo from "./components/Logo";
import { ACCENT_GREEN, BG_DARK, CARD_BG, BORDER } from "./data/constants";

const formatCurrency = (val) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val);

export default function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [records, setRecords] = useState([]);
  const [debts, setDebts] = useState([]);
  const [rates, setRates] = useState({ USD: 18.50, BTC: 1250000 });
  
  // States for Debt Input
  const [debtName, setDebtName] = useState("");
  const [debtBalance, setDebtBalance] = useState("");
  const [debtInterest, setDebtInterest] = useState("");

  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Neural link active. Analyzing debt-to-wealth ratio...' }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { fetchRecords(); fetchDebts(); }
    });
  }, []);

  const fetchRecords = async () => {
    const { data } = await supabase.from('finances').select('*').order('created_at', { ascending: false });
    setRecords(data || []);
  };

  const fetchDebts = async () => {
    const { data } = await supabase.from('debts').select('*').order('interest_rate', { ascending: false });
    setDebts(data || []);
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('debts').insert([{ 
      user_id: session.user.id, name: debtName, balance: parseFloat(debtBalance), interest_rate: parseFloat(debtInterest), minimum_payment: 0 
    }]);
    if (!error) { setDebtName(""); setDebtBalance(""); setDebtInterest(""); fetchDebts(); }
  };

  const calculateNetWorth = () => {
    const assets = records.reduce((acc, r) => r.type === 'income' ? acc + (r.currency === 'USD' ? r.amount * rates.USD : r.amount) : acc - (r.type === 'expense' ? r.amount : 0), 0);
    const totalDebt = debts.reduce((acc, d) => acc + d.balance, 0);
    return assets - totalDebt;
  };

  const askAdvisor = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput("");
    setIsTyping(true);

    const netWorth = calculateNetWorth();
    const highInterestDebt = debts.find(d => d.interest_rate > 15);

    setTimeout(() => {
      let advice = `Net Position: ${formatCurrency(netWorth)}. `;
      if (highInterestDebt) {
        advice += `⚠️ URGENT: Your '${highInterestDebt.name}' has a ${highInterestDebt.interest_rate}% interest rate. This is "toxic capital." Secure R${(highInterestDebt.balance * 0.1).toFixed(0)} this month to initiate an early settlement before we move to investments.`;
      } else if (netWorth > 0) {
        advice += "Credit cleared. Transitioning to 'Wealth Ingress' mode. I suggest allocating 15% to high-yield ZAR dividends.";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: advice }]);
      setIsTyping(false);
    }, 1200);
  };

  if (!session) return <Auth />;

  const S = {
    container: { background: BG_DARK, minHeight: "100vh", color: "#E8F0EA", padding: "20px 20px 120px 20px" },
    card: { background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 28, padding: 24, marginBottom: 20 },
    label: { color: "#3D6B4A", fontSize: 10, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" },
    input: { background: '#000', border: `1px solid ${BORDER}`, padding: 14, borderRadius: 16, color: ACCENT_GREEN, width: '100%', marginBottom: 10, outline: 'none', boxSizing: 'border-box' },
    nav: { position: 'fixed', bottom: 20, left: 20, right: 20, display: 'flex', gap: 10, background: 'rgba(10, 18, 12, 0.8)', backdropFilter: 'blur(10px)', padding: 8, borderRadius: 50, border: `1px solid ${BORDER}` },
    navBtn: (active) => ({ flex: 1, padding: '15px 0', borderRadius: 40, border: 'none', background: active ? ACCENT_GREEN : 'transparent', color: active ? '#000' : '#3D6B4A', fontWeight: 'bold' }),
    debtPill: { background: '#1A0A0C', border: '1px solid #441111', padding: 12, borderRadius: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }
  };

  return (
    <div style={S.container}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
        <Logo size={32} />
        <span style={{ fontSize: 10, color: ACCENT_GREEN }}>STATUS: DEBT SETTLEMENT MODE</span>
      </header>

      {tab === "dashboard" && (
        <div className="fade">
          <div style={S.card}>
            <p style={S.label}>True Net Worth (Assets - Credit)</p>
            <h2 style={{ fontSize: 42, color: ACCENT_GREEN, margin: 0 }}>{formatCurrency(calculateNetWorth())}</h2>
          </div>

          <div style={S.card}>
            <p style={S.label}>Credit Eradication List</p>
            {debts.map(d => (
              <div key={d.id} style={S.debtPill}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 'bold' }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: '#ff4444' }}>Interest: {d.interest_rate}%</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14 }}>{formatCurrency(d.balance)}</div>
                </div>
              </div>
            ))}
            <form onSubmit={handleAddDebt} style={{ marginTop: 20 }}>
              <p style={S.label}>Register New Credit</p>
              <input style={S.input} placeholder="Liability Name" value={debtName} onChange={e => setDebtName(e.target.value)} />
              <input style={S.input} type="number" placeholder="Total Balance" value={debtBalance} onChange={e => setDebtBalance(e.target.value)} />
              <input style={S.input} type="number" placeholder="Interest %" value={debtInterest} onChange={e => setDebtInterest(e.target.value)} />
              <button type="submit" style={{ ...S.navBtn(true), width: '100%', background: '#ff4444' }}>REGISTER DEBT</button>
            </form>
          </div>
        </div>
      )}

      {tab === "advisor" && (
        <div className="fade" style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? ACCENT_GREEN : '#0A120C', color: m.role === 'user' ? '#000' : '#E8F0EA', padding: '14px 18px', borderRadius: 20, marginBottom: 12, fontSize: 14, maxWidth: '85%', marginLeft: m.role === 'user' ? 'auto' : 0 }}>{m.content}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...S.input, marginBottom: 0 }} placeholder="Request Debt-Exit Strategy..." value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={askAdvisor} style={{ ...S.navBtn(true), flex: '0 0 55px' }}>&rarr;</button>
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <button onClick={() => setTab("dashboard")} style={S.navBtn(tab === "dashboard")}>CORE</button>
        <button onClick={() => setTab("advisor")} style={S.navBtn(tab === "advisor")}>STRATEGY</button>
      </nav>
    </div>
  );
}
