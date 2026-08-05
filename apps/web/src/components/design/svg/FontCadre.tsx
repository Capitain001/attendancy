import { cn } from "@/lib/utils";


interface Position {
  x: number;
  y: number;
}

interface FontCadreProps {
  rotation?: number;
  strokeColor?: string;
  circleFillColor?: string;
  position?: Position;
  className?: string;
  circlePositions?: Position[];
  scale?: number;
}

export function FontCadre({
  rotation = 342.329,
  strokeColor = "#EBFF57",
  circleFillColor = "#0A0A0C",
  position = { x: 258.318, y: 225.798 },
  className,
  circlePositions,
  scale = 1,
}: FontCadreProps) {
  // Parse dimensions from className or use defaults
  const widthMatch = className?.match(/w-\[([0-9.]+)px\]|w-(\d+)/);
  const heightMatch = className?.match(/h-\[([0-9.]+)px\]|h-(\d+)/);
  
  const width = widthMatch ? (widthMatch[1] ? parseFloat(widthMatch[1]) : parseFloat(widthMatch[2]) * 4) : 204.5;
  const height = heightMatch ? (heightMatch[1] ? parseFloat(heightMatch[1]) : parseFloat(heightMatch[2]) * 4) : 113.5;

  const defaultCirclePositions: Position[] = [
    { x: 0, y: 0 },
    { x: width / 2, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height / 2 },
    { x: width, y: height },
    { x: width / 2, y: height },
    { x: 0, y: height },
    { x: 0, y: height / 2 },
  ];

  const positions = circlePositions || defaultCirclePositions;
  
  // Rayon du cercle proportionnel à la taille
  const circleRadius = Math.min(width, height) * 0.03;
  const circleDiameter = circleRadius * 2;

  return (
    <div
      className={cn(
        "absolute w-[204.5px] h-[113.5px]",
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        <rect
          x="1"
          y="1"
          width={width - 2}
          height={height - 2}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1"
        />
      </svg>

      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: `${circleDiameter}px`,
            height: `${circleDiameter}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <svg
            className="absolute inset-0"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 14 14"
          >
            <circle
              cx={7}
              cy={7}
              r={6.5}
              fill={circleFillColor}
              stroke={strokeColor}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

// Exemple d'utilisation
export default function Demo() {
  return (
    <div className="relative w-full h-[600px] bg-gray-900">

      
      {/* Exemples avec className */}
      <FontCadre
        position={{ x: 100, y: 100 }}
        rotation={0}
        scale={0.5}
        strokeColor="#FF5757"
        className="w-40 h-24"
      />
      
      <FontCadre
        position={{ x: 500, y: 350 }}
        rotation={45}
        scale={0.7}
        strokeColor="#57EBFF"
        className="w-56 h-40"
      />
    </div>
  );
}