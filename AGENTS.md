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
- Outfit previews are generated from selected private wardrobe cut-outs and the local Woman/Man profile choice; body measurements remain local and are never sent for image generation.
- Wardrobe cut-outs are normalized to a front-facing upright orientation before they are saved; why: catalog items must remain consistently oriented regardless of camera rotation.

- Shorts are a third garment kind everywhere (fit checker, find-my-size, wardrobe); they use the trouser ease bands and waist/hips measurements, and brand charts fall back to the trouser chart when a brand has no separate shorts chart — why: shorts fit like trousers at the waist/hips and brands rarely publish separate shorts measurements.
