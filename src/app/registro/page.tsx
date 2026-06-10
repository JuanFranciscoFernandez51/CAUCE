import type { Metadata } from "next";
import { getPricing } from "@/lib/pricing";
import { RegistroForm } from "./registro-form";

export const metadata: Metadata = {
  title: "Creá tu bot Starter — Cauce",
  description:
    "Alta autoservicio del pack Starter: bot de FAQ + captura de leads por WhatsApp o Instagram.",
};

export default async function RegistroPage() {
  const pricing = await getPricing();
  const monthlyUsd = pricing.packs.starter?.monthlyUsd ?? 45;
  return <RegistroForm monthlyUsd={monthlyUsd} />;
}
