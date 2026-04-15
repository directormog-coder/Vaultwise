import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Logo from "./components/Logo";
import { ACCENT_GREEN, BG_DARK, CARD_BG, BORDER } from "./data/constants";

export default function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Input states for the "Vault Entry"
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");

  // 1. Listen for Auth Changes (Login/Logout)
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

  // 2. Fetch Data from the 'finances' table
  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('finances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setRecords(data);
  };

  // 3. Save a new Record to the Vault
  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!amount) return;

    const { error } = await supabase
      .from('finances')
      .insert([{ 
        user_id: session.user.id, 
        amount: parseFloat(amount), 
        type: type 
      }]);

    if (!error) {
      setAmount("");
      fetchRecords();
    }
  };

  if (loading) return <div style={{ background: BG_DARK, height: '100vh' }} />;
  if (!session) return <Auth />;

  // UI Styles
  const S = {
    container: { background: BG_DARK, minHeight: "100vh", color: "#E8F0EA", padding: 20 },
    card: { background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 24, padding: 24, marginBottom: 20 },
    nav: { position: 'fixed', bottom: 20, left: 20, right: 20, display: 'flex', gap: 10, background: '#0A120C', padding: 10, borderRadius: 50, border: `1px solid ${BORDER}` },
    navBtn: (active) => ({ flex: 1, padding: 12, borderRadius: 40, border: 'none', background: active ? ACCENT_GREEN : 'transparent', color: active ? '#000' : '#3D6B4A', fontWeight: 'bold' }),
    input: { background: '#000', border: `1px solid ${BORDER}`, padding: 12, borderRadius: 12, color: ACCENT_GREEN, width: '100%', marginBottom: 10, fontSize: 18 }
  };

  return (
    <div style={S.container}>
      {/* Header with Logo */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <Logo size={28} />
        <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', border: 'none', color: '#3D6B4A' }}>LOGOUT</button>
      </header>

      {tab === "dashboard" && (
        <div className="fade">
          <h1 style={{ fontSize: 32, marginBottom: 4 }}>Vault Status</h1>
          <p style={{ color: '#3D6B4A', marginBottom: 30 }}>SYSTEM ACTIVE // USER_{session.user.email.split('@')[0].toUpperCase()}</p>

          <div style={S.card}>
            <p style={{ fontSize: 12, color: '#3D6B4A', marginBottom: 8 }}>TOTAL LIQUIDITY</p>
            <h2 style={{ fontSize: 48, color: ACCENT_GREEN }}>
              ${records.reduce((acc, r) => r.type === 'income' ? acc + r.amount : acc - r.amount, 0).toLocaleString()}
            </h2>
          </div>

          <form onSubmit={handleAddRecord} style={S.card}>
            <p style={{ fontSize: 12, color: '#3D6B4A', marginBottom: 15 }}>NEW VAULT ENTRY</p>
            <input 
              style={S.input} 
              type="number" 
              placeholder="0.00" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setType('income')} style={{ ...S.navBtn(type === 'income'), flex: 1 }}>INCOME</button>
              <button type="button" onClick={() => setType('expense')} style={{ ...S.navBtn(type === 'expense'), flex: 1 }}>EXPENSE</button>
            </div>
            <button type="submit" style={{ ...S.navBtn(true), width: '100%', marginTop: 15 }}>SECURE TRANSACTION</button>
          </form>
        </div>
      )}

      {/* Mobile Navigation */}
      <nav style={S.nav}>
        <button onClick={() => setTab("dashboard")} style={S.navBtn(tab === "dashboard")}>OS</button>
        <button onClick={() => setTab("ai")} style={S.navBtn(tab === "ai")}>ADVISOR</button>
      </nav>
    </div>
  );
}
