import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * A modal on the native <dialog> element (design.md §7.11): centred on
 * desktop, a bottom sheet on phones (CSS). showModal() makes the page behind
 * inert and keeps focus inside; Esc closes it; the browser returns focus to
 * the control that opened it.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-labelledby={titleId}
      className="dialog"
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> itself, outside its panel.
        if (event.target === event.currentTarget) onClose();
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="dialog__panel">
        <span aria-hidden="true" className="dialog__handle" />
        <div className="dialog__head">
          <h2 className="dialog__title" id={titleId}>{title}</h2>
          <button aria-label="Close" className="dialog__close" onClick={onClose} type="button">
            <X aria-hidden="true" className="icon" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
