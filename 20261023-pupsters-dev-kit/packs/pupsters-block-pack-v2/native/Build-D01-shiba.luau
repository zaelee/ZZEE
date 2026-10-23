-- Generated from a PUPSTERS block-dog scene. Paste the whole file into the Roblox Studio Command Bar.
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
	{ name = "DotEyeL", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(-0.47, 1.55, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "WhiteBrowL", group = "Head", kind = "sphere", size = Vector3.new(0.17, 0.14, 0.05), cframe = CFrame.new(-0.47, 1.8, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "DotEyeR", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(0.47, 1.55, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "WhiteBrowR", group = "Head", kind = "sphere", size = Vector3.new(0.17, 0.14, 0.05), cframe = CFrame.new(0.47, 1.8, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "CreamMuzzle", group = "Head", kind = "box", size = Vector3.new(1.75, 0.5, 0.19), cframe = CFrame.new(0, 1.01, -1.32, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "SquareNose", group = "Head", kind = "box", size = Vector3.new(0.3, 0.17, 0.08), cframe = CFrame.new(0, 1.14, -1.45, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "MouthCenter", group = "Head", kind = "box", size = Vector3.new(0.038, 0.14, 0.045), cframe = CFrame.new(0, 0.998, -1.435, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "SmallMouth", group = "Head", kind = "box", size = Vector3.new(0.23, 0.035, 0.045), cframe = CFrame.new(0, 0.935, -1.435, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "TailRoot", group = "Tail", kind = "box", size = Vector3.new(0.34, 0.55, 0.36), cframe = CFrame.new(0, 1.7, 1.07, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "TailCreamTip", group = "Tail", kind = "box", size = Vector3.new(0.34, 0.23, 0.36), cframe = CFrame.new(0, 2.09, 1.07, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "BoneShaft", group = "MouthBone", kind = "box", size = Vector3.new(0.68, 0.128, 0.16), cframe = CFrame.new(0, 0.82, -1.48, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "bone" },
	{ name = "BoneBlockEndL", group = "MouthBone", kind = "box", size = Vector3.new(0.2, 0.34, 0.18), cframe = CFrame.new(-0.37, 0.82, -1.48, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "bone" },
	{ name = "BoneBlockEndR", group = "MouthBone", kind = "box", size = Vector3.new(0.2, 0.34, 0.18), cframe = CFrame.new(0.37, 0.82, -1.48, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "bone" },
	{ name = "EarL_Base", group = "Head", kind = "box", size = Vector3.new(0.56, 0.43, 0.54), cframe = CFrame.new(-0.76, 2.29, -0.5, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "EarL_BluntTop", group = "Head", kind = "box", size = Vector3.new(0.4, 0.23, 0.5), cframe = CFrame.new(-0.76, 2.56, -0.5, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "EarL_Inner", group = "Head", kind = "box", size = Vector3.new(0.24, 0.3, 0.035), cframe = CFrame.new(-0.76, 2.32, -0.787, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "inner" },
	{ name = "EarR_Base", group = "Head", kind = "box", size = Vector3.new(0.56, 0.43, 0.54), cframe = CFrame.new(0.76, 2.29, -0.5, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "EarR_BluntTop", group = "Head", kind = "box", size = Vector3.new(0.4, 0.23, 0.5), cframe = CFrame.new(0.76, 2.56, -0.5, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "orange" },
	{ name = "EarR_Inner", group = "Head", kind = "box", size = Vector3.new(0.24, 0.3, 0.035), cframe = CFrame.new(0.76, 2.32, -0.787, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "inner" },
}
local mouthPartIndex = 18
local mouthWorld = Vector3.new(0, 0.82, -1.48)

local model = Instance.new("Model")
model.Name = "시바멈"
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
