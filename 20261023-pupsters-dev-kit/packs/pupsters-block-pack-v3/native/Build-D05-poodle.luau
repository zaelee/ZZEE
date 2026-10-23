-- Generated from a PUPSTERS block-dog scene. Paste the whole file into the Roblox Studio Command Bar.
local Selection = game:GetService("Selection")
local groups = { "Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR", "Tail", "MouthBone", "FX" }
local colors = {
	["peach"] = Color3.new(1, 0.7215686275, 0.3843137255),
	["cream"] = Color3.new(1, 0.9411764706, 0.7725490196),
	["black"] = Color3.new(0.1176470588, 0.1019607843, 0.1098039216),
	["yellow"] = Color3.new(1, 0.9254901961, 0.1058823529),
	["cyan"] = Color3.new(0.0784313725, 0.8, 0.9411764706),
	["electricWhite"] = Color3.new(1, 1, 0.91),
}
local parts = {
	{ name = "CompactTorso", group = "Body", kind = "box", size = Vector3.new(1.26, 0.98, 1.02), cframe = CFrame.new(0, 0.84, 0.52, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "BodyPuffL", group = "Body", kind = "box", size = Vector3.new(0.58, 0.48, 0.76), cframe = CFrame.new(-0.43, 1.32, 0.5, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "BodyPuffC", group = "Body", kind = "box", size = Vector3.new(0.62, 0.54, 0.8), cframe = CFrame.new(0, 1.39, 0.57, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "BodyPuffR", group = "Body", kind = "box", size = Vector3.new(0.58, 0.48, 0.76), cframe = CFrame.new(0.43, 1.32, 0.5, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegFL_Leg", group = "LegFL", kind = "box", size = Vector3.new(0.4, 0.68, 0.48), cframe = CFrame.new(-0.52, 0.47, -0.47, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "LegFL_Paw", group = "LegFL", kind = "box", size = Vector3.new(0.5, 0.3, 0.56), cframe = CFrame.new(-0.52, 0.15, -0.52, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegFR_Leg", group = "LegFR", kind = "box", size = Vector3.new(0.4, 0.68, 0.48), cframe = CFrame.new(0.52, 0.47, -0.47, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "LegFR_Paw", group = "LegFR", kind = "box", size = Vector3.new(0.5, 0.3, 0.56), cframe = CFrame.new(0.52, 0.15, -0.52, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegBL_Leg", group = "LegBL", kind = "box", size = Vector3.new(0.4, 0.52, 0.48), cframe = CFrame.new(-0.52, 0.39, 0.78, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "LegBL_Paw", group = "LegBL", kind = "box", size = Vector3.new(0.5, 0.3, 0.56), cframe = CFrame.new(-0.52, 0.15, 0.75, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegBR_Leg", group = "LegBR", kind = "box", size = Vector3.new(0.4, 0.52, 0.48), cframe = CFrame.new(0.52, 0.39, 0.78, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "LegBR_Paw", group = "LegBR", kind = "box", size = Vector3.new(0.5, 0.3, 0.56), cframe = CFrame.new(0.52, 0.15, 0.75, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "CoreHead", group = "Head", kind = "box", size = Vector3.new(1.68, 1.4, 1.34), cframe = CFrame.new(0, 1.43, -0.55, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "BroadHeadPuffL", group = "Head", kind = "box", size = Vector3.new(0.76, 0.48, 1.02), cframe = CFrame.new(-0.58, 2.15, -0.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "BroadHeadPuffC", group = "Head", kind = "box", size = Vector3.new(0.84, 0.58, 1.08), cframe = CFrame.new(0, 2.27, -0.54, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "BroadHeadPuffR", group = "Head", kind = "box", size = Vector3.new(0.76, 0.46, 1), cframe = CFrame.new(0.58, 2.12, -0.54, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "SideEarBaseL", group = "Head", kind = "box", size = Vector3.new(0.58, 0.9, 0.72), cframe = CFrame.new(-1.02, 1.36, -0.51, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "LargeEarPuffL", group = "Head", kind = "box", size = Vector3.new(0.7, 0.66, 0.78), cframe = CFrame.new(-1.2, 1.03, -0.51, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "SideEarBaseR", group = "Head", kind = "box", size = Vector3.new(0.58, 0.9, 0.72), cframe = CFrame.new(1.02, 1.36, -0.51, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "LargeEarPuffR", group = "Head", kind = "box", size = Vector3.new(0.7, 0.66, 0.78), cframe = CFrame.new(1.2, 1.03, -0.51, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "DotEyeL", group = "Head", kind = "sphere", size = Vector3.new(0.13, 0.16, 0.05), cframe = CFrame.new(-0.36, 1.48, -1.245, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "DotEyeR", group = "Head", kind = "sphere", size = Vector3.new(0.13, 0.16, 0.05), cframe = CFrame.new(0.36, 1.48, -1.245, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "CreamMuzzle", group = "Head", kind = "box", size = Vector3.new(1, 0.42, 0.2), cframe = CFrame.new(0, 1.03, -1.27, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "SquareNose", group = "Head", kind = "box", size = Vector3.new(0.27, 0.16, 0.09), cframe = CFrame.new(0, 1.12, -1.38, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "SmallMouth", group = "Head", kind = "box", size = Vector3.new(0.22, 0.04, 0.05), cframe = CFrame.new(0, 0.96, -1.4, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "ShortTail", group = "Tail", kind = "box", size = Vector3.new(0.32, 0.42, 0.36), cframe = CFrame.new(0, 1.43, 1.04, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "TailPuffL", group = "Tail", kind = "box", size = Vector3.new(0.4, 0.34, 0.44), cframe = CFrame.new(-0.14, 1.73, 1.04, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "TailPuffR", group = "Tail", kind = "box", size = Vector3.new(0.4, 0.356, 0.456), cframe = CFrame.new(0.14, 1.73, 1.04, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "FX_Left_Glow0", group = "FX", kind = "box", size = Vector3.new(0.2791249695, 0.115, 0.085), cframe = CFrame.new(-1.84, 2.036175849, -0.9113343308, 0.6246950476, 0.7808688094, 0, -0.5713530159, 0.4570824127, 0.68163876, 0.532270447, -0.4258163576, 0.7316888689), material = "cyan" },
	{ name = "FX_Left_Core0", group = "FX", kind = "box", size = Vector3.new(0.2641249695, 0.04, 0.024), cframe = CFrame.new(-1.84, 2.000730633, -0.949382152, 0.6246950476, 0.7808688094, 0, -0.5713530159, 0.4570824127, 0.68163876, 0.532270447, -0.4258163576, 0.7316888689), material = "electricWhite" },
	{ name = "FX_Left_Glow1", group = "FX", kind = "box", size = Vector3.new(0.2689674775, 0.115, 0.085), cframe = CFrame.new(-1.87, 1.922764074, -0.805680323, -0.894427191, 0.4472135955, 0, -0.3272212098, -0.6544424197, 0.68163876, 0.3048381207, 0.6096762414, 0.7316888689), material = "cyan" },
	{ name = "FX_Left_Core1", group = "FX", kind = "box", size = Vector3.new(0.2539674775, 0.04, 0.024), cframe = CFrame.new(-1.87, 1.887318858, -0.8437281442, -0.894427191, 0.4472135955, 0, -0.3272212098, -0.6544424197, 0.68163876, 0.3048381207, 0.6096762414, 0.7316888689), material = "electricWhite" },
	{ name = "FX_Left_Glow2", group = "FX", kind = "box", size = Vector3.new(0.331058436, 0.115, 0.085), cframe = CFrame.new(-1.89, 1.791060078, -0.6829853462, 0.5843047258, 0.8115343415, 0, -0.5937906443, 0.4275292639, 0.68163876, 0.5531732622, -0.3982847488, 0.7316888689), material = "cyan" },
	{ name = "FX_Left_Core2", group = "FX", kind = "box", size = Vector3.new(0.316058436, 0.04, 0.024), cframe = CFrame.new(-1.89, 1.755614862, -0.7210331674, 0.5843047258, 0.8115343415, 0, -0.5937906443, 0.4275292639, 0.68163876, 0.5531732622, -0.3982847488, 0.7316888689), material = "electricWhite" },
	{ name = "FX_Right_Glow0", group = "FX", kind = "box", size = Vector3.new(0.3271381265, 0.115, 0.085), cframe = CFrame.new(1.885, 2.022598367, 0.4704228476, 0.6904757467, 0.7233555441, 0, -0.5292711999, 0.5052134181, -0.68163876, -0.4930671762, 0.4706550318, 0.7316888689), material = "yellow" },
	{ name = "FX_Right_Core0", group = "FX", kind = "box", size = Vector3.new(0.3121381265, 0.04, 0.024), cframe = CFrame.new(1.885, 2.058043582, 0.4323750264, 0.6904757467, 0.7233555441, 0, -0.5292711999, 0.5052134181, -0.68163876, -0.4930671762, 0.4706550318, 0.7316888689), material = "electricWhite" },
	{ name = "FX_Right_Glow1", group = "FX", kind = "box", size = Vector3.new(0.2735992817, 0.115, 0.085), cframe = CFrame.new(1.88, 1.898211259, 0.3545442584, -0.8778955729, 0.4788521307, 0, -0.3503707739, -0.6423464187, -0.68163876, -0.3264041726, -0.5984076498, 0.7316888689), material = "yellow" },
	{ name = "FX_Right_Core1", group = "FX", kind = "box", size = Vector3.new(0.2585992817, 0.04, 0.024), cframe = CFrame.new(1.88, 1.933656475, 0.3164964372, -0.8778955729, 0.4788521307, 0, -0.3503707739, -0.6423464187, -0.68163876, -0.3264041726, -0.5984076498, 0.7316888689), material = "electricWhite" },
	{ name = "FX_Right_Glow2", group = "FX", kind = "box", size = Vector3.new(0.339227766, 0.115, 0.085), cframe = CFrame.new(1.86, 1.759190374, 0.225032894, 0.5692099788, 0.8221921916, 0, -0.6015888747, 0.4164846056, -0.68163876, -0.560438066, 0.3879955842, 0.7316888689), material = "yellow" },
	{ name = "FX_Right_Core2", group = "FX", kind = "box", size = Vector3.new(0.324227766, 0.04, 0.024), cframe = CFrame.new(1.86, 1.79463559, 0.1869850728, 0.5692099788, 0.8221921916, 0, -0.6015888747, 0.4164846056, -0.68163876, -0.560438066, 0.3879955842, 0.7316888689), material = "electricWhite" },
	{ name = "FX_Top_Glow0", group = "FX", kind = "box", size = Vector3.new(0.3835551275, 0.115, 0.085), cframe = CFrame.new(-0.33, 3.04113339, -0.642504268, 0.8320502943, 0.5547001962, 0, -0.3660927805, 0.5491391708, -0.7512804051, -0.4167353882, 0.6251030822, 0.6599831459), material = "yellow" },
	{ name = "FX_Top_Core0", group = "FX", kind = "box", size = Vector3.new(0.3685551275, 0.04, 0.024), cframe = CFrame.new(-0.33, 3.080199971, -0.6768233916, 0.8320502943, 0.5547001962, 0, -0.3660927805, 0.5491391708, -0.7512804051, -0.4167353882, 0.6251030822, 0.6599831459), material = "electricWhite" },
	{ name = "FX_Top_Glow1", group = "FX", kind = "box", size = Vector3.new(0.313, 0.115, 0.085), cframe = CFrame.new(-0.08, 3.044433305, -0.638747866, 0.6896551724, -0.724137931, 0, 0.4779188298, 0.4551607903, -0.7512804051, 0.5440306382, 0.5181244173, 0.6599831459), material = "yellow" },
	{ name = "FX_Top_Core1", group = "FX", kind = "box", size = Vector3.new(0.298, 0.04, 0.024), cframe = CFrame.new(-0.08, 3.083499886, -0.6730669896, 0.6896551724, -0.724137931, 0, 0.4779188298, 0.4551607903, -0.7512804051, 0.5440306382, 0.5181244173, 0.6599831459), material = "electricWhite" },
	{ name = "FX_Top_Glow2", group = "FX", kind = "box", size = Vector3.new(0.3891966685, 0.115, 0.085), cframe = CFrame.new(0.17, 3.044433305, -0.638747866, 0.8192319205, 0.5734623444, 0, -0.3784754821, 0.5406792601, -0.7512804051, -0.4308310224, 0.6154728892, 0.6599831459), material = "yellow" },
	{ name = "FX_Top_Core2", group = "FX", kind = "box", size = Vector3.new(0.3741966685, 0.04, 0.024), cframe = CFrame.new(0.17, 3.083499886, -0.6730669896, 0.8192319205, 0.5734623444, 0, -0.3784754821, 0.5406792601, -0.7512804051, -0.4308310224, 0.6154728892, 0.6599831459), material = "electricWhite" },
	{ name = "FX_SparkL", group = "FX", kind = "box", size = Vector3.new(0.09, 0.09, 0.07), cframe = CFrame.new(-1.48, 2.63, -0.87, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cyan" },
	{ name = "FX_SparkR", group = "FX", kind = "box", size = Vector3.new(0.09, 0.09, 0.07), cframe = CFrame.new(1.8, 2.5, 0.35, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cyan" },
}
local mouthPartIndex = 25
local mouthWorld = Vector3.new(0, 0.96, -1.4)

local model = Instance.new("Model")
model.Name = "무들"
local groupModels = {}
local builtParts = {}
for _, groupName in ipairs(groups) do
	local group = Instance.new("Model")
	group.Name = groupName
	group.Parent = model
	groupModels[groupName] = group
end

for index, data in ipairs(parts) do
	local part = Instance.new(data.kind == "wedge" and "WedgePart" or "Part")
	part.Name = data.name
	part.Anchored = true
	part.CanCollide = false
	part.Material = data.group == "FX" and Enum.Material.Neon or Enum.Material.SmoothPlastic
	part.Color = colors[data.material]
	part.Size = data.size
	part.CFrame = data.cframe
	if data.kind == "sphere" then
		part.Shape = Enum.PartType.Ball
	elseif data.kind == "cylinder" then
		part.Shape = Enum.PartType.Cylinder
	end
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.LeftSurface = Enum.SurfaceType.Smooth
	part.RightSurface = Enum.SurfaceType.Smooth
	part.FrontSurface = Enum.SurfaceType.Smooth
	part.BackSurface = Enum.SurfaceType.Smooth
	part.Parent = groupModels[data.group]
	builtParts[index] = part
end

local mouth = Instance.new("Attachment")
mouth.Name = "Mouth"
mouth.Position = builtParts[mouthPartIndex].CFrame:PointToObjectSpace(mouthWorld)
mouth.Parent = builtParts[mouthPartIndex]

-- Place the model on y=0 near the current camera focus, probing +X for open space.
local minCorner = Vector3.new(math.huge, math.huge, math.huge)
local maxCorner = Vector3.new(-math.huge, -math.huge, -math.huge)
for _, part in ipairs(builtParts) do
	local half = part.Size / 2
	local r, u, b = part.CFrame.RightVector, part.CFrame.UpVector, part.CFrame.ZVector
	local extent = Vector3.new(
		math.abs(r.X) * half.X + math.abs(u.X) * half.Y + math.abs(b.X) * half.Z,
		math.abs(r.Y) * half.X + math.abs(u.Y) * half.Y + math.abs(b.Y) * half.Z,
		math.abs(r.Z) * half.X + math.abs(u.Z) * half.Y + math.abs(b.Z) * half.Z
	)
	minCorner = minCorner:Min(part.Position - extent)
	maxCorner = maxCorner:Max(part.Position + extent)
end
local size = maxCorner - minCorner
local sourceCenter = (minCorner + maxCorner) / 2
local focus = workspace.CurrentCamera and workspace.CurrentCamera.Focus.Position or Vector3.zero
local base = Vector3.new(math.floor(focus.X / 4) * 4, size.Y / 2 + 0.05, math.floor(focus.Z / 4) * 4)
local overlap = OverlapParams.new()
overlap.FilterType = Enum.RaycastFilterType.Exclude
overlap.FilterDescendantsInstances = {}
local probeSize = Vector3.new(math.max(size.X, 0.1), math.max(size.Y - 0.1, 0.1), math.max(size.Z, 0.1))
local target = base
for attempt = 0, 20 do
	local candidate = base + Vector3.new(attempt * (size.X + 2), 0, 0)
	if #workspace:GetPartBoundsInBox(CFrame.new(candidate), probeSize, overlap) == 0 then
		target = candidate
		break
	end
end
model:PivotTo(CFrame.new(target))
model.Parent = workspace
Selection:Set({ model })
print(string.format("Created %s with %d parts", model:GetFullName(), #builtParts))
