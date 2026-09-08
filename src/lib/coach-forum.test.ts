import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { apiRequest } from "@/lib/marketplace";
import {
  createForumComment,
  fetchForumDiscussions,
  forumInitials,
  getForumError,
  reactToForumDiscussion,
} from "@/lib/coach-forum";

vi.mock("@/lib/marketplace", () => ({
  apiRequest: vi.fn(),
  normalizeArray: <T>(payload: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      if (Array.isArray(payload[key])) return payload[key] as T[];
    }
    return [];
  },
}));

const mockedApiRequest = apiRequest as Mock;

describe("API du forum coach", () => {
  beforeEach(() => mockedApiRequest.mockReset());

  it("construit la recherche et restitue la pagination", async () => {
    mockedApiRequest.mockResolvedValueOnce({
      discussions: {
        data: [{ id: 8, title: "Préparation trail" }],
        current_page: 2,
        last_page: 3,
        per_page: 15,
        total: 31,
      },
    });

    const result = await fetchForumDiscussions({ channel: "entrainement", q: "trail", sort: "popular", page: 2 });

    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/forum/discussions?channel=entrainement&q=trail&sort=popular&page=2",
      { auth: true },
    );
    expect(result.discussions).toHaveLength(1);
    expect(result.pagination).toMatchObject({ current_page: 2, last_page: 3, total: 31 });
  });

  it("envoie une réponse imbriquée et ses mentions", async () => {
    mockedApiRequest.mockResolvedValueOnce({ comment: { id: 15, body: "@Nora merci" } });

    await createForumComment(8, { body: "@Nora merci", parent_id: 12, mention_ids: [4] });

    expect(mockedApiRequest).toHaveBeenCalledWith("/forum/discussions/8/comments", {
      method: "POST",
      auth: true,
      body: { body: "@Nora merci", parent_id: 12, mention_ids: [4] },
    });
  });

  it("envoie les réactions avec authentification", async () => {
    mockedApiRequest.mockResolvedValueOnce({ discussion: { id: 8, viewer_reaction: "helpful" } });

    const result = await reactToForumDiscussion(8, "helpful");

    expect(result.viewer_reaction).toBe("helpful");
    expect(mockedApiRequest).toHaveBeenCalledWith("/forum/discussions/8/reactions", {
      method: "POST",
      auth: true,
      body: { type: "helpful" },
    });
  });
});

describe("présentation du forum", () => {
  it("calcule au maximum deux initiales", () => {
    expect(forumInitials("nora ben ali")).toBe("NB");
    expect(forumInitials()).toBe("C");
  });

  it("affiche un message API exploitable ou le texte de secours", () => {
    expect(getForumError(new Error("Accès refusé"), "Erreur")).toBe("Accès refusé");
    expect(getForumError({}, "Erreur")).toBe("Erreur");
  });
});
