export function StrokePatternCSS() {
  return (
    <div
      className="absolute inset-1"
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 6px,
            hsl(var(--border) ) 6px,
            hsl(var(--border) ) 7px
          )
        `,
      }}
    />
  )
}