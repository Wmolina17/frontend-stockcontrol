import { useEffect, useState } from "react";

export function useToast(duration = 2400) {
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), duration);
    return () => clearTimeout(timer);
  }, [toast, duration]);

  return {
    toast,
    showToast: setToast,
    Toast: toast ? <div className="ui-toast" role="status">{toast}</div> : null,
  };
}
