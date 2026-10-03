# Replace 3D Try-On with AI Outfit Photos

## What will change

- Turn My Wardrobe into a simple 2D catalog of the scanned clothing cut-outs.
- Let the user tap one top and one pair of trousers to select or deselect them, with a clear selected state.
- Show the chosen pieces together in an outfit summary, while keeping item removal available.
- Add a **Create outfit photo** action that generates a realistic photo of an adult wearing the selected clothes.
- Use the actual scanned cut-outs as image references so the generated outfit keeps their colours, shape, patterns, and visible details as closely as possible.
- Show blurred progress frames while the photo is being made, then reveal the completed image and allow a fresh version to be generated.
- Remove the 3D model, 3D rail, measurement-avatar code, and now-unused 3D packages.

## Experience

1. Scan a clothing item; AI identifies and cuts it out as it does now.
2. The item appears in a two-column or wider responsive catalog.
3. Tap a top and/or trousers to select the outfit.
4. Tap **Create outfit photo**.
5. A realistic AI-created fashion photo appears below the selected pieces.

The subject presentation will follow the existing Woman/Man profile choice, without sending body measurements.

## Technical details

- Add a signed-in image-edit endpoint under the existing wardrobe API routes.
- Send selected cut-out image files in top-then-trousers order with a prompt assigning each reference its role.
- Continue using the configured image model and streaming image helper; errors from the image service will be shown directly.
- Generated previews remain temporary in the current screen; scanned wardrobe items continue to be saved to the user’s private wardrobe.

## Verification

- Check the signed-out wardrobe page and authenticated catalog flow where a test session is available.
- Verify desktop and mobile layouts, selection states, empty states, generation progress, and image errors.
- Run the relevant tests and confirm the preview build is healthy.