export function DrybarCoverOverlay() {
  return (
    <div
      className="absolute inset-0 z-10 bg-white dark:bg-slate-50 flex items-start justify-center"
      style={{
        pointerEvents: "none",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <img
        src="/images/design-mode/Drybar-FDD-%282025%29%28Cover-Page%29_1.png"
        alt="Drybar FDD Cover Page"
        style={{
          width: "100%",
          height: "auto",
          maxWidth: "100%",
          objectFit: "contain",
          objectPosition: "top center",
        }}
      />
    </div>
  )
}
// </CHANGE>
