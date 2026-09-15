# OSSEscape Prop Asset Manifest

This folder contains curated, game-ready prop images copied from source drops.
Original source folders are preserved so new art can be re-sorted without losing
the delivered files.

## Folder Rules

- `items/`
  Inventory items and reusable puzzle tools.

- `documents/`
  Readable papers, reports, meeting notes, printed logs, and clue documents.

- `effects/`
  Scene overlays, red beans, monitor states, lights, boxes, and ambient props.

- `ui/`
  System popups, stamps, approvals, and interface-like artwork.

- `minigame/`
  Sprites used only inside minigame overlays.

- `misc_layers/`
  Unclassified original layers kept for future sorting.

## Current Important Assets

- `items/security_access_card.png`
  Guard room access card.

- `items/second_floor_auth_card.png`
  Card acquired after the Simdaeri meeting room boss.

- `items/usb_drive.png`
  USB picked up in the CEO office ending route.

- `items/crowbar.png`
  Design room tool used for the CEO office door route.

- `documents/meeting_minutes.png`
  Meeting room document clue.

- `effects/single_red_bean.png`
  Small red bean prop used in meeting room staging.

- `effects/red_warning_light.png`
  Emergency light overlay.

## Current Scene Placements

The active prop placement table lives in `game.js` as `PROP_OVERLAYS`.
Props are now intentionally conservative: most document/effect props appear
only after the player clicks or triggers the related object. Inventory items
that the player can pick up may remain visible before collection.

- `guard_room`, `guard_room_desk_zoom`
  Monitor glow and CCTV static appear after investigation. Security card is
  visible before pickup. Red bean pile appears after the chair escalation.

- `warehouse_01`, `warehouse_boxes_zoom`, `warehouse_office_zoom`
  Emergency light is a story state. Inventory list, torn memo, inspection
  report, safety guideline, box contents, and red bean effects appear after
  related clicks or parcel progress.

- `office_01`, `office_inner_01`
  Red beans are the active floor puzzle. Printer output and messenger logs
  appear only after inspecting the relevant devices.

- `meeting_room_01`
  Meeting minutes appear after the table is inspected. The single red bean is
  the boss seed, and the second-floor auth card appears after Simdaeri is clear.

- `design_studio`
  Crowbar appears as a pickup inside the studio. UV/filter/training props are
  shown only after related inspection flags.

- `ceo_door_front`, `ceo_office`
  Crowbar appears only while the door is still blocked. USB appears before
  pickup; recovery log icon appears after the USB is obtained.

## Runtime Optimization

Scene photos and major character PNGs keep their editable originals in
`assets/photos/` and `png/`. The game loads smaller runtime copies from
`assets/runtime/photos/` and `assets/runtime/characters/` so shared NAS startup
is faster on slower PCs.

To rebuild the runtime copies after replacing photos or boss sprites, run:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\optimize-runtime-assets.ps1 -Root .
```

The photo optimizer stretches each scene image to the same 1280x720 framing used
by the game canvas. This preserves the existing hotspot coordinate layout.

## Notes

Some source filenames from `20260709/png` did not match their actual image
content. The curated files in this folder are named by visual inspection, not by
the original filename.
