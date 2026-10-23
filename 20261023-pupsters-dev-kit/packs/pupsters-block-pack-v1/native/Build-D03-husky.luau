-- Generated from a PUPSTERS block-dog scene. Paste the whole file into the Roblox Studio Command Bar.
local Selection = game:GetService("Selection")
local groups = { "Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR", "Tail", "MouthBone" }
local colors = {
	["gray"] = Color3.new(0.3215686275, 0.337254902, 0.3843137255),
	["darkGray"] = Color3.new(0.2, 0.2156862745, 0.2549019608),
	["white"] = Color3.new(0.9843137255, 0.9764705882, 0.9411764706),
	["black"] = Color3.new(0.0784313725, 0.0862745098, 0.1058823529),
	["iceBlue"] = Color3.new(0.3333333333, 0.8196078431, 0.968627451),
	["iceWhite"] = Color3.new(0.8509803922, 0.9764705882, 1),
}
local parts = {
	{ name = "ShortTorso", group = "Body", kind = "box", size = Vector3.new(1.49, 1.17, 1.13), cframe = CFrame.new(0, 0.99, 0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "WhiteChest", group = "Body", kind = "box", size = Vector3.new(1, 0.76, 0.22), cframe = CFrame.new(0, 0.86, 0.02, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegFL_Leg", group = "LegFL", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(-0.67, 0.48, -0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "LegFL_Paw", group = "LegFL", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(-0.67, 0.18, -0.66, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegFR_Leg", group = "LegFR", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(0.67, 0.48, -0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "LegFR_Paw", group = "LegFR", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(0.67, 0.18, -0.66, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegBL_Leg", group = "LegBL", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(-0.67, 0.48, 0.93, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "LegBL_Paw", group = "LegBL", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(-0.67, 0.18, 0.87, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegBR_Leg", group = "LegBR", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(0.67, 0.48, 0.93, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "LegBR_Paw", group = "LegBR", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(0.67, 0.18, 0.87, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "BigHead", group = "Head", kind = "box", size = Vector3.new(2.16, 1.57, 1.49), cframe = CFrame.new(0, 1.43, -0.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "EarL", group = "Head", kind = "wedge", size = Vector3.new(0.4, 0.85, 0.77), cframe = CFrame.new(-0.76, 2.28, -0.48, -5.103411967e-12, 0, -1, 0, 1, 0, 1, 0, -5.103411967e-12), material = "darkGray" },
	{ name = "EarInnerL", group = "Head", kind = "wedge", size = Vector3.new(0.065, 0.48, 0.41), cframe = CFrame.new(-0.78, 2.31, -0.713, -5.103411967e-12, 0, -1, 0, 1, 0, 1, 0, -5.103411967e-12), material = "white" },
	{ name = "EarIceCapL", group = "Head", kind = "wedge", size = Vector3.new(0.42, 0.3, 0.48), cframe = CFrame.new(-0.76, 2.59, -0.48, -5.103411967e-12, 0, -1, 0, 1, 0, 1, 0, -5.103411967e-12), material = "iceBlue" },
	{ name = "EarIceGlintL", group = "Head", kind = "wedge", size = Vector3.new(0.43, 0.15, 0.31), cframe = CFrame.new(-0.76, 2.7, -0.48, -5.103411967e-12, 0, -1, 0, 1, 0, 1, 0, -5.103411967e-12), material = "iceWhite" },
	{ name = "EarR", group = "Head", kind = "wedge", size = Vector3.new(0.4, 0.85, 0.77), cframe = CFrame.new(0.76, 2.28, -0.48, -5.103411967e-12, 0, 1, 0, 1, 0, -1, 0, -5.103411967e-12), material = "darkGray" },
	{ name = "EarInnerR", group = "Head", kind = "wedge", size = Vector3.new(0.065, 0.48, 0.41), cframe = CFrame.new(0.78, 2.31, -0.713, -5.103411967e-12, 0, 1, 0, 1, 0, -1, 0, -5.103411967e-12), material = "white" },
	{ name = "EarIceCapR", group = "Head", kind = "wedge", size = Vector3.new(0.42, 0.3, 0.48), cframe = CFrame.new(0.76, 2.59, -0.48, -5.103411967e-12, 0, 1, 0, 1, 0, -1, 0, -5.103411967e-12), material = "iceBlue" },
	{ name = "EarIceGlintR", group = "Head", kind = "wedge", size = Vector3.new(0.43, 0.15, 0.31), cframe = CFrame.new(0.76, 2.7, -0.48, -5.103411967e-12, 0, 1, 0, 1, 0, -1, 0, -5.103411967e-12), material = "iceWhite" },
	{ name = "DotEyeL", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(-0.47, 1.55, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "DotEyeR", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(0.47, 1.55, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "MaskBlaze", group = "Head", kind = "box", size = Vector3.new(0.46, 0.68, 0.08), cframe = CFrame.new(0, 1.84, -1.292, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "MaskSlashL", group = "Head", kind = "box", size = Vector3.new(0.48, 0.24, 0.08), cframe = CFrame.new(-0.34, 1.83, -1.294, 0.9130889403, 0.4077604531, 0, -0.4077604531, 0.9130889403, 0, 0, 0, 1), material = "white" },
	{ name = "MaskSlashR", group = "Head", kind = "box", size = Vector3.new(0.48, 0.24, 0.08), cframe = CFrame.new(0.34, 1.83, -1.294, 0.9130889403, -0.4077604531, 0, 0.4077604531, 0.9130889403, 0, 0, 0, 1), material = "white" },
	{ name = "WhiteMuzzle", group = "Head", kind = "box", size = Vector3.new(1.75, 0.5, 0.19), cframe = CFrame.new(0, 1.01, -1.32, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "SquareNose", group = "Head", kind = "box", size = Vector3.new(0.3, 0.17, 0.08), cframe = CFrame.new(0, 1.14, -1.45, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "MouthCenter", group = "Head", kind = "box", size = Vector3.new(0.038, 0.14, 0.045), cframe = CFrame.new(0, 0.998, -1.435, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "SmallMouth", group = "Head", kind = "box", size = Vector3.new(0.23, 0.035, 0.045), cframe = CFrame.new(0, 0.935, -1.435, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "CheekFrostL", group = "Head", kind = "wedge", size = Vector3.new(0.12, 0.2, 0.16), cframe = CFrame.new(-0.76, 1.17, -1.43, -5.103411967e-12, 0, -1, 0, 1, 0, 1, 0, -5.103411967e-12), material = "iceBlue" },
	{ name = "CheekFrostR", group = "Head", kind = "wedge", size = Vector3.new(0.12, 0.2, 0.16), cframe = CFrame.new(0.76, 1.17, -1.43, -5.103411967e-12, 0, 1, 0, 1, 0, -1, 0, -5.103411967e-12), material = "iceBlue" },
	{ name = "TailRoot", group = "Tail", kind = "box", size = Vector3.new(0.42, 0.46, 0.4), cframe = CFrame.new(0, 1.53, 1.17, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "TailWhiteBand", group = "Tail", kind = "box", size = Vector3.new(0.42, 0.24, 0.4), cframe = CFrame.new(0, 1.84, 1.17, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "TailIceTip", group = "Tail", kind = "wedge", size = Vector3.new(0.42, 0.25, 0.4), cframe = CFrame.new(0, 2.08, 1.17, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "iceBlue" },
	{ name = "TailIceGlint", group = "Tail", kind = "wedge", size = Vector3.new(0.28, 0.13, 0.41), cframe = CFrame.new(0, 2.17, 1.17, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "iceWhite" },
}
local mouthPartIndex = 27
local mouthWorld = Vector3.new(0, 0.84, -1.48)

local model = Instance.new("Model")
model.Name = "Husky_Block"
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
