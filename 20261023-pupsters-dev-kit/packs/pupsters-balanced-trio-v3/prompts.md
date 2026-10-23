# 사고멍치 / PUPSTERS — 비율 수정 v3

- 생성 방식: built-in image_gen, 참조 이미지 편집
- 요청: 얼굴과 몸 약 1:1, 과도한 복부 폭 축소, 기존 외형 및 표정 유지
- 해석: 귀를 제외한 머리 높이 : 턱 아래부터 발까지 높이 ≈ 1:1
- 최종 파일: 01-maltese-balanced-v3.png, 02-shiba-inu-balanced-v3.png, 03-bulldog-balanced-v3.png

## 말티즈

Edit target: ../pupsters-chunky-trio-v2/01-maltese-chunky-v2.png

Use case: precise-object-edit.
Edit target: the attached white Maltese mascot. Make a corrected full-body character portrait for the same game.
Change only the body proportions. The current body is excessively broad and obese. Give it a moderately plump, balanced two-head-tall canine build: head height (crown to chin, not ear tips) and lower-body height (chin to ground including paws) must be about 1:1. The chin should be approximately halfway between crown and paw baseline. Narrow the torso and belly substantially: the torso excluding arms/feet should be about 75% of the head width excluding ears. Keep gentle rounded sides, a compact short chest, and clearly visible stubby front legs with simple paws. Sitting dog posture, small hind feet beside the front paws. No flared hips, no bulging belly, no fat rolls. Do not give it long human limbs or a human neck.
Preserve this exact Maltese's facial identity: white fluffy dropped ears, crown tufts, half-lidded deadpan eyes, solid black broad oval nose, small crooked mouth, little coral tongue to one side. Keep the same clean heavy black hand-drawn contours and flat white fill. The cool understated attitude comes from the face and simple silhouette.
One dog only, centered full body with all paws visible, square pure white background and ample margin. Crisp flat illustration with no gray grime, smoky shading, paper grain, cast shadow, clothing, accessories, extra objects, labels or text. This is a proportional correction, not a different character.

## 시바견

Edit target: ../pupsters-chunky-trio-v2/02-shiba-inu-chunky-v2.png

Use case: precise-object-edit.
Input image 1: EDIT TARGET, the 시바견 mascot to correct. Input image 2: supporting PROPORTIONS reference, the corrected white Maltese; copy its balance between head and body, not its ears, face or coat.
Primary request: the first dog's body is too fat. Change only its body proportions into a moderately plump two-head-tall canine. Head height from crown to chin (excluding projecting ears) and body height from chin to paw baseline should be about 1:1. Chin at roughly the halfway point between crown and ground. Narrow its torso substantially; body width excluding limbs should be about 75–80% of its head width excluding ears. Gentle rounded sides, clearly visible short front legs and paws, seated canine posture with modest hind paws. No bulging belly, flared hips or fat rolls. No human body, no long human legs, no visible long neck.
Shiba Inu: keep its orange coat, ivory cheeks and muzzle, the two light eyebrow patches, pointed triangular ears, orange-and-ivory curled tail and ivory chest and paws.
Preserve the exact face design and attitude from image 1: half-lidded deadpan eyes, black wide oval nose, simple crooked mouth, tiny coral tongue to one side. Keep the heavy clean black hand-drawn contours, slightly informal curves, flat solid colors and minimal details. Adjust the body rather than replacing the face.
Composition: one full-body dog alone, centered in a square white canvas, ample margins, all paws and tail visible. Crisp clean illustration. No gritty texture, charcoal shading, smudges, gray grime, gradients, cast shadows, clothing, accessories, objects, labels or text.

## 불도그

Edit target: ../pupsters-chunky-trio-v2/03-bulldog-chunky-v2.png

Use case: precise-object-edit.
Input image 1: EDIT TARGET, the 불도그 mascot to correct. Input image 2: supporting PROPORTIONS reference, the corrected white Maltese; copy its balance between head and body, not its ears, face or coat.
Primary request: the first dog's body is too fat. Change only its body proportions into a moderately plump two-head-tall canine. Head height from crown to chin (excluding projecting ears) and body height from chin to paw baseline should be about 1:1. Chin at roughly the halfway point between crown and ground. Narrow its torso substantially; body width excluding limbs should be about 75–80% of its head width excluding ears. Gentle rounded sides, clearly visible short front legs and paws, seated canine posture with modest hind paws. No bulging belly, flared hips or fat rolls. No human body, no long human legs, no visible long neck.
English Bulldog: keep its fawn-and-white coat, white central blaze and muzzle, small folded ears, broad cheek jowls, fawn eye patches and white chest and paws. Preserve its breed's sturdy build but remove the excessive lateral belly width.
Preserve the exact face design and attitude from image 1: half-lidded deadpan eyes, black wide oval nose, simple crooked mouth, tiny coral tongue to one side. Keep the heavy clean black hand-drawn contours, slightly informal curves, flat solid colors and minimal details. Adjust the body rather than replacing the face.
Composition: one full-body dog alone, centered in a square white canvas, ample margins, all paws and tail visible. Crisp clean illustration. No gritty texture, charcoal shading, smudges, gray grime, gradients, cast shadows, clothing, accessories, objects, labels or text.

### 최종 비율 보정

Use case: precise-object-edit. Edit this exact bulldog drawing, with one proportional correction.
The lower body is still too short. Make crown-to-chin HEAD HEIGHT exactly equal to chin-to-ground BODY HEIGHT: 1:1 vertically, a two-head-tall dog. Give the body below the chin about 30% more vertical space than it has now and scale the head down slightly in height, retaining its broad bulldog face. Target layout on the square canvas: crown near 18% from top, chin at 52%, paws at 86%. Thus head and visible lower body each occupy 34% of the canvas height. The jowls should end near the vertical midpoint of the full character, not two thirds down.
Keep the moderately narrow chest, gently rounded straight body sides and visible stubby front legs; distribute the added lower-body length between chest and legs. Keep seated canine anatomy, not a human torso, no human arms, no neck, no huge belly, no flared hips. Body width excluding limbs about 75% of head width.
Keep the same fawn-and-white markings, folded ears, half-lidded eyes, black nose, cheek jowls, tiny side tongue, tiny tail, heavy clean black outlines, flat colors, simple few details, cool unbothered expression. One dog alone on pure white background, no text or props. Remove the two gray/brown cheek wrinkle strokes so all drawn contours are black; otherwise preserve facial identity and color shapes.
