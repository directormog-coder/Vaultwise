import { ACCENT_GREEN } from "../data/constants";

export default function Logo({ size = 32, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: size, height: size }}>
        <img 
          src="/logo.png" 
          alt="Vaultwise" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>
      {showText && (
        <span style={{ 
          fontFamily: "'DM Serif Display', serif", 
          fontSize: size * 0.7, 
          color: '#E8F0EA',
          letterSpacing: 0.5
        }}>
          Vaultwise
        </span>
      )}
    </div>
  );
}
