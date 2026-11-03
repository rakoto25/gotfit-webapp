import { API_BASE_URL } from "./api-config";

export type PublicRuntimeConfig = {
  stripe_publishable_key: string | null;
  google_client_id: string | null;
};

const fallback: PublicRuntimeConfig = {
  stripe_publishable_key: process.env.NEXT_PUBLIC_STRIPE_KEY?.trim() || null,
  google_client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null,
};

export async function fetchPublicRuntimeConfig(): Promise<PublicRuntimeConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/public-config`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return fallback;

    const payload = await response.json() as Partial<PublicRuntimeConfig>;
    return {
      stripe_publishable_key: payload.stripe_publishable_key?.trim() || fallback.stripe_publishable_key,
      google_client_id: payload.google_client_id?.trim() || fallback.google_client_id,
    };
  } catch {
    return fallback;
  }
}
