import React from "react";

interface AuthBarProps {
  lightPosition?: "left" | "right";
  title?: string;
}

export default function AuthBar({
  lightPosition = "left",
  title,
}: AuthBarProps) {
  const position = lightPosition === "left" ? "left-0" : "left-1/2";

  return (
    <div className="relative my-4 flex h-16 w-full flex-col justify-center overflow-hidden rounded-lg border-4 bg-[#D9D9D9]/40 backdrop-blur-md">
      {title && (
        <h1 className="text-center align-middle font-medium">{title}</h1>
      )}

      <div
        className={`absolute ${position} animate-moving-light inset-0 h-20 w-20 rounded-full bg-gradient-radial from-yellow-400/70 to-transparent blur-md`}
      ></div>
    </div>
  );
}
