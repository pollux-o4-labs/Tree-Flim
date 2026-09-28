import { useEffect, type RefObject } from "react";

export function useDialogBodyLock(
  ...dialogs: readonly RefObject<HTMLDialogElement | null>[]
) {
  useEffect(() => {
    const dialogElements = dialogs
      .map((dialog) => dialog.current)
      .filter((dialog): dialog is HTMLDialogElement => Boolean(dialog));
    const close = () => {
      document.body.style.overflow = "";
    };
    const observer = new MutationObserver(() => {
      document.body.style.overflow = dialogElements.some((dialog) => dialog.open)
        ? "hidden"
        : "";
    });

    dialogElements.forEach((dialog) =>
      observer.observe(dialog, {
        attributes: true,
        attributeFilter: ["open"],
      }),
    );
    return () => {
      observer.disconnect();
      close();
    };
  }, [dialogs]);
}
