"""Validate exported artwork and compose review sheets from existing PNGs."""
from pathlib import Path
import json
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'previews'
OUT.mkdir(exist_ok=True)
FONT = next((str(p) for p in [
    Path(os.environ.get('PUPSTERS_FONT', '')),
    Path('C:/Windows/Fonts/malgun.ttf'),
    Path('/System/Library/Fonts/AppleSDGothicNeo.ttc'),
    Path('/usr/share/fonts/truetype/nanum/NanumGothic.ttf'),
    Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')
] if p.is_file()), None)
def font(size):
    if not FONT:
        raise RuntimeError('Set PUPSTERS_FONT to an installed Korean .ttf/.ttc/.otf font path.')
    return ImageFont.truetype(FONT, size)

DOGS = [
    ('D01-shiba.png', '시바멈', '입으로 작은 뼈 뱉기'),
    ('D02-bulldog.png', '불돔', '볼에 모은 압축 공기탄'),
    ('D03-husky.png', '머스키', '얼음 귀끝 · 냉기 숨결'),
    ('D04-beagle.png', '미글', '끈적한 침방울'),
    ('D05-poodle.png', '무들', '정수리 번개 · 정전기'),
    ('D06-collie.png', '모더콜리', '낡은 왕관 · 응원 짖기')
]
ENEMIES = [
    ('E01-block-bot.png', '기본 블록봇', '기본'),
    ('E02-wheelie.png', '바퀴 블록봇', '고속'),
    ('E03-brick-bruiser.png', '벽돌 덩치', '탱커'),
    ('E04-shellback.png', '장갑 블록봇', '장갑'),
    ('E05-split-stack.png', '분열 블록봇', '분열'),
    ('E06-fix-it-bot.png', '수리 블록봇', '수리'),
    ('E07-clear-crawler.png', '투명 블록봇', '은신'),
    ('E08-carrier-cart.png', '블록 운반차', '수송'),
    ('B01-blockosaur.png', '블록사우루스', '보스')
]

def sheet(items, folder, heading, subtitle, filename, cell=420):
    cols = 3
    rows = (len(items)+cols-1)//cols
    im = Image.new('RGB', (cols*cell+80, rows*400+150), '#fff7e8')
    d = ImageDraw.Draw(im)
    d.text((48, 28), heading, font=font(38), fill='#29180f')
    d.text((50, 84), subtitle, font=font(18), fill='#79634c')
    for i, (file, name, note) in enumerate(items):
        x, y = 40+(i%cols)*cell, 140+(i//cols)*400
        sprite = Image.open(ROOT/'assets'/folder/file).convert('RGBA')
        # Presentation only: the distributed sprite is neither cropped nor edited.
        sprite = sprite.crop(sprite.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
        sprite.thumbnail((320, 285), Image.Resampling.LANCZOS)
        im.paste(sprite, (x+(cell-sprite.width)//2, y+(285-sprite.height)//2), sprite)
        d.text((x+cell/2, y+300), name, font=font(26), fill='#29180f', anchor='mt')
        d.text((x+cell/2, y+341), note, font=font(17), fill='#79634c', anchor='mt')
    im.save(OUT/filename)

report = []
for file in sorted((ROOT/'assets').rglob('*.png')):
    with Image.open(file) as image:
        image.verify()
    with Image.open(file).convert('RGBA') as image:
        alpha = image.getchannel('A')
        # Very faint generated edge pixels must not count as clipped visible artwork.
        bbox = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
        is_sprite = file.parent.name in ('characters', 'enemies')
        corners = [alpha.getpixel(p) for p in [(0,0),(image.width-1,0),(0,image.height-1),(image.width-1,image.height-1)]]
        assert bbox, f'Empty artwork: {file}'
        if is_sprite:
            assert alpha.getextrema() == (0,255), f'Alpha missing: {file}'
            assert corners == [0]*4, f'Nontransparent corners: {file}'
            assert bbox[0]>0 and bbox[1]>0 and bbox[2]<image.width and bbox[3]<image.height, f'Clipped sprite: {file}'
        report.append({'file':file.relative_to(ROOT).as_posix(),'width':image.width,'height':image.height,'alpha_extrema':alpha.getextrema(),'visible_bounds':bbox,'transparent_corners':corners==[0]*4})
assert len(report) == 16, f'Expected 16 PNG assets, found {len(report)}'
(ROOT/'docs'/'artwork-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
sheet(DOGS,'characters','사고멍치  /  PUPSTERS','작은 코 · 짧은 몸 · 각자의 능력이 보이는 여섯 멍치','characters.png')
sheet(ENEMIES,'enemies','우당탕, 장난감들의 습격','강아지와 같은 굵은 선으로 다시 그린 블록 몹 9종','enemies.png')
print(f'PASS: {len(report)} PNGs verified; 15 transparent sprites; 2 review sheets saved.')
