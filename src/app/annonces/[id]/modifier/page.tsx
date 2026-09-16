"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getStoredAuth } from "@/lib/auth";
import { weekDays } from "@/lib/availability";
import { type Annonce, fetchMyAnnonces, getAssetUrl, updateAnnonce } from "@/lib/marketplace";

export default function EditAnnouncementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [hours, setHours] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!getStoredAuth()) { router.replace(`/auth/login?redirect=${encodeURIComponent(`/annonces/${id}/modifier`)}`); return; }
      try {
        const item = (await fetchMyAnnonces()).find(a => String(a.id) === id);
        if (!item) throw new Error("Cette annonce est introuvable dans votre compte.");
        if (active) { setAnnonce(item); setDays(item.available_days ?? []); setHours((item.available_hours ?? []).join("\n")); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Chargement impossible."); }
      finally { if (active) setLoading(false); }
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [id, router]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!annonce || saving) return;
    setError(""); setSuccess("");
    const body = new FormData(e.currentTarget);
    const ranges = hours.split("\n").map(s => s.trim()).filter(Boolean);
    if (annonce.announcement_type !== "client_request" && (!days.length || !ranges.length)) {
      setError("Indiquez au moins un jour et un créneau disponible."); return;
    }
    if (days.length) days.forEach(day => body.append("available_days[]", day));
    else body.set("available_days", "");
    if (ranges.length) ranges.forEach(range => body.append("available_hours[]", range));
    else body.set("available_hours", "");
    const file = body.get("image");
    if (file instanceof File && !file.size) body.delete("image");
    try {
      setSaving(true);
      const result = await updateAnnonce(id, body);
      setSuccess(result.message || "Modifications enregistrées. Votre annonce attend une nouvelle validation.");
    } catch (e) { setError(e instanceof Error ? e.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }
  return <><Header /><main className="mx-auto min-h-screen max-w-3xl px-5 pb-16 pt-32">
    <Link href="/annonces/mes-annonces" className="font-bold underline">Retour à mes annonces</Link>
    <h1 className="my-6 text-3xl font-black">Modifier mon annonce</h1>
    {loading && <p role="status">Chargement…</p>}
    {error && <p role="alert" className="my-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {success && <p role="status" className="my-4 rounded-xl bg-emerald-50 p-4 text-emerald-800">{success}</p>}
    {annonce && <form onSubmit={submit} className="grid gap-5 rounded-3xl bg-white p-6">
      <p>Toute modification est soumise à une nouvelle validation par GotFit.</p>
      <label>Titre<input className="gotfit-input" name="titre" defaultValue={annonce.titre ?? ""} required maxLength={255} /></label>
      <label>Description<textarea className="gotfit-input" rows={6} name="contenu" defaultValue={annonce.contenu ?? ""} required /></label>
      <label>Spécialité<input className="gotfit-input" name="category" defaultValue={annonce.category ?? ""} maxLength={100} /></label>
      <label>{annonce.announcement_type === "client_request" ? "Budget" : "Prix de la séance"} (€)
        <input className="gotfit-input" name="price" type="number" min="0" step="0.01" defaultValue={annonce.price ?? ""} required={annonce.announcement_type !== "client_request"} /></label>
      <label>Durée (minutes)<input className="gotfit-input" name="duration" type="number" min="1" max="480" defaultValue={annonce.duration ?? 60} required /></label>
      <fieldset><legend className="mb-2 font-bold">Jours disponibles</legend><div className="flex flex-wrap gap-4">{weekDays.map(([value, label]) =>
        <label key={value} className="flex items-center gap-2"><input type="checkbox" checked={days.includes(value)} onChange={e => setDays(e.target.checked ? [...days, value] : days.filter(d => d !== value))} />{label}</label>)}</div></fieldset>
      <label>Créneaux (un par ligne, ex. 09:00-12:00)<textarea className="gotfit-input" rows={3} value={hours} onChange={e => setHours(e.target.value)} /></label>
      <p className="text-sm text-[var(--muted)]">Les créneaux s’appliquent à chaque jour sélectionné. Les séances se déroulent exclusivement en ligne.</p>
      {annonce.image && <p><a href={getAssetUrl(annonce.image_url || annonce.image)} target="_blank" rel="noreferrer" className="underline">Voir l’image actuelle</a></p>}
      <label>Remplacer l’image (optionnel, 4 Mo maximum)<input className="gotfit-input" type="file" name="image" accept="image/jpeg,image/png,image/webp" /></label>
      <button disabled={saving} className="gotfit-button gotfit-button-dark">{saving ? "Enregistrement…" : "Enregistrer les modifications"}</button>
    </form>}
  </main><Footer /></>;
}
