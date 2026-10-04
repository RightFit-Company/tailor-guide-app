import { createFileRoute } from "@tanstack/react-router";
import { GATEWAY, IMAGE_MODEL, verifyUser } from "@/lib/wardrobe-ai.server";
import { outfitHairClause } from "@/lib/wardrobe-prompts";
import { avatarEyeClause, avatarPersonPhrase, normalizeAvatar } from "@/lib/avatar";

export const Route = createFileRoute("/api/wardrobe/outfit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyUser(request))) return new Response("Please sign in", { status: 401 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });

        const incoming = await request.formData();
        const images = incoming.getAll("image[]").filter((value): value is File => value instanceof File);
        if (images.length < 1 || images.length > 9) {
          return new Response("Choose between 1 and 9 items", { status: 400 });
        }

        const descriptions = incoming
          .getAll("description")
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.slice(0, 120));
        const presentation = incoming.get("presentation") === "man" ? "man" : "woman";
        const avatar = normalizeAvatar({ gender: presentation, skin: incoming.get("skin"), hair: incoming.get("hairColor"), eyes: incoming.get("eyes") });
        const hairColor = avatar.hair;
        const num = (k: string, min: number, max: number) => {
          const n = Number(incoming.get(k));
          return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null;
        };
        const sizes = [
          ["height", num("height", 120, 230)],
          ["chest", num("chest", 60, 180)],
          ["waist", num("waist", 50, 180)],
          ["hips", num("hips", 60, 190)],
        ].filter(([, v]) => v != null).map(([k, v]) => `${k} about ${v} cm`);
        const bodyClause = sizes.length ? ` Give the person a realistic body shape and build roughly matching these measurements: ${sizes.join(", ")}. Show the clothes fitting that body naturally.` : "";
        const streaming = incoming.get("stream") !== "false";
        const referenceRoles = descriptions.map((description, index) => `Reference ${index + 1}: ${description}.`).join(" ");
        const hairClause = outfitHairClause(hairColor) + avatarEyeClause(avatar);

        const form = new FormData();
        for (const image of images) form.append("image[]", image);
        form.set("model", IMAGE_MODEL);
        form.set(
          "prompt",
          `Create a realistic full-body street-style fashion photograph of ${avatarPersonPhrase(avatar)} wearing every clothing item and accessory shown in the reference images.${hairClause}${bodyClause} ${referenceRoles} Preserve each garment's colour, cut, fabric appearance, pattern, print, logos, and visible details as closely as possible. Hats go on the head, belts at the waist, socks on the feet and visible, shoes on the feet. A dress is worn on its own with no other top or bottoms. Leggings go under a skirt. A coat or blazer is worn open or closed over the top or dress so the outfit underneath is still partly visible. The clothing must look naturally worn together and remain the clear focus. Neutral daylight, simple city background, natural standing pose, head-to-toe composition, editorial fashion photography. Do not add text, labels, borders, or extra people.`,
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