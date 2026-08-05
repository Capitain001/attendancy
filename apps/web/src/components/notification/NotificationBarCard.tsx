"use client";

interface NotificationCardProps {
  children: React.ReactNode;
  position?: "top" | "bottom" ;
}

export const NotifBarCard = ({ children, position = "top" }: NotificationCardProps) => {
  // Classes de positionnement par défaut (bottom)
  const positionClasses = {
    top: "top-18 left-1/2 transform -translate-x-1/2",
    bottom: "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  return (
    <div className={`fixed flex items-center rounded-lg ${positionClasses[position]}`}>
      {children}
    </div>
  );
};