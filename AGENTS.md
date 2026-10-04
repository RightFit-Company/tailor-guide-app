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

- Fit logic is pure frontend in src/lib/fit.ts (ease thresholds in cm). Body measurements live in localStorage and, when signed in, sync to the per-user `body_profiles` row (RLS own-row); why: measurements follow the account across devices.
- Wardrobe (/wardrobe) is the only backend feature: Cloud auth, `wardrobe_items` table + private `wardrobe` bucket (paths `{userId}/...`), RLS per user; why: wardrobe must follow the user across devices.
- Wardrobe AI runs in bearer-verified server routes under src/routes/api/wardrobe.* (analyze = Responses JSON schema, cutout = image edit with transparent background); why: keeps the AI key server-side.
- Outfit previews use selected wardrobe cut-outs, the Woman/Man choice, and rounded height/chest/waist/hips (cm, range-validated server-side) for a rough body shape; the UI labels body matching as beta.
- Wardrobe cut-outs are normalized to a front-facing upright orientation before they are saved; why: catalog items must remain consistently oriented regardless of camera rotation.

- Shorts are a third garment kind everywhere (fit checker, find-my-size, wardrobe); they use the trouser ease bands and waist/hips measurements, and brand charts fall back to the trouser chart when a brand has no separate shorts chart — why: shorts fit like trousers at the waist/hips and brands rarely publish separate shorts measurements.
- Surprise-me outfits: /api/wardrobe/pick (bearer-verified) asks the chat model to choose wardrobe item ids for a style, then the normal outfit photo route renders them; why: AI picks only from the user's own items.
