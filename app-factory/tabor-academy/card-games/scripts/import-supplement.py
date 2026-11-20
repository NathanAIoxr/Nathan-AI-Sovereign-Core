"""Index game titles and source links from additional saved reference pages."""
from hashlib import sha256
from pathlib import Path
from urllib.parse import urljoin, urlparse
import json
import re
import sys
from lxml import html

PAGAT = 'https://www.pagat.com/'
PAGES = {
    'parlett.html': ('https://www.parlettgames.uk/histocs/', 'Historic'),
    'pagat-solitaire-card.html': (PAGAT + 'solitaire/card.html', 'Layout'),
    'pagat-com.html': (PAGAT + 'com/', 'Proprietary'),
    'pagat-trading.html': (PAGAT + 'com/trading.html', 'Proprietary'),
    'pagat-invented.html': (PAGAT + 'invented/', 'Unclassified'),
}


def clean(node):
    return ' '.join(node.text_content().split())


def entries(file, base):
    tree = html.parse(str(file))
    if file.name == 'parlett.html':
        for anchor in tree.xpath('//table//tr/td[1]/a[@href]'):
            if anchor.get('href') not in {'histrefs.html', 'patience.html', 'leafgame.html'}:
                yield clean(anchor), urljoin(base, anchor.get('href')), []
    elif file.name == 'pagat-solitaire-card.html':
        for cell in tree.xpath('//div[@class="soltable"]//td[@class="col1"]'):
            anchor = cell.xpath('.//a[@href]')[0]
            yield clean(cell), urljoin(base, anchor.get('href')), []
    elif file.name == 'pagat-trading.html':
        for heading in tree.xpath('//h3[@id and preceding-sibling::h2[@id="games"] and following-sibling::h2[@id="suppliers"]]'):
            yield clean(heading), base + '#' + heading.get('id'), []
    else:
        for term in tree.xpath('//div[contains(@class,"mainContent")]//dl//dt'):
            links = term.xpath('.//a[@href][normalize-space()]')
            if not links:
                continue
            anchor = links[0]
            candidate = urljoin(base, anchor.get('href'))
            heading = clean(anchor)
            parent_id = term.get('id') or term.xpath('ancestor::div[@id][1]/@id')
            stable = base + ('#' + (parent_id if isinstance(parent_id, str) else parent_id[0]) if parent_id else '')
            if file.name == 'pagat-invented.html':
                follows = term.getnext()
                detail = clean(follows) if follows is not None and follows.tag == 'dd' else ''
                if re.search(r'\bdomino(?:es)?\b|\bmah\s*jong\b', heading + ' ' + detail, re.I) or '/domino/' in candidate:
                    continue
            if len(heading) < 2:
                continue
            # Link the index entry and an individual page when the latter is
            # served by one of the two game-history sites.
            more = [candidate] if urlparse(candidate).hostname in {'www.pagat.com','www.parlettgames.uk'} and candidate != stable else []
            yield heading, stable, more


if __name__ == '__main__':
    folder, target = map(Path,sys.argv[1:])
    games = {}
    for name, (base, family) in PAGES.items():
        for title, url, supporting in entries(folder / name, base):
            if urlparse(url).scheme != 'https':
                continue
            source = 'David Parlett’s historical games' if name == 'parlett.html' else 'Pagat source index'
            suffix = sha256((title.casefold() + '\n' + url).encode()).hexdigest()[:14]
            game_id = 'ref-' + suffix
            games[game_id] = {
                'id':game_id,'title':title,'family':family,'region':'',
                'players':'1 or see source' if family == 'Layout' else '',
                'deck':'Publisher-specific' if family == 'Proprietary' else '',
                'status':'indexed','aliases':[],
                'sources':[{'label':source,'url':url}, *({'label':'Game reference','url':v} for v in supporting if v.startswith('https:'))],
            }
    if len(games) < 1000:
        raise SystemExit('Supplement had fewer than 1,000 game references')
    target.write_text(json.dumps(sorted(games.values(),key=lambda game: (game['title'].casefold(),game['id'])),ensure_ascii=False,separators=(',',':'))+'\n', encoding='utf8')
    print(len(games))
