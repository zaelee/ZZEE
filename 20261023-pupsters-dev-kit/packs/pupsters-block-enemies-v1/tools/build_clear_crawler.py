"""Original block construction of E07; colors are sRGB, dimensions in studs."""
import json
from build_models import ROOT

sc={'id':'E07','slug':'clear-crawler','name':'ClearCrawler_Enemy','displayName':'투명 블록봇',
    'version':1,'units':'studs','up':'+Y','front':'-Z','feature':'비치는 몸통 · 짙은 파랑 테두리 · 짧은 네 발',
    'role':'은신 접근형','roleDescription':'투명한 몸통으로 탐지를 피하는 적 콘셉트. 은신 판정은 미구현.',
    'hitPoint':[0,.81,-.64],
    'materials':{'glass':{'color':[.45,.82,.96],'opacity':.38},
                 'frame':{'color':[.15,.43,.64]},'foot':{'color':[.18,.51,.76]},
                 'eyes':{'color':[.05,.12,.20]}},'parts':[]}
def part(name,group,size,pos,mat,kind='box'):
    sc['parts'].append(dict(name=name,group=group,type=kind,size=size,position=pos,rotation=[0,0,0],material=mat))
part('ClearBody','Body',[1.7,1.0,1.25],[0,.80,0],'glass')
for x,lr in [(-.85,'L'),(.85,'R')]:
    for z,fb in [(-.625,'Front'),(.625,'Back')]:
        part('Edge'+lr+fb,'Frame',[.055,1.04,.055],[x,.80,z],'frame')
for y,tb in [(.3,'Bottom'),(1.3,'Top')]:
    for z,fb in [(-.625,'Front'),(.625,'Back')]:
        part('Rail'+tb+fb,'Frame',[1.755,.055,.055],[0,y,z],'frame')
    for x,lr in [(-.85,'L'),(.85,'R')]:
        part('Rail'+tb+lr,'Frame',[.055,.055,1.3],[x,y,0],'frame')
for x,lr in [(-.61,'L'),(.61,'R')]:
    for z,fb in [(-.43,'F'),(.43,'B')]:
        part('Foot'+lr+fb,'Feet',[.32,.34,.36],[x,.17,z],'foot')
for x,lr in [(-.31,'L'),(.31,'R')]:
    part('DotEye'+lr,'Face',[.11,.145,.06],[x,.84,-.643],'eyes','sphere')
(ROOT/'scenes/E07-clear-crawler.json').write_text(json.dumps(sc,ensure_ascii=False,indent=2),encoding='utf-8')
print('E07:',len(sc['parts']),'parts')
