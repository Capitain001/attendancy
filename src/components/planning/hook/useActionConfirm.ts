import { useCallback, useRef, useState } from "react";

type ConfirmResolver = (confirmed: boolean) => void;

export function useActionConfirm() {
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<ConfirmResolver | null>(null);

  const waitForConfirmation = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setOpen(true);
    });
  }, []);

  const onConfirm = useCallback(() => {
    resolverRef.current?.(true);
    resolverRef.current = null;
    setOpen(false);
  }, []);

  const onCancel = useCallback(() => {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setOpen(false);
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  return { open, waitForConfirmation, onConfirm, onCancel, onClose };
}
