import { ACCENT_GREEN } from "../data/constants";

export default function Logo({ size = 40, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* The "Multiplier" Symbol - CSS Version */}
      <div style={{ 
        width: size, 
        height: size, 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img 
          src="/logo.png" 
          alt="Vaultwise Logo" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>
      
      {showText && (
        <span style={{ 
          fontFamily: "'DM Serif Display', serif", 
          fontSize: size * 0.6, 
          letterSpacing: 1,
          color: '#E8F0EA' 
        }}>
          VAULTWISE
        </span>
      )}
    </div>
  );
}
