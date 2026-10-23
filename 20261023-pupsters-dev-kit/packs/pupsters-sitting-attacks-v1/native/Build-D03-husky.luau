-- Generated from a PUPSTERS block-dog scene. Paste the whole file into the Roblox Studio Command Bar.
local Selection = game:GetService("Selection")
local groups = { "Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR", "Tail", "MouthBone", "FX" }
local colors = {
	["gray"] = Color3.new(0.3215686275, 0.337254902, 0.3843137255),
	["darkGray"] = Color3.new(0.2, 0.2156862745, 0.2549019608),
	["white"] = Color3.new(0.9843137255, 0.9764705882, 0.9411764706),
	["black"] = Color3.new(0.0784313725, 0.0862745098, 0.1058823529),
	["iceBlue"] = Color3.new(0.3333333333, 0.8196078431, 0.968627451),
	["iceWhite"] = Color3.new(0.8509803922, 0.9764705882, 1),
}
local parts = {
	{ name = "ShortTorso", group = "Body", kind = "box", size = Vector3.new(1.2, 1.15, 0.82), cframe = CFrame.new(0, 0.575, 0.15, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "SeatedRump", group = "Body", kind = "box", size = Vector3.new(1.45, 0.58, 1.05), cframe = CFrame.new(0, 0.29, 0.58, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "WhiteChest", group = "Body", kind = "box", size = Vector3.new(0.76, 0.7, 0.15), cframe = CFrame.new(0, 0.7, -0.335, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegFL_Leg", group = "LegFL", kind = "box", size = Vector3.new(0.38, 0.72, 0.42), cframe = CFrame.new(-0.38, 0.52, -0.48, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "LegFL_Paw", group = "LegFL", kind = "box", size = Vector3.new(0.44, 0.3, 0.58), cframe = CFrame.new(-0.38, 0.15, -0.59, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegFR_Leg", group = "LegFR", kind = "box", size = Vector3.new(0.38, 0.72, 0.42), cframe = CFrame.new(0.38, 0.52, -0.48, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "LegFR_Paw", group = "LegFR", kind = "box", size = Vector3.new(0.44, 0.3, 0.58), cframe = CFrame.new(0.38, 0.15, -0.59, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegBL_Leg", group = "LegBL", kind = "box", size = Vector3.new(0.58, 0.54, 0.75), cframe = CFrame.new(-0.67, 0.27, 0.5, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "LegBL_Paw", group = "LegBL", kind = "box", size = Vector3.new(0.52, 0.26, 0.66), cframe = CFrame.new(-0.82, 0.13, 0.1, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegBR_Leg", group = "LegBR", kind = "box", size = Vector3.new(0.58, 0.54, 0.75), cframe = CFrame.new(0.67, 0.27, 0.5, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "LegBR_Paw", group = "LegBR", kind = "box", size = Vector3.new(0.52, 0.26, 0.66), cframe = CFrame.new(0.82, 0.13, 0.1, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "BigHead", group = "Head", kind = "box", size = Vector3.new(1.94, 1.65, 1.4), cframe = CFrame.new(0, 1.7, -0.21, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "TallEarL", group = "Head", kind = "box", size = Vector3.new(0.54, 0.62, 0.55), cframe = CFrame.new(-0.67, 2.72, -0.16, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "darkGray" },
	{ name = "EarInnerL", group = "Head", kind = "box", size = Vector3.new(0.24, 0.36, 0.06), cframe = CFrame.new(-0.67, 2.67, -0.465, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "EarIceCapL", group = "Head", kind = "box", size = Vector3.new(0.58, 0.28, 0.59), cframe = CFrame.new(-0.67, 2.99, -0.16, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "iceBlue" },
	{ name = "EarIceFaceL", group = "Head", kind = "box", size = Vector3.new(0.28, 0.12, 0.06), cframe = CFrame.new(-0.67, 2.99, -0.485, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "iceWhite" },
	{ name = "TallEarR", group = "Head", kind = "box", size = Vector3.new(0.54, 0.62, 0.55), cframe = CFrame.new(0.67, 2.72, -0.16, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "darkGray" },
	{ name = "EarInnerR", group = "Head", kind = "box", size = Vector3.new(0.24, 0.36, 0.06), cframe = CFrame.new(0.67, 2.67, -0.465, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "EarIceCapR", group = "Head", kind = "box", size = Vector3.new(0.58, 0.28, 0.59), cframe = CFrame.new(0.67, 2.99, -0.16, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "iceBlue" },
	{ name = "EarIceFaceR", group = "Head", kind = "box", size = Vector3.new(0.28, 0.12, 0.06), cframe = CFrame.new(0.67, 2.99, -0.485, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "iceWhite" },
	{ name = "DotEyeL", group = "Head", kind = "sphere", size = Vector3.new(0.13, 0.16, 0.05), cframe = CFrame.new(-0.4, 1.79, -0.935, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "DotEyeR", group = "Head", kind = "sphere", size = Vector3.new(0.13, 0.16, 0.05), cframe = CFrame.new(0.4, 1.79, -0.935, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "MaskBlaze", group = "Head", kind = "box", size = Vector3.new(0.44, 0.55, 0.08), cframe = CFrame.new(0, 2.18, -0.95, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "MaskTempleL", group = "Head", kind = "box", size = Vector3.new(0.34, 0.22, 0.08), cframe = CFrame.new(-0.42, 2.12, -0.95, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "MaskTempleR", group = "Head", kind = "box", size = Vector3.new(0.34, 0.22, 0.08), cframe = CFrame.new(0.42, 2.12, -0.95, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "WhiteCheekL", group = "Head", kind = "box", size = Vector3.new(0.48, 0.34, 0.11), cframe = CFrame.new(-0.56, 1.38, -0.965, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "WhiteCheekR", group = "Head", kind = "box", size = Vector3.new(0.48, 0.34, 0.11), cframe = CFrame.new(0.56, 1.38, -0.965, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "WhiteMuzzle", group = "Head", kind = "box", size = Vector3.new(1.34, 0.44, 0.18), cframe = CFrame.new(0, 1.22, -1.01, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "SquareNose", group = "Head", kind = "box", size = Vector3.new(0.28, 0.16, 0.08), cframe = CFrame.new(0, 1.33, -1.14, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "MouthCenter", group = "Head", kind = "box", size = Vector3.new(0.038, 0.13, 0.045), cframe = CFrame.new(0, 1.205, -1.105, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "SmallMouth", group = "Head", kind = "box", size = Vector3.new(0.22, 0.035, 0.045), cframe = CFrame.new(0, 1.16, -1.105, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "CheekFrostL", group = "Head", kind = "box", size = Vector3.new(0.12, 0.12, 0.08), cframe = CFrame.new(-0.82, 1.32, -0.988, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "iceBlue" },
	{ name = "CheekFrostR", group = "Head", kind = "box", size = Vector3.new(0.12, 0.12, 0.08), cframe = CFrame.new(0.82, 1.32, -0.988, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "iceBlue" },
	{ name = "TailRoot", group = "Tail", kind = "box", size = Vector3.new(0.36, 0.34, 0.42), cframe = CFrame.new(0.68, 0.42, 0.9, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "gray" },
	{ name = "TailWhiteBand", group = "Tail", kind = "box", size = Vector3.new(0.3, 0.28, 0.4), cframe = CFrame.new(0.86, 0.28, 0.92, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "TailIceTip", group = "Tail", kind = "box", size = Vector3.new(0.34, 0.24, 0.42), cframe = CFrame.new(1.03, 0.18, 0.94, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "iceBlue" },
	{ name = "TailIceFace", group = "Tail", kind = "box", size = Vector3.new(0.18, 0.08, 0.44), cframe = CFrame.new(1.03, 0.1, 0.94, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "iceWhite" },
}
local mouthPartIndex = 30
local mouthWorld = Vector3.new(0, 1.16, -1.105)

local model = Instance.new("Model")
model.Name = "머스키"
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
