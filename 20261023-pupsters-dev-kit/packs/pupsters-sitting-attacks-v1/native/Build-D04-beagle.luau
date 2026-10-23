-- Generated from a PUPSTERS block-dog scene. Paste the whole file into the Roblox Studio Command Bar.
local Selection = game:GetService("Selection")
local groups = { "Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR", "Tail", "MouthBone", "FX" }
local colors = {
	["orange"] = Color3.new(0.8823529412, 0.4901960784, 0.2),
	["brown"] = Color3.new(0.3215686275, 0.1843137255, 0.1254901961),
	["black"] = Color3.new(0.1058823529, 0.0901960784, 0.0980392157),
	["cream"] = Color3.new(1, 0.9568627451, 0.8705882353),
	["drool"] = Color3.new(0.568627451, 0.8588235294, 0.9568627451),
}
local parts = {
	{ name = "NarrowShortTorso", group = "Body", kind = "box", size = Vector3.new(1.18, 1.18, 0.88), cframe = CFrame.new(0, 0.87, 0.45, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "GroundedRump", group = "Body", kind = "box", size = Vector3.new(1.48, 0.48, 0.94), cframe = CFrame.new(0, 0.24, 0.7, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "BlackBackSaddle", group = "Body", kind = "box", size = Vector3.new(1.12, 0.55, 0.5), cframe = CFrame.new(0, 1.16, 0.65, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "WhiteChest", group = "Body", kind = "box", size = Vector3.new(0.7, 0.72, 0.2), cframe = CFrame.new(0, 0.74, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegFL_Leg", group = "LegFL", kind = "box", size = Vector3.new(0.38, 0.74, 0.5), cframe = CFrame.new(-0.45, 0.5, -0.22, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "LegFL_Paw", group = "LegFL", kind = "box", size = Vector3.new(0.48, 0.3, 0.58), cframe = CFrame.new(-0.45, 0.15, -0.38, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegFR_Leg", group = "LegFR", kind = "box", size = Vector3.new(0.38, 0.74, 0.5), cframe = CFrame.new(0.45, 0.5, -0.22, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "LegFR_Paw", group = "LegFR", kind = "box", size = Vector3.new(0.48, 0.3, 0.58), cframe = CFrame.new(0.45, 0.15, -0.38, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegBL_Leg", group = "LegBL", kind = "box", size = Vector3.new(0.58, 0.42, 0.72), cframe = CFrame.new(-0.68, 0.31, 0.56, 0.9928086359, -0.1197122073, 0, 0.1197122073, 0.9928086359, 0, 0, 0, 1), material = "orange" },
	{ name = "LegBL_Paw", group = "LegBL", kind = "box", size = Vector3.new(0.6, 0.26, 0.62), cframe = CFrame.new(-0.8, 0.13, 0.3, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegBR_Leg", group = "LegBR", kind = "box", size = Vector3.new(0.58, 0.42, 0.72), cframe = CFrame.new(0.68, 0.31, 0.56, 0.9928086359, 0.1197122073, 0, -0.1197122073, 0.9928086359, 0, 0, 0, 1), material = "orange" },
	{ name = "LegBR_Paw", group = "LegBR", kind = "box", size = Vector3.new(0.6, 0.26, 0.62), cframe = CFrame.new(0.8, 0.13, 0.3, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "NarrowHead", group = "Head", kind = "box", size = Vector3.new(1.8, 1.54, 1.42), cframe = CFrame.new(0, 1.62, -0.25, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "LongHangingEarL", group = "Head", kind = "box", size = Vector3.new(0.48, 1.28, 0.58), cframe = CFrame.new(-1.04, 1.51, -0.2, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "brown" },
	{ name = "SquareEarEndL", group = "Head", kind = "box", size = Vector3.new(0.58, 0.46, 0.62), cframe = CFrame.new(-1.04, 0.93, -0.2, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "brown" },
	{ name = "LongHangingEarR", group = "Head", kind = "box", size = Vector3.new(0.48, 1.28, 0.58), cframe = CFrame.new(1.04, 1.51, -0.2, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "brown" },
	{ name = "SquareEarEndR", group = "Head", kind = "box", size = Vector3.new(0.58, 0.46, 0.62), cframe = CFrame.new(1.04, 0.93, -0.2, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "brown" },
	{ name = "WhiteCenterStripe", group = "Head", kind = "box", size = Vector3.new(0.34, 0.94, 0.08), cframe = CFrame.new(0, 1.94, -0.98, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "DotEyeL", group = "Head", kind = "sphere", size = Vector3.new(0.13, 0.16, 0.05), cframe = CFrame.new(-0.38, 1.72, -0.975, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "DotEyeR", group = "Head", kind = "sphere", size = Vector3.new(0.13, 0.16, 0.05), cframe = CFrame.new(0.38, 1.72, -0.975, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "WhiteMuzzle", group = "Head", kind = "box", size = Vector3.new(1.16, 0.48, 0.2), cframe = CFrame.new(0, 1.2, -1.01, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "SquareNose", group = "Head", kind = "box", size = Vector3.new(0.28, 0.17, 0.09), cframe = CFrame.new(0, 1.32, -1.13, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "SmallMouth", group = "Head", kind = "box", size = Vector3.new(0.24, 0.04, 0.05), cframe = CFrame.new(0, 1.11, -1.12, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "ShortBlueDrool", group = "Head", kind = "box", size = Vector3.new(0.13, 0.21, 0.11), cframe = CFrame.new(0.31, 0.99, -1.16, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "drool" },
	{ name = "ShortTail", group = "Tail", kind = "box", size = Vector3.new(0.3, 0.46, 0.34), cframe = CFrame.new(0, 0.48, 1.14, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "WhiteTailEnd", group = "Tail", kind = "box", size = Vector3.new(0.314, 0.2, 0.354), cframe = CFrame.new(0, 0.76, 1.14, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
}
local mouthPartIndex = 23
local mouthWorld = Vector3.new(0, 1.11, -1.12)

local model = Instance.new("Model")
model.Name = "미글"
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
