import React from 'react';
import { cn } from "@/lib/utils";


// Loader 1 - Complex rotating circles with bars
export const Loader1 = ({ size = 50, className = "text-primary" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeMiterlimit="15"
      strokeDasharray="14.2472,14.2472"
      cx="50"
      cy="50"
      r="47"
    >
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        dur="5s"
        from="0 50 50"
        to="360 50 50"
        repeatCount="indefinite"
      />
    </circle>
    <circle
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeMiterlimit="10"
      strokeDasharray="10,10"
      cx="50"
      cy="50"
      r="39"
    >
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        dur="5s"
        from="0 50 50"
        to="-360 50 50"
        repeatCount="indefinite"
      />
    </circle>
    <g fill="currentColor">
      {[30, 40, 50, 60, 70].map((x, index) => (
        <rect key={index} x={x} y="35" width="5" height="30">
          <animateTransform
            attributeName="transform"
            dur="1s"
            type="translate"
            values="0 5 ; 0 -5; 0 5"
            repeatCount="indefinite"
            begin={`${(index + 1) * 0.1}s`}
          />
        </rect>
      ))}
    </g>
  </svg>
);

// Loader 2 - Clock-like loader
export const Loader2 = ({ size = 100, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      fill="none"
      stroke={color}
      strokeWidth="4"
      strokeMiterlimit="10"
      cx="50"
      cy="50"
      r="48"
    />
    <line
      fill="none"
      strokeLinecap="round"
      stroke={color}
      strokeWidth="4"
      strokeMiterlimit="10"
      x1="50"
      y1="50"
      x2="85"
      y2="50.5"
    >
      <animateTransform
        attributeName="transform"
        dur="2s"
        type="rotate"
        from="0 50 50"
        to="360 50 50"
        repeatCount="indefinite"
      />
    </line>
    <line
      fill="none"
      strokeLinecap="round"
      stroke={color}
      strokeWidth="4"
      strokeMiterlimit="10"
      x1="50"
      y1="50"
      x2="49.5"
      y2="74"
    >
      <animateTransform
        attributeName="transform"
        dur="15s"
        type="rotate"
        from="0 50 50"
        to="360 50 50"
        repeatCount="indefinite"
      />
    </line>
  </svg>
);


// Loader 3 - Orbiting dot
export const Loader3 = ({ size = 100, color = "#fff", dotColor = "#e74c3c" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        fill="none"
        stroke={color}
        strokeWidth="4"
        cx="50"
        cy="50"
        r="44"
        style={{ opacity: 0.5 }}
      />
      <circle fill={color} stroke={dotColor} strokeWidth="3" cx="8" cy="54" r="6">
        <animateTransform
          attributeName="transform"
          dur="2s"
          type="rotate"
          from="0 50 48"
          to="360 50 52"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );

// Loader 4 - Fading dots
export const Loader4 = ({ size = 100, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    {[6, 26, 46].map((x, index) => (
      <circle key={index} fill={color} stroke="none" cx={x} cy="50" r="6">
        <animate
          attributeName="opacity"
          dur="1s"
          values="0;1;0"
          repeatCount="indefinite"
          begin={`${(index + 1) * 0.1}s`}
        />
      </circle>
    ))}
  </svg>
);

// Loader 5 - Bouncing dots
export const Loader5 = ({ size = 100, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    {[
      { x: 6, values: "0 15 ; 0 -15; 0 15" },
      { x: 30, values: "0 10 ; 0 -10; 0 10" },
      { x: 54, values: "0 5 ; 0 -5; 0 5" }
    ].map((dot, index) => (
      <circle key={index} fill={color} stroke="none" cx={dot.x} cy="50" r="6">
        <animateTransform
          attributeName="transform"
          dur="1s"
          type="translate"
          values={dot.values}
          repeatCount="indefinite"
          begin={`${(index + 1) * 0.1}s`}
        />
      </circle>
    ))}
  </svg>
);

// Loader 7 - Triple rotating arcs
export const Loader7 = ({ size = 100, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill={color}
      d="M31.6,3.5C5.9,13.6-6.6,42.7,3.5,68.4c10.1,25.7,39.2,38.3,64.9,28.1l-3.1-7.9c-21.3,8.4-45.4-2-53.8-23.3c-8.4-21.3,2-45.4,23.3-53.8L31.6,3.5z"
    >
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        dur="2s"
        from="0 50 50"
        to="360 50 50"
        repeatCount="indefinite"
      />
    </path>
    <path
      fill={color}
      d="M42.3,39.6c5.7-4.3,13.9-3.1,18.1,2.7c4.3,5.7,3.1,13.9-2.7,18.1l4.1,5.5c8.8-6.5,10.6-19,4.1-27.7c-6.5-8.8-19-10.6-27.7-4.1L42.3,39.6z"
    >
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        dur="1s"
        from="0 50 50"
        to="-360 50 50"
        repeatCount="indefinite"
      />
    </path>
    <path
      fill={color}
      d="M82,35.7C74.1,18,53.4,10.1,35.7,18S10.1,46.6,18,64.3l7.6-3.4c-6-13.5,0-29.3,13.5-35.3s29.3,0,35.3,13.5L82,35.7z"
    >
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        dur="2s"
        from="0 50 50"
        to="360 50 50"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

// Loader 9 - Jumping bars
const Loader9 = ({ size = 100, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    {[20, 30, 40].map((x, index) => (
      <rect key={index} x={x} y="50" width="4" height="10" fill={color}>
        <animateTransform
          attributeType="xml"
          attributeName="transform"
          type="translate"
          values="0 0; 0 20; 0 0"
          begin={`${index * 0.2}s`}
          dur="0.6s"
          repeatCount="indefinite"
        />
      </rect>
    ))}
  </svg>
);

// Loader 10 - Simple spinning arc
export const Loader10 = ({ size = 100, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill={color}
      d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50"
    >
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        dur="1s"
        from="0 50 50"
        to="360 50 50"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);


function Pulse({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <>
      <style>{`
        @keyframes loading-ui-thin-pulse {
          0%,
          100% {
            transform: scale(0.95);
            opacity: 0.8;
          }

          50% {
            transform: scale(1.05);
            opacity: 0.4;
          }
        }
      `}</style>
      <span
        role="status"
        className={cn("relative inline-block shrink-0", className)}
        {...props}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-current"
          style={{
            animation:
              "loading-ui-thin-pulse var(--duration, 1.5s) ease-in-out infinite",
          }}
        />
        <span className="sr-only">Chargement</span>
      </span>
    </>
  );
}

export { Pulse };


function Ripple({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      {...props}
    >
      <title>Chargement…</title>
      <g fill="none" fillRule="evenodd" strokeWidth="2">
        <circle cx="22" cy="22" r="1">
          <animate
            attributeName="r"
            begin="0s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.165, 0.84, 0.44, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 20"
          />
          <animate
            attributeName="stroke-opacity"
            begin="0s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.3, 0.61, 0.355, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 0"
          />
        </circle>
        <circle cx="22" cy="22" r="1">
          <animate
            attributeName="r"
            begin="-0.9s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.165, 0.84, 0.44, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 20"
          />
          <animate
            attributeName="stroke-opacity"
            begin="-0.9s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.3, 0.61, 0.355, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 0"
          />
        </circle>
      </g>
    </svg>
  );
}

export { Ripple };


// Demo component to showcase all loaders
 const LoaderDemo = () => {
  const loaders = [
    { name: "Loader 1", component: Loader1 },
    { name: "Loader 2", component: Loader2 },
    { name: "Loader 3", component: Loader3 },   
    { name: "Loader 4", component: Loader4 },
    { name: "Loader 5", component: Loader5 },
    { name: "Loader 7", component: Loader7 },
    { name: "Loader 9", component: Loader9 },
    { name: "Loader 10", component: Loader10 },
  ];

  return (
    <div className="min-h-screen bg-red-500 text-white font-mono">
      <div className="bg-red-600 py-6 mb-12">
        <h1 className="text-4xl font-light text-center uppercase tracking-wider">
          Pure <span className="font-bold">SVG</span> Loaders
        </h1>
      </div>
      
      <div className="flex flex-wrap justify-center items-center gap-8 px-4">
        {loaders.map(({ name, component: LoaderComponent }, index) => (
          <div key={index} className="flex flex-col items-center">
            <LoaderComponent size={100} color="#ffffff" />
            <p className="mt-2 text-sm opacity-75">{name}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center text-xs text-white/70">
        <p>
          Made with <span className="text-lg">♥</span> by{" "}
          <a 
            href="https://codepen.io/nikhil8krishnan" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:underline"
          >
            Nikhil Krishnan
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoaderDemo;
