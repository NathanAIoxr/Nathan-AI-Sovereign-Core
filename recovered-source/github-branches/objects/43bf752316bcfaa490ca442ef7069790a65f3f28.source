#!/usr/bin/env python3
"""Offline, reproducible children's game art. Requires Pillow only.
Generates artwork without image downloads, API access, or personal photographs.
"""
import json, random, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
random.seed(20261012)
ROOT=Path(__file__).resolve().parents[1]/'Resources'/'Assets.xcassets'
ROOT.mkdir(parents=True,exist_ok=True)

def save_asset(name,img,icon=False):
    d=ROOT/(name+('.appiconset' if icon else '.imageset'));d.mkdir(parents=True,exist_ok=True)
    img.save(d/(name+'.png'), optimize=True)
    image={'filename':name+'.png','idiom':'universal'}
    if icon:image.update(platform='ios',size='1024x1024')
    (d/'Contents.json').write_text(json.dumps({'images':[image],'info':{'author':'xcode','version':1}},indent=2))

def landscape(w,h):
    im=Image.new('RGB',(w,h));d=ImageDraw.Draw(im,'RGBA')
    for y in range(h):
        f=y/h
        c=(int(115+42*f),int(214-35*f),int(240-85*f))
        d.line((0,y,w,y),fill=c)
    d.ellipse((w*.74,h*.045,w*.92,h*.30),fill=(255,237,157,240))
    d.ellipse((-w*.45,h*.55,w*.66,h*1.25),fill=(57,164,121,255))
    d.ellipse((w*.3,h*.43,w*1.24,h*1.24),fill=(68,181,121,255))
    d.ellipse((-w*.3,h*.81,w*1.2,h*1.7),fill=(40,145,92,255))
    return im

def tree(d,x,y,s):
    d.rounded_rectangle((x-13*s,y-80*s,x+13*s,y+78*s),radius=8*s,fill=(105,66,45,255))
    for z in range(3):
        r=(82-z*13)*s;cy=y-(99-z*36)*s
        d.ellipse((x-r,cy-r*.85,x+r,cy+r*.85),fill=(22+z*7,104+z*19,78+z*7,255))

def house(d,x,y,s):
    a=74*s;b=58*s
    d.rounded_rectangle((x-a,y-b,x+a,y+b),radius=int(8*s),fill=(152,96,68,255),outline=(73,58,50,255),width=int(4*s))
    d.polygon(((x-94*s,y-43*s),(x,y-130*s),(x+94*s,y-43*s)),fill=(158,67,65,255))
    for u in [-.45,.45]:
        dx=a*u
        d.rounded_rectangle((x+dx-12*s,y-25*s,x+dx+12*s,y+6*s),radius=4*s,fill=(255,232,144,255))
    d.rounded_rectangle((x-14*s,y+10*s,x+14*s,y+b),radius=4*s,fill=(73,47,41,255))

def kitten(d,cx,cy,r,stewart=False):
    """Two visually complementary 50/50 black/white patched cats."""
    ink=(39,44,49,255);ivory=(251,248,230,255)
    ears=[((cx-r*.82,cy-r*.47),(cx-r*.64,cy-r*1.45),(cx-r*.19,cy-r*.89)),
          ((cx+r*.20,cy-r*.88),(cx+r*.70,cy-r*1.43),(cx+r*.84,cy-r*.36))]
    for ear in ears: d.polygon(ear,fill=ink)
    for ear in ears:
        pts=list(ear);mid=tuple(sum(p[i] for p in pts)/3 for i in (0,1))
        d.ellipse((mid[0]-r*.12,mid[1]-r*.12,mid[0]+r*.12,mid[1]+r*.12),fill=(227,148,158,255))
    d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=(ink if not stewart else ivory))
    if stewart:
        # Tall white cleavage explicitly splits the black upper face and head.
        d.pieslice((cx-r,cy-r,cx+r,cy+r),200,345,fill=ink)
        d.polygon([(cx-r*.19,cy-r*.95),(cx+r*.13,cy-r*.96),(cx+r*.30,cy+r*.32),(cx-r*.18,cy+r*.22)],fill=ivory)
        d.ellipse((cx-r*.72,cy+r*.15,cx+r*.74,cy+r*.95),fill=ivory)
    else:
        # Inverse pattern: sweeping black blotch divides predominantly white patch.
        d.ellipse((cx-r*.77,cy-r*.55,cx+r*.81,cy+r*.89),fill=ivory)
        d.polygon([(cx-r*.28,cy-r*.84),(cx+r*.22,cy-r*.89),(cx+r*.14,cy+r*.40),(cx-r*.05,cy+r*.45)],fill=ink)
    for side in [-1,1]:
        ex=cx+side*r*.42;ey=cy-r*.11
        d.ellipse((ex-r*.15,ey-r*.12,ex+r*.15,ey+r*.13),fill=(248,216,130,255))
        d.ellipse((ex-r*.046,ey-r*.10,ex+r*.046,ey+r*.13),fill=(25,34,40,255))
        d.ellipse((ex-r*.066,ey-r*.055,ex-r*.015,ey-r*.01),fill=(255,255,255,255))
    d.polygon(((cx-r*.12,cy+r*.36),(cx+r*.12,cy+r*.36),(cx,cy+r*.53)),fill=(239,155,159,255))
    d.arc((cx-r*.25,cy+r*.45,cx,cy+r*.66),0,145,fill=ink,width=max(2,int(r*.024)))
    d.arc((cx,cy+r*.45,cx+r*.25,cy+r*.66),40,180,fill=ink,width=max(2,int(r*.024)))
    for side in [-1,1]:
        for z in [-1,0,1]:
            start=(cx+side*r*.13,cy+r*.58)
            end=(cx+side*r*.97,cy+r*(.52+z*.18))
            d.line((start,end),fill=(250,245,229,255) if not stewart else (66,61,53,255),width=max(2,int(r*.012)))
    # legs and white paws
    for u in [-.43,.43]:
        d.rounded_rectangle((cx+u*r-r*.26,cy+r*.73,cx+u*r+r*.26,cy+r*1.30),radius=int(r*.22),fill=ink)
        d.ellipse((cx+u*r-r*.29,cy+r*1.04,cx+u*r+r*.30,cy+r*1.38),fill=ivory)

# Wide hero with fully original paint-horse-like animal illustrations.
w,h=1102,560
hero=landscape(w,h);d=ImageDraw.Draw(hero,'RGBA')
for x,y,s in [(70,210,.70),(1045,205,.72),(150,350,.5),(930,365,.52)]:tree(d,x,y,s)
house(d,800,285,.9)
# underpaw grassy platform
d.rounded_rectangle((130,460,990,555),radius=34,fill=(133,81,53,255))
d.rounded_rectangle((130,458,990,482),radius=15,fill=(204,158,96,255))
kitten(d,341,247,145,stewart=True)
kitten(d,744,247,145,stewart=False)
save_asset('CatHeroes',hero)

# Tall map illustration for hidden-treasure hunt.
w,h=960,1350
world=landscape(w,h);d=ImageDraw.Draw(world,'RGBA')
d.line(((400,1370),(470,1180),(420,960),(590,770),(300,540)),fill=(249,227,172,255),width=120,joint='curve')
for x,y,s in [(20,355,1.2),(955,360,1.1),(135,700,.75),(830,775,.7),(55,1150,.6),(940,1220,.8)]:tree(d,x,y,s)
for x,y,s in [(580,390,1.0),(260,895,.82),(710,1090,.9)]:house(d,x,y,s)
for i in range(110):
    x=random.randrange(0,w);y=random.randrange(300,h)
    r=random.randrange(3,10)
    d.ellipse((x-r,y-r,x+r,y+r),fill=random.choice([(255,239,143,235),(249,183,218,235),(230,251,214,235)]))
save_asset('Puzzlewood',world)

# App icon: same two cats, clear at small sizes, no unnecessary words.
icon=landscape(1024,1024);d=ImageDraw.Draw(icon,'RGBA')
d.ellipse((50,740,970,1210),fill=(19,123,97,255))
kitten(d,300,445,185,stewart=True)
kitten(d,735,445,185,stewart=False)
d.ellipse((458,805,566,911),fill=(255,223,152,255))
for x,y in [(482,783),(512,765),(543,780)]:d.ellipse((x-17,y-21,x+17,y+13),fill=(255,223,152,255))
save_asset('AppIcon',icon,icon=True)
print('Generated offline artwork:', ROOT)

# New original offline dog portraits; no external image licensing or network calls.
def dog_portrait(name, red=False):
    w,h=1050,630
    image=landscape(w,h)
    d=ImageDraw.Draw(image,"RGBA")
    coat=(155,77,47,255) if red else (201,143,87,255)
    dark=(110,55,39,255) if red else (143,88,52,255)
    white=(251,243,215,255)
    for x,y,z in [(55,325,.65),(990,305,.67)]: tree(d,x,y,z)
    d.ellipse((255,290,820,685),fill=coat)
    if red:
        for x in range(300,820,45):
            d.polygon([(x,500),(x+20,600),(x+54,492)],fill=coat)
        d.ellipse((492,385,635,660),fill=white)
    d.ellipse((348,108,748,498),fill=coat)
    if red:
        d.polygon([(387,241),(330,51),(500,145)],fill=dark)
        d.polygon([(680,241),(755,52),(618,146)],fill=dark)
        d.polygon([(515,120),(573,120),(595,374),(490,374)],fill=white)
    else:
        d.ellipse((310,170,430,475),fill=dark)
        d.ellipse((660,175,787,471),fill=dark)
    for x in (457,633):
        d.ellipse((x-33,261,x+33,314),fill=white)
        d.ellipse((x-15,267,x+15,309),fill=(35,35,35,255))
        d.ellipse((x-9,270,x-1,279),fill=white)
    d.ellipse((435,331,663,483),fill=(243,216,181,255))
    d.ellipse((511,355,589,411),fill=(54,39,37,255))
    d.arc((490,394,605,483),4,176,fill=(100,57,42,255),width=8)
    for x in (430,649):
        d.ellipse((x-73,495,x+73,629),fill=white if red else (236,185,116,255))
    save_asset(name,image)

dog_portrait("ChampPortrait")
dog_portrait("AcePortrait",True)
