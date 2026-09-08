import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";

import { apiRequest } from "@/lib/marketplace";
import { ChannelNav, ForumAvatar, ForumTopLinks, MentionComposer, ReactionBar } from "@/components/forum/ForumUi";

vi.mock("@/lib/marketplace", () => ({
  apiRequest: vi.fn(),
  normalizeArray: <T,>(payload: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      if (Array.isArray(payload[key])) return payload[key] as T[];
    }
    return [];
  },
}));

const mockedApiRequest = apiRequest as Mock;

afterEach(() => {
  vi.useRealTimers();
  mockedApiRequest.mockReset();
});

describe("composants du forum", () => {
  it("sélectionne un canal thématique", () => {
    const onSelect = vi.fn();
    render(
      <ChannelNav
        selected=""
        onSelect={onSelect}
        channels={[{ id: 1, name: "Nutrition", slug: "nutrition", is_official: false, is_active: true, sort_order: 1, discussions_count: 7 }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Nutrition/ }));
    expect(onSelect).toHaveBeenCalledWith("nutrition");
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("affiche et active les réactions", () => {
    const onReact = vi.fn();
    render(<ReactionBar counts={{ like: 3 }} active="like" onReact={onReact} />);

    expect(screen.getByRole("button", { name: /J’aime 3/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Utile/ }));
    expect(onReact).toHaveBeenCalledWith("helpful");
  });

  it("affiche les initiales et le nombre de notifications", () => {
    render(
      <>
        <ForumAvatar author={{ id: 3, name: "Nora Martin" }} />
        <ForumTopLinks unreadCount={125} admin />
      </>,
    );

    expect(screen.getByText("NM")).toBeInTheDocument();
    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Modération" })).toHaveAttribute("href", "/admin/forum");
  });

  it("recherche puis insère une mention de coach validé", async () => {
    vi.useFakeTimers();
    mockedApiRequest.mockResolvedValueOnce({ coaches: [{ id: 4, name: "Nora Martin", coach_title: "Coach running" }] });
    const onChange = vi.fn();
    const onMentionIdsChange = vi.fn();

    render(
      <MentionComposer
        value="Bonjour"
        onChange={onChange}
        mentionIds={[]}
        onMentionIdsChange={onMentionIdsChange}
        placeholder="Votre réponse"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Mentionner un coach/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(screen.getByRole("button", { name: /Nora Martin/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Nora Martin/ }));

    expect(onChange).toHaveBeenCalledWith("Bonjour @Nora Martin ");
    expect(onMentionIdsChange).toHaveBeenCalledWith([4]);
  });
});
