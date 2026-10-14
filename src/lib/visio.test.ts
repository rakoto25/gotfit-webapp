import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { apiRequest } from "@/lib/marketplace";
import { createVisioSession } from "@/lib/visio";

vi.mock("@/lib/marketplace", () => ({
  apiRequest: vi.fn(),
}));

const mockedApiRequest = apiRequest as Mock;

describe("création d’une séance visio", () => {
  beforeEach(() => mockedApiRequest.mockReset());

  it("respecte le nombre de coachés choisi par l’intervenant", async () => {
    mockedApiRequest.mockResolvedValueOnce({
      session: {
        id: 42,
        coach_id: 7,
        title: "Mobilité en petit groupe",
        start_at: "2026-10-20T09:00:00+02:00",
        duration_minutes: 45,
        min_participants: 1,
        max_participants: 2,
        price: 0,
        currency: "EUR",
        status: "open",
      },
    });

    await createVisioSession({
      title: "  Mobilité en petit groupe  ",
      description: "  Travail guidé  ",
      start_at: "2026-10-20T09:00",
      duration_minutes: 45,
      min_participants: 1,
      max_participants: 2,
      price: 0,
      currency: "eur",
    });

    expect(mockedApiRequest).toHaveBeenCalledWith("/visio/sessions", {
      method: "POST",
      auth: true,
      body: expect.objectContaining({
        title: "Mobilité en petit groupe",
        description: "Travail guidé",
        min_participants: 1,
        max_participants: 2,
        currency: "EUR",
      }),
    });
  });
});
