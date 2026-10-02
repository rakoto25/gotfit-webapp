import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OfferCard from "@/components/marketplace/OfferCard";
import { cancelOffer, type Offer } from "@/lib/marketplace";

vi.mock("@/lib/marketplace", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/marketplace")>();
  return {
    ...original,
    cancelOffer: vi.fn(),
  };
});

const offer: Offer = {
  id: 42,
  conversation_id: 8,
  coach_id: 2,
  client_id: 3,
  title: "Coaching personnalisé",
  description: "Programme sur mesure",
  session_count: 5,
  amount_total: 13500,
  currency: "eur",
  status: "sent",
  expires_at: "2030-01-10T12:00:00Z",
};

describe("OfferCard", () => {
  beforeEach(() => {
    vi.mocked(cancelOffer).mockReset();
  });

  it("propose au client une étape de vérification avant Stripe", () => {
    render(<OfferCard offer={offer} currentUserId={offer.client_id} />);

    expect(screen.getByText("Coaching personnalisé")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Vérifier et payer/ })).toHaveAttribute(
      "href",
      "/offres/42/paiement"
    );
  });

  it("permet au coach d'annuler une offre encore payable", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(cancelOffer).mockResolvedValue({ ...offer, status: "cancelled" });
    const onChanged = vi.fn();

    render(<OfferCard offer={offer} currentUserId={offer.coach_id} onChanged={onChanged} />);
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    await waitFor(() => expect(cancelOffer).toHaveBeenCalledWith(offer.id));
    expect(onChanged).toHaveBeenCalledOnce();
  });
});
