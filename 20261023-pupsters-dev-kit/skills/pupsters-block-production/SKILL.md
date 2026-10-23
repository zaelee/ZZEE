---
name: pupsters-block-production
description: Create or update Pupsters block-style dogs, enemies, motions, maps, Roblox models, and matching previews while preserving the project's art direction and cross-format consistency. Use for Pupsters asset-pack production or validation, not for unrelated Roblox projects.
---

# Pupsters Block Production

Produce a complete, inspectable asset-pack change while preserving existing source files and project decisions.

## Establish the change surface

Inspect the target pack's README, manifest or layout, editable JSON, generation tools, and validation reports before editing. Identify every derived output affected by the source change: model files, Roblox files, viewer data, previews, manifests, and checks.

Prefer the newest compatible pack as the baseline. Treat older 2D and proportion studies as historical design evidence unless the user explicitly asks to revive one.

## Preserve the visual language

- Use a large head, short body, slightly chubby proportions, blunt block silhouettes, black dot eyes, square tails, and square bones.
- Prefer the sitting pose for placeable dogs. Keep planted paws and return exactly to the rest pose after an attack.
- Keep the six identities distinct: Shiba white eyebrows and bone spit; Bulldog inflated cheeks and air; Husky frozen ear tips and cold breath; Beagle long ears and drool; Poodle one central zigzag at base level and multiple floating bolts only when upgraded; Border Collie two ears, ragged cardboard crown, and support bark.
- Do not add guns. Express attacks through the character's body, personality, or innate effect.

## Keep one source of truth

Find the authoritative editable input before changing a file. Static model packs read scene JSON, but the map's `tools/build_map.py` creates its scene/layout JSON, and motion builders create sampled animation JSON. Change the relevant generator parameters or functions when JSON is derived; otherwise the next build will erase a hand edit. Generate GLB/glTF/OBJ, Roblox XML, viewer data, and previews from the shared data rather than hand-fixing derived files independently.

For Roblox motion, preserve the established anchored-Part playback and BindableEvent interface. Do not introduce `Humanoid`, skeletal rigs, or uploaded `AnimationId` dependencies unless the user explicitly changes the architecture.

Keep units and axes consistent: one source unit equals one stud, +Y is up, and -Z is front. When editing the playroom map, preserve explicit waypoint and placement-slot identifiers and validate their CFrames after any transform.

## Build and validate

Follow the exact regeneration order in the target pack's README. Use the repository's existing builders and validators; do not add a new dependency when the current tools can perform the work.

Check the invariants affected by the change:

- editable JSON and every generated format describe the same parts, coordinates, materials, attachments, and frames;
- planted parts stay fixed, looping clips join cleanly, one-shot clips terminate correctly, and rest poses restore exactly;
- Roblox referents, PrimaryParts, BindableEvents, attributes, and embedded frame data are structurally valid;
- previews are rendered from the actual output geometry or frames;
- local links and downloadable paths resolve.

Report the commands run and their outcomes. State Roblox Studio, Luau runtime, or browser WebGL as unverified unless they were actually exercised in that environment.

## Maintain the product boundary

Describe asset roles as design intent. Do not claim path movement, health, damage, targeting, waves, placement economy, upgrades, team play, or victory logic unless those systems are implemented and verified.

Keep working names provisional when trademark clearance has not been established. External publishing is a separate action and requires the user's request; producing or validating a pack does not authorize release.

## Invocation examples

- `$pupsters-block-production Update one dog's attack and regenerate every affected format and preview.`
- `$pupsters-block-production Add an enemy that matches the existing block silhouettes, including Move, Hit, and Death clips.`
- `$pupsters-block-production Change the playroom placement pads while preserving the waypoint contract and Roblox metadata.`
