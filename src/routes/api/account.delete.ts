import { createFileRoute } from "@tanstack/react-router";
import { verifyUser } from "@/lib/wardrobe-ai.server";

export const Route = createFileRoute("/api/account/delete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await verifyUser(request);
        if (!userId) return new Response("Please sign in", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // Remove every file in the user's private folder, then their rows, then the account.
        for (;;) {
          const { data } = await supabaseAdmin.storage.from("wardrobe").list(userId, { limit: 100 });
          if (!data || data.length === 0) break;
          await supabaseAdmin.storage.from("wardrobe").remove(data.map((f) => `${userId}/${f.name}`));
          if (data.length < 100) break;
        }
        await supabaseAdmin.from("wardrobe_items").delete().eq("user_id", userId);
        await supabaseAdmin.from("body_profiles").delete().eq("user_id", userId);
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) return new Response("Couldn't delete your account. Please try again.", { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
