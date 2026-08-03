
import React from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Loader1 } from "@/components/loader/Loader";

interface LoadButtonProps {
  text: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;

}
       // {!loading ? text : <Loader1 size={50}  />}
export const LoadButton: React.FC<LoadButtonProps> = ({
  text,
  loading = false,
  disabled = false,
  className, 
}) => {
  return (
    <Button type="submit" variant="ghost" className={clsx("px-1 py-1 border bg-accent/70 h-14 aspect-video dark:bg-accent", className)} disabled={disabled}>
    
      <div className="border rounded-xs h-full w-full px-2 flex justify-center items-center ">
{!loading ? (<h1> {text}  </h1>):(  <Loader1 className="size-7 opacity-70 " />)}
      </div>
    </Button>
  );
};

