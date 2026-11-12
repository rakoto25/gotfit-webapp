import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPublicRuntimeConfig } from "./runtime-config";

describe("fetchPublicRuntimeConfig", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads only public Stripe, Google and Turnstile identifiers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        stripe_publishable_key: "pk_test_public",
        google_client_id: "google-public-id",
        turnstile_enabled: true,
        turnstile_site_key: "turnstile-public-key",
        stripe_secret: "must-be-ignored",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPublicRuntimeConfig()).resolves.toEqual({
      stripe_publishable_key: "pk_test_public",
      google_client_id: "google-public-id",
      turnstile_enabled: true,
      turnstile_site_key: "turnstile-public-key",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("accepts the nested Turnstile payload used by newer API versions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          turnstile: {
            enabled: true,
            configured: true,
            site_key: "nested-public-key",
          },
        }),
      })
    );

    await expect(fetchPublicRuntimeConfig()).resolves.toMatchObject({
      turnstile_enabled: true,
      turnstile_site_key: "nested-public-key",
    });
  });
});
