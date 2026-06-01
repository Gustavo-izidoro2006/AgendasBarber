export default function LoadingSpinner({ size = 16, color = "white" }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}33`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
        display: "inline-block",
      }}
      aria-hidden="true"
    />
  );
}
