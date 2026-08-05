import React from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Loader1 } from "@/components/loaders/Loader";

type ButtonProps = React.ComponentProps<typeof Button>;

interface FormButtonProps extends ButtonProps {
  text: string;
  loading?: boolean;
  contentClassName?: string;
}

export const FormButton = ({
  text,
  loading = false,
  disabled = false,
  className,
  contentClassName,
  type = "submit",
  variant = "ghost",
  ...props
}: FormButtonProps) => {
  return (
    <Button
      {...props}
      type={type}
      variant={variant}
      disabled={disabled || loading}
      className={clsx(
        "p-1 border bg-accent/70 h-14 aspect-video dark:bg-accent",
        className
      )}
    >
      <div
        className={clsx(
          "border rounded-xs h-full w-full px-2 flex justify-center items-center",
          contentClassName
        )}
      >
        {!loading ? (
          <h1>{text}</h1>
        ) : (
          <Loader1 className="size-7 opacity-70" />
        )}
      </div>
    </Button>
  );
};