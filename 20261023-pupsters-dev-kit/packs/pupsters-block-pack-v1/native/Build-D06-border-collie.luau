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
	{ name = "ShortTorso", group = "Body", kind = "box", size = Vector3.new(1.49, 1.17, 1.13), cframe = CFrame.new(0, 0.99, 0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "WhiteChest", group = "Body", kind = "box", size = Vector3.new(1, 0.76, 0.22), cframe = CFrame.new(0, 0.86, 0.02, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegFL_Leg", group = "LegFL", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(-0.67, 0.48, -0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "LegFL_Paw", group = "LegFL", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(-0.67, 0.18, -0.66, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegFR_Leg", group = "LegFR", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(0.67, 0.48, -0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "LegFR_Paw", group = "LegFR", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(0.67, 0.18, -0.66, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegBL_Leg", group = "LegBL", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(-0.67, 0.48, 0.93, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "LegBL_Paw", group = "LegBL", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(-0.67, 0.18, 0.87, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "LegBR_Leg", group = "LegBR", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(0.67, 0.48, 0.93, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "LegBR_Paw", group = "LegBR", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(0.67, 0.18, 0.87, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "BigHead", group = "Head", kind = "box", size = Vector3.new(2.16, 1.57, 1.49), cframe = CFrame.new(0, 1.43, -0.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "FoldedEarL", group = "Head", kind = "wedge", size = Vector3.new(0.4, 0.76, 0.72), cframe = CFrame.new(-0.73, 2.18, -0.48, -3.836774355e-12, -3.365111626e-12, -1, -0.659384672, 0.7518057291, 0, 0.7518057291, 0.659384672, -5.103411967e-12), material = "blackCoat" },
	{ name = "FoldedEarInnerL", group = "Head", kind = "wedge", size = Vector3.new(0.06, 0.4, 0.36), cframe = CFrame.new(-0.78, 2.18, -0.72, -3.836774355e-12, -3.365111626e-12, -1, -0.659384672, 0.7518057291, 0, 0.7518057291, 0.659384672, -5.103411967e-12), material = "pink" },
	{ name = "UprightEarR", group = "Head", kind = "wedge", size = Vector3.new(0.4, 0.85, 0.77), cframe = CFrame.new(0.76, 2.28, -0.48, -5.103411967e-12, 0, 1, 0, 1, 0, -1, 0, -5.103411967e-12), material = "blackCoat" },
	{ name = "UprightEarInnerR", group = "Head", kind = "wedge", size = Vector3.new(0.065, 0.5, 0.43), cframe = CFrame.new(0.78, 2.34, -0.713, -5.103411967e-12, 0, 1, 0, 1, 0, -1, 0, -5.103411967e-12), material = "pink" },
	{ name = "DotEyeL", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(-0.47, 1.55, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "DotEyeR", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(0.47, 1.55, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "WhiteBlazeUpper", group = "Head", kind = "box", size = Vector3.new(0.5, 0.64, 0.08), cframe = CFrame.new(0.06, 1.88, -1.292, 0.9968017063, -0.07991469397, 0, 0.07991469397, 0.9968017063, 0, 0, 0, 1), material = "white" },
	{ name = "WhiteBlazeLower", group = "Head", kind = "box", size = Vector3.new(0.34, 0.45, 0.08), cframe = CFrame.new(-0.02, 1.48, -1.294, 0.9968017063, 0.07991469397, 0, -0.07991469397, 0.9968017063, 0, 0, 0, 1), material = "white" },
	{ name = "WhiteCheekL", group = "Head", kind = "box", size = Vector3.new(0.56, 0.43, 0.11), cframe = CFrame.new(-0.7, 1.12, -1.31, 0.9950041653, 0.09983341665, 0, -0.09983341665, 0.9950041653, 0, 0, 0, 1), material = "white" },
	{ name = "WhiteCheekR", group = "Head", kind = "box", size = Vector3.new(0.56, 0.43, 0.11), cframe = CFrame.new(0.7, 1.12, -1.31, 0.9950041653, -0.09983341665, 0, 0.09983341665, 0.9950041653, 0, 0, 0, 1), material = "white" },
	{ name = "WhiteMuzzle", group = "Head", kind = "box", size = Vector3.new(1.48, 0.46, 0.19), cframe = CFrame.new(0, 1, -1.36, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "MintThroat", group = "Body", kind = "box", size = Vector3.new(0.58, 0.16, 0.08), cframe = CFrame.new(0, 0.57, -0.115, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "mint" },
	{ name = "SquareNose", group = "Head", kind = "box", size = Vector3.new(0.3, 0.17, 0.08), cframe = CFrame.new(0, 1.14, -1.48, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "MouthCenter", group = "Head", kind = "box", size = Vector3.new(0.038, 0.14, 0.045), cframe = CFrame.new(0, 0.998, -1.455, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "SmallMouth", group = "Head", kind = "box", size = Vector3.new(0.23, 0.035, 0.045), cframe = CFrame.new(0, 0.935, -1.455, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "TailRoot", group = "Tail", kind = "box", size = Vector3.new(0.42, 0.46, 0.4), cframe = CFrame.new(0, 1.53, 1.17, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "blackCoat" },
	{ name = "TailWhiteBand", group = "Tail", kind = "box", size = Vector3.new(0.42, 0.25, 0.4), cframe = CFrame.new(0, 1.85, 1.17, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "white" },
	{ name = "TailMintTip", group = "Tail", kind = "box", size = Vector3.new(0.42, 0.2, 0.4), cframe = CFrame.new(0, 2.075, 1.17, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "mint" },
	{ name = "CrownBand", group = "Head", kind = "box", size = Vector3.new(1.18, 0.25, 0.28), cframe = CFrame.new(0, 2.28, -0.58, 0.9982005399, -0.05996400648, 0, 0.05996400648, 0.9982005399, 0, 0, 0, 1), material = "cardboard" },
	{ name = "CrownPointL_A", group = "Head", kind = "wedge", size = Vector3.new(0.18, 0.48, 0.22), cframe = CFrame.new(-0.53, 2.63, -0.58, -5.087089757e-12, 0, 1, 0.07991469397, 0.9968017063, 0, -0.9968017063, 0.07991469397, -5.103411967e-12), material = "cardboard" },
	{ name = "CrownPointL_B", group = "Head", kind = "wedge", size = Vector3.new(0.18, 0.48, 0.22), cframe = CFrame.new(-0.31, 2.63, -0.58, -5.087089757e-12, 0, -1, 0.07991469397, 0.9968017063, 0, 0.9968017063, -0.07991469397, -5.103411967e-12), material = "cardboardLight" },
	{ name = "CrownPointCenter_A", group = "Head", kind = "wedge", size = Vector3.new(0.18, 0.72, 0.22), cframe = CFrame.new(-0.11, 2.75, -0.58, -5.094228581e-12, 0, 1, 0.05996400648, 0.9982005399, 0, -0.9982005399, 0.05996400648, -5.103411967e-12), material = "cardboardLight" },
	{ name = "CrownPointCenter_B", group = "Head", kind = "wedge", size = Vector3.new(0.18, 0.72, 0.22), cframe = CFrame.new(0.11, 2.75, -0.58, -5.094228581e-12, 0, -1, 0.05996400648, 0.9982005399, 0, 0.9982005399, -0.05996400648, -5.103411967e-12), material = "cardboard" },
	{ name = "CrownPointR_A", group = "Head", kind = "wedge", size = Vector3.new(0.18, 0.5, 0.22), cframe = CFrame.new(0.31, 2.64, -0.58, -5.101115604e-12, 0, 1, 0.0299955002, 0.9995500337, 0, -0.9995500337, 0.0299955002, -5.103411967e-12), material = "cardboard" },
	{ name = "CrownPointR_B_Folded", group = "Head", kind = "wedge", size = Vector3.new(0.18, 0.34, 0.22), cframe = CFrame.new(0.53, 2.56, -0.58, -5.038227532e-12, -8.130664422e-13, -1, -0.1593182066, 0.9872272834, 0, 0.9872272834, 0.1593182066, -5.103411967e-12), material = "cardboardLight" },
	{ name = "CrownFoldFlap", group = "Head", kind = "wedge", size = Vector3.new(0.1, 0.18, 0.16), cframe = CFrame.new(0.49, 2.76, -0.73, -4.931886179e-12, -1.311987965e-12, -1, -0.2570805519, 0.9663899781, 0, 0.9663899781, 0.2570805519, -5.103411967e-12), material = "cardboardLight" },
	{ name = "CrownCrease", group = "Head", kind = "box", size = Vector3.new(0.035, 0.23, 0.035), cframe = CFrame.new(0.36, 2.29, -0.735, 0.9902159962, 0.1395431146, 0, -0.1395431146, 0.9902159962, 0, 0, 0, 1), material = "crease" },
	{ name = "CrownTapePatch", group = "Head", kind = "box", size = Vector3.new(0.26, 0.18, 0.035), cframe = CFrame.new(-0.17, 2.26, -0.735, 0.9992001067, -0.03998933419, 0, 0.03998933419, 0.9992001067, 0, 0, 0, 1), material = "tape" },
}
local mouthPartIndex = 25
local mouthWorld = Vector3.new(0, 0.84, -1.48)

local model = Instance.new("Model")
model.Name = "BorderCollie_Block"
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
