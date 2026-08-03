import React from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Loader1 } from "@/components/loader/Loader";

type ButtonProps = React.ComponentProps<typeof Button>;

interface FormButtonProps extends ButtonProps {
  text: string;
  loading?: boolean;
}

export const FormButtonB = ({
  text,
  loading = false,
  disabled = false,
  className,
  type = "button",
  variant = "default",
  ...props
}: FormButtonProps) => {
  return (
    <Button
      {...props}
      type={type}
      variant={variant}
      disabled={disabled || loading}
      className={clsx(
        "h-10 px-3 text-[13px] font-medium",
        className
      )}
    >
      {loading ? (
        <Loader1 className="size-4 opacity-70" />
      ) : (
        text
      )}
    </Button>
  );
};