"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useEffect, useState } from "react";
import { fetchPublicRuntimeConfig } from "@/lib/runtime-config";

export function PublicTurnstile({ onToken, resetKey = 0 }: { onToken: (token: string) => void; resetKey?: number }) {
  const [config, setConfig] = useState<{ enabled: boolean; siteKey: string | null } | null>(null);
  useEffect(() => {
    let active = true;
    fetchPublicRuntimeConfig().then((result) => {
      if (active) setConfig({ enabled: result.turnstile_enabled, siteKey: result.turnstile_site_key });
    });
    return () => { active = false; };
  }, []);
  if (!config) return <p className="text-xs text-slate-500">Chargement de la vérification de sécurité…</p>;
  if (!config.enabled) return null;
  if (!config.siteKey) return <p role="alert" className="text-sm text-red-700">Captcha indisponible : configuration serveur incomplète.</p>;
  return <div className="my-3"><Turnstile key={resetKey} siteKey={config.siteKey} onSuccess={onToken} onExpire={() => onToken("")} onError={() => onToken("")} /></div>;
}
