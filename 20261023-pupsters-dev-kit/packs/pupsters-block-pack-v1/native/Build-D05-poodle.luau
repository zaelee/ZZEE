-- Generated from a PUPSTERS block-dog scene. Paste the whole file into the Roblox Studio Command Bar.
local Selection = game:GetService("Selection")
local groups = { "Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR", "Tail", "MouthBone" }
local colors = {
	["apricot"] = Color3.new(0.9411764706, 0.6156862745, 0.2941176471),
	["cream"] = Color3.new(1, 0.9411764706, 0.8352941176),
	["black"] = Color3.new(0.1176470588, 0.1019607843, 0.1098039216),
	["yellow"] = Color3.new(1, 0.9411764706, 0.1019607843),
	["cyan"] = Color3.new(0.0784313725, 0.8, 0.9411764706),
}
local parts = {
	{ name = "ShortTorso", group = "Body", kind = "box", size = Vector3.new(1.49, 1.17, 1.13), cframe = CFrame.new(0, 0.99, 0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "apricot" },
	{ name = "BodyTuftL", group = "Body", kind = "box", size = Vector3.new(0.52, 0.35, 0.54), cframe = CFrame.new(-0.5, 1.56, 0.48, 0.9968017063, -0.07991469397, 0, 0.07991469397, 0.9968017063, 0, 0, 0, 1), material = "apricot" },
	{ name = "BodyTuftC", group = "Body", kind = "box", size = Vector3.new(0.56, 0.38, 0.58), cframe = CFrame.new(0, 1.6, 0.66, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "apricot" },
	{ name = "BodyTuftR", group = "Body", kind = "box", size = Vector3.new(0.52, 0.35, 0.54), cframe = CFrame.new(0.5, 1.56, 0.48, 0.9968017063, 0.07991469397, 0, -0.07991469397, 0.9968017063, 0, 0, 0, 1), material = "apricot" },
	{ name = "LegFL_Leg", group = "LegFL", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(-0.67, 0.48, -0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "apricot" },
	{ name = "LegFL_Paw", group = "LegFL", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(-0.67, 0.18, -0.66, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegFR_Leg", group = "LegFR", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(0.67, 0.48, -0.6, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "apricot" },
	{ name = "LegFR_Paw", group = "LegFR", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(0.67, 0.18, -0.66, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegBL_Leg", group = "LegBL", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(-0.67, 0.48, 0.93, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "apricot" },
	{ name = "LegBL_Paw", group = "LegBL", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(-0.67, 0.18, 0.87, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "LegBR_Leg", group = "LegBR", kind = "box", size = Vector3.new(0.51, 0.68, 0.57), cframe = CFrame.new(0.67, 0.48, 0.93, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "apricot" },
	{ name = "LegBR_Paw", group = "LegBR", kind = "box", size = Vector3.new(0.55, 0.36, 0.64), cframe = CFrame.new(0.67, 0.18, 0.87, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "BigHead", group = "Head", kind = "box", size = Vector3.new(2.16, 1.57, 1.49), cframe = CFrame.new(0, 1.43, -0.53, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "apricot" },
	{ name = "ClippedEarL", group = "Head", kind = "box", size = Vector3.new(0.5, 0.98, 0.52), cframe = CFrame.new(-1.12, 1.35, -0.48, 0.9992001067, -0.03998933419, 0, 0.03998933419, 0.9992001067, 0, 0, 0, 1), material = "apricot" },
	{ name = "EarTuftL", group = "Head", kind = "box", size = Vector3.new(0.62, 0.5, 0.58), cframe = CFrame.new(-1.14, 0.91, -0.49, 0.9987502604, 0.04997916927, 0, -0.04997916927, 0.9987502604, 0, 0, 0, 1), material = "apricot" },
	{ name = "ClippedEarR", group = "Head", kind = "box", size = Vector3.new(0.5, 0.98, 0.52), cframe = CFrame.new(1.12, 1.35, -0.48, 0.9992001067, 0.03998933419, 0, -0.03998933419, 0.9992001067, 0, 0, 0, 1), material = "apricot" },
	{ name = "EarTuftR", group = "Head", kind = "box", size = Vector3.new(0.62, 0.5, 0.58), cframe = CFrame.new(1.14, 0.91, -0.49, 0.9987502604, -0.04997916927, 0, 0.04997916927, 0.9987502604, 0, 0, 0, 1), material = "apricot" },
	{ name = "HeadTuftL", group = "Head", kind = "box", size = Vector3.new(0.65, 0.42, 0.66), cframe = CFrame.new(-0.53, 2.32, -0.54, 0.9928086359, -0.1197122073, 0, 0.1197122073, 0.9928086359, 0, 0, 0, 1), material = "apricot" },
	{ name = "HeadTuftC", group = "Head", kind = "box", size = Vector3.new(0.72, 0.5, 0.7), cframe = CFrame.new(0, 2.4, -0.54, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "apricot" },
	{ name = "HeadTuftR", group = "Head", kind = "box", size = Vector3.new(0.65, 0.42, 0.66), cframe = CFrame.new(0.53, 2.32, -0.54, 0.9928086359, 0.1197122073, 0, -0.1197122073, 0.9928086359, 0, 0, 0, 1), material = "apricot" },
	{ name = "DotEyeL", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(-0.47, 1.55, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "DotEyeR", group = "Head", kind = "sphere", size = Vector3.new(0.14, 0.17, 0.05), cframe = CFrame.new(0.47, 1.55, -1.287, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "CreamMuzzle", group = "Head", kind = "box", size = Vector3.new(1.48, 0.5, 0.19), cframe = CFrame.new(0, 1, -1.32, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "cream" },
	{ name = "SquareNose", group = "Head", kind = "box", size = Vector3.new(0.3, 0.18, 0.08), cframe = CFrame.new(0, 1.14, -1.45, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "SmallMouth", group = "Head", kind = "box", size = Vector3.new(0.26, 0.04, 0.05), cframe = CFrame.new(0, 0.93, -1.44, 1, 0, 0, 0, 1, 0, 0, 0, 1), material = "black" },
	{ name = "CrestYellowL", group = "Head", kind = "wedge", size = Vector3.new(0.22, 0.36, 0.16), cframe = CFrame.new(-0.35, 2.68, -0.66, 0.9130889403, 0.4077604531, 0, -0.4077604531, 0.9130889403, 0, 0, 0, 1), material = "yellow" },
	{ name = "CrestCyanL", group = "Head", kind = "wedge", size = Vector3.new(0.16, 0.28, 0.15), cframe = CFrame.new(-0.17, 2.57, -0.71, 0.9286646356, -0.3709204694, 0, 0.3709204694, 0.9286646356, 0, 0, 0, 1), material = "cyan" },
	{ name = "CrestYellowR", group = "Head", kind = "wedge", size = Vector3.new(0.22, 0.36, 0.16), cframe = CFrame.new(0.34, 2.68, -0.66, 0.9130889403, -0.4077604531, 0, 0.4077604531, 0.9130889403, 0, 0, 0, 1), material = "yellow" },
	{ name = "CrestCyanR", group = "Head", kind = "wedge", size = Vector3.new(0.16, 0.28, 0.15), cframe = CFrame.new(0.16, 2.57, -0.71, 0.9286646356, 0.3709204694, 0, -0.3709204694, 0.9286646356, 0, 0, 0, 1), material = "cyan" },
	{ name = "EarSparkYellowL", group = "Head", kind = "wedge", size = Vector3.new(0.2, 0.3, 0.18), cframe = CFrame.new(-1.27, 0.69, -0.55, 0.8525245221, 0.5226872289, 0, -0.5226872289, 0.8525245221, 0, 0, 0, 1), material = "yellow" },
	{ name = "EarSparkCyanL", group = "Head", kind = "wedge", size = Vector3.new(0.14, 0.23, 0.17), cframe = CFrame.new(-1.12, 0.62, -0.58, 0.9004471024, -0.4349655341, 0, 0.4349655341, 0.9004471024, 0, 0, 0, 1), material = "cyan" },
	{ name = "EarSparkYellowR", group = "Head", kind = "wedge", size = Vector3.new(0.2, 0.3, 0.18), cframe = CFrame.new(1.27, 0.69, -0.55, 0.8525245221, -0.5226872289, 0, 0.5226872289, 0.8525245221, 0, 0, 0, 1), material = "yellow" },
	{ name = "EarSparkCyanR", group = "Head", kind = "wedge", size = Vector3.new(0.14, 0.23, 0.17), cframe = CFrame.new(1.12, 0.62, -0.58, 0.9004471024, 0.4349655341, 0, -0.4349655341, 0.9004471024, 0, 0, 0, 1), material = "cyan" },
	{ name = "ShortTail", group = "Tail", kind = "box", size = Vector3.new(0.34, 0.48, 0.38), cframe = CFrame.new(0, 1.59, 1.14, 1, 0, 0, 0, 0.9928086359, -0.1197122073, 0, 0.1197122073, 0.9928086359), material = "apricot" },
	{ name = "TailTuftL", group = "Tail", kind = "box", size = Vector3.new(0.38, 0.28, 0.42), cframe = CFrame.new(-0.13, 1.91, 1.1, 0.9838436928, -0.1790295734, 0, 0.1790295734, 0.9838436928, 0, 0, 0, 1), material = "apricot" },
	{ name = "TailTuftR", group = "Tail", kind = "box", size = Vector3.new(0.38, 0.28, 0.42), cframe = CFrame.new(0.13, 1.91, 1.1, 0.9838436928, 0.1790295734, 0, -0.1790295734, 0.9838436928, 0, 0, 0, 1), material = "apricot" },
	{ name = "TailSparkYellow", group = "Tail", kind = "wedge", size = Vector3.new(0.23, 0.34, 0.2), cframe = CFrame.new(-0.1, 2.17, 1.06, 0.9393727128, 0.3428978075, 0, -0.3411847467, 0.934679762, -0.09983341665, -0.03423265968, 0.09378078743, 0.9950041653), material = "yellow" },
	{ name = "TailSparkCyan", group = "Tail", kind = "wedge", size = Vector3.new(0.16, 0.25, 0.18), cframe = CFrame.new(0.1, 2.12, 1.04, 0.9286646356, -0.3709204694, 0, 0.3690674121, 0.9240251805, -0.09983341665, 0.03703025777, 0.09271176349, 0.9950041653), material = "cyan" },
}
local mouthPartIndex = 25
local mouthWorld = Vector3.new(0, 0.91, -1.48)

local model = Instance.new("Model")
model.Name = "Poodle_Block"
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
