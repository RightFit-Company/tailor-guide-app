# Realistic 3D fitting room and outfit builder

## What will change

- Replace the simple mannequin with a more natural, measurement-shaped 3D figure. Height, chest, waist, hips, inside leg, body type, and cup choice will influence its proportions.
- Give the figure a clearer human silhouette with shoulders, torso shaping, articulated-looking arms and legs, neck, head, hands, and feet, plus improved skin, fabric, lighting, shadows, and camera framing.
- Turn My Wardrobe into an outfit builder: choose one scanned top and one scanned pair of trousers, see both together on the same figure, swap either item, and clear individual pieces.
- Use each saved clothing cut-out on a curved, body-following garment surface so the real photographed item is visible while still reading as clothing around the figure.
- Add a prominent My Wardrobe invitation after measurements and in the fit result, explaining that saved scans can be combined and tried on.
- Keep the existing size checker, saved measurements, wardrobe scanning, sign-in, and item removal behavior.

## User experience

1. Enter measurements as today.
2. Continue to size checking, or open My Wardrobe from the new invitation.
3. In My Wardrobe, tap tops and trousers independently to assemble an outfit.
4. The 3D fitting room updates immediately and can be rotated and zoomed.
5. The chosen outfit stays selected while browsing the current wardrobe session.

## Technical details

- Keep the body generator procedural so it can respond continuously to measurements instead of forcing a fixed downloaded body shape.
- Expand the 3D viewer API to accept separate top and trouser selections, including their transparent cut-out image URLs.
- Generate curved garment geometry with UVs for the scanned images and retain a material-backed side/rear shell for believable depth.
- Derive stable body proportions from centimetres with sensible fallbacks and clamps for incomplete or unusual entries.
- Keep all visual work client-side; wardrobe images remain private and continue using their signed URLs.
- Add focused tests for the measurement-to-avatar proportion rules, then verify the full measurement-to-wardrobe outfit flow on desktop and mobile.

## Accuracy note

Measurements can create a proportionally realistic avatar, but they cannot recreate a person’s face, posture, body composition, or exact garment drape. The fitting room will present this as a visual preview rather than a photorealistic guarantee.
