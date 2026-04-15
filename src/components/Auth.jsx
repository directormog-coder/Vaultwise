import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { BORDER, CARD_BG, ACCENT_GREEN, BG_DARK } from '../data/constants'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) alert(error.message)
    else if (isSignUp) alert('Check your email for the confirmation link!')
    setLoading(false)
  }

  const styles = {
    container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG_DARK, padding: '20px' },
    card: { background: CARD_BG, border: `1px solid ${BORDER}`, padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center' },
    input: { width: '100%', background: '#0A120C', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '14px', color: '#E8F0EA', marginBottom: '16px', outline: 'none', fontFamily: 'monospace' },
    button: { width: '100%', background: ACCENT_GREEN, color: '#000', border: 'none', borderRadius: '12px', padding: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '1px' },
    toggle: { marginTop: '20px', color: '#3D6B4A', fontSize: '12px', cursor: 'pointer', fontFamily: 'monospace', textDecoration: 'underline' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card} className="fade">
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', marginBottom: '8px' }}>Vaultwise</h1>
        <p style={{ color: '#3D6B4A', fontSize: '10px', letterSpacing: '2px', marginBottom: '30px', textTransform: 'uppercase' }}>Secure your financial future</p>
        
        <form onSubmit={handleAuth}>
          <input style={styles.input} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button style={styles.button} disabled={loading}>
            {loading ? 'PROCESSING...' : isSignUp ? 'CREATE ACCOUNT' : 'SECURE LOGIN'}
          </button>
        </form>

        <div style={styles.toggle} onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have a vault? Log in' : 'New here? Create your secure vault'}
        </div>
      </div>
    </div>
  )
}