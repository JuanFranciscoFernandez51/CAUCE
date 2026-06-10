import { db } from "@/lib/db";
import { RecetarioView, type RecipeData } from "./recetario-view";

export const dynamic = "force-dynamic";

export default async function RecetarioPage() {
  const recipes = await db.recipe.findMany({
    orderBy: [{ area: "asc" }, { level: "asc" }, { name: "asc" }],
  });

  const data: RecipeData[] = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    area: r.area,
    level: r.level,
    apps: r.apps,
    solves: r.solves,
    variables: ((r.variables as RecipeData["variables"] | null) ?? []).filter((v) => v && v.key),
    n8nTemplateId: r.n8nTemplateId,
    buildHours: r.buildHours,
    active: r.active,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recetario</h1>
        <p className="text-sm text-muted-foreground">
          Las recetas de automatización que Cauce vende y provisiona. {data.length} en total.
        </p>
      </div>
      <RecetarioView initialRecipes={data} />
    </div>
  );
}
