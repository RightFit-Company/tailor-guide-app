import { createFileRoute } from "@tanstack/react-router";
import { OUTFIT_STYLES, pickOutfit, verifyUser, type OutfitStyle, type PickItem } from "@/lib/wardrobe-ai.server";

export const Route = createFileRoute("/api/wardrobe/pick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyUser(request))) return new Response("Please sign in", { status: 401 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        const body = (await request.json().catch(() => null)) as { style?: string; items?: PickItem[] } | null;
        const style = body?.style as OutfitStyle;
        if (!OUTFIT_STYLES.includes(style)) return new Response("Choose a style", { status: 400 });
        const items = (Array.isArray(body?.items) ? body!.items : [])
          .filter((i) => i && typeof i.id === "string" && typeof i.kind === "string" && typeof i.description === "string")
          .slice(0, 200)
          .map((i) => ({ id: i.id.slice(0, 64), kind: i.kind.slice(0, 16), description: i.description.slice(0, 120) }));
        if (items.length === 0) return new Response("Your wardrobe is empty", { status: 400 });
        const result = await pickOutfit(apiKey, style, items);
        if (result instanceof Response) return result;
        return Response.json({ ids: result });
      },
    },
  },
});
