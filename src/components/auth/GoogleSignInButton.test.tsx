import { act, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GoogleSignInButton from "./GoogleSignInButton";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));
vi.mock("next/script", () => ({ default: () => null }));

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); localStorage.clear(); delete window.google; });

describe("Google sign-in continuation", () => {
  it("returns the client to the selected coach after the Google callback", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "test-client-id");
    window.history.replaceState({}, "", "/auth/login?redirect=%2Freservation%3Fannonce_id%3D42%26intervenant_id%3D7");
    let credentialCallback: ((response: { credential: string }) => void) | undefined;
    window.google = { accounts: { id: {
      initialize: (options) => { credentialCallback = options.callback; },
      renderButton: vi.fn(), cancel: vi.fn(),
    } } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok:true, json:async () => ({token:"test-token", user:{id:9,name:"Client",email:"test@example.com",roles:[{id:1,name:"Client",slug:"client"}]}})}));
    render(<GoogleSignInButton flow="login" />);
    await waitFor(() => expect(credentialCallback).toBeDefined());
    await act(async () => { credentialCallback?.({credential:"mock-google-token"}); });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/reservation?annonce_id=42&intervenant_id=7"));
  });
});
