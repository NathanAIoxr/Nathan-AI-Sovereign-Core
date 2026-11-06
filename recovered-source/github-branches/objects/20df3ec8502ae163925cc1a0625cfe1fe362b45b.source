#!/usr/bin/env python3
"""Package recovered artwork. Extract existing pixels; never invent cat markings."""
import json
from pathlib import Path
from PIL import Image, ImageOps

BASE = Path(__file__).resolve().parents[1]
SOURCE = BASE / 'Artwork'
ROOT = BASE / 'Resources' / 'Assets.xcassets'
ROOT.mkdir(parents=True, exist_ok=True)

def asset(name, image, icon=False):
    folder = ROOT / (name + ('.appiconset' if icon else '.imageset'))
    folder.mkdir(parents=True, exist_ok=True)
    filename = name + ('.png' if icon else '.jpg')
    image = image.convert('RGB')
    if icon:
        # Preserve both complete faces in the square icon instead of clipping eyes.
        ImageOps.pad(image, (1024, 1024), color='#edca83').save(folder / filename, optimize=True)
    else:
        image.save(folder / filename, quality=95, optimize=True)
    entry = {'filename': filename, 'idiom': 'universal'}
    if icon:
        entry.update(platform='ios', size='1024x1024')
    (folder / 'Contents.json').write_text(json.dumps({
        'images': [entry], 'info': {'author': 'xcode', 'version': 1}
    }, indent=2))

# The showcase explicitly labels Stewart on the left and Mr. Finn on the right.
# Coordinates isolate the existing illustrated characters and scenes from its UI.
showcase = Image.open(SOURCE / 'OriginalGameShowcase.png').convert('RGB')
family = Image.open(SOURCE / 'OriginalMammalFamily.png').convert('RGB')
polar = Image.open(SOURCE / 'OriginalPolarFamily.png').convert('RGB')
workshop = Image.open(SOURCE / 'OriginalWorkshop.png').convert('RGB')
images = {
    'CatHeroes': showcase.crop((490, 225, 938, 510)),
    'StewartPortrait': showcase.crop((490, 232, 729, 506)),
    'FinnPortrait': showcase.crop((727, 220, 938, 510)),
    'Puzzlewood': showcase.crop((239, 558, 402, 800)),
    # Retain Mrs Clause and the original working cats; omit the retired sign.
    'Workshop': workshop.crop((0, 210, 1536, 1010)),
    'NorthPaw': polar.crop((0, 180, 720, 650)),
    'BiscuitArt': showcase.crop((490, 232, 729, 506)),
    'MirrorArt': showcase.crop((448, 566, 610, 800)),
    'ChampPortrait': family.crop((20, 503, 423, 825)),
    'AcePortrait': family.crop((797, 510, 1145, 835)),
    'BondArt': family.crop((10, 500, 1140, 1000)),
}
for name, image in images.items():
    asset(name, image)
asset('AppIcon', images['CatHeroes'], icon=True)
for i, source in enumerate(['CatHeroes', 'BiscuitArt', 'MirrorArt', 'ChampPortrait', 'AcePortrait', 'BondArt']):
    asset('World' + str(i), images[source])
print('Packaged 18 assets from four recovered original artworks; no replacement cats.')
