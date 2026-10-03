import { createFileRoute } from "@tanstack/react-router";
import { analyzeGarment, verifyUser } from "@/lib/wardrobe-ai.server";

export const Route = createFileRoute("/api/wardrobe/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyUser(request))) return new Response("Please sign in", { status: 401 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        const { image } = (await request.json()) as { image?: string };
        if (typeof image !== "string" || !image.startsWith("data:image/")) {
          return new Response("A photo is required", { status: 400 });
        }
        const result = await analyzeGarment(apiKey, image);
        if (result instanceof Response) return result;
        return Response.json(result);
      },
    },
  },
});
