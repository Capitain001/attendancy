import React from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Loader1 } from "../loaders/Loader";


interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string; // Texte principal du bouton
  icon?: React.ReactNode; // Icône optionnelle (peut être un <svg> ou un composant Lucide)
  loading?: boolean;
  className?: string;

}

/**
 * FormButton
 *
 * Exemple :
 * <FormButton text="Envoyer" icon={<Send className="size-5" />} />
 * <FormButton text="Valider" />
 */
export const FormButton: React.FC<FormButtonProps> = ({
  text,
  icon,
  loading = false,
  disabled = false,
  className,
  ...props
}) => {
  return (
    <Button
      {...props}
      type="submit"
      variant="ghost"
      disabled={disabled}
      className={clsx(
        "px-1 py-1 border  bg-accent/70 group hover:bg-accent/70 h-14 aspect-video dark:bg-accent",
        className
      )}
    >
      <div className="border rounded-xs h-full group-hover:bg-accent w-full px-2 flex justify-center items-center gap-2">
        {!loading ? (
          <>
            {icon && <span className="flex items-center">{icon}</span>}

            <h1>{text}</h1>
          </>
        ) : (
          <Loader1 className="size-7 opacity-70" />
        )}
      </div>
    </Button>
  );
};
