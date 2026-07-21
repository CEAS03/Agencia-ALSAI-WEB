/**
 * Fondo alternativo cuando WebGL no está disponible:
 * constelación SVG estática con pulsos de opacidad muy sutiles.
 * Mantiene la identidad visual sin depender del GPU.
 */
export function FallbackBackground() {
  const dots: [number, number, number][] = [
    [14, 12, 3], [78, 8, 2.4], [88, 26, 3.2], [22, 32, 2.2],
    [64, 42, 2.8], [10, 56, 3], [82, 62, 2.4], [38, 72, 2.6],
    [70, 84, 3], [18, 88, 2.2], [50, 22, 1.6], [46, 94, 2],
  ];
  const lines: [number, number, number, number][] = [
    [14, 12, 50, 22], [50, 22, 88, 26], [22, 32, 64, 42],
    [10, 56, 38, 72], [38, 72, 70, 84], [64, 42, 82, 62],
  ];

  return (
    <div className="eco-canvas" aria-hidden="true">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="fb-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4d9dff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#37e2e4" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {lines.map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="url(#fb-line)"
            strokeWidth="0.12"
            className="fb-pulse"
            style={{ animationDelay: `${i * 1.3}s` }}
          />
        ))}
        {dots.map(([x, y, r], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r * 0.28}
            fill="none"
            stroke="rgba(120, 170, 240, 0.55)"
            strokeWidth="0.14"
            className="fb-pulse"
            style={{ animationDelay: `${i * 0.7}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
