"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability degrades gracefully if this fails — the app still
        // works normally, it just won't be installable/offline-cached.
      });
    }
  }, []);

  return null;
}
