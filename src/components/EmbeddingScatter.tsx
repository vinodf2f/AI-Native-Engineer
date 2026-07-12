import { motion } from 'framer-motion'

type Point = { label: string; vector: number[]; color: string }

export function EmbeddingScatter({ points }: { points: Point[] }) {
  if (points.length < 2) return null

  const allDims = points[0].vector.length
  const dim1 = 0
  const dim2 = 1
  const xs = points.map((p) => p.vector[dim1] ?? 0)
  const ys = points.map((p) => p.vector[dim2] ?? 0)
  const all = [...xs, ...ys]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const range = max - min || 1
  const pad = 20
  const size = 200

  function project(v: number) {
    return pad + ((v - min) / range) * (size - pad * 2)
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px] mx-auto">
      <rect x={pad} y={pad} width={size - pad * 2} height={size - pad * 2} fill="none" stroke="#27272a" strokeWidth="1" rx="4" />
      {points.map((p, i) => {
        const px = project(p.vector[dim1] ?? 0)
        const py = project(p.vector[dim2] ?? 0)
        return (
          <g key={i}>
            {i > 0 && (
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                x1={project(points[0].vector[dim1] ?? 0)}
                y1={project(points[0].vector[dim2] ?? 0)}
                x2={px}
                y2={py}
                stroke="#52525b"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}
            <motion.circle
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              cx={px}
              cy={py}
              r="5"
              fill={p.color}
            />
            <text x={px + 8} y={py + 4} fontSize="9" fontFamily="monospace" fill="#a1a1aa">
              {p.label}
            </text>
          </g>
        )
      })}
      <text x="6" y={size / 2} fontSize="7" fill="#52525b" transform={`rotate(-90 6 ${size / 2})`}>
        dim {dim1}
      </text>
      <text x={size / 2 - 10} y={size - 4} fontSize="7" fill="#52525b">
        dim {dim2}
      </text>
      <text x={size - 32} y={10} fontSize="6" fill="#52525b">
        of {allDims}D
      </text>
    </svg>
  )
}