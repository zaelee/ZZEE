# Roblox sitting attack playback

`D01-attack.rbxmx` through `D06-attack.rbxmx` contain one sitting dog, an `Attack` BindableEvent, and a baked `AttackPlayback` Script. Import a file with **Workspace → Insert From File…**, then play the experience and fire one attack from another server Script:

```lua
workspace["시바멈"].Attack:Fire()
```

Each individual model has the `AutoPreview` attribute set to `false`. Set it to `true` for a repeating preview. `Pupsters-Sitting-Attacks-Demo.rbxmx` contains all six dogs in a 3×2 layout with `AutoPreview` enabled.

Playback uses the planted `LegFL_Paw` as a placement anchor, so moving or rotating the whole imported dog before firing still preserves the baked pose. It interpolates transforms and size on `RunService.Heartbeat`, switches effect visibility at frame boundaries, and restores every animated part's prior CFrame, Size, and Transparency at the end. The existing Mouth attachment stays parented to its animated head part.

The scripts provide visual playback only. They contain no damage, targeting, RemoteEvents, skeletal rig, or `AnimationTrack`. The generated `validation.json` records schema and static output checks. Roblox Studio and Luau runtime playback remain untested.

API behavior used by the player follows Roblox Creator Hub documentation for [CFrame inverse and interpolation](https://create.roblox.com/docs/reference/engine/datatypes/CFrame), [RunService.Heartbeat](https://create.roblox.com/docs/reference/engine/classes/RunService), and [BindableEvent](https://create.roblox.com/docs/reference/engine/classes/BindableEvent).
