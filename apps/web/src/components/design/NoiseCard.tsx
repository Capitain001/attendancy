import NoiseOverlay from "./NoiseOverlay";

interface NoiseCardProps {
    children: React.ReactNode;
    className?: string;
    intensity?: number;
    blendMode?: React.CSSProperties["mixBlendMode"];
    grainSize?: number;
  }
  
  export default function NoiseCard({
    children,
    className,
    intensity,
    blendMode,
    grainSize,
  }: NoiseCardProps) {
    return (
      <div className={`relative  overflow-hidden ${className}`}>
        <NoiseOverlay intensity={intensity} blendMode={blendMode} grainSize={grainSize} />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
  