import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPublicRuntimeConfig } from "./runtime-config";

describe("fetchPublicRuntimeConfig", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads only the public Stripe and Google identifiers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        stripe_publishable_key: "pk_test_public",
        google_client_id: "google-public-id",
        stripe_secret: "must-be-ignored",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPublicRuntimeConfig()).resolves.toEqual({
      stripe_publishable_key: "pk_test_public",
      google_client_id: "google-public-id",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
