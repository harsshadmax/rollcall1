export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
      <div style={{ height: 28, width: 160, borderRadius: 12, background: "#ece9f4" }} />
      <div className="rc-card" style={{ height: 96, background: "#f4f2fa" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="rc-card" style={{ height: 112, background: "#f4f2fa" }} />
        <div className="rc-card" style={{ height: 112, background: "#f4f2fa" }} />
      </div>
    </div>
  );
}
