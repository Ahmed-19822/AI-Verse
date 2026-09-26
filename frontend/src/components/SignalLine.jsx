// The signature motif of AIverse: a living "signal" waveform.
// It represents the pulse of a conversation between human and AI —
// used in the hero, as a section divider, and as a loading/typing indicator.
export default function SignalLine({ className = '', color = '#7C5CFF', height = 80 }) {
  // A hand-tuned irregular waveform path (not a generic sine) so it reads as a "voice", not a generic chart.
  const d = "M0,40 L20,40 L30,18 L40,62 L52,8 L62,40 L78,40 L88,52 L98,28 L110,40 L130,40 L142,15 L154,55 L168,40 L190,40 L200,30 L212,48 L224,40 L260,40";

  return (
    <svg
      viewBox="0 0 260 80"
      preserveAspectRatio="none"
      className={className}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="signalGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0" />
          <stop offset="15%" stopColor="#7C5CFF" />
          <stop offset="55%" stopColor="#00F0D8" />
          <stop offset="100%" stopColor="#FF3CAC" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke="url(#signalGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 6"
        className="animate-pulseLine"
      />
    </svg>
  )
}
