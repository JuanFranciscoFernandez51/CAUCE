/** Sube los 5 videos finales de la campaña a Cloudinary y devuelve las URLs. */
import { readFileSync } from "node:fs";
import { uploadToTenant } from "../src/lib/storage";

const DIR = "/Users/juanfri/Desktop/CAUCE FABLE/videos camopaña";
const VIDEOS = ["v1-raul.MOV", "v2-osvaldo.MOV", "v3-vanesa.MOV", "v4-diego.MOV", "v5-gustavo.MOV"];

async function main() {
  const urls: Record<string, string> = {};
  for (const v of VIDEOS) {
    const buffer = readFileSync(`${DIR}/${v}`);
    const up = await uploadToTenant({
      slug: "sistema",
      scope: ["marketing", "ads"],
      buffer,
      originalName: v,
    });
    urls[v] = up.url;
    console.log(`✅ ${v} → ${up.url}`);
  }
  console.log("\nJSON:", JSON.stringify(urls));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
