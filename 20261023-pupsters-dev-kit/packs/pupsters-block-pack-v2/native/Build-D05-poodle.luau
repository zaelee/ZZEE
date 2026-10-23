-- Generated from a PUPSTERS block-dog scene. Paste the whole file into the Roblox Studio Command Bar.
local Selection = game:GetService("Selection")
local groups = { "Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR", "Tail", "MouthBone" }
local colors = {
	["peach"] = Color3.new(1, 0.7215686275, 0.3843137255),
	["cream"] = Color3.new(1, 0.9411764706, 0.7725490196),
	["black"] = Color3.new(0.1176470588, 0.1019607843, 0.1098039216),
	["yellow"] = Color3.new(1, 0.9254901961, 0.1058823529),
	["cyan"] = Color3.new(0.0784313725, 0.8, 0.9411764706),
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
	{ name = "ForeheadZapYellowA", group = "Head", kind = "box", size = Vector3.new(0.3, 0.18, 0.08), cframe = CFrame.new(-0.22, 1.97, -1.25, 0.9130889403, 0.4077604531, 0, -0.4077604531, 0.9130889403, 0, 0, 0, 1), material = "yellow" },
	{ name = "ForeheadZapCyan", group = "Head", kind = "box", size = Vector3.new(0.2, 0.28, 0.08), cframe = CFrame.new(0, 1.91, -1.255, 0.921060994, -0.3894183423, 0, 0.3894183423, 0.921060994, 0, 0, 0, 1), material = "cyan" },
	{ name = "ForeheadZapYellowB", group = "Head", kind = "box", size = Vector3.new(0.3, 0.18, 0.08), cframe = CFrame.new(0.22, 1.85, -1.25, 0.9130889403, 0.4077604531, 0, -0.4077604531, 0.9130889403, 0, 0, 0, 1), material = "yellow" },
	{ name = "EarZapYellow", group = "Head", kind = "box", size = Vector3.new(0.28, 0.18, 0.08), cframe = CFrame.new(-1.3, 1.09, -0.92, 0.9427546655, -0.3334870921, 0, 0.3334870921, 0.9427546655, 0, 0, 0, 1), material = "yellow" },
	{ name = "EarZapCyan", group = "Head", kind = "box", size = Vector3.new(0.18, 0.26, 0.08), cframe = CFrame.new(-1.15, 0.98, -0.92, 0.9427546655, 0.3334870921, 0, -0.3334870921, 0.9427546655, 0, 0, 0, 1), material = "cyan" },
	{ name = "ShortTail", group = "Tail", kind = "box", size = Vector3.new(0.32, 0.42, 0.36), cframe = CFrame.new(0, 1.43, 1.04, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
	{ name = "TailPuffL", group = "Tail", kind = "box", size = Vector3.new(0.4, 0.34, 0.44), cframe = CFrame.new(-0.14, 1.73, 1.04, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "TailPuffR", group = "Tail", kind = "box", size = Vector3.new(0.4, 0.356, 0.456), cframe = CFrame.new(0.14, 1.73, 1.04, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "peach" },
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
