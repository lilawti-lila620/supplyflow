import { formatBps } from '../lib/format';

// The signature visual of the product: one buyer payment entering a Soroban
// contract and fanning out atomically to every stakeholder, each stamped
// with their locked-in share. Reused on the landing hero (with sample data)
// and on manifest detail pages (with the real, on-chain split).
export default function SplitManifestDiagram({ stakeholders, settled = false, animate = true }) {
  const n = stakeholders.length;
  const width = 720;
  const height = Math.max(260, n * 74 + 60);
  const contractX = width * 0.46;
  const stakeholderX = width - 190;
  const topPad = 40;
  const rowGap = (height - topPad * 2) / Math.max(n - 1, 1);

  const rows = stakeholders.map((s, i) => ({
    ...s,
    y: n === 1 ? height / 2 : topPad + i * rowGap,
  }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Payment split diagram">
      <defs>
        <marker id="dot" markerWidth="6" markerHeight="6" refX="3" refY="3">
          <circle cx="3" cy="3" r="2.5" fill="#E8A33D" />
        </marker>
      </defs>

      {/* Buyer node */}
      <g>
        <rect x="16" y={height / 2 - 34} width="150" height="68" rx="10" fill="#111C2E" stroke="#26334A" />
        <text x="91" y={height / 2 - 6} textAnchor="middle" fontFamily="Space Grotesk" fontSize="13" fill="#C7D0DE" fontWeight="600">
          Buyer
        </text>
        <text x="91" y={height / 2 + 14} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill="#8792A3">
          sends payment
        </text>
      </g>

      {/* Contract line */}
      <line
        x1="166"
        y1={height / 2}
        x2={contractX - 60}
        y2={height / 2}
        stroke="#E8A33D"
        strokeWidth="2"
        className={animate ? 'flow-line' : ''}
        markerEnd="url(#dot)"
      />

      {/* Contract stamp node */}
      <g>
        <rect
          x={contractX - 60}
          y={height / 2 - 44}
          width="120"
          height="88"
          rx="12"
          fill="#0B1220"
          stroke="#3FA796"
          strokeWidth="1.5"
        />
        <text x={contractX} y={height / 2 - 14} textAnchor="middle" fontFamily="Space Grotesk" fontWeight="700" fontSize="12" fill="#3FA796">
          SOROBAN
        </text>
        <text x={contractX} y={height / 2 + 3} textAnchor="middle" fontFamily="Space Grotesk" fontWeight="700" fontSize="12" fill="#F5F1E8">
          MANIFEST
        </text>
        <text x={contractX} y={height / 2 + 22} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#8792A3">
          {settled ? 'atomic split ✓' : 'shares locked'}
        </text>
      </g>

      {/* Fan-out lines + stakeholder nodes */}
      {rows.map((s, i) => (
        <g key={i}>
          <path
            d={`M ${contractX + 60} ${height / 2} C ${contractX + 110} ${height / 2}, ${stakeholderX - 60} ${s.y}, ${stakeholderX - 10} ${s.y}`}
            fill="none"
            stroke={settled ? '#3FA796' : '#E8A33D'}
            strokeWidth="2"
            className={animate ? 'flow-line' : ''}
            markerEnd="url(#dot)"
          />
          <rect x={stakeholderX} y={s.y - 26} width="180" height="52" rx="9" fill="#F5F1E8" />
          <text x={stakeholderX + 14} y={s.y - 6} fontFamily="Space Grotesk" fontWeight="600" fontSize="12" fill="#0B1220">
            {s.role}
          </text>
          <text x={stakeholderX + 14} y={s.y + 14} fontFamily="JetBrains Mono" fontSize="11" fill="#C97F1E">
            {formatBps(s.share_bps)}
          </text>
          <circle cx={stakeholderX + 165} cy={s.y - 26 + 12} r="9" fill={settled ? '#3FA796' : '#E8A33D'} />
          <text x={stakeholderX + 165} y={s.y - 26 + 16} textAnchor="middle" fontFamily="Space Grotesk" fontSize="10" fontWeight="700" fill="#0B1220">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
