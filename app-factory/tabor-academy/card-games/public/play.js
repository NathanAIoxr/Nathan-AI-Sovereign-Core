const suits = [
  { glyph: '♠', name: 'spades' }, { glyph: '♥', name: 'hearts' },
  { glyph: '♣', name: 'clubs' }, { glyph: '♦', name: 'diamonds' },
];
const rankName = (n) => ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' })[n] || String(n);
const label = (c) => rankName(c.rank) + c.suit.glyph;
const spoken = (c) => rankName(c.rank) + ' of ' + c.suit.name;

export function deck(maxRank = 13, suitCount = 4, rng = Math.random) {
  const cards = suits.slice(0, suitCount).flatMap((suit) =>
    Array.from({ length: maxRank }, (_, i) => ({ suit, rank: i + 1 })));
  return shuffle(cards, rng);
}

function shuffle(cards, rng = Math.random) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export const hiLo = ({ rank }) => rank === 1 || rank >= 10 ? -1 : rank <= 6 ? 1 : 0;
export function handTotal(cards) {
  const hard = cards.reduce((sum, card) => sum + Math.min(card.rank, 10), 0);
  return cards.some((card) => card.rank === 1) && hard <= 11 ? hard + 10 : hard;
}

export function combinations(cards, target) {
  for (let i = 0; i < cards.length; i++) {
    if (!cards[i]) continue;
    for (let j = i + 1; j < cards.length; j++) {
      if (!cards[j]) continue;
      const pair = cards[i].rank + cards[j].rank;
      if (pair === target) return [i, j];
      for (let k = j + 1; k < cards.length; k++) {
        if (cards[k] && pair + cards[k].rank === target) return [i, j, k];
      }
    }
  }
  return [];
}

export function deadwood(cards) {
  const melds = [];
  const points = (i) => Math.min(cards[i].rank, 10);
  for (let mask = 1; mask < 2 ** cards.length; mask++) {
    const group = cards.filter((_, i) => mask & (1 << i)).sort((a,b) => a.rank - b.rank);
    if (group.length < 3) continue;
    const set = group.every((c) => c.rank === group[0].rank);
    const run = group.every((c,i) => c.suit.glyph === group[0].suit.glyph && c.rank === group[0].rank + i);
    if (set || run) melds.push(mask);
  }
  const memo = new Map([[0, 0]]);
  function score(mask) {
    if (memo.has(mask)) return memo.get(mask);
    const low = mask & -mask;
    let best = points(31 - Math.clz32(low)) + score(mask ^ low);
    for (const meld of melds) {
      if ((meld & low) && (mask & meld) === meld) best = Math.min(best, score(mask ^ meld));
    }
    memo.set(mask,best);
    return best;
  }
  return score(2 ** cards.length - 1);
}

function el(tag, content, className = '') {
  const node = document.createElement(tag);
  node.textContent = content;
  if (className) node.className = className;
  return node;
}

function button(text, action, disabled = false) {
  const node = el('button', text);
  node.type = 'button';
  node.disabled = disabled;
  node.addEventListener('click', action);
  return node;
}

function cardNode(card, action, hidden = false, pressed = false, position = '') {
  const text = hidden ? '◆' : card ? label(card) : '–';
  const node = action ? button(text, action) : el('span', text);
  node.className = action ? 'card-button' : 'card-value';
  if (hidden) node.classList.add('back');
  else if (card && ['♥','♦'].includes(card.suit.glyph)) node.classList.add('red');
  node.setAttribute('aria-label', [position, hidden ? 'face down' : card ? spoken(card) : 'empty'].filter(Boolean).join(', '));
  if (action) node.setAttribute('aria-pressed', String(pressed));
  return node;
}

function table(root, heading, hint) {
  const title = el('h3', heading);
  const status = el('p', hint);
  status.setAttribute('role', 'status');
  const surface = el('div','');
  const control = el('div','','controls');
  root.replaceChildren(title, status, surface, control);
  return { status, surface, control };
}

function row(cards, name, hiddenLast = false) {
  const group = el('div','','card-row');
  group.setAttribute('aria-label', name);
  group.setAttribute('role','group');
  cards.forEach((c, i) => group.append(cardNode(c, null, hiddenLast && i === cards.length - 1)));
  return group;
}

function war(root, subtract) {
  const { status, surface, control } = table(root, subtract ? 'Subtraction War' : 'Addition War', 'Flip two cards for each player.');
  const stock = deck(10);
  const scores = [0,0];
  let tied = 0;
  let round = 0;
  const flip = button('Flip cards', () => {
    const a = stock.splice(0,2), b = stock.splice(0,2);
    const get = (c) => subtract ? Math.abs(c[0].rank - c[1].rank) : c[0].rank + c[1].rank;
    const x = get(a), y = get(b);
    surface.replaceChildren(row(a,'Player 1'),row(b,'Player 2'));
    round++;
    if (x === y) tied += 4;
    else { scores[x > y ? 0 : 1] += 4 + tied; tied = 0; }
    const result = round < 10 ? '' : scores[0] === scores[1] ? ' The game is tied.' : ' Player ' + (scores[0] > scores[1] ? '1' : '2') + ' wins.';
    status.textContent = 'Turn ' + round + ' of 10. Totals ' + x + ' and ' + y +
      '. Cards won ' + scores.join(' to ') + (tied ? '. Tie pile ' + tied : '') + '.' + result;
    flip.disabled = round === 10;
  });
  control.append(flip, button('New game', () => war(root, subtract)));
}

function grid(root, target) {
  const { status, surface, control } = table(root, 'Make ' + target, 'Select two or three cards that reach the target.');
  const stock = deck(10);
  const cards = stock.splice(0,9);
  const picked = new Set();
  let score = 0;
  const group = el('div','','card-row');
  surface.append(group);
  function draw() {
    group.replaceChildren(...cards.map((c,i) => cardNode(c,c ? (event) => {
      if (picked.has(i)) picked.delete(i);
      else if (picked.size < 3) picked.add(i);
      event.currentTarget.setAttribute('aria-pressed', String(picked.has(i)));
    } : null, false, picked.has(i), 'Slot ' + (i+1))));
    if (!combinations(cards,target).length) status.textContent = 'No combinations remain. Final score ' + score + '.';
  }
  control.append(button('Check total', () => {
    if (!combinations(cards,target).length) return;
    const sum = [...picked].reduce((n,i) => n + cards[i].rank,0);
    if (picked.size < 2 || sum !== target) {
      status.textContent = 'Selected total ' + sum + '. Choose two or three cards totaling ' + target + '.';
      return;
    }
    for (const i of picked) cards[i] = stock.pop() || null;
    picked.clear();
    status.textContent = 'Correct. Score ' + (++score) + '.';
    draw();
  }), button('New grid', () => grid(root,target)));
  draw();
}

function blackjack(root) {
  const { status, surface, control } = table(root, 'Blackjack practice', 'Play to 21. Use hit or stand.');
  const stock = deck();
  const player = [stock.pop(), stock.pop()], dealer = [stock.pop(), stock.pop()];
  let done = false;
  function draw() {
    surface.replaceChildren(el('p','Your hand · ' + handTotal(player)),row(player,'Your hand'),
      el('p',done ? 'Dealer · ' + handTotal(dealer) : 'Dealer · one hidden'),row(dealer,'Dealer hand',!done));
  }
  function finish(runDealer) {
    const p = handTotal(player);
    if (runDealer && p <= 21) while (handTotal(dealer) < 17) dealer.push(stock.pop());
    const d = handTotal(dealer);
    const pNatural = player.length === 2 && p === 21;
    const dNatural = dealer.length === 2 && d === 21;
    done = true;
    status.textContent = (p > 21 ? 'You bust.' : pNatural && !dNatural ? 'Natural 21. You win.' :
      dNatural && !pNatural ? 'Dealer has natural 21.' : d > 21 ? 'Dealer busts. You win.' :
      p === d ? 'Push. The hand is tied.' : p > d ? 'You win.' : 'Dealer wins.');
    hit.disabled = stand.disabled = true;
    draw();
  }
  const hit = button('Hit', () => {
    player.push(stock.pop());
    if (handTotal(player) > 21) finish(false);
    else draw();
  });
  const stand = button('Stand', () => finish(true));
  control.append(hit,stand,button('New hand', () => blackjack(root)));
  if (handTotal(player) === 21 || handTotal(dealer) === 21) finish(false);
  else draw();
}

function countPractice(root) {
  const { status, surface, control } = table(root,'Hi-Lo counting drill','Start at zero. Reveal a card, then keep the count in your head.');
  const stock = deck();
  let running = 0;
  const history = [];
  const next = button('Reveal card', () => {
    const card = stock.pop();
    history.push(card);
    running += hiLo(card);
    surface.replaceChildren(row([card],'Latest revealed card'));
    status.textContent = history.length + ' of 52 cards revealed. ' + stock.length + ' cards remain.';
    if (!stock.length) next.disabled = true;
  });
  const label = el('label', 'Your running count');
  const guess = document.createElement('input');
  guess.type = 'number'; guess.step = '1'; guess.value = '0';
  label.append(guess);
  control.append(next,label,button('Check count', () => {
    const left = stock.length / 52;
    const answer = guess.value !== '' && Number(guess.value) === running ? 'Correct.' : 'Count check.';
    status.textContent = answer + ' Running count ' + running + (left ? '. True count ' + (running / left).toFixed(2) + ' using the exact deck fraction.' : '. The full deck is balanced.');
  }),button('Reshuffle', () => countPractice(root)));
}

function memory(root) {
  const { status, surface, control } = table(root,'Rank Pairs Memory','Turn up two cards and compare their ranks.');
  const cards = deck(6,2);
  const matched = new Set();
  let faceUp = [];
  let attempts = 0;
  function draw(focus = -1) {
    const group = el('div','','card-row');
    cards.forEach((c,i) => {
      const visible = faceUp.includes(i) || matched.has(i);
      const pick = cardNode(c,visible || faceUp.length === 2 ? null : () => {
        faceUp.push(i);
        if (faceUp.length === 2) {
          attempts++;
          if (cards[faceUp[0]].rank === cards[faceUp[1]].rank) {
            for (const index of faceUp) matched.add(index);
            faceUp = [];
            status.textContent = matched.size === cards.length ? 'Board cleared in ' + attempts + ' attempts.' : 'Match. Find another pair.';
          } else status.textContent = 'Different ranks. Cover the cards and try again.';
        }
        draw(i);
      }, !visible, false, 'Card ' + (i+1));
      group.append(pick);
    });
    surface.replaceChildren(group);
    cover.disabled = faceUp.length !== 2;
    if (focus >= 0) {
      const next = [...group.children].slice(focus + 1).find((node) => node.tagName === 'BUTTON') ?? group.querySelector('button');
      (next ?? (cover.disabled ? reset : cover)).focus();
    }
  }
  const cover = button('Cover both', () => { faceUp = []; draw(0); }, true);
  const reset = button('New board', () => memory(root));
  control.append(cover,reset);
  draw();
}

function gin(root) {
  const { status, surface, control } = table(root,'Gin Rummy deadwood drill','You just drew an eleventh card. Choose one card to discard and estimate the remaining deadwood.');
  const hand = deck().slice(0,11).sort((a,b) => a.suit.glyph.localeCompare(b.suit.glyph) || a.rank - b.rank);
  let discarded = -1;
  const label = el('label','Your deadwood estimate');
  const guess = document.createElement('input');
  guess.type = 'number'; guess.min = '0'; guess.step = '1'; label.append(guess);
  function draw() {
    const group = el('div','','card-row');
    hand.forEach((c,i) => group.append(cardNode(c,(event) => {
      discarded = i;
      for (const child of group.children) child.setAttribute('aria-pressed','false');
      event.currentTarget.setAttribute('aria-pressed','true');
      status.textContent = 'Discard selected: ' + spoken(c) + '. Enter the deadwood total.';
    },false,i === discarded)));
    surface.replaceChildren(group);
  }
  control.append(label,button('Check deadwood', () => {
    if (discarded < 0) { status.textContent = 'Choose one card to discard first.'; return; }
    const value = deadwood(hand.filter((_, i) => i !== discarded));
    const best = Math.min(...hand.map((_,i) => deadwood(hand.filter((_,j) => i !== j))));
    const correct = guess.value !== '' && Number(guess.value) === value;
    status.textContent = (correct ? 'Correct. ' : '') + 'Deadwood ' + value + '. Best achievable discard leaves ' + best +
      '. ' + (value === 0 ? 'Gin is available.' : value <= 10 ? 'Knocking is available.' : 'Keep playing.');
  }),button('Deal another hand', () => gin(root)));
  draw();
}

function trash(root) {
  const { status, surface, control } = table(root,'Trash solo round','Draw a card to start.');
  const stock = deck();
  const layout = stock.splice(0,10);
  const open = Array(10).fill(false);
  let held = null;
  let turns = 0;
  let done = false;
  function available(card,i) {
    return card && i < 10 && (!open[i] || layout[i].rank === 11) && (card.rank === i+1 || (card.rank === 11 && !open[i]));
  }
  function draw() {
    const group = el('div','','card-row');
    layout.forEach((card,i) => group.append(cardNode(card, !done && available(held,i) ? () => {
      const next = layout[i];
      layout[i] = held;
      open[i] = true;
      held = next;
      done = open.every(Boolean);
      draw();
    } : null, !open[i], false, 'Slot ' + (i+1))));
    surface.replaceChildren(group);
    const placeable = Boolean(held && layout.some((_,i) => available(held,i)));
    const endStock = !stock.length && !placeable;
    status.textContent = done ? 'Layout complete in ' + turns + ' draws.' :
      endStock ? 'Stock empty. Filled ' + open.filter(Boolean).length + ' of 10 slots.' :
      held ? spoken(held) + (placeable ? ' can be placed. Choose a highlighted slot.' : ' is discarded. Draw again.') :
      'Draw from the stock. ' + open.filter(Boolean).length + ' of 10 slots filled.';
    next.disabled = done || endStock || placeable;
  }
  const next = button('Draw card', () => { held = stock.pop(); turns++; draw(); });
  control.append(next,button('New layout', () => trash(root)));
  draw();
}

function eights(root) {
  const { status, surface, control } = table(root,'Crazy Eights · one opponent','Match the rank or suit. Eights can declare a new suit.');
  const stock = deck();
  const hand = stock.splice(0,5), opponent = stock.splice(0,5);
  const discards = [stock.splice(stock.findIndex((c) => c.rank !== 8),1)[0]];
  let suit = discards[0].suit;
  let done = false;
  let passes = 0;
  const top = () => discards.at(-1);
  function legal(c) { return c.rank === 8 || c.rank === top().rank || c.suit === suit; }
  function pop() {
    if (!stock.length && discards.length > 1) stock.push(...shuffle(discards.splice(0,discards.length-1)));
    return stock.pop();
  }
  function play(cards,i,chosen) {
    const card = cards.splice(i,1)[0];
    discards.push(card);
    suit = card.rank === 8 ? chosen : card.suit;
    passes = 0;
  }
  function cannotPlay(cards) {
    const card = pop();
    if (card) { cards.push(card); passes = 0; return 'draws'; }
    passes++; return 'passes';
  }
  function opponentTurn() {
    if (!hand.length) return finish('You emptied your hand.');
    const index = opponent.findIndex(legal);
    if (index < 0) status.textContent += ' Opponent ' + cannotPlay(opponent) + '.';
    else {
      const choice = opponent.find((card,i) => i !== index && card.rank !== 8)?.suit ?? suits[0];
      play(opponent,index,choice);
      status.textContent += ' Opponent plays ' + spoken(top()) + '.';
    }
    if (!opponent.length) return finish('Opponent wins the round.');
    if (passes === 2) return finish(hand.length === opponent.length ? 'Draw.' :
      hand.length < opponent.length ? 'You win on fewer cards.' : 'Opponent wins on fewer cards.');
    draw();
  }
  function finish(message) { done = true; status.textContent = message; draw(); }
  const choiceLabel = el('label','Suit for an eight');
  const choice = document.createElement('select');
  for (const s of suits) {
    const option = el('option',s.name);
    option.value = s.name;
    choice.append(option);
  }
  choiceLabel.append(choice);
  function draw() {
    const group = el('div','','card-row');
    hand.forEach((card,i) => group.append(cardNode(card, !done && legal(card) ? () => {
      play(hand,i,suits.find((s) => s.name === choice.value));
      status.textContent = 'You play ' + spoken(top()) + '.';
      opponentTurn();
    } : null)));
    surface.replaceChildren(el('p','Top card · ' + spoken(top()) + ' · current suit ' + suit.name +
      ' · opponent has ' + opponent.length + ' cards'),group);
    take.disabled = done || hand.some(legal);
  }
  const take = button('Draw or pass', () => { status.textContent = 'You ' + cannotPlay(hand) + '.'; opponentTurn(); });
  control.append(choiceLabel,take,button('New hand', () => eights(root)));
  draw();
}

export const activities = {
  'war-add': (root) => war(root,false), 'war-sub': (root) => war(root,true),
  'grid-10': (root) => grid(root,10), 'grid-15': (root) => grid(root,15),
  'memory': memory, 'blackjack': blackjack, 'hi-lo': countPractice,
  'gin-drill': gin, 'trash': trash, 'eights': eights,
};
