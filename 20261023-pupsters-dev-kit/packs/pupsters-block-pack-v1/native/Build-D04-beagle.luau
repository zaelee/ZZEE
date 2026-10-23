-- Generated from a PUPSTERS block-dog scene. Paste the whole file into the Roblox Studio Command Bar.
local Selection = game:GetService("Selection")
local groups = { "Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR", "Tail", "MouthBone" }
local colors = {
	["orange"] = Color3.new(0.8823529412, 0.4901960784, 0.2),
	["brown"] = Color3.new(0.2509803922, 0.1607843137, 0.1411764706),
	["cream"] = Color3.new(1, 0.9568627451, 0.8705882353),
	["black"] = Color3.new(0.1176470588, 0.1019607843, 0.1098039216),
	["drool"] = Color3.new(0.568627451, 0.8588235294, 0.9568627451),
	["foam"] = Color3.new(1, 1, 0.9803921569),
}
local parts = {
	{ name = "ShortTorso", group = "Body", kind = "box", size = Vector3.new(1.49, 1.17, 1.13), cframe = CFrame.new(0, 0.99, 0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "DarkSaddle", group = "Body", kind = "box", size = Vector3.new(1.43, 0.48, 0.78), cframe = CFrame.new(0, 1.42, 0.69, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "brown" },
	{ name = "WhiteChest", group = "Body", kind = "box", size = Vector3.new(1, 0.74, 0.22), cframe = CFrame.new(0, 0.84, 0.02, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegFL_Leg", group = "LegFL", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(-0.67, 0.48, -0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "LegFL_Paw", group = "LegFL", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(-0.67, 0.18, -0.66, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegFR_Leg", group = "LegFR", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(0.67, 0.48, -0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "LegFR_Paw", group = "LegFR", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(0.67, 0.18, -0.66, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegBL_Leg", group = "LegBL", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(-0.67, 0.48, 0.93, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "LegBL_Paw", group = "LegBL", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(-0.67, 0.18, 0.87, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegBR_Leg", group = "LegBR", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(0.67, 0.48, 0.93, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "LegBR_Paw", group = "LegBR", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(0.67, 0.18, 0.87, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "BigHead", group = "Head", kind = "box", size = Vector3.new(2.16, 1.57, 1.49), cframe = CFrame.new(0, 1.43, -0.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "FloppyEarL", group = "Head", kind = "box", size = Vector3.new(0.42, 1.13, 0.52), cframe = CFrame.new(-1.11, 1.34, -0.47, 0.9968017063, -0.07991469397, 0, 0.07991469397, 0.9968017063, 0, 0, 0, 1), material = "brown" },
	{ name = "FloppyEarTipL", group = "Head", kind = "box", size = Vector3.new(0.48, 0.43, 0.55), cframe = CFrame.new(-1.13, 0.86, -0.48, 0.9982005399, 0.05996400648, 0, -0.05996400648, 0.9982005399, 0, 0, 0, 1), material = "orange" },
	{ name = "FloppyEarR", group = "Head", kind = "box", size = Vector3.new(0.42, 1.13, 0.52), cframe = CFrame.new(1.11, 1.34, -0.47, 0.9968017063, 0.07991469397, 0, -0.07991469397, 0.9968017063, 0, 0, 0, 1), material = "brown" },
	{ name = "FloppyEarTipR", group = "Head", kind = "box", size = Vector3.new(0.48, 0.43, 0.55), cframe = CFrame.new(1.13, 0.86, -0.48, 0.9982005399, -0.05996400648, 0, 0.05996400648, 0.9982005399, 0, 0, 0, 1), material = "orange" },
	{ name = "WhiteFaceStripe", group = "Head", kind = "box", size = Vector3.new(0.38, 1.08, 0.08), cframe = CFrame.new(0, 1.72, -1.294, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "DotEyeL", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(-0.47, 1.55, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "DotEyeR", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(0.47, 1.55, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "WhiteMuzzle", group = "Head", kind = "box", size = Vector3.new(1.48, 0.52, 0.19), cframe = CFrame.new(0, 1, -1.32, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "SquareNose", group = "Head", kind = "box", size = Vector3.new(0.32, 0.18, 0.08), cframe = CFrame.new(0, 1.14, -1.45, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "SmallMouth", group = "Head", kind = "box", size = Vector3.new(0.28, 0.04, 0.05), cframe = CFrame.new(0, 0.93, -1.44, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "DroolStrand", group = "Head", kind = "box", size = Vector3.new(0.13, 0.28, 0.11), cframe = CFrame.new(0.37, 0.76, -1.48, 0.9968017063, 0.07991469397, 0, -0.07991469397, 0.9968017063, 0, 0, 0, 1), material = "drool" },
	{ name = "FoamBead", group = "Head", kind = "box", size = Vector3.new(0.14, 0.14, 0.12), cframe = CFrame.new(0.36, 0.91, -1.49, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "foam" },
	{ name = "ShortTail", group = "Tail", kind = "box", size = Vector3.new(0.34, 0.54, 0.38), cframe = CFrame.new(0, 1.62, 1.13, 1, 0, 0, 0, 0.9872272834, -0.1593182066, 0, 0.1593182066, 0.9872272834), material = "orange" },
	{ name = "WhiteTailTip", group = "Tail", kind = "box", size = Vector3.new(0.34, 0.22, 0.38), cframe = CFrame.new(0, 1.98, 1.08, 1, 0, 0, 0, 0.9872272834, -0.1593182066, 0, 0.1593182066, 0.9872272834), material = "cream" },
}
local mouthPartIndex = 22
local mouthWorld = Vector3.new(0, 0.88, -1.48)

local model = Instance.new("Model")
model.Name = "Beagle_Block"
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
