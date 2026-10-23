-- Generated from a PUPSTERS block-dog scene. Paste the whole file into the Roblox Studio Command Bar.
local Selection = game:GetService("Selection")
local groups = { "Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR", "Tail", "MouthBone", "FX" }
local colors = {
	["coat"] = Color3.new(0.7843137255, 0.7137254902, 0.6117647059),
	["ear"] = Color3.new(0.6509803922, 0.5529411765, 0.4588235294),
	["white"] = Color3.new(1, 0.9607843137, 0.8705882353),
	["black"] = Color3.new(0.1294117647, 0.1215686275, 0.1333333333),
}
local parts = {
	{ name = "ShortTorso", group = "Body", kind = "box", size = Vector3.new(1.5, 1.05, 0.9), cframe = CFrame.new(0, 0.525, 0.3, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "coat" },
	{ name = "WhiteChest", group = "Body", kind = "box", size = Vector3.new(0.95, 0.64, 0.14), cframe = CFrame.new(0, 0.53, -0.2, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegFL_Leg", group = "LegFL", kind = "box", size = Vector3.new(0.56, 0.84, 0.48), cframe = CFrame.new(-0.68, 0.56, -0.42, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "coat" },
	{ name = "LegFL_Paw", group = "LegFL", kind = "box", size = Vector3.new(0.66, 0.3, 0.62), cframe = CFrame.new(-0.68, 0.15, -0.51, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegFR_Leg", group = "LegFR", kind = "box", size = Vector3.new(0.56, 0.84, 0.48), cframe = CFrame.new(0.68, 0.56, -0.42, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "coat" },
	{ name = "LegFR_Paw", group = "LegFR", kind = "box", size = Vector3.new(0.66, 0.3, 0.62), cframe = CFrame.new(0.68, 0.15, -0.51, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegBL_Leg", group = "LegBL", kind = "box", size = Vector3.new(0.75, 0.58, 0.8), cframe = CFrame.new(-0.8, 0.29, 0.45, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "coat" },
	{ name = "LegBL_Paw", group = "LegBL", kind = "box", size = Vector3.new(0.66, 0.3, 0.7), cframe = CFrame.new(-1, 0.15, 0.1, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegBR_Leg", group = "LegBR", kind = "box", size = Vector3.new(0.75, 0.58, 0.8), cframe = CFrame.new(0.8, 0.29, 0.45, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "coat" },
	{ name = "LegBR_Paw", group = "LegBR", kind = "box", size = Vector3.new(0.66, 0.3, 0.7), cframe = CFrame.new(1, 0.15, 0.1, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "BigHead", group = "Head", kind = "box", size = Vector3.new(2.55, 1.25, 1.45), cframe = CFrame.new(0, 1.51, -0.12, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "coat" },
	{ name = "WhiteBlaze", group = "Head", kind = "box", size = Vector3.new(0.34, 0.75, 0.045), cframe = CFrame.new(0, 1.75, -0.86, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "ForeheadFold", group = "Head", kind = "box", size = Vector3.new(0.3, 0.045, 0.04), cframe = CFrame.new(0, 1.99, -0.9, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "ear" },
	{ name = "EarL_Fold", group = "Head", kind = "box", size = Vector3.new(0.54, 0.24, 0.58), cframe = CFrame.new(-1.24, 2.05, -0.09, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "ear" },
	{ name = "EarL_Drop", group = "Head", kind = "box", size = Vector3.new(0.25, 0.37, 0.46), cframe = CFrame.new(-1.4, 1.81, -0.1, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "ear" },
	{ name = "DotEyeL", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(-0.6, 1.66, -0.86, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "PuffedCheekL", group = "Head", kind = "box", size = Vector3.new(1.02, 0.58, 0.46), cframe = CFrame.new(-0.54, 1.15, -1.03, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "EarR_Fold", group = "Head", kind = "box", size = Vector3.new(0.54, 0.24, 0.58), cframe = CFrame.new(1.24, 2.05, -0.09, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "ear" },
	{ name = "EarR_Drop", group = "Head", kind = "box", size = Vector3.new(0.25, 0.37, 0.46), cframe = CFrame.new(1.4, 1.81, -0.1, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "ear" },
	{ name = "DotEyeR", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(0.6, 1.66, -0.86, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "PuffedCheekR", group = "Head", kind = "box", size = Vector3.new(1.02, 0.58, 0.46), cframe = CFrame.new(0.54, 1.15, -1.03, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "SquareNose", group = "Head", kind = "box", size = Vector3.new(0.43, 0.2, 0.1), cframe = CFrame.new(0, 1.36, -1.3, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "MouthCenter", group = "Head", kind = "box", size = Vector3.new(0.28, 0.18, 0.05), cframe = CFrame.new(0, 0.95, -1.335, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "SmallTooth", group = "Head", kind = "box", size = Vector3.new(0.1, 0.13, 0.035), cframe = CFrame.new(0.07, 0.99, -1.37, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LowerJaw", group = "Head", kind = "box", size = Vector3.new(1.1, 0.18, 0.24), cframe = CFrame.new(0, 0.84, -1.08, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "TailStub", group = "Tail", kind = "box", size = Vector3.new(0.36, 0.3, 0.44), cframe = CFrame.new(0, 0.55, 0.96, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "coat" },
	{ name = "TailTip", group = "Tail", kind = "box", size = Vector3.new(0.374, 0.314, 0.16), cframe = CFrame.new(0, 0.55, 1.23, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
}
local mouthPartIndex = 23
local mouthWorld = Vector3.new(0, 0.93, -1.38)

local model = Instance.new("Model")
model.Name = "불돔"
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
