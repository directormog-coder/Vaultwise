import { useState } from "react";
import { supabase } from "../lib/supabase";
import { ACCENT_GREEN, BORDER, CARD_BG, BG_DARK } from "../data/constants";
import Logo from "./Logo"; // Make sure to create Logo.jsx as well!

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    setLoading(false);
  };

  const S = {
    container: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG_DARK, padding: 20 },
    box: { background: CARD_BG, border: `1px solid ${BORDER}`, padding: 40, borderRadius: 24, width: "100%", maxWidth: 400, textAlign: "center" },
    input: { width: "100%", padding: 14, marginBottom: 12, background: "#0A120C", border: `1px solid ${BORDER}`, borderRadius: 12, color: "#E8F0EA", fontFamily: "monospace" },
    btn: { width: "100%", padding: 14, background: ACCENT_GREEN, border: "none", borderRadius: 12, fontWeight: "bold", cursor: "pointer", marginTop: 10 }
  };

  return (
    <div style={S.container}>
      <div style={S.box} className="fade">
        <div style={{ marginBottom: 30, display: "flex", justifyContent: "center" }}>
          <Logo size={60} showText={false} />
        </div>
        
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 8 }}>
          {isSignUp ? "Create Vault" : "Secure Access"}
        </h2>
        <p style={{ color: "#3D6B4A", fontSize: 10, letterSpacing: 2, marginBottom: 30, textTransform: "uppercase" }}>
          Encryption Protocol Active
        </p>

        <form onSubmit={handleAuth}>
          <input style={S.input} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input style={S.input} type="password" placeholder="Master Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button style={S.btn} disabled={loading}>
            {loading ? "AUTHENTICATING..." : isSignUp ? "INITIALIZE VAULT" : "UNLOCK VAULT"}
          </button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: "none", border: "none", color: "#3D6B4A", marginTop: 20, fontSize: 11, cursor: "pointer", textDecoration: "underline" }}
        >
          {isSignUp ? "Already have a vault? Login" : "New here? Create your secure vault."}
        </button>
      </div>
    </div>
  );
}
