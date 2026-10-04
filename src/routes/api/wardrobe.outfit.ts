import { createFileRoute } from "@tanstack/react-router";
import { GATEWAY, IMAGE_MODEL, verifyUser } from "@/lib/wardrobe-ai.server";

export const Route = createFileRoute("/api/wardrobe/outfit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyUser(request))) return new Response("Please sign in", { status: 401 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });

        const incoming = await request.formData();
        const images = incoming.getAll("image[]").filter((value): value is File => value instanceof File);
        if (images.length < 1 || images.length > 2) {
          return new Response("Choose one top, one pair of trousers, or both", { status: 400 });
        }

        const descriptions = incoming
          .getAll("description")
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.slice(0, 120));
        const presentation = incoming.get("presentation") === "man" ? "man" : "woman";
        const hairRaw = incoming.get("hairColor");
        const hairColor = typeof hairRaw === "string" && /^[a-z -]{3,24}$/i.test(hairRaw.trim()) ? hairRaw.trim().toLowerCase() : null;
        const streaming = incoming.get("stream") !== "false";
        const referenceRoles = descriptions.map((description, index) => `Reference ${index + 1}: ${description}.`).join(" ");
        const hairClause = hairColor ? ` The person has ${hairColor} hair.` : "";

        const form = new FormData();
        for (const image of images) form.append("image[]", image);
        form.set("model", IMAGE_MODEL);
        form.set(
          "prompt",
          `Create a realistic full-body street-style fashion photograph of one adult ${presentation} wearing the exact clothing shown in the reference images.${hairClause} ${referenceRoles} Preserve each garment's colour, cut, fabric appearance, pattern, print, logos, and visible details as closely as possible. The clothing must look naturally worn together and remain the clear focus. Neutral daylight, simple city background, natural standing pose, head-to-toe composition, editorial fashion photography. Do not add text, labels, borders, or extra people.`,
        );
        form.set("quality", "medium");
        form.set("size", "1024x1536");
        form.set("background", "opaque");
        form.set("output_format", "png");
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
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});