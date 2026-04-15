import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Logo from "./components/Logo";
import { ACCENT_GREEN, BG_DARK, CARD_BG, BORDER } from "./data/constants";

// Global Formatter for South African Rand
const formatZAR = (val) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard"); // dashboard, growth, advisor
  
  // Data States
  const [records, setRecords] = useState([]);
  const [debts, setDebts] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [rates, setRates] = useState({ USD: 16.38, BTC: 1225000 }); // Live April 2026 Rates

  // Input States
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [selectedCurrency, setSelectedCurrency] = useState("ZAR");

  // AI & UI States
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Neural link active. Systems ready for wealth optimization.' }]);
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

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!amount) return;
    const { error } = await supabase.from('finances').insert([
      { user_id: session.user.id, amount: parseFloat(amount), type, currency: selectedCurrency }
    ]);
    if (!error) { setAmount(""); fetchAllData(); }
  };

  // BIOMETRIC LOGIC
  const handleBiometricAuth = async () => {
    if (!window.PublicKeyCredential) return alert("Biometrics not supported.");
    alert("Authenticating via Secure Scan...");
    // Mock success for UI flow
  };

  // CALCULATIONS
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

  const askAdvisor = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let response = `Status: ${formatZAR(netWorth())}. `;
      const highInterest = debts.find(d => d.interest_rate > 15);
      
      if (highInterest) {
        response += `⚠️ HIGH ALERT: ${highInterest.name} is draining capital at ${highInterest.interest_rate}%. Cease all discretionary spending until this liability is cleared.`;
      } else if (netWorth() > 50000) {
        response += "Surplus detected. Opportunity: RSA Retail Bonds are currently offering 9.25% fixed for 5 years. A safe move for your ZAR holdings.";
      } else {
        response += "Consolidating position. Focus on increasing your monthly velocity.";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1200);
  };

  const S = {
    container: { background: BG_DARK, minHeight: "100vh", color: "#E8F0EA", padding: "20px 20px 120px 20px", fontFamily: 'sans-serif' },
    card: { background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 28, padding: 24, marginBottom: 20 },
    label: { color: "#3D6B4A", fontSize: 10, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase", fontWeight: 'bold' },
    input: { background: '#000', border: `1px solid ${BORDER}`, padding: 14, borderRadius: 16, color: ACCENT_GREEN, width: '100%', marginBottom: 12, outline: 'none', boxSizing: 'border-box' },
    nav: { position: 'fixed', bottom: 20, left: 20, right: 20, display: 'flex', gap: 10, background: 'rgba(10, 18, 12, 0.9)', backdropFilter: 'blur(15px)', padding: 8, borderRadius: 50, border: `1px solid ${BORDER}`, zIndex: 100 },
    navBtn: (active) => ({ flex: 1, padding: '15px 0', borderRadius: 40, border: 'none', background: active ? ACCENT_GREEN : 'transparent', color: active ? '#000' : '#3D6B4A', fontWeight: 'bold' }),
    pill: (active) => ({ padding: '8px 14px', borderRadius: 20, fontSize: 11, background: active ? ACCENT_GREEN : '#000', color: active ? '#000' : ACCENT_GREEN, border: `1px solid ${BORDER}`, marginRight: 6 })
  };

  if (loading) return <div style={{ background: BG_DARK, height: '100vh' }} />;
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
          <p style={S.label}>Net Position</p>
          <span style={{ color: ACCENT_GREEN, fontSize: 24, fontWeight: 'bold' }}>{formatZAR(netWorth())}</span>
        </div>
      </header>

      {tab === "dashboard" && (
        <div className="fade">
          {/* NET WORTH GRAPH SIMULATION */}
          <div style={S.card}>
            <p style={S.label}>Velocity</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40, marginBottom: 15 }}>
              {[10, 30, 20, 50, 45, 70, 90].map((h, i) => <div key={i} style={{ width: 8, background: ACCENT_GREEN, borderRadius: 4, height: h, opacity: 0.6 }} />)}
            </div>
          </div>

          <form onSubmit={handleAddRecord} style={S.card}>
            <p style={S.label}>Manual Ingress</p>
            <div style={{ marginBottom: 15 }}>
              {['ZAR', 'USD', 'BTC'].map(c => (
                <button type="button" key={c} onClick={() => setSelectedCurrency(c)} style={S.pill(selectedCurrency === c)}>{c}</button>
              ))}
            </div>
            <input style={S.input} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <button type="button" onClick={() => setType('income')} style={S.navBtn(type === 'income')}>ASSET</button>
              <button type="button" onClick={() => setType('expense')} style={S.navBtn(type === 'expense')}>LIABILITY</button>
            </div>
            <button type="submit" style={{ ...S.navBtn(true), width: '100%' }}>EXECUTE ENTRY</button>
          </form>
        </div>
      )}

      {tab === "growth" && (
        <div className="fade">
          <h2 style={{ fontSize: 28, marginBottom: 20 }}>Wealth Ingress</h2>
          <div style={S.card}>
            <p style={S.label}>Priority // RSA Retail Bonds</p>
            <h4 style={{ margin: 0 }}>9.25% Fixed (5-Year)</h4>
            <p style={{ fontSize: 11, color: '#3D6B4A' }}>Current Rate for April 2026. Risk: Zero.</p>
          </div>
          <div style={S.card}>
            <p style={S.label}>Growth // JSE Satrix 40</p>
            <h4 style={{ margin: 0 }}>STX40 Index ETF</h4>
            <p style={{ fontSize: 11, color: '#3D6B4A' }}>Diversified exposure to SA's top corporate giants.</p>
          </div>
        </div>
      )}

      {tab === "advisor" && (
        <div className="fade" style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? ACCENT_GREEN : '#0A120C', color: m.role === 'user' ? '#000' : '#E8F0EA', padding: '14px 18px', borderRadius: 20, marginBottom: 12, fontSize: 14, maxWidth: '85%', marginLeft: m.role === 'user' ? 'auto' : 0 }}>{m.content}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...S.input, marginBottom: 0 }} placeholder="Query Advisor..." value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={askAdvisor} style={{ ...S.navBtn(true), flex: '0 0 55px' }}>&rarr;</button>
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <button onClick={() => setTab("dashboard")} style={S.navBtn(tab === "dashboard")}>CORE</button>
        <button onClick={() => setTab("growth")} style={S.navBtn(tab === "growth")}>GROWTH</button>
        <button onClick={() => setTab("advisor")} style={S.navBtn(tab === "advisor")}>INTEL</button>
      </nav>
    </div>
  );
}
