/**
 * Ambient "aurora" background — soft rose light-streaks drifting behind the store.
 * Adapted from a SCSS CodePen effect: the streak edges fade into the blush page
 * (not white), so the light melts into the background. Durations are long and
 * delays are staggered so the motion reads as slow and continuous, not looping.
 *
 * Colours, speed and intensity are driven by CSS variables (--aurora-*) defined
 * in globals.css, so the dev colour editor can retune them live. The per-streak
 * geometry is computed deterministically from the index (no Math.random), so
 * server and client render identically — no hydration mismatch.
 */

// Which of the three colour vars each streak plays in slot 1/2/3. Six
// permutations keep neighbouring streaks from looking identical.
const PERMUTATIONS: [number, number, number][] = [
  [1, 2, 3],
  [1, 3, 2],
  [3, 1, 2],
  [3, 2, 1],
  [2, 3, 1],
  [2, 1, 3],
];

const STREAKS = 25;

export function AuroraBackground() {
  return (
    <div className="aurora" aria-hidden>
      {Array.from({ length: STREAKS }, (_, idx) => {
        const i = idx + 1;
        const [s1, s2, s3] = PERMUTATIONS[idx % PERMUTATIONS.length];
        // 96s → 60s base; the --aurora-speed multiplier scales it live.
        const duration = 96 - i * 1.5;
        // Negative offsets scatter the streaks across the sweep from the first frame.
        const delay = -(i * 4.2);
        return (
          <span
            key={i}
            className="rainbow"
            style={{
              animationDuration: `calc(${duration}s * var(--aurora-speed, 1))`,
              animationDelay: `${delay}s`,
              boxShadow: [
                `-130px 0 80px 40px var(--aurora-fade)`,
                `-50px 0 60px 30px var(--aurora-c${s1})`,
                `0 0 60px 30px var(--aurora-c${s2})`,
                `50px 0 60px 30px var(--aurora-c${s3})`,
                `130px 0 80px 40px var(--aurora-fade)`,
              ].join(", "),
            }}
          />
        );
      })}
      <span className="aurora-h" />
      <span className="aurora-v" />
    </div>
  );
}
