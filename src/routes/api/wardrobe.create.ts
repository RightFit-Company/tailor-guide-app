import { createFileRoute } from "@tanstack/react-router";
import { GATEWAY, IMAGE_MODEL, verifyUser } from "@/lib/wardrobe-ai.server";
import { KINDS } from "@/lib/outfit-rules";

export const Route = createFileRoute("/api/wardrobe/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyUser(request))) return new Response("Please sign in", { status: 401 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        const incoming = await request.formData();
        const kind = String(incoming.get("kind") ?? "");
        const description = String(incoming.get("description") ?? "").trim().slice(0, 120);
        const color = String(incoming.get("color") ?? "").trim();
        if (!(KINDS as string[]).includes(kind)) return new Response("Pick a clothing type", { status: 400 });
        if (description.length < 3) return new Response("Describe the item", { status: 400 });
        if (!/^#[0-9a-f]{6}$/i.test(color)) return new Response("Pick a colour", { status: 400 });
        const streaming = incoming.get("stream") !== "false";
        const form = new FormData();
        form.set("model", IMAGE_MODEL);
        form.set(
          "prompt",
          `A single ${description} (${kind}), main fabric colour ${color}. Catalog product cut-out of the garment only: front-facing, perfectly upright, laid flat, no person, no hanger, no mannequin, no background, no shadow. Show the whole item edge to edge with even studio lighting and crisp fabric detail.`,
        );
        form.set("background", "transparent");
        form.set("output_format", "png");
        form.set("quality", "low");
        form.set("size", "1024x1024");
        if (streaming) {
          form.set("stream", "true");
          form.set("partial_images", "1");
        }
        const upstream = await fetch(`${GATEWAY}/v1/images/generations`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
        });
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
