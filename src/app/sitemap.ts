import type { MetadataRoute } from "next";
import { CASOS } from "@/lib/casos";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fixed = ["", "/precios", "/casos", "/consultoria", "/intake", "/registro"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const casos = CASOS.map((c) => ({
    url: `${base}/casos/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...fixed, ...casos];
}
