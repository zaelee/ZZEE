-- Generated from scenes/block.json. Paste the whole file into the Roblox Studio Command Bar.
local Selection = game:GetService("Selection")
local groups = { "Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR", "Tail", "MouthBone" }
local colors = {
	["orange"] = Color3.new(0.9607843137, 0.6274509804, 0.2235294118),
	["cream"] = Color3.new(1, 0.9411764706, 0.8352941176),
	["black"] = Color3.new(0.1450980392, 0.1215686275, 0.1294117647),
	["white"] = Color3.new(1, 0.9882352941, 0.9568627451),
	["bone"] = Color3.new(0.9725490196, 0.8784313725, 0.6588235294),
	["inner"] = Color3.new(1, 0.8392156863, 0.6549019608),
}
local parts = {
	{ name = "ShortTorso", group = "Body", kind = "box", size = Vector3.new(1.49, 1.17, 1.13), cframe = CFrame.new(0, 0.99, 0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "CreamChest", group = "Body", kind = "box", size = Vector3.new(1, 0.76, 0.22), cframe = CFrame.new(0, 0.86, 0.02, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegFL_Leg", group = "LegFL", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(-0.67, 0.48, -0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "LegFL_Paw", group = "LegFL", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(-0.67, 0.18, -0.66, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegBL_Leg", group = "LegBL", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(-0.67, 0.48, 0.93, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "LegBL_Paw", group = "LegBL", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(-0.67, 0.18, 0.87, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegFR_Leg", group = "LegFR", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(0.67, 0.48, -0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "LegFR_Paw", group = "LegFR", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(0.67, 0.18, -0.66, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegBR_Leg", group = "LegBR", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(0.67, 0.48, 0.93, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "LegBR_Paw", group = "LegBR", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(0.67, 0.18, 0.87, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "BigHead", group = "Head", kind = "box", size = Vector3.new(2.16, 1.57, 1.49), cframe = CFrame.new(0, 1.43, -0.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "EarL", group = "Head", kind = "wedge", size = Vector3.new(0.4, 0.85, 0.77), cframe = CFrame.new(-0.76, 2.28, -0.48, 0, 0, -1, 0, 1, 0, 1, 0, 0), material = "orange" },
	{ name = "EarInnerL", group = "Head", kind = "wedge", size = Vector3.new(0.065, 0.5, 0.43), cframe = CFrame.new(-0.78, 2.34, -0.713, 0, 0, -1, 0, 1, 0, 1, 0, 0), material = "cream" },
	{ name = "CheekL", group = "Head", kind = "box", size = Vector3.new(1, 0.58, 0.38), cframe = CFrame.new(-0.43, 1.015, -1.265, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "EyeWhiteL", group = "Head", kind = "sphere", size = Vector3.new(0.4, 0.34, 0.14), cframe = CFrame.new(-0.5, 1.52, -1.283, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "EyePupilL", group = "Head", kind = "sphere", size = Vector3.new(0.2, 0.25, 0.1), cframe = CFrame.new(-0.465, 1.49, -1.375, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "EyeGlintL", group = "Head", kind = "sphere", size = Vector3.new(0.055, 0.065, 0.035), cframe = CFrame.new(-0.488, 1.55, -1.431, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "EyelidL", group = "Head", kind = "box", size = Vector3.new(0.43, 0.105, 0.1), cframe = CFrame.new(-0.5, 1.655, -1.38, 0.9950041653, -0.09983341665, 0, 0.09983341665, 0.9950041653, 0, 0, 0, 1), material = "black" },
	{ name = "BrowMarkL", group = "Head", kind = "sphere", size = Vector3.new(0.25, 0.14, 0.08), cframe = CFrame.new(-0.5, 1.88, -1.295, 0.9800665778, 0.1986693308, 0, -0.1986693308, 0.9800665778, 0, 0, 0, 1), material = "cream" },
	{ name = "EarR", group = "Head", kind = "wedge", size = Vector3.new(0.4, 0.85, 0.77), cframe = CFrame.new(0.76, 2.28, -0.48, 0, 0, 1, 0, 1, 0, -1, 0, 0), material = "orange" },
	{ name = "EarInnerR", group = "Head", kind = "wedge", size = Vector3.new(0.065, 0.5, 0.43), cframe = CFrame.new(0.78, 2.34, -0.713, 0, 0, 1, 0, 1, 0, -1, 0, 0), material = "cream" },
	{ name = "CheekR", group = "Head", kind = "box", size = Vector3.new(1, 0.58, 0.38), cframe = CFrame.new(0.43, 1.015, -1.265, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "EyeWhiteR", group = "Head", kind = "sphere", size = Vector3.new(0.4, 0.34, 0.14), cframe = CFrame.new(0.5, 1.52, -1.283, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "EyePupilR", group = "Head", kind = "sphere", size = Vector3.new(0.2, 0.25, 0.1), cframe = CFrame.new(0.535, 1.49, -1.375, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "EyeGlintR", group = "Head", kind = "sphere", size = Vector3.new(0.055, 0.065, 0.035), cframe = CFrame.new(0.512, 1.55, -1.431, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "EyelidR", group = "Head", kind = "box", size = Vector3.new(0.43, 0.105, 0.1), cframe = CFrame.new(0.5, 1.64, -1.38, 0.9713379749, 0.2377026264, 0, -0.2377026264, 0.9713379749, 0, 0, 0, 1), material = "black" },
	{ name = "BrowMarkR", group = "Head", kind = "sphere", size = Vector3.new(0.25, 0.14, 0.08), cframe = CFrame.new(0.5, 1.91, -1.295, 0.9800665778, -0.1986693308, 0, 0.1986693308, 0.9800665778, 0, 0, 0, 1), material = "cream" },
	{ name = "BigNose", group = "Head", kind = "sphere", size = Vector3.new(0.49, 0.3, 0.26), cframe = CFrame.new(0, 1.185, -1.52, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "MouthCenter", group = "Head", kind = "box", size = Vector3.new(0.055, 0.2, 0.065), cframe = CFrame.new(0, 0.975, -1.49, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "Smile-1", group = "Head", kind = "box", size = Vector3.new(0.32, 0.055, 0.065), cframe = CFrame.new(-0.155, 0.89, -1.465, 0.9950041653, 0.09983341665, 0, -0.09983341665, 0.9950041653, 0, 0, 0, 1), material = "black" },
	{ name = "Smile1", group = "Head", kind = "box", size = Vector3.new(0.32, 0.055, 0.065), cframe = CFrame.new(0.155, 0.89, -1.465, 0.9950041653, -0.09983341665, 0, 0.09983341665, 0.9950041653, 0, 0, 0, 1), material = "black" },
	{ name = "TailRoot", group = "Tail", kind = "box", size = Vector3.new(0.35, 0.66, 0.35), cframe = CFrame.new(0, 1.46, 1.035, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "TailCurl0", group = "Tail", kind = "box", size = Vector3.new(0.4178503477, 0.33, 0.36), cframe = CFrame.new(0.3645945237, 1.806556975, 1.035, 0.4090644493, -0.9125054939, 0, 0.9125054939, 0.4090644493, 0, 0, 0, 1), material = "orange" },
	{ name = "TailCurl1", group = "Tail", kind = "box", size = Vector3.new(0.4178503477, 0.33, 0.36), cframe = CFrame.new(0.3772482708, 2.101630283, 1.029, -0.3294436647, -0.9441752336, 0, 0.9441752336, -0.3294436647, 0, 0, 0, 1), material = "orange" },
	{ name = "TailCurl2", group = "Tail", kind = "box", size = Vector3.new(0.4178503477, 0.33, 0.36), cframe = CFrame.new(0.1837746163, 2.324781171, 1.023, -0.8879446805, -0.4599502629, 0, 0.4599502629, -0.8879446805, 0, 0, 0, 1), material = "orange" },
	{ name = "TailCurl3", group = "Tail", kind = "box", size = Vector3.new(0.4178503477, 0.33, 0.36), cframe = CFrame.new(-0.1101129752, 2.354080619, 1.017, -0.961275203, 0.2755902468, 0, -0.2755902468, -0.961275203, 0, 0, 0, 1), material = "orange" },
	{ name = "TailCurl4", group = "Tail", kind = "box", size = Vector3.new(0.4178503477, 0.33, 0.36), cframe = CFrame.new(-0.3438351446, 2.173519489, 1.011, -0.5093676394, 0.8605490154, 0, -0.8605490154, -0.5093676394, 0, 0, 0, 1), material = "orange" },
	{ name = "TailCurl5", group = "Tail", kind = "box", size = Vector3.new(0.4178503477, 0.33, 0.36), cframe = CFrame.new(-0.3896867514, 1.881755879, 1.005, 0.2208569796, 0.9753062055, 0, -0.9753062055, 0.2208569796, 0, 0, 0, 1), material = "cream" },
	{ name = "TailCurl6", group = "Tail", kind = "box", size = Vector3.new(0.4178503477, 0.33, 0.36), cframe = CFrame.new(-0.2226146056, 1.63820861, 0.999, 0.8304059618, 0.5571588091, 0, -0.5571588091, 0.8304059618, 0, 0, 0, 1), material = "cream" },
	{ name = "BoneShaft", group = "MouthBone", kind = "box", size = Vector3.new(0.78, 0.14, 0.17), cframe = CFrame.new(0, 0.82, -1.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "bone" },
	{ name = "BoneKnuckle-1_-1", group = "MouthBone", kind = "sphere", size = Vector3.new(0.25, 0.23, 0.23), cframe = CFrame.new(-0.43, 0.755, -1.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "bone" },
	{ name = "BoneKnuckle-1_1", group = "MouthBone", kind = "sphere", size = Vector3.new(0.25, 0.23, 0.23), cframe = CFrame.new(-0.43, 0.885, -1.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "bone" },
	{ name = "BoneKnuckle1_-1", group = "MouthBone", kind = "sphere", size = Vector3.new(0.25, 0.23, 0.23), cframe = CFrame.new(0.43, 0.755, -1.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "bone" },
	{ name = "BoneKnuckle1_1", group = "MouthBone", kind = "sphere", size = Vector3.new(0.25, 0.23, 0.23), cframe = CFrame.new(0.43, 0.885, -1.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "bone" },
}
local mouthPartIndex = 29
local mouthWorld = Vector3.new(0, 0.82, -1.53)

local model = Instance.new("Model")
model.Name = "Shiba_Block"
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
	part.Material = Enum.Material.SmoothPlastic
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
