export default function LoadingSpinner({ texto = "Carregando..." }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
      background: "var(--bg-primary)",
      color: "white",
    }}>
      {/* Spinner com anel */}
      <div style={{ position: "relative", width: 48, height: 48 }}>
        <div style={{
          width: 48, height: 48,
          border: "2px solid var(--border-default)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: "12px",
          border: "2px solid transparent",
          borderTopColor: "var(--gold)",
          borderRadius: "50%",
          animation: "spin 1.1s linear infinite reverse",
        }} />
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 500 }}>{texto}</p>
    </div>
  );
}
