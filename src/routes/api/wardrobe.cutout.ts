import { createFileRoute } from "@tanstack/react-router";
import { GATEWAY, IMAGE_MODEL, verifyUser } from "@/lib/wardrobe-ai.server";

export const Route = createFileRoute("/api/wardrobe/cutout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyUser(request))) return new Response("Please sign in", { status: 401 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        const incoming = await request.formData();
        const image = incoming.get("image");
        if (!(image instanceof File)) return new Response("A photo is required", { status: 400 });
        const streaming = incoming.get("stream") !== "false";
        const form = new FormData();
        form.set("image", image);
        form.set("model", IMAGE_MODEL);
        form.set(
          "prompt",
          "Cut out only the clothing item, laid flat and facing front, centred. Remove the background, hanger, hands and anything else. Keep its exact colours, print, logos and shape.",
        );
        form.set("background", "transparent");
        form.set("output_format", "png");
        form.set("quality", "low");
        form.set("size", "1024x1024");
        if (streaming) {
          form.set("stream", "true");
          form.set("partial_images", "1");
        }
        const upstream = await fetch(`${GATEWAY}/v1/images/edits`, {
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
