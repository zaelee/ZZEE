-- Generated from a PUPSTERS block-dog scene. Paste the whole file into the Roblox Studio Command Bar.
local Selection = game:GetService("Selection")
local groups = { "Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR", "Tail", "MouthBone" }
local colors = {
	["blackCoat"] = Color3.new(0.2784313725, 0.262745098, 0.2941176471),
	["white"] = Color3.new(0.9843137255, 0.9764705882, 0.9411764706),
	["black"] = Color3.new(0.0470588235, 0.0431372549, 0.0509803922),
	["pink"] = Color3.new(0.9490196078, 0.5254901961, 0.5176470588),
	["mint"] = Color3.new(0.5607843137, 0.8901960784, 0.7411764706),
	["cardboard"] = Color3.new(0.7607843137, 0.5254901961, 0.2470588235),
	["cardboardLight"] = Color3.new(0.8823529412, 0.6588235294, 0.337254902),
	["crease"] = Color3.new(0.2705882353, 0.1921568627, 0.1215686275),
	["tape"] = Color3.new(0.9254901961, 0.8745098039, 0.7058823529),
}
local parts = {
	{ name = "ShortTorso", group = "Body", kind = "box", size = Vector3.new(1.55, 1.02, 1.16), cframe = CFrame.new(0, 0.9, 0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "WhiteChest", group = "Body", kind = "box", size = Vector3.new(1.06, 0.62, 0.2), cframe = CFrame.new(0, 0.78, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegFL_Leg", group = "LegFL", kind = "box", size = Vector3.new(0.49, 0.58, 0.55), cframe = CFrame.new(-0.69, 0.43, -0.56, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "LegFL_Paw", group = "LegFL", kind = "box", size = Vector3.new(0.57, 0.34, 0.66), cframe = CFrame.new(-0.69, 0.17, -0.63, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegFR_Leg", group = "LegFR", kind = "box", size = Vector3.new(0.49, 0.58, 0.55), cframe = CFrame.new(0.69, 0.43, -0.56, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "LegFR_Paw", group = "LegFR", kind = "box", size = Vector3.new(0.57, 0.34, 0.66), cframe = CFrame.new(0.69, 0.17, -0.63, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegBL_Leg", group = "LegBL", kind = "box", size = Vector3.new(0.49, 0.58, 0.55), cframe = CFrame.new(-0.69, 0.43, 0.92, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "LegBL_Paw", group = "LegBL", kind = "box", size = Vector3.new(0.57, 0.34, 0.66), cframe = CFrame.new(-0.69, 0.17, 0.85, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegBR_Leg", group = "LegBR", kind = "box", size = Vector3.new(0.49, 0.58, 0.55), cframe = CFrame.new(0.69, 0.43, 0.92, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "LegBR_Paw", group = "LegBR", kind = "box", size = Vector3.new(0.57, 0.34, 0.66), cframe = CFrame.new(0.69, 0.17, 0.85, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "BigHead", group = "Head", kind = "box", size = Vector3.new(2.1, 1.45, 1.44), cframe = CFrame.new(0, 1.38, -0.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "FoldedEarRootL", group = "Head", kind = "box", size = Vector3.new(0.34, 0.4, 0.52), cframe = CFrame.new(-0.68, 2.05, -0.48, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "FoldedEarFlapL", group = "Head", kind = "box", size = Vector3.new(0.62, 0.26, 0.54), cframe = CFrame.new(-0.78, 1.94, -0.5, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "FoldedEarInnerL", group = "Head", kind = "box", size = Vector3.new(0.3, 0.12, 0.06), cframe = CFrame.new(-0.78, 1.91, -0.8, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "pink" },
	{ name = "UprightEarR", group = "Head", kind = "box", size = Vector3.new(0.45, 0.7, 0.54), cframe = CFrame.new(0.72, 2.31, -0.48, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "UprightEarInnerR", group = "Head", kind = "box", size = Vector3.new(0.22, 0.36, 0.06), cframe = CFrame.new(0.72, 2.24, -0.78, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "pink" },
	{ name = "DotEyeL", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(-0.44, 1.46, -1.275, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "DotEyeR", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(0.44, 1.46, -1.275, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "WhiteBlazeUpper", group = "Head", kind = "box", size = Vector3.new(0.46, 0.64, 0.08), cframe = CFrame.new(0.04, 1.72, -1.29, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "WhiteBlazeLower", group = "Head", kind = "box", size = Vector3.new(0.3, 0.32, 0.08), cframe = CFrame.new(-0.02, 1.3, -1.29, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "HangingCheekFluffL", group = "Head", kind = "box", size = Vector3.new(0.46, 0.5, 0.3), cframe = CFrame.new(-0.87, 0.86, -1.16, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "HangingCheekFluffR", group = "Head", kind = "box", size = Vector3.new(0.46, 0.5, 0.3), cframe = CFrame.new(0.87, 0.86, -1.16, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "WhiteMuzzle", group = "Head", kind = "box", size = Vector3.new(1.4, 0.42, 0.18), cframe = CFrame.new(0, 0.98, -1.35, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "MintThroat", group = "Body", kind = "box", size = Vector3.new(0.52, 0.13, 0.07), cframe = CFrame.new(0, 0.55, -0.615, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "mint" },
	{ name = "SquareNose", group = "Head", kind = "box", size = Vector3.new(0.3, 0.17, 0.08), cframe = CFrame.new(0, 1.08, -1.48, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "MouthCenter", group = "Head", kind = "box", size = Vector3.new(0.038, 0.13, 0.045), cframe = CFrame.new(0, 0.99, -1.455, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "SmallMouth", group = "Head", kind = "box", size = Vector3.new(0.23, 0.035, 0.045), cframe = CFrame.new(0, 0.93, -1.455, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "TailRoot", group = "Tail", kind = "box", size = Vector3.new(0.44, 0.38, 0.44), cframe = CFrame.new(0, 1.32, 1.22, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "TailWhiteBand", group = "Tail", kind = "box", size = Vector3.new(0.5, 0.3, 0.46), cframe = CFrame.new(0, 1.6, 1.24, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "TailMintTip", group = "Tail", kind = "box", size = Vector3.new(0.484, 0.18, 0.444), cframe = CFrame.new(0, 1.83, 1.24, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "mint" },
	{ name = "CrownBand", group = "Head", kind = "box", size = Vector3.new(1.16, 0.24, 0.3), cframe = CFrame.new(0, 2.16, -0.58, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cardboard" },
	{ name = "CrownCrenelL", group = "Head", kind = "box", size = Vector3.new(0.24, 0.34, 0.28), cframe = CFrame.new(-0.38, 2.43, -0.58, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cardboardLight" },
	{ name = "CrownCrenelCenter", group = "Head", kind = "box", size = Vector3.new(0.24, 0.44, 0.28), cframe = CFrame.new(0, 2.48, -0.58, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cardboard" },
	{ name = "CrownCrenelR_Worn", group = "Head", kind = "box", size = Vector3.new(0.24, 0.28, 0.28), cframe = CFrame.new(0.38, 2.4, -0.58, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cardboardLight" },
	{ name = "CrownFoldPatch", group = "Head", kind = "box", size = Vector3.new(0.16, 0.11, 0.04), cframe = CFrame.new(0.38, 2.5, -0.74, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cardboard" },
	{ name = "CrownCrease", group = "Head", kind = "box", size = Vector3.new(0.04, 0.2, 0.04), cframe = CFrame.new(0.25, 2.16, -0.75, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "crease" },
	{ name = "CrownTapePatch", group = "Head", kind = "box", size = Vector3.new(0.24, 0.17, 0.04), cframe = CFrame.new(-0.16, 2.16, -0.75, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "tape" },
}
local mouthPartIndex = 26
local mouthWorld = Vector3.new(0, 0.93, -1.455)

local model = Instance.new("Model")
model.Name = "모더콜리"
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
