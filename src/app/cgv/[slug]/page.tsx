"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, FileCheck2, Loader2 } from "lucide-react";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { fetchLegalDocument, type LegalDocument } from "@/lib/marketplace";

function formatDate(value?: string | null) {
  if (!value) return "Date d’effet non précisée";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value));
}

export default function LegalDocumentPage() {
  const params = useParams<{ slug: string }>();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetchLegalDocument(params.slug)
      .then((result) => active && setDocument(result))
      .catch((caught) => active && setError(caught instanceof Error ? caught.message : "Impossible de charger les CGV."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [params.slug]);

  const blocks = document?.content.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean) || [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fff7ed] px-4 pb-24 pt-32 text-slate-950 sm:px-6 sm:pt-36">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm"><ArrowLeft size={17}/> Retour à l’accueil</Link>
          {loading ? (
            <div className="mt-8 flex items-center justify-center rounded-[2rem] bg-white py-20 text-sm font-black text-orange-700 shadow-sm"><Loader2 className="mr-3 animate-spin" size={20}/> Chargement des CGV…</div>
          ) : error || !document ? (
            <div className="mt-8 rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-black">CGV indisponibles</h1><p className="mt-3 text-sm font-semibold text-red-700">{error}</p></div>
          ) : (
            <article className="mt-8 overflow-hidden rounded-[2.5rem] bg-white shadow-[0_24px_80px_rgba(249,115,22,0.12)]">
              <header className="bg-slate-950 p-7 text-white sm:p-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-300"><FileCheck2 size={16}/> CGV GotFit · {document.audience === "client" ? "Clients" : "Intervenants"}</span>
                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">{document.title}</h1>
                <p className="mt-4 text-sm font-semibold text-slate-300">Version {document.version} · En vigueur le {formatDate(document.effective_at)}</p>
              </header>
              <div className="space-y-5 p-6 sm:p-10">
                {blocks.map((block, index) => block.startsWith("## ") ? (
                  <h2 key={`${index}-${block}`} className="pt-4 text-xl font-black tracking-tight text-slate-950">{block.slice(3)}</h2>
                ) : (
                  <p key={`${index}-${block.slice(0, 24)}`} className="whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-600">{block}</p>
                ))}
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
