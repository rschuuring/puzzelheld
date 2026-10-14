/* Puzzelmaker: maakt nieuwe puzzels op een moeilijkheid van 1 t/m 20, in hetzelfde formaat als het lesprogramma.
   Elke puzzel is reproduceerbaar uit zijn id ("G:<soort>:<moeilijkheid>:<seed>"), dus er hoeft niets opgeslagen te worden. */
const GEN = (() => {
  const KLEUREN = ['rood', 'blauw', 'geel', 'groen', 'oranje', 'paars'];
  const VORMEN = ['rondje', 'vierkant', 'driehoek', 'ster', 'ruit', 'zeshoek'];
  const VORM_MV = { rondje: 'rondjes', vierkant: 'vierkanten', driehoek: 'driehoeken', ster: 'sterren', ruit: 'ruiten', zeshoek: 'zeshoeken', pijl: 'pijlen' };
  const RAND = [0, 1, 2, 5, 8, 7, 6, 3]; // vakjes langs de rand, met de klok mee
  const MV = { voetbal: 'voetballen', kokosnoot: 'kokosnoten', banaan: 'bananen', shuttle: 'shuttles' };
  const NAMEN = ['Sem', 'Noor', 'Ayu', 'Daan', 'Mila', 'Finn', 'Siti', 'Bram', 'Lina', 'Jayden'];
  const THEMAS = [
    { zin: 'Drie spelers hebben elk een racket in een andere kleur.', wat: ['rood', 'blauw', 'geel'], ja: (n, x) => `${n} heeft het ${x === 'rood' ? 'rode' : x === 'blauw' ? 'blauwe' : 'gele'} racket.`, nee: (n, x) => `${n} heeft niet het ${x === 'rood' ? 'rode' : x === 'blauw' ? 'blauwe' : 'gele'} racket.`, vraag: x => `Wie heeft het ${x === 'rood' ? 'rode' : x === 'blauw' ? 'blauwe' : 'gele'} racket?` },
    { zin: 'Drie kinderen doen elk een andere sport.', wat: ['voetbal', 'badminton', 'snowboarden'], ja: (n, x) => `${n} doet aan ${x}.`, nee: (n, x) => `${n} doet niet aan ${x}.`, vraag: x => `Wie doet aan ${x}?` },
    { zin: 'Drie vrienden kiezen elk een ander eten.', wat: ['pizza', 'wraps', 'nasi lemak'], ja: (n, x) => `${n} kiest ${x}.`, nee: (n, x) => `${n} kiest geen ${x}.`, vraag: x => `Wie kiest ${x}?` },
    { zin: 'Drie racers rijden elk in een andere auto.', wat: ['Ferrari', 'Porsche', 'McLaren'], ja: (n, x) => `${n} rijdt in de ${x}.`, nee: (n, x) => `${n} rijdt niet in de ${x}.`, vraag: x => `Wie rijdt in de ${x}?` },
    { zin: 'Drie fans luisteren elk naar een andere zanger.', wat: ['Queen', 'Elvis', 'Michael Jackson'], ja: (n, x) => `${n} luistert naar ${x}.`, nee: (n, x) => `${n} luistert niet naar ${x}.`, vraag: x => `Wie luistert naar ${x}?` },
    { zin: 'Drie spelers van een jeugdteam spelen elk op een andere plek.', wat: ['keeper', 'verdediger', 'spits'], ja: (n, x) => `${n} is ${x}.`, nee: (n, x) => `${n} is geen ${x}.`, vraag: x => `Wie is de ${x}?` },
  ];

  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const mk = r => ({ int: (lo, hi) => lo + Math.floor(r() * (hi - lo + 1)), pick: a => a[Math.floor(r() * a.length)], shuf: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }, r });
  const key = f => JSON.stringify(f);
  const F = (k, c, o = {}) => { const f = { k, c }; if (o.s && o.s !== 'm') f.s = o.s; if (o.n && o.n !== 1) f.n = o.n; if (o.r) f.r = ((o.r % 360) + 360) % 360; if (o.f === 'leeg') f.f = 'leeg'; if (o.p) f.p = o.p; return f; };
  const kl = (f, ch) => F(ch.k ?? f.k, ch.c ?? f.c, { s: ch.s ?? f.s, n: ch.n ?? f.n, r: ch.r ?? f.r, f: ch.f ?? f.f, p: ch.p ?? f.p });
  /* antwoord vooraan (ans = 0), daarna unieke afleiders */
  function opties(ans, kandidaten, n = 4) { const out = [ans], seen = new Set([key(ans)]); for (const c of kandidaten) { if (out.length >= n) break; const k = key(c); if (!seen.has(k)) { seen.add(k); out.push(c); } } return out.length >= 3 ? out : null; }

  /* ---- getallenreeksen ---- */
  function getallen(R, d) {
    let t, ans, why;
    const kind = d <= 6 ? R.pick(['plus', 'min']) : d <= 12 ? R.pick(['plus', 'min', 'keer', 'groei']) : R.pick(['twee', 'groei', 'wissel', 'keer']);
    if (kind === 'plus') { const a = R.int(1, 12), k = R.int(2, d <= 3 ? 3 : 9); t = [0, 1, 2, 3, 4].map(i => a + i * k); ans = a + 5 * k; why = `${ans}: er komt steeds ${k} bij.`; }
    else if (kind === 'min') { const k = R.int(2, d <= 3 ? 3 : 8), a = 5 * k + R.int(5, 30); t = [0, 1, 2, 3, 4].map(i => a - i * k); ans = a - 5 * k; why = `${ans}: er gaat steeds ${k} af.`; }
    else if (kind === 'keer') { const a = R.int(1, 4), m = d < 15 ? 2 : R.pick([2, 3]); t = [0, 1, 2, 3].map(i => a * m ** i); ans = a * m ** 4; why = `${ans}: elk getal is ${m === 2 ? 'het dubbele van' : 'drie keer'} het vorige.`; }
    else if (kind === 'groei') { const a = R.int(1, 10), s = R.int(1, 2); t = [a]; for (let i = 0; i < 4; i++) t.push(t[i] + s + i); ans = t[4] + s + 4; why = `${ans}: de stap wordt steeds één groter (+${s}, +${s + 1}, +${s + 2}...).`; }
    else if (kind === 'wissel') { const a = R.int(1, 10), p = R.int(2, 5), q = R.int(1, 4); t = [a]; for (let i = 0; i < 5; i++) t.push(t[i] + (i % 2 ? -q : p)); ans = t[5] - q; why = `${ans}: het gaat om en om +${p} en −${q}.`; }
    else { const a = R.int(1, 5), b = R.int(10, 30), k = R.int(1, 3), m = R.int(2, 5) * (R.r() < .5 ? 1 : -1); t = []; for (let i = 0; i < 6; i++) t.push(i % 2 ? b + m * ((i - 1) / 2) : a + k * (i / 2)); ans = a + k * 3; why = `${ans}: er lopen twee reeksen door elkaar. Op deze plek komt de reeks ${a}, ${a + k}, ${a + 2 * k}...`; }
    const cand = R.shuf([ans + 1, ans - 1, ans + 2, ans - 2, t[t.length - 1], ans + 10]).filter(x => x >= 0 && x !== ans);
    const o = opties(ans, cand); if (!o) return null;
    return { type: 'text', q: 'Welk getal komt er op het vraagteken?   ' + t.join(' · ') + ' · ?', opts: o, ans: 0, why };
  }

  /* ---- puzzelvakjes ---- */
  function matrix(R, d) {
    const cs = R.shuf(KLEUREN).slice(0, 3), vs = R.shuf(VORMEN).slice(0, 3);
    if (d <= 8) {
      const A = F(vs[0], cs[0]), B = F(vs[1], cs[0]), C = F(vs[0], cs[1]), ans = F(vs[1], cs[1]);
      const o = opties(ans, R.shuf([F(vs[1], cs[0]), F(vs[0], cs[1]), F(vs[1], cs[2]), F(vs[2], cs[1])]));
      return o && { type: 'matrix', grid: [[A, B], [C, null]], opts: o, ans: 0, why: `${cap(een(cs[1], vs[1]))}: naar rechts verandert de vorm, naar beneden de kleur.` };
    }
    if (d <= 14) {
      const tel = d >= 12 && R.r() < .5;
      const cell = (r, c) => tel ? F(vs[0], cs[r], { n: c + 1 }) : F(vs[c], cs[r]);
      const grid = [0, 1, 2].map(r => [0, 1, 2].map(c => cell(r, c))); const ans = grid[2][2]; grid[2][2] = null;
      const cand = tel ? [F(vs[0], cs[2], { n: 2 }), F(vs[0], cs[1], { n: 3 }), F(vs[1], cs[2], { n: 3 }), F(vs[0], cs[0], { n: 3 })] : [F(vs[1], cs[2]), F(vs[2], cs[1]), F(vs[0], cs[2]), F(vs[2], cs[0])];
      const o = opties(ans, R.shuf(cand));
      return o && { type: 'matrix', grid, opts: o, ans: 0, why: tel ? `Drie ${kleurWoord(cs[2])} ${VORM_MV[vs[0]]}: elke rij heeft één kleur en in elke kolom komt er één bij.` : `${cap(een(cs[2], vs[2]))}: elke rij heeft één kleur, elke kolom één vorm.` };
    }
    // latijns vierkant: vorm (r+c), kleur (r+2c) mod 3
    const grid = [0, 1, 2].map(r => [0, 1, 2].map(c => F(vs[(r + c) % 3], cs[(r + 2 * c) % 3]))); const ans = grid[2][2]; grid[2][2] = null;
    const cand = R.shuf([F(vs[(2 + 1) % 3], cs[(2 + 2 * 2) % 3]), F(vs[(2 + 2) % 3], cs[(2 + 1 * 2) % 3]), F(vs[(2 + 0) % 3], cs[(2 + 2 * 2) % 3]), F(vs[(2 + 2) % 3], cs[(2 + 0) % 3])]);
    const o = opties(ans, cand);
    return o && { type: 'matrix', grid, opts: o, ans: 0, why: `${cap(een(ans.c, ans.k))}: in elke rij en elke kolom komt elke vorm en elke kleur precies één keer voor.` };
  }

  /* ---- reeksen met figuren ---- */
  function reeks(R, d) {
    if (d <= 6) {
      const pat = d <= 3 ? [0, 1] : R.pick([[0, 1, 2], [0, 0, 1]]);
      const items = pat.map(() => null), vs = R.shuf(VORMEN), cs = R.shuf(KLEUREN);
      const fig = i => F(vs[pat[i % pat.length]], cs[pat[i % pat.length]]);
      const seq = [0, 1, 2, 3, 4, 5].map(fig); const ans = fig(6); void items;
      const o = opties(ans, R.shuf([fig(5), fig(7), F(vs[3], cs[3]), F(ans.k, cs[4])]));
      return o && { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: `Het patroon herhaalt zich steeds. Daarom komt er nu ${een(ans.c, ans.k)}.` };
    }
    if (d <= 13 && R.r() < .5) {
      const c = R.pick(KLEUREN), st = R.pick([90, 90, 45, 180]), r0 = R.pick([0, 90, 180, 270]);
      const seq = [0, 1, 2, 3].map(i => F('pijl', c, { r: r0 + i * st })); const ans = F('pijl', c, { r: r0 + 4 * st });
      const o = opties(ans, R.shuf([F('pijl', c, { r: r0 + 3 * st }), F('pijl', c, { r: r0 + 5 * st }), F('pijl', c, { r: r0 + 4 * st + 180 }), F('pijl', c, { r: r0 + 4 * st + 90 })]));
      return o && { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: `De pijl draait steeds ${st === 90 ? 'een kwartslag' : st === 180 ? 'een halve slag' : 'een achtste slag'} met de klok mee.` };
    }
    if (d <= 13) {
      // vakje loopt langs de rand
      const stap = d >= 11 ? R.pick([1, 2]) : 1, s0 = R.int(0, 7), c = R.pick(KLEUREN), tegen = d >= 10 && R.r() < .4;
      const pos = i => RAND[((s0 + (tegen ? -1 : 1) * i * stap) % 8 + 8) % 8];
      const seq = [0, 1, 2, 3].map(i => F('raster', c, { p: [pos(i)] })), ans = F('raster', c, { p: [pos(4)] });
      const o = opties(ans, R.shuf([F('raster', c, { p: [pos(3)] }), F('raster', c, { p: [pos(5)] }), F('raster', c, { p: [4] }), F('raster', c, { p: [RAND[(RAND.indexOf(pos(4)) + 4) % 8]] })]));
      return o && { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: `Het vakje loopt langs de rand, ${tegen ? 'tegen' : 'met'} de klok ${tegen ? 'in' : 'mee'}, steeds ${stap === 1 ? 'één stap' : 'twee stappen'}.` };
    }
    // twee regels: draaien + kleur wisselt, of aantal + vol/leeg
    if (R.r() < .5) {
      const cs = R.shuf(KLEUREN).slice(0, d >= 17 ? 3 : 2), r0 = R.pick([0, 90]);
      const fig = i => F('pijl', cs[i % cs.length], { r: r0 + i * 90 });
      const seq = [0, 1, 2, 3, 4].map(fig), ans = fig(5);
      const o = opties(ans, R.shuf([kl(ans, { c: cs[(5 + 1) % cs.length] }), kl(ans, { r: ans.r ? ans.r + 90 : 90 }), kl(ans, { r: (ans.r || 0) + 180 }), fig(4)]));
      return o && { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: `Twee regels: de pijl draait steeds een kwartslag en de kleur gaat ${cs.join(', ')}, opnieuw.` };
    }
    const v = R.pick(VORMEN.slice(0, 4)), c = R.pick(KLEUREN);
    const fig = i => F(v, c, { n: i + 1, f: i % 2 ? 'leeg' : 'vol' });
    const seq = [0, 1, 2, 3, 4].map(fig), ans = fig(5);
    const o = opties(ans, R.shuf([kl(ans, { f: 'vol' }), F(v, c, { n: 5, f: 'leeg' }), F(v, c, { n: 4, f: 'leeg' }), kl(ans, { k: VORMEN[(VORMEN.indexOf(v) + 1) % 4] })]));
    return o && { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: `Er komt steeds één ${v} bij, en vol en leeg wisselen af. Dus zes lege ${VORM_MV[v]}.` };
  }

  /* ---- wat hoort er niet bij ---- */
  function anders(R, d) {
    const n = d >= 12 ? 5 : 4, pos = R.int(0, n - 1), v = R.pick(VORMEN), c = R.pick(KLEUREN);
    let cells, why;
    if (d <= 6) {
      const omKleur = R.r() < .5, ander = omKleur ? F(v, R.pick(KLEUREN.filter(x => x !== c))) : F(R.pick(VORMEN.filter(x => x !== v)), c);
      cells = Array.from({ length: n }, (_, i) => i === pos ? ander : F(v, c));
      why = omKleur ? `Plaatje ${'ABCDE'[pos]} heeft een andere kleur.` : `Plaatje ${'ABCDE'[pos]} heeft een andere vorm.`;
    } else if (d <= 11) {
      const mode = R.pick(['n', 's', 'f']);
      const basis = F(v, c, { n: mode === 'n' ? 2 : 1, s: 'm' });
      const ander = mode === 'n' ? kl(basis, { n: 3 }) : mode === 's' ? kl(basis, { s: 'l' }) : kl(basis, { f: 'leeg' });
      cells = Array.from({ length: n }, (_, i) => i === pos ? ander : basis);
      why = `Plaatje ${'ABCDE'[pos]} is anders: ${mode === 'n' ? 'het heeft een ander aantal' : mode === 's' ? 'het is groter' : 'het is leeg'}.`;
    } else {
      // de anderen verschillen in kleur (afleiding), de regel zit in het aantal of de vorm
      const cs = R.shuf(KLEUREN), mode = R.pick(['n', 'k']);
      cells = Array.from({ length: n }, (_, i) => F(i === pos && mode === 'k' ? R.pick(VORMEN.filter(x => x !== v)) : v, cs[i], { n: i === pos && mode === 'n' ? 3 : 2 }));
      why = `De kleur doet er niet toe. Plaatje ${'ABCDE'[pos]} is anders: ${mode === 'n' ? 'het heeft drie vormen, de rest twee' : 'het heeft een andere vorm'}.`;
    }
    return { type: 'odd', cells, ans: pos, why };
  }

  /* ---- analogieën met figuren ---- */
  const TRANS = {
    groot: { do: f => kl(f, { s: 'l' }), uit: 'wordt groot', ok: f => f.s !== 'l' },
    leeg: { do: f => kl(f, { f: 'leeg' }), uit: 'wordt leeg', ok: f => f.f !== 'leeg' },
    draai: { do: f => kl(f, { r: (f.r || 0) + 90 }), uit: 'draait een kwartslag', ok: f => f.k === 'pijl' || f.k === 'driehoek' },
    twee: { do: f => kl(f, { n: 2 }), uit: 'wordt twee keer zo veel', ok: f => !f.n || f.n === 1 },
  };
  function analogie(R, d) {
    const keys = Object.keys(TRANS);
    const aantal = d <= 9 ? 1 : 2;
    for (let tries = 0; tries < 20; tries++) {
      const ts = R.shuf(keys).slice(0, aantal);
      const vormA = R.pick(['pijl', 'driehoek', ...VORMEN]), vormC = R.pick(['pijl', 'driehoek', ...VORMEN].filter(x => x !== vormA));
      const A = F(vormA, R.pick(KLEUREN), { s: 's' }), C = F(vormC, R.pick(KLEUREN), { s: 's' });
      if (!ts.every(t => TRANS[t].ok(A) && TRANS[t].ok(C))) continue;
      const app = (f, list) => list.reduce((x, t) => TRANS[t].do(x), f);
      const B = app(A, ts), ans = app(C, ts);
      const cand = [C, app(C, ts.slice(0, 1)), app(C, ts.slice(1)), app(C, keys.filter(k => !ts.includes(k) && TRANS[k].ok(C)).slice(0, 1)), kl(ans, { k: vormA })];
      const o = opties(ans, R.shuf(cand)); if (!o) continue;
      return { type: 'analogy', abc: [A, B, C], opts: o, ans: 0, why: `Het eerste plaatje ${ts.map(t => TRANS[t].uit).join(' en ')}. Doe hetzelfde met het derde plaatje.` };
    }
    return null;
  }

  /* ---- weegschalen ---- */
  function weegschaal(R, d) {
    const [X, Y, Z] = R.shuf(Object.keys(MV)).slice(0, 3);
    if (d <= 8) {
      const k = R.int(2, 3), m = R.int(2, d <= 4 ? 2 : 3);
      if (m * k > 9) return null;
      return { type: 'balance', facts: [[[[X, 1]], [[Y, k]]]], ask: [[[X, m]], '?'], askline: `Hoeveel ${MV[Y]}?`, opts: opties(m * k, R.shuf([m + k, m * k - 1, m * k + 1, k, m * k + k]).filter(v => v > 0 && v !== m * k)), ans: 0, why: `${m * k}: 1 ${X} weegt evenveel als ${k} ${MV[Y]}, dus ${m} keer zo veel is ${m * k}.` };
    }
    if (d <= 14) {
      const a = R.int(2, 3), b = R.int(2, 3);
      return { type: 'balance', facts: [[[[X, 1]], [[Y, a]]], [[[Y, 1]], [[Z, b]]]], ask: [[[X, 1]], '?'], askline: `Hoeveel ${MV[Z]}?`, opts: opties(a * b, R.shuf([a + b, a * b - 1, a * b + 1, b, a * b + b]).filter(v => v > 0 && v !== a * b)), ans: 0, why: `${a * b}: 1 ${X} = ${a} ${MV[Y]}, en elke ${Y} = ${b} ${MV[Z]}. Dus ${a} × ${b} = ${a * b}.` };
    }
    const a = R.int(2, 4), y = R.int(1, 4), n = a + y;
    if (n > 6) return null;
    return { type: 'balance', facts: [[[[X, 1], [Y, 1]], [[Z, n]]], [[[X, 1]], [[Z, a]]]], ask: [[[Y, 1]], '?'], askline: `Hoeveel ${MV[Z]}?`, opts: opties(y, R.shuf([n, a, y + 1, y + 2, n + a]).filter(v => v > 0 && v !== y)), ans: 0, why: `${y}: samen wegen ze ${n}. De ${X} weegt al ${a}, dus voor de ${Y} blijft ${n} − ${a} = ${y} over.` };
  }

  /* ---- logica-rooster ---- */
  const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  function rooster(R, d) {
    const th = R.pick(THEMAS), namen = R.shuf(NAMEN).slice(0, 3), sol = R.pick(PERMS);
    // kandidaat-aanwijzingen
    const clues = [];
    for (let p = 0; p < 3; p++) for (let w = 0; w < 3; w++) {
      if (sol[p] === w) clues.push({ t: 'ja', p, w }); else clues.push({ t: 'nee', p, w });
    }
    const fits = (perm, cl) => cl.every(c => c.t === 'ja' ? perm[c.p] === c.w : perm[c.p] !== c.w);
    const maxJa = d >= 15 ? 0 : 1;
    let chosen = [];
    for (const c of R.shuf(clues)) {
      if (c.t === 'ja' && chosen.filter(x => x.t === 'ja').length >= maxJa) continue;
      if (fits(sol, chosen.concat([c])) && PERMS.filter(pm => fits(pm, chosen)).length > PERMS.filter(pm => fits(pm, chosen.concat([c]))).length) chosen.push(c);
      if (PERMS.filter(pm => fits(pm, chosen)).length === 1) break;
    }
    if (PERMS.filter(pm => fits(pm, chosen)).length !== 1) return null;
    const ww = R.int(0, 2), wie = sol.indexOf(ww);
    const zin = c => c.t === 'ja' ? th.ja(namen[c.p], th.wat[c.w]) : th.nee(namen[c.p], th.wat[c.w]);
    return { type: 'grid', q: th.zin, rows: namen, cols: th.wat, clues: chosen.map(zin), subq: th.vraag(th.wat[ww]), opts: namen.slice(), ans: wie, why: `${namen[wie]}. Oplossing: ${namen.map((n, i) => `${n}: ${th.wat[sol[i]]}`).join(', ')}.` };
  }

  const kleurWoord = c => ({ rood: 'rode', blauw: 'blauwe', geel: 'gele', groen: 'groene', oranje: 'oranje', paars: 'paarse', zwart: 'zwarte' }[c] || c);
  const HET = ['rondje', 'vierkant'];
  const een = (c, k) => 'een ' + (HET.includes(k) && c !== 'oranje' ? c : kleurWoord(c)) + ' ' + k;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  const MAKERS = { text: getallen, matrix, series: reeks, odd: anders, analogy: analogie, balance: weegschaal, grid: rooster };
  function make(type, d, seed) {
    for (let k = 0; k < 12; k++) {
      const R = mk(rng(seed * 31 + k));
      const it = MAKERS[type](R, d);
      if (it && (it.type === 'odd' || (it.opts && it.opts.length >= 3))) { it.id = `G:${type}:${d}:${seed}`; it.lvl = d; it.gen = true; return it; }
    }
    return null;
  }
  function fromId(id) { const [, type, d, seed] = id.split(':'); return make(type, +d, +seed); }
  return { make, fromId, TYPES: Object.keys(MAKERS) };
})();
if (typeof module !== 'undefined') module.exports = GEN;
