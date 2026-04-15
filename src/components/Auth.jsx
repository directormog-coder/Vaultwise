import { useState } from "react";
import { supabase } from "../lib/supabase";
import { ACCENT_GREEN, BORDER, CARD_BG, BG_DARK } from "../data/constants";
import Logo from "./Logo";

export default function Auth({ onBiometric }) {
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

    if (error) {
      alert("VAULT ERROR: " + error.message);
    }
    setLoading(false);
  };

  const S = {
    container: { 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      background: BG_DARK, 
      padding: 20 
    },
    box: { 
      background: CARD_BG, 
      border: `1px solid ${BORDER}`, 
      padding: "40px 30px", 
      borderRadius: 32, 
      width: "100%", 
      maxWidth: 400, 
      textAlign: "center",
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
    },
    input: { 
      width: "100%", 
      padding: 16, 
      marginBottom: 12, 
      background: "#000", 
      border: `1px solid ${BORDER}`, 
      borderRadius: 16, 
      color: "#E8F0EA", 
      fontSize: 16,
      outline: 'none',
      boxSizing: 'border-box'
    },
    btn: { 
      width: "100%", 
      padding: 16, 
      background: ACCENT_GREEN, 
      border: "none", 
      borderRadius: 16, 
      fontWeight: "900", 
      letterSpacing: 1,
      cursor: "pointer", 
      marginTop: 10,
      color: "#000",
      fontSize: 14
    },
    bioBtn: {
      width: "100%",
      padding: 14,
      background: "transparent",
      border: `1px solid ${ACCENT_GREEN}`,
      borderRadius: 16,
      color: ACCENT_GREEN,
      marginTop: 15,
      fontSize: 12,
      fontWeight: "bold",
      cursor: "pointer",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8
    }
  };

  return (
    <div style={S.container}>
      <div style={S.box} className="fade">
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
          <Logo size={60} showText={false} />
        </div>
        
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, marginBottom: 8 }}>
          {isSignUp ? "Initialize Vault" : "Secure Access"}
        </h2>
        <p style={{ color: "#3D6B4A", fontSize: 10, letterSpacing: 2, marginBottom: 32, textTransform: "uppercase" }}>
          Encryption Protocol v2.6
        </p>

        <form onSubmit={handleAuth}>
          <input 
            style={S.input} 
            type="email" 
            placeholder="Identity (Email)" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            style={S.input} 
            type="password" 
            placeholder="Access Key" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button style={S.btn} disabled={loading}>
            {loading ? "VERIFYING..." : isSignUp ? "CREATE NEW VAULT" : "UNLOCK TERMINAL"}
          </button>
        </form>

        {/* --- BIOMETRIC UPGRADE --- */}
        {!isSignUp && (
          <button onClick={onBiometric} style={S.bioBtn}>
            <span style={{ fontSize: 18 }}>⊙</span> BIOMETRIC UNLOCK
          </button>
        )}

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ 
            background: "none", 
            border: "none", 
            color: "#3D6B4A", 
            marginTop: 25, 
            fontSize: 11, 
            cursor: "pointer", 
            textDecoration: "underline" 
          }}
        >
          {isSignUp ? "EXISTING USER? LOGIN" : "NEW ENTITY? INITIALIZE ACCOUNT"}
        </button>
      </div>
    </div>
  );
}
