import { createClient } from "@supabase/supabase-js";
import { createParser } from "eventsource-parser";

export const GATEWAY = "https://ai.gateway.lovable.dev";
export const CHAT_MODEL = "openai/gpt-6-astra";
export const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";

/** Returns the signed-in user's id from the request's bearer token, or null. */
export async function verifyUser(request: Request): Promise<string | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!token || !url || !key) return null;
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

export type Analysis = { kind: "top" | "trousers" | "shorts" | "shoes" | "socks" | "hat" | "belt"; description: string; color: string };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "description", "color"],
  properties: {
    kind: { type: "string", enum: ["top", "trousers", "shorts", "shoes", "socks", "hat", "belt"] },
    description: { type: "string", description: "Short everyday name with colour, e.g. 'dark jeans', 'pink t-shirt'" },
    color: { type: "string", description: "Main fabric colour as #rrggbb hex" },
  },
};

/** Streams a Responses call and returns the parsed analysis, or an error Response. */
export async function analyzeGarment(apiKey: string, image: string): Promise<Analysis | Response> {
  const res = await fetch(`${GATEWAY}/v1/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      text: { format: { type: "json_schema", name: "garment", strict: true, schema: SCHEMA } },
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Identify this piece of clothing. Tops include t-shirts, shirts, jumpers, hoodies, jackets. Trousers include full-length jeans, joggers, leggings and skirts. Shorts include shorts, culottes and mini skirts. Shoes include trainers, boots, sandals and heels. Socks include all socks and tights. Hats include caps, beanies and bucket hats. Belts are belts.",
            },
            { type: "input_image", image_url: image },
          ],
        },
      ],
    }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    return new Response(text || "AI request failed", { status: res.status });
  }
  let out = "";
  let failed: string | null = null;
  const parser = createParser({
    onEvent(ev) {
      try {
        const p = JSON.parse(ev.data);
        if (p.type === "response.output_text.delta") out += p.delta ?? "";
        if (p.type === "error" || p.type === "response.failed") failed = p.error?.message ?? p.response?.error?.message ?? "AI failed";
      } catch {
        /* ignore keep-alives */
      }
    },
  });
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(value);
  }
  if (failed) return new Response(failed, { status: 502 });
  try {
    const a = JSON.parse(out) as Analysis;
    if (!/^#[0-9a-f]{6}$/i.test(a.color)) a.color = a.kind === "top" ? "#e9e4da" : "#3a3d44";
    return a;
  } catch {
    return new Response("The AI couldn't recognise this item. Try a clearer photo.", { status: 422 });
  }
}
