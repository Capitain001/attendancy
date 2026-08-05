// src/components/PasswordInput.tsx (Client Component)
"use client"
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { GlassInputWrapper } from "./components";

interface PasswordInputProps {
  name: string;
  label: string;
  placeholder: string;
  delay?: string;
  error?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  name,
  label,
  placeholder,
  delay = "animate-delay-500",
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`animate-element ${delay}`}>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <GlassInputWrapper>
        <div className="relative">
          <input
            name={name}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            ) : (
              <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </button>
        </div>
      </GlassInputWrapper>
      {error && (
        <p className="text-destructive text-xs mt-1">{error}</p>
      )}
    </div>
  );
};