import { API_BASE_URL } from "./api-config";

export type PublicRuntimeConfig = {
  stripe_publishable_key: string | null;
  google_client_id: string | null;
  turnstile_enabled: boolean;
  turnstile_site_key: string | null;
};

type PublicRuntimeConfigPayload = Partial<PublicRuntimeConfig> & {
  turnstile?: {
    enabled?: boolean;
    configured?: boolean;
    site_key?: string | null;
  };
};

const fallback: PublicRuntimeConfig = {
  stripe_publishable_key: process.env.NEXT_PUBLIC_STRIPE_KEY?.trim() || null,
  google_client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null,
  turnstile_enabled: process.env.NEXT_PUBLIC_TURNSTILE_ENABLED === "true",
  turnstile_site_key: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null,
};

export async function fetchPublicRuntimeConfig(): Promise<PublicRuntimeConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/public-config`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return fallback;

    const payload = await response.json() as PublicRuntimeConfigPayload;
    return {
      stripe_publishable_key: payload.stripe_publishable_key?.trim() || fallback.stripe_publishable_key,
      google_client_id: payload.google_client_id?.trim() || fallback.google_client_id,
      turnstile_enabled:
        payload.turnstile_enabled ??
        payload.turnstile?.enabled ??
        fallback.turnstile_enabled,
      turnstile_site_key:
        payload.turnstile_site_key?.trim() ||
        payload.turnstile?.site_key?.trim() ||
        fallback.turnstile_site_key,
    };
  } catch {
    return fallback;
  }
}
