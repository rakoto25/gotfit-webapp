import { describe, expect, it } from "vitest";
import { getAuthDestination, getSafeRedirect } from "./auth-redirect";
import type { User } from "@/types/auth";

describe("Authentication continuation", () => {
  const client = { id: 1, name: "Client", roles: [{ id: 1, name: "Client", slug: "client" }] } as User;
  const coach = { ...client, roles: [{ id: 2, name: "Intervenant", slug: "intervenant" }] } as User;
  it("preserves the selected coach and announcement", () => {
    expect(getAuthDestination(client, "?redirect=%2Freservation%3Fintervenant_id%3D7%26annonce_id%3D42")).toBe("/reservation?intervenant_id=7&annonce_id=42");
  });
  it("sends coaches directly to their dashboard", () => {
    expect(getAuthDestination(coach, "")).toBe("/intervenant/dashboard");
  });
  it("rejects external and browser-normalized unsafe redirects", () => {
    for (const value of ["https://example.org", "//example.org", "/\\example.org", "/\texample.org"]) expect(getSafeRedirect(value)).toBeNull();
  });
});
