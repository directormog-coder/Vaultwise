import { useState, useEffect, useRef } from "react";
// Import our database client
import { supabase } from "./lib/supabase";
// Import the Login component
import Auth from "./components/Auth";
// Import all our data from the constants file
import { 
  TABS, 
  WORLD_INSIGHTS, 
  HABITS, 
  DIGITAL_IDEAS, 
  PLAYBOOK, 
  PRINCIPLES,
  ACCENT_GREEN,
  ACCENT_RED,
  ACCENT_GOLD,
  BG_DARK,
  CARD_BG,
  BORDER 
} from "./data/constants";

export default function App() {
  // --- 1. SESSION & AUTH LOGIC ---
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 2. APP STATES ---
  const [tab, setTab] = useState("dashboard");
  const [mode, setMode] = useState("happy");
  const [goals, setGoals] = useState([
    { id: 1, title: "Emergency Fund (3 months)", target: 5000, current: 1200, category: "safety" },
    { id: 2, title: "Launch First Digital Product", target: 1, current: 0, category: "asset" },
    { id: 3, title: "Rental Property Down Payment", target: 20000, current: 3000, category: "property" },
  ]);
  const [habits, setHabits] = useState({});
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [assets, setAssets] = useState("");
  const [liabilities, setLiabilities] = useState("");
  const [calcResult, setCalcResult] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeFoundation, setActiveFoundation] = useState(null);
  const [activeInvestment, setActiveInvestment] = useState(null);
  const [worldIndex, setWorldIndex] = useState(0);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [digitalExpanded, setDigitalExpanded] = useState(false);
  const chatEndRef = useRef(null);

  const accent = mode === "happy" ? ACCENT_GREEN : ACCENT_RED;

  // --- 3. HELPER FUNCTIONS ---
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const toggleHabit = (id) => {
    const key = `${id}_${new Date().toDateString()}`;
    setHabits(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const isHabitDone = (id) => !!habits[`${id}_${new Date().toDateString()}`];
  const habitScore = HABITS.filter(h => isHabitDone(h.id)).length;

  const calculate = () => {
    const inc = parseFloat(income) || 0;
    const exp = parseFloat(expenses) || 0;
    const ast = parseFloat(assets) || 0;
    const lib = parseFloat(liabilities) || 0;
    const net = inc - exp;
    const netWorth = ast - lib;
    const savingsRate = inc > 0 ? Math.round((net / inc) * 100) : 0;
    
    let status, statusColor, advice;
    if (net < 0) { 
        status = "Critical"; statusColor = "#FF4444"; 
        advice = ["Stop all non-essential spending", "Find extra income", "Negotiate debt"]; 
    } else if (savingsRate < 10) { 
        status = "Surviving"; statusColor = ACCENT_RED; 
        advice = ["Target 20% savings", "Start a digital product"]; 
    } else { 
        status = "Thriving"; statusColor = ACCENT_GREEN; 
        advice = ["Deploy surplus into assets"]; 
    }
    setCalcResult({ net, netWorth, savingsRate, status, statusColor, advice, inc, exp, ast, lib });
  };

  const sendToAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    setAiMessages(prev => [...prev, { role: "user", content: aiInput }]);
    setAiInput("");
    setAiLoading(true);
    setTimeout(() => {
      setAiMessages(prev => [...prev, { role: "assistant", content: "AI Advisor is ready. Connect your API keys in the .env file to enable live intelligence." }]);
      setAiLoading(false);
    }, 1000);
  };

  // --- 4. STYLING ---
  const S = {
    app: { minHeight: "100vh", background: BG_DARK, color: "#E8F0EA", fontFamily: "'DM Serif Display', serif", paddingBottom: 88 },
    card: { background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "18px 20px", marginBottom: 14 },
    label: { fontSize: 9, letterSpacing: 3, color: "#3D6B4A", fontFamily: "monospace", textTransform: "uppercase" },
    input: { width: "100%", background: "#0A120C", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "13px 16px", color: "#E8F0EA", fontFamily: "monospace", fontSize: 14, outline: "none", marginTop: 6 },
    btn: (c) => ({ background: c || accent, color: "#000", border: "none", borderRadius: 12, padding: "14px 20px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, cursor: "pointer", width: "100%" }),
    sec: { padding: "0 20px" },
    h2: { fontSize: "32px", fontWeight: 400, color: "#E8F0EA", lineHeight: 1.1, marginBottom: 6 },
  };

  // --- 5. THE GATEKEEPER RENDER ---
  if (!session) {
    return <Auth />;
  }

  // --- 6. MAIN DASHBOARD RENDER ---
  return (
    <div style={S.app} className="fade">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .fade{animation:fadeUp 0.3s ease}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "36px 20px 20px" }}>
        <div style={S.label}>VAULTWISE · {new Date().toLocaleDateString()}</div>
        <h1 style={S.h2}>
          {mode === "happy" ? <>Your wealth,<br /><em style={{ color: accent }}>multiplying.</em></> : <>Tough times,<br /><em style={{ color: accent }}>temporary.</em></>}
        </h1>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => setMode("happy")} style={{ flex: 1, padding: 10, borderRadius: 12, border: `1px solid ${mode === "happy" ? accent : BORDER}`, background: mode === "happy" ? `${accent}12` : "transparent", color: mode === "happy" ? accent : "#3D6B4A" }}>🌟 Thriving</button>
          <button onClick={() => setMode("challenging")} style={{ flex: 1, padding: 10, borderRadius: 12, border: `1px solid ${mode === "challenging" ? accent : BORDER}`, background: mode === "challenging" ? `${accent}12` : "transparent", color: mode === "challenging" ? accent : "#3D6B4A" }}>🌊 Surviving</button>
        </div>
      </div>

      {/* CONTENT SECTIONS */}
      <div style={S.sec}>
        {tab === "dashboard" && (
          <div className="fade">
            <div style={{ ...S.card, background: `${accent}0A` }}>
              <div style={S.label}>Global Insight</div>
              <div style={{ fontSize: 18, margin: "10px 0" }}>{WORLD_INSIGHTS[worldIndex].region}</div>
              <p style={{ fontSize: 12, color: "#6A9A7A" }}>{WORLD_INSIGHTS[worldIndex].tip}</p>
            </div>
          </div>
        )}
        {/* Other sections (calculator, goals, etc.) would go here */}
      </div>

      {/* BOTTOM NAVIGATION */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#060A07", borderTop: `1px solid ${BORDER}`, display: "flex", padding: "10px 0 18px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 13, color: tab === t.id ? accent : "#2A4030" }}>{t.icon}</span>
            <span style={{ fontSize: 7, fontFamily: "monospace", color: tab === t.id ? accent : "#2A4030" }}>{t.label}</span>
          </button>
        ))}
      </div>
      
      {/* Logout Button (Hidden in bottom of Playbook or Dashboard) */}
      <button 
        onClick={() => supabase.auth.signOut()} 
        style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: `1px solid ${BORDER}`, color: '#3D6B4A', fontSize: 8, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}
      >
        LOCK VAULT (LOGOUT)
      </button>
    </div>
  );
}