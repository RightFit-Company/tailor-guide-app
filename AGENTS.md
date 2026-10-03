<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Fit logic is pure frontend in src/lib/fit.ts (ease thresholds in cm); no backend needed for fit checks. Body measurements persist in localStorage only.
- Wardrobe (/wardrobe) is the only backend feature: Cloud auth, `wardrobe_items` table + private `wardrobe` bucket (paths `{userId}/...`), RLS per user; why: wardrobe must follow the user across devices.
- Wardrobe AI runs in bearer-verified server routes under src/routes/api/wardrobe.* (analyze = Responses JSON schema, cutout = image edit with transparent background); why: keeps the AI key server-side.
- The fitting-room avatar is generated procedurally from local measurements and accepts separate top/trouser cut-outs; why: proportions and outfits must update instantly without storing body data online.
