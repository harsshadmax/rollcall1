/** Original minimal face marks (dots + curves). Not derived from any app's artwork. */
export type Mood = "happy" | "neutral" | "sad" | "sleep";

export function Face({ mood = "happy", size = 22 }: { mood?: Mood; size?: number }) {
  const stroke = { stroke: "currentColor", strokeWidth: 1.6, fill: "none", strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden style={{ display: "block" }}>
      {mood === "sleep" ? (
        <>
          <path d="M6.8 9.5 Q8.5 11 10.2 9.5" {...stroke} />
          <path d="M13.8 9.5 Q15.5 11 17.2 9.5" {...stroke} />
          <path d="M10.5 15 Q12 16 13.5 15" {...stroke} />
        </>
      ) : (
        <>
          <circle cx="8.5" cy="9.5" r="1.3" fill="currentColor" />
          <circle cx="15.5" cy="9.5" r="1.3" fill="currentColor" />
          {mood === "happy" && <path d="M7.5 13.5 Q12 18 16.5 13.5" {...stroke} />}
          {mood === "neutral" && <path d="M8.5 15 H15.5" {...stroke} />}
          {mood === "sad" && <path d="M7.5 16 Q12 12.5 16.5 16" {...stroke} />}
        </>
      )}
    </svg>
  );
}
