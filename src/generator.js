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
    { zin: 'Drie spelers hebben elk een racket in een andere kleur.', wat: ['rood', 'blauw', 'geel', 'groen'], ja: (n, x) => `${n} heeft het ${({ rood: 'rode', blauw: 'blauwe', geel: 'gele', groen: 'groene' })[x]} racket.`, nee: (n, x) => `${n} heeft niet het ${({ rood: 'rode', blauw: 'blauwe', geel: 'gele', groen: 'groene' })[x]} racket.`, vraag: x => `Wie heeft het ${({ rood: 'rode', blauw: 'blauwe', geel: 'gele', groen: 'groene' })[x]} racket?` },
    { zin: 'Drie kinderen doen elk een andere sport.', wat: ['voetbal', 'badminton', 'snowboarden', 'tennis'], ja: (n, x) => `${n} doet aan ${x}.`, nee: (n, x) => `${n} doet niet aan ${x}.`, vraag: x => `Wie doet aan ${x}?` },
    { zin: 'Drie vrienden kiezen elk een ander eten.', wat: ['pizza', 'wraps', 'nasi lemak', 'croissants'], ja: (n, x) => `${n} kiest ${x}.`, nee: (n, x) => `${n} kiest geen ${x}.`, vraag: x => `Wie kiest ${x}?` },
    { zin: 'Drie racers rijden elk in een andere auto.', wat: ['Ferrari', 'Porsche', 'McLaren', 'Lamborghini'], ja: (n, x) => `${n} rijdt in de ${x}.`, nee: (n, x) => `${n} rijdt niet in de ${x}.`, vraag: x => `Wie rijdt in de ${x}?` },
    { zin: 'Drie fans luisteren elk naar een andere zanger.', wat: ['Queen', 'Elvis', 'Michael Jackson', 'Bon Jovi'], ja: (n, x) => `${n} luistert naar ${x}.`, nee: (n, x) => `${n} luistert niet naar ${x}.`, vraag: x => `Wie luistert naar ${x}?` },
    { zin: 'Drie spelers van een jeugdteam spelen elk op een andere plek.', wat: ['keeper', 'verdediger', 'spits', 'middenvelder'], ja: (n, x) => `${n} is ${x}.`, nee: (n, x) => `${n} is geen ${x}.`, vraag: x => `Wie is de ${x}?` },
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
    const pool = d <= 6 ? ['plus', 'min'] : d <= 10 ? ['plus', 'min', 'keer', 'groei'] : d <= 12 ? ['plusgroot', 'mingroot', 'keer', 'groei'] : d <= 14 ? ['twee', 'groei', 'wissel', 'keer3'] : d <= 16 ? ['twee', 'wissel', 'keerplus', 'groei2', 'kwadraat'] : d <= 18 ? ['keerplus', 'som', 'kwadraat', 'keerwissel', 'groei2'] : ['som', 'keerwissel', 'verdubbelstap', 'kwadplus', 'keerplus3'];
    const kind = R.pick(pool);
    if (kind === 'plus' || kind === 'plusgroot') { const groot = kind === 'plusgroot', a = groot ? R.int(10, 60) : R.int(1, 12), k = groot ? R.int(6, 19) : R.int(2, d <= 3 ? 3 : 9); t = [0, 1, 2, 3, 4].map(i => a + i * k); ans = a + 5 * k; why = `${ans}: er komt steeds ${k} bij.`; }
    else if (kind === 'min' || kind === 'mingroot') { const groot = kind === 'mingroot', k = groot ? R.int(6, 15) : R.int(2, d <= 3 ? 3 : 8), a = 5 * k + (groot ? R.int(10, 40) : R.int(5, 30)); t = [0, 1, 2, 3, 4].map(i => a - i * k); ans = a - 5 * k; why = `${ans}: er gaat steeds ${k} af.`; }
    else if (kind === 'keer' || kind === 'keer3') { const a = R.int(1, 4), m = kind === 'keer3' ? R.pick([2, 3]) : 2; t = [0, 1, 2, 3].map(i => a * m ** i); ans = a * m ** 4; why = `${ans}: elk getal is ${m === 2 ? 'het dubbele van' : 'drie keer'} het vorige.`; }
    else if (kind === 'groei') { const a = R.int(1, 10), s = R.int(1, 2); t = [a]; for (let i = 0; i < 4; i++) t.push(t[i] + s + i); ans = t[4] + s + 4; why = `${ans}: de stap wordt steeds één groter (+${s}, +${s + 1}, +${s + 2}...).`; }
    else if (kind === 'wissel') { const a = R.int(1, 10), p = R.int(2, 5), q = R.int(1, 4); t = [a]; for (let i = 0; i < 5; i++) t.push(t[i] + (i % 2 ? -q : p)); ans = t[5] - q; why = `${ans}: het gaat om en om +${p} en −${q}.`; }
    else if (kind === 'keerplus') { const a = R.int(1, 6), p = R.int(1, 4); t = [a]; for (let i = 0; i < 4; i++) t.push(t[i] * 2 + p); ans = t[4] * 2 + p; why = `${ans}: steeds keer 2 en dan +${p}.`; }
    else if (kind === 'keerplus3') { const a = R.int(1, 5), p = R.pick([-1, 1, 2]); t = [a]; for (let i = 0; i < 3; i++) t.push(t[i] * 3 + p); ans = t[3] * 3 + p; why = `${ans}: steeds keer 3 en dan ${p > 0 ? '+' + p : '−1'}.`; }
    else if (kind === 'keerwissel') { const a = R.int(1, 9), k = R.int(1, 6); t = [a]; for (let i = 0; i < 5; i++) t.push(i % 2 ? t[i] + k : t[i] * 2); ans = t[5] * 2; why = `${ans}: het gaat om en om keer 2 en +${k}. Nu is keer 2 aan de beurt.`; }
    else if (kind === 'verdubbelstap') { const a = R.int(1, 20), s = R.int(1, 3); t = [a]; let st = s; for (let i = 0; i < 4; i++) { t.push(t[i] + st); st *= 2; } ans = t[4] + st; why = `${ans}: de stap wordt steeds twee keer zo groot (+${s}, +${2 * s}, +${4 * s}, +${8 * s}, dus nu +${st}).`; }
    else if (kind === 'kwadplus') { const a = R.int(1, 5), c = R.int(1, 5); t = [0, 1, 2, 3, 4].map(i => (a + i) * (a + i) + c); ans = (a + 5) * (a + 5) + c; why = `${ans}: het zijn ${a}×${a}+${c}, ${a + 1}×${a + 1}+${c}, ${a + 2}×${a + 2}+${c}... dus nu ${a + 5}×${a + 5}+${c}.`; }
    else if (kind === 'som') { const a = R.int(1, 7), b = R.int(a, a + 6); t = [a, b]; for (let i = 0; i < 4; i++) t.push(t[i] + t[i + 1]); ans = t[4] + t[5]; why = `${ans}: elk getal is de twee getallen ervoor bij elkaar opgeteld (${t[4]} + ${t[5]}).`; }
    else if (kind === 'kwadraat') { const a = R.int(1, 7); t = [0, 1, 2, 3, 4].map(i => (a + i) * (a + i)); ans = (a + 5) * (a + 5); why = `${ans}: het zijn ${a}×${a}, ${a + 1}×${a + 1}, ${a + 2}×${a + 2}... dus nu ${a + 5}×${a + 5}.`; }
    else if (kind === 'groei2') { const a = R.int(1, 20), s = R.int(1, 4); t = [a]; for (let i = 0; i < 4; i++) t.push(t[i] + s + 2 * i); ans = t[4] + s + 8; why = `${ans}: de stap wordt steeds 2 groter (+${s}, +${s + 2}, +${s + 4}...).`; }
    else { const a = R.int(1, 5), b = R.int(10, 30), k = R.int(1, 3), m = R.int(2, 5) * (R.r() < .5 ? 1 : -1); t = []; for (let i = 0; i < 6; i++) t.push(i % 2 ? b + m * ((i - 1) / 2) : a + k * (i / 2)); ans = a + k * 3; why = `${ans}: er lopen twee reeksen door elkaar. Op deze plek komt de reeks ${a}, ${a + k}, ${a + 2 * k}...`; }
    const cand = R.shuf([ans + 1, ans - 1, ans + 2, ans - 2, t[t.length - 1], ans + 10]).filter(x => x >= 0 && x !== ans);
    const o = opties(ans, cand); if (!o) return null;
    return { type: 'text', q: 'Welk getal komt er op het vraagteken?   ' + t.join(' · ') + ' · ?', opts: o, ans: 0, why };
  }

  /* ---- puzzelvakjes ---- */
  // afleiders: het antwoord met precies één eigenschap anders, gekozen uit wat er in het vak voorkomt
  const eenAnders = (ans, vs, cs, ns) => [...vs.filter(v => v !== ans.k).map(k => kl(ans, { k })), ...cs.filter(c => c !== ans.c).map(c => kl(ans, { c })), ...(ns || []).filter(n => n !== (ans.n || 1)).map(n => kl(ans, { n }))];
  function matrix(R, d) {
    const cs = R.shuf(KLEUREN).slice(0, 3), vs = R.shuf(VORMEN).slice(0, 3);
    if (d <= 8) {
      const A = F(vs[0], cs[0]), B = F(vs[1], cs[0]), C = F(vs[0], cs[1]), ans = F(vs[1], cs[1]);
      const o = opties(ans, R.shuf([F(vs[1], cs[0]), F(vs[0], cs[1]), F(vs[1], cs[2]), F(vs[2], cs[1])]));
      return o && { type: 'matrix', grid: [[A, B], [C, null]], opts: o, ans: 0, why: `${cap(een(cs[1], vs[1]))}: naar rechts verandert de vorm, naar beneden de kleur.` };
    }
    // vanaf stap 15 staat het vraagteken op een willekeurige plek
    const gat = d >= 15 ? [R.int(0, 2), R.int(0, 2)] : [2, 2];
    const vul = cell => { const grid = [0, 1, 2].map(r => [0, 1, 2].map(c => cell(r, c))); const ans = grid[gat[0]][gat[1]]; grid[gat[0]][gat[1]] = null; return { grid, ans }; };
    let cell, ns = null, why;
    if (d <= 13) {
      const tel = d >= 12 && R.r() < .5;
      cell = (r, c) => tel ? F(vs[0], cs[r], { n: c + 1 }) : F(vs[c], cs[r]);
      if (tel) ns = [1, 2, 3];
      why = a => tel ? `${cap(String(a.n))} ${kleurWoord(a.c)} ${a.n === 1 ? a.k : VORM_MV[a.k]}: elke rij heeft één kleur en in elke kolom komt er één bij.` : `${cap(een(a.c, a.k))}: elke rij heeft één kleur, elke kolom één vorm.`;
    } else if (d <= 15) {
      cell = (r, c) => F(vs[(r + c) % 3], cs[(r + 2 * c) % 3]);
      why = a => `${cap(een(a.c, a.k))}: in elke rij en elke kolom komt elke vorm en elke kleur precies één keer voor.`;
    } else if (d <= 17) {
      cell = (r, c) => F(vs[r], cs[c], { n: (r + c) % 3 + 1 }); ns = [1, 2, 3];
      why = a => `${a.n === 1 ? 'Een' : cap(String(a.n))} ${kleurWoord(a.c)} ${a.n === 1 ? a.k : VORM_MV[a.k]}: elke rij heeft één vorm, elke kolom één kleur, en het aantal (1, 2, 3) komt in elke rij en kolom één keer voor.`;
    } else {
      const perRij = R.r() < .5; ns = [1, 2, 3];
      cell = (r, c) => F(vs[(r + c) % 3], cs[(r + 2 * c) % 3], { n: (perRij ? r : c) + 1 });
      why = a => `${a.n === 1 ? 'Een' : cap(String(a.n))} ${kleurWoord(a.c)} ${a.n === 1 ? a.k : VORM_MV[a.k]}: elke vorm en elke kleur komt in elke rij en kolom één keer voor, en het aantal hoort bij de ${perRij ? 'rij' : 'kolom'}.`;
    }
    const { grid, ans } = vul(cell);
    const o = opties(ans, R.shuf(eenAnders(ans, vs, cs, ns)));
    return o && { type: 'matrix', grid, opts: o, ans: 0, why: why(ans) };
  }

  /* ---- reeksen met figuren ---- */
  function reeks(R, d) {
    if (d <= 6) {
      const pat = d <= 3 ? [0, 1] : R.pick([[0, 1, 2], [0, 0, 1]]);
      const vs = R.shuf(VORMEN), cs = R.shuf(KLEUREN);
      const fig = i => F(vs[pat[i % pat.length]], cs[pat[i % pat.length]]);
      const seq = [0, 1, 2, 3, 4, 5].map(fig); const ans = fig(6);
      const o = opties(ans, R.shuf([fig(5), fig(7), F(vs[3], cs[3]), F(ans.k, cs[4])]));
      return o && { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: `Het patroon herhaalt zich steeds. Daarom komt er nu ${een(ans.c, ans.k)}.` };
    }
    const soort = d <= 13 ? R.pick(['pijl', 'rand']) : d <= 15 ? R.pick(['draaikleur', 'aantal', 'rand']) : d <= 17 ? R.pick(['draaikleur', 'aantal', 'tweeblok']) : R.pick(['tweeblok', 'groeidraai', 'draaikleur']);
    if (soort === 'pijl') {
      const c = R.pick(KLEUREN), st = d >= 11 ? R.pick([90, 45, 180, 135]) : R.pick([90, 90, 45, 180]), r0 = R.pick([0, 90, 180, 270]), tegen = d >= 11 && R.r() < .4, s = tegen ? -st : st;
      const seq = [0, 1, 2, 3].map(i => F('pijl', c, { r: r0 + i * s })); const ans = F('pijl', c, { r: r0 + 4 * s });
      const o = opties(ans, R.shuf([F('pijl', c, { r: r0 + 3 * s }), F('pijl', c, { r: r0 + 5 * s }), F('pijl', c, { r: r0 + 4 * s + 180 }), F('pijl', c, { r: r0 + 4 * s + 90 }), F('pijl', c, { r: r0 - 4 * s })]));
      const hoek = { 45: 'een achtste slag', 90: 'een kwartslag', 135: 'drie achtste slag', 180: 'een halve slag' }[st];
      return o && { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: `De pijl draait steeds ${hoek} ${tegen ? 'tegen de klok in' : 'met de klok mee'}.` };
    }
    if (soort === 'rand') {
      const stap = d >= 14 ? R.pick([2, 3]) : d >= 11 ? R.pick([1, 2]) : 1, s0 = R.int(0, 7), c = R.pick(KLEUREN), tegen = d >= 10 && R.r() < .4;
      const pos = i => RAND[((s0 + (tegen ? -1 : 1) * i * stap) % 8 + 8) % 8];
      const seq = [0, 1, 2, 3].map(i => F('raster', c, { p: [pos(i)] })), ans = F('raster', c, { p: [pos(4)] });
      const o = opties(ans, R.shuf([F('raster', c, { p: [pos(3)] }), F('raster', c, { p: [pos(5)] }), F('raster', c, { p: [4] }), F('raster', c, { p: [RAND[(RAND.indexOf(pos(4)) + 4) % 8]] })]));
      return o && { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: `Het vakje loopt langs de rand, ${tegen ? 'tegen' : 'met'} de klok ${tegen ? 'in' : 'mee'}, steeds ${stap === 1 ? 'één stap' : stap === 2 ? 'twee stappen' : 'drie stappen'}.` };
    }
    if (soort === 'draaikleur') {
      const cs = R.shuf(KLEUREN).slice(0, d >= 16 ? 3 : 2), r0 = R.pick([0, 90, 180, 270]), st = d >= 18 ? R.pick([90, 45]) : 90, tegen = R.r() < .4, sg = tegen ? -st : st;
      const fig = i => F('pijl', cs[i % cs.length], { r: r0 + i * sg });
      const seq = [0, 1, 2, 3, 4].map(fig), ans = fig(5);
      const o = opties(ans, R.shuf([kl(ans, { c: cs[(5 + 1) % cs.length] }), kl(ans, { r: (ans.r || 0) + sg }), kl(ans, { r: (ans.r || 0) + 180 }), fig(4), kl(fig(6), { c: ans.c }), kl(ans, { r: r0 - 5 * sg })]));
      return o && { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: `Twee regels: de pijl draait steeds ${st === 90 ? 'een kwartslag' : 'een achtste slag'} ${tegen ? 'tegen de klok in' : 'met de klok mee'} en de kleur gaat ${cs.join(', ')}, opnieuw.` };
    }
    if (soort === 'groeidraai') {
      // de draai wordt steeds een achtste slag groter
      const c = R.pick(KLEUREN), r0 = R.pick([0, 90, 180, 270]), hoek = i => r0 + 45 * i * (i + 1) / 2;
      const seq = [0, 1, 2, 3, 4].map(i => F('pijl', c, { r: hoek(i) })), ans = F('pijl', c, { r: hoek(5) });
      const o = opties(ans, R.shuf([F('pijl', c, { r: hoek(5) + 45 }), F('pijl', c, { r: hoek(5) - 45 }), F('pijl', c, { r: hoek(5) + 180 }), F('pijl', c, { r: hoek(4) + 180 }), F('pijl', c, { r: hoek(5) + 90 })]));
      return o && { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: 'De pijl draait steeds een stukje verder dan de vorige keer: eerst een achtste slag, dan twee achtste, dan drie, dan vier, dus nu vijf achtste slag.' };
    }
    if (soort === 'tweeblok') {
      // twee blokjes lopen langs de rand: het ene met de klok mee, het andere tegen de klok in
      const [ca, cb] = R.shuf(KLEUREN).slice(0, 2), sa = d >= 18 ? R.pick([1, 2]) : 1;
      for (let tries = 0; tries < 20; tries++) {
        const a0 = R.int(0, 7), b0 = R.int(0, 7);
        const pa = i => RAND[((a0 + i * sa) % 8 + 8) % 8], pb = i => RAND[((b0 - i) % 8 + 8) % 8];
        if ([0, 1, 2, 3, 4, 5, 6].some(i => pa(i) === pb(i))) continue;
        const fig = (i, j = i) => ({ k: 'raster', p: [[pa(i), ca], [pb(j), cb]].sort((x, y) => x[0] - y[0]) });
        const seq = [0, 1, 2, 3].map(i => fig(i)), ans = fig(4);
        const cand = [fig(4, 3), fig(3, 4), fig(5, 4), fig(4, 5), { k: 'raster', p: [[pa(4), cb], [pb(4), ca]].sort((x, y) => x[0] - y[0]) }].filter(f => f.p[0][0] !== f.p[1][0]);
        const o = opties(ans, R.shuf(cand));
        if (!o) continue;
        return { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: `Twee blokjes lopen langs de rand: het ${kleurWoord(ca)} blokje met de klok mee (${sa === 1 ? 'één stap' : 'twee stappen'}), het ${kleurWoord(cb)} blokje tegen de klok in (één stap).` };
      }
      return null;
    }
    const v = R.pick(VORMEN), c = R.pick(KLEUREN);
    const fig = i => F(v, c, { n: i + 1, f: i % 2 ? 'leeg' : 'vol' });
    const seq = [0, 1, 2, 3, 4].map(fig), ans = fig(5);
    const o = opties(ans, R.shuf([kl(ans, { f: 'vol' }), F(v, c, { n: 5, f: 'leeg' }), F(v, c, { n: 4, f: 'leeg' }), kl(ans, { k: VORMEN[(VORMEN.indexOf(v) + 1) % 4] })]));
    return o && { type: 'series', seq: seq.concat([null]), opts: o, ans: 0, why: `Er komt steeds één ${v} bij, en vol en leeg wisselen af. Dus zes lege ${VORM_MV[v]}.` };
  }

  /* ---- wat hoort er niet bij ---- */
  // geen enkele losse eigenschap mag één plaatje alleen aanwijzen, anders zijn er twee goede antwoorden
  const ATTR = { k: f => f.k, c: f => f.c, n: f => f.n || 1, f: f => f.f || 'vol', s: f => f.s || 'm' };
  const eerlijk = cells => Object.values(ATTR).every(get => { const cnt = {}; cells.forEach(f => { const v = get(f); cnt[v] = (cnt[v] || 0) + 1; }); const ones = Object.values(cnt).filter(x => x === 1).length; return ones === 0 || ones === cells.length; });
  function koppel(R, mode) {
    // twee eigenschappen horen bij elkaar; één plaatje uit de grootste groep breekt die koppeling
    for (let tries = 0; tries < 40; tries++) {
      const groep = R.shuf([0, 0, 0, 1, 1]), breker = R.pick([0, 1, 2, 3, 4].filter(i => groep[i] === 0));
      const vs = R.shuf(VORMEN), cs = R.shuf(KLEUREN), [n1, n2] = R.shuf([1, 2, 3, 4]);
      const cells = groep.map((g, i) => {
        const b = i === breker ? 1 - g : g; // de breker krijgt de tweede eigenschap van de andere groep
        if (mode === 'vk') return F(vs[g], cs[b], { n: R.int(1, 3) });
        if (mode === 'af') return F(vs[i], cs[i], { n: g ? n2 : n1, f: b ? 'leeg' : 'vol' });
        return F(vs[g], cs[i], { n: b ? n2 : n1 });
      });
      if (!eerlijk(cells)) continue;
      const v1 = VORM_MV[vs[0]], v2 = VORM_MV[vs[1]], tel = n => n === 1 ? 'één' : String(n);
      const why = mode === 'vk' ? `Alle ${v1} zijn ${cs[0]} en alle ${v2} zijn ${cs[1]}. Plaatje ${'ABCDE'[breker]} breekt die regel. Het aantal doet er niet toe.`
        : mode === 'af' ? `Plaatjes met ${tel(n1)} ${n1 === 1 ? 'vorm' : 'vormen'} zijn vol, plaatjes met ${tel(n2)} ${n2 === 1 ? 'vorm' : 'vormen'} zijn leeg. Plaatje ${'ABCDE'[breker]} breekt die regel. Vorm en kleur doen er niet toe.`
        : `${cap(v1)} komen steeds met ${tel(n1)}, ${v2} steeds met ${tel(n2)}. Plaatje ${'ABCDE'[breker]} breekt die regel. De kleur doet er niet toe.`;
      return { type: 'odd', cells, ans: breker, why };
    }
    return null;
  }
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
    } else if (d <= 13) {
      // de anderen verschillen in kleur (afleiding), de regel zit in het aantal of de vorm
      const cs = R.shuf(KLEUREN), mode = R.pick(['n', 'k']);
      cells = Array.from({ length: n }, (_, i) => F(i === pos && mode === 'k' ? R.pick(VORMEN.filter(x => x !== v)) : v, cs[i], { n: i === pos && mode === 'n' ? 3 : 2 }));
      why = `De kleur doet er niet toe. Plaatje ${'ABCDE'[pos]} is anders: ${mode === 'n' ? 'het heeft drie vormen, de rest twee' : 'het heeft een andere vorm'}.`;
    } else return koppel(R, d <= 15 ? 'vk' : d <= 17 ? R.pick(['vk', 'af']) : R.pick(['af', 'va']));
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
    const aantal = d <= 9 ? 1 : d <= 14 ? 2 : 3, metKleur = d >= 18;
    for (let tries = 0; tries < 30; tries++) {
      const doel = R.pick(KLEUREN);
      const trans = { ...TRANS }; if (metKleur) trans.kleur = { do: f => kl(f, { c: doel }), uit: `wordt ${doel}`, ok: f => f.c !== doel };
      const keys = Object.keys(trans);
      const ts = metKleur ? ['kleur', ...R.shuf(Object.keys(TRANS)).slice(0, aantal - 1)] : R.shuf(keys).slice(0, aantal);
      const vormA = R.pick(['pijl', 'driehoek', ...VORMEN]), vormC = R.pick(['pijl', 'driehoek', ...VORMEN].filter(x => x !== vormA));
      const A = F(vormA, R.pick(KLEUREN), { s: 's' }), C = F(vormC, R.pick(KLEUREN), { s: 's' });
      if (!ts.every(t => trans[t].ok(A) && trans[t].ok(C))) continue;
      const app = (f, list) => list.reduce((x, t) => trans[t].do(x), f);
      const B = app(A, ts), ans = app(C, ts);
      const deel = ts.map((_, i) => ts.filter((__, j) => j !== i)); // telkens één regel vergeten
      const cand = [...deel.map(l => app(C, l)), C, app(C, keys.filter(k => !ts.includes(k) && trans[k].ok(C)).slice(0, 1)), kl(ans, { k: vormA })];
      const o = opties(ans, R.shuf(cand)); if (!o) continue;
      return { type: 'analogy', abc: [A, B, C], opts: o, ans: 0, why: `Het eerste plaatje ${ts.map(t => trans[t].uit).join(', ').replace(/, ([^,]*)$/, ' en $1')}. Doe hetzelfde met het derde plaatje.` };
    }
    return null;
  }

  /* ---- weegschalen ---- */
  function weegschaal(R, d) {
    const [X, Y, Z] = R.shuf(Object.keys(MV)).slice(0, 3);
    const af = (ans, l) => opties(ans, R.shuf(l).filter(v => v > 0 && v !== ans));
    if (d <= 8) {
      const k = R.int(2, 3), m = R.int(2, d <= 4 ? 2 : 3);
      if (m * k > 9) return null;
      return { type: 'balance', facts: [[[[X, 1]], [[Y, k]]]], ask: [[[X, m]], '?'], askline: `Hoeveel ${MV[Y]}?`, opts: af(m * k, [m + k, m * k - 1, m * k + 1, k, m * k + k]), ans: 0, why: `${m * k}: 1 ${X} weegt evenveel als ${k} ${MV[Y]}, dus ${m} keer zo veel is ${m * k}.` };
    }
    if (d <= 12) {
      const a = R.int(2, 3), b = R.int(2, 3);
      return { type: 'balance', facts: [[[[X, 1]], [[Y, a]]], [[[Y, 1]], [[Z, b]]]], ask: [[[X, 1]], '?'], askline: `Hoeveel ${MV[Z]}?`, opts: af(a * b, [a + b, a * b - 1, a * b + 1, b, a * b + b]), ans: 0, why: `${a * b}: 1 ${X} = ${a} ${MV[Y]}, en elke ${Y} = ${b} ${MV[Z]}. Dus ${a} × ${b} = ${a * b}.` };
    }
    if (d <= 14) {
      const a = R.int(2, 4), y = R.int(1, 4), n = a + y;
      if (n > 6) return null;
      return { type: 'balance', facts: [[[[X, 1], [Y, 1]], [[Z, n]]], [[[X, 1]], [[Z, a]]]], ask: [[[Y, 1]], '?'], askline: `Hoeveel ${MV[Z]}?`, opts: af(y, [n, a, y + 1, y + 2, n + a]), ans: 0, why: `${y}: samen wegen ze ${n}. De ${X} weegt al ${a}, dus voor de ${Y} blijft ${n} − ${a} = ${y} over.` };
    }
    if (d <= 16) {
      if (R.r() < .5) {
        const a = R.int(2, 3), b = R.int(2, 3), m = 2;
        return { type: 'balance', facts: [[[[X, 1]], [[Y, a]]], [[[Y, 1]], [[Z, b]]]], ask: [[[X, m]], '?'], askline: `Hoeveel ${MV[Z]}?`, opts: af(m * a * b, [a * b, m * a + b, m * a * b - 2, m * a * b + 2, a * b + m]), ans: 0, why: `${m * a * b}: 1 ${X} = ${a} ${MV[Y]} = ${a} × ${b} = ${a * b} ${MV[Z]}. Twee keer zoveel is ${m * a * b}.` };
      }
      const k = R.int(2, 3), n = 2 * k;
      return { type: 'balance', facts: [[[[X, 2]], [[Y, 1]]], [[[Y, 1]], [[Z, n]]]], ask: [[[X, 1]], '?'], askline: `Hoeveel ${MV[Z]}?`, opts: af(k, [n, 2 * n, k + 1, k - 1, n - 1]), ans: 0, why: `${k}: 2 ${MV[X]} wegen samen evenveel als ${n} ${MV[Z]}. Eén ${X} is dus de helft: ${k}.` };
    }
    if (d <= 18) {
      // X en Y samen, en X weegt evenveel als m keer Y
      const [m, yv] = R.pick([[2, 1], [2, 2], [3, 1]]), xv = m * yv, n = xv + yv, vraagX = R.r() < .5, ans = vraagX ? xv : yv;
      return { type: 'balance', facts: [[[[X, 1], [Y, 1]], [[Z, n]]], [[[X, 1]], [[Y, m]]]], ask: [[[vraagX ? X : Y, 1]], '?'], askline: `Hoeveel ${MV[Z]}?`, opts: af(ans, [n, vraagX ? yv : xv, ans + 1, n - 1, m]), ans: 0, why: `${ans}: 1 ${X} weegt evenveel als ${m} ${MV[Y]}. Dus links liggen eigenlijk ${m + 1} ${MV[Y]}, en die wegen samen ${n}. Eén ${Y} weegt ${yv}, en de ${X} weegt ${xv}.` };
    }
    // twee weegschalen vergelijken: wat er bij komt, is het verschil
    const [xv, yv] = R.pick([[2, 1], [1, 2], [2, 2], [1, 3], [1, 4]]), n = xv + yv, m = 2 * xv + yv;
    return { type: 'balance', facts: [[[[X, 1], [Y, 1]], [[Z, n]]], [[[X, 2], [Y, 1]], [[Z, m]]]], ask: [[[Y, 1]], '?'], askline: `Hoeveel ${MV[Z]}?`, opts: af(yv, [xv, n, m - n + 1, yv + 1, m - yv]), ans: 0, why: `${yv}: op de tweede weegschaal ligt één ${X} meer, en daar liggen ${m - n} ${MV[Z]} meer. Dus 1 ${X} = ${xv}. Op de eerste weegschaal blijft voor de ${Y} ${n} − ${xv} = ${yv} over.` };
  }

  /* ---- logica-rooster ---- */
  const permsN = n => n === 1 ? [[0]] : permsN(n - 1).flatMap(p => [...Array(n).keys()].map(i => [...p.slice(0, i), n - 1, ...p.slice(i)]));
  function rooster(R, d) {
    const n = d >= 17 ? 4 : 3, PERMS = permsN(n);
    const th = R.pick(THEMAS), namen = R.shuf(NAMEN).slice(0, n), sol = R.pick(PERMS);
    const clues = [];
    for (let p = 0; p < n; p++) for (let w = 0; w < n; w++) clues.push({ t: sol[p] === w ? 'ja' : 'nee', p, w });
    const fits = (perm, cl) => cl.every(c => c.t === 'ja' ? perm[c.p] === c.w : perm[c.p] !== c.w);
    const maxJa = d >= 19 || (d >= 15 && d <= 16) ? 0 : 1;
    let chosen = [];
    for (const c of R.shuf(clues)) {
      if (c.t === 'ja' && chosen.filter(x => x.t === 'ja').length >= maxJa) continue;
      if (fits(sol, chosen.concat([c])) && PERMS.filter(pm => fits(pm, chosen)).length > PERMS.filter(pm => fits(pm, chosen.concat([c]))).length) chosen.push(c);
      if (PERMS.filter(pm => fits(pm, chosen)).length === 1) break;
    }
    if (PERMS.filter(pm => fits(pm, chosen)).length !== 1) return null;
    // overbodige aanwijzingen weglaten, zodat je elke aanwijzing echt nodig hebt
    for (const c of R.shuf(chosen.slice())) { const rest = chosen.filter(x => x !== c); if (PERMS.filter(pm => fits(pm, rest)).length === 1) chosen = rest; }
    const wat = th.wat.slice(0, n), ww = R.int(0, n - 1), wie = sol.indexOf(ww);
    const zin = c => c.t === 'ja' ? th.ja(namen[c.p], wat[c.w]) : th.nee(namen[c.p], wat[c.w]);
    return { type: 'grid', q: n === 4 ? th.zin.replace('Drie', 'Vier') : th.zin, rows: namen, cols: wat, clues: chosen.map(zin), subq: th.vraag(wat[ww]), opts: namen.slice(), ans: wie, why: `${namen[wie]}. Oplossing: ${namen.map((x, i) => `${x}: ${wat[sol[i]]}`).join(', ')}.` };
  }

  const kleurWoord = c => ({ rood: 'rode', blauw: 'blauwe', geel: 'gele', groen: 'groene', oranje: 'oranje', paars: 'paarse', zwart: 'zwarte' }[c] || c);
  const HET = ['rondje', 'vierkant'];
  const een = (c, k) => 'een ' + (HET.includes(k) && c !== 'oranje' ? c : kleurWoord(c)) + ' ' + k;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---- codekraker (zoals Mastermind) ---- */
  const fb = (g, sec) => { let b = 0; g.forEach((x, i) => { if (sec[i] === x) b++; }); const common = g.filter(x => sec.includes(x)).length; return { b, w: common - b }; };
  function perms(pool, n) { if (!n) return [[]]; const out = []; pool.forEach(x => perms(pool.filter(y => y !== x), n - 1).forEach(p => out.push([x, ...p]))); return out; }
  function codekraker(R, d) {
    const len = d >= 19 ? 4 : 3, pool = R.shuf(KLEUREN).slice(0, d <= 10 ? 3 : d <= 17 ? 4 : 5), all = perms(pool, len), maxG = d >= 19 ? 5 : 4, minG = d <= 13 ? 2 : 3;
    for (let tries = 0; tries < 30; tries++) {
      const sec = R.pick(all), guesses = [];
      let cand = all;
      while (cand.length > 1 && guesses.length < maxG) {
        const g = R.pick(all.filter(x => key(x) !== key(sec) && !guesses.some(y => key(y.g) === key(x))));
        const f = fb(g, sec); guesses.push({ g, b: f.b, w: f.w });
        cand = cand.filter(c => { const h = fb(g, c); return h.b === f.b && h.w === f.w; });
      }
      if (cand.length !== 1 || guesses.length < minG) continue;
      // afleiders: codes die bij bijna alle hints passen
      const score = c => guesses.filter(gu => { const h = fb(gu.g, c); return h.b === gu.b && h.w === gu.w; }).length;
      const wrong = R.shuf(all.filter(c => key(c) !== key(sec))).sort((a, b) => score(b) - score(a));
      const o = opties({ k: 'code', p: sec }, wrong.map(c => ({ k: 'code', p: c })));
      if (!o) continue;
      return { type: 'code', q: (len === 4 ? 'Kraak de geheime code van vier kleuren! ' : 'Kraak de geheime code! ') + 'Een zwart bolletje = goede kleur op de goede plek. Een wit bolletje = goede kleur, maar op een andere plek.', guesses, opts: o, ans: 0, why: `${sec.join(' – ')}. Alleen deze code geeft bij elke gok precies het goede aantal zwarte en witte bolletjes.` };
    }
    return null;
  }

  /* ---- mini-sudoku 4x4 ---- */
  let SUDOKUS = null;
  function alleSudokus() {
    if (SUDOKUS) return SUDOKUS; SUDOKUS = [];
    const g = Array(16).fill(-1);
    const ok = (i, v) => { const r = i >> 2, c = i & 3; for (let k = 0; k < 4; k++) { if (g[r * 4 + k] === v || g[k * 4 + c] === v) return false; } const br = r - r % 2, bc = c - c % 2; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if (g[(br + a) * 4 + bc + b] === v) return false; return true; };
    const fill = i => { if (i === 16) { SUDOKUS.push(g.slice()); return; } for (let v = 0; v < 4; v++) if (ok(i, v)) { g[i] = v; fill(i + 1); g[i] = -1; } };
    fill(0); return SUDOKUS;
  }
  function sudoku(R, d) {
    const all = alleSudokus(), vs = R.shuf(VORMEN).slice(0, 4), cs = R.shuf(KLEUREN).slice(0, 4);
    const sym = i => F(vs[i], cs[i]);
    const nGiven = d <= 6 ? 12 : d <= 10 ? 10 : d <= 12 ? 9 : d <= 14 ? 8 : d <= 16 ? 7 : 6;
    for (let tries = 0; tries < 200; tries++) {
      const sol = R.pick(all), q = R.int(0, 15);
      const others = R.shuf([...Array(16).keys()].filter(i => i !== q));
      const given = new Set(others.slice(0, nGiven));
      const fits = all.filter(x => [...given].every(i => x[i] === sol[i]));
      if (!fits.every(x => x[q] === sol[q])) continue;
      // bij hogere stappen: het vraagteken mag niet al uit alleen zijn rij volgen
      const r = q >> 2; const rowGiven = [0, 1, 2, 3].filter(c => given.has(r * 4 + c)).length;
      if (d >= 11 && rowGiven === 3) continue;
      // vanaf stap 17 volgt het vraagteken uit geen enkele rij, kolom of blokje alleen: je moet ze combineren
      if (d >= 17) { const c = q & 3, br = r - r % 2, bc = c - c % 2; const colGiven = [0, 1, 2, 3].filter(x => given.has(x * 4 + c)).length, blkGiven = [0, 1].flatMap(a => [0, 1].map(b => (br + a) * 4 + bc + b)).filter(i => given.has(i)).length; if (colGiven === 3 || blkGiven === 3) continue; }
      const cells = [...Array(16).keys()].map(i => given.has(i) ? sym(sol[i]) : null);
      const o = opties(sym(sol[q]), R.shuf([0, 1, 2, 3].filter(v => v !== sol[q])).map(sym));
      return { type: 'sudoku', q: 'Mini-sudoku: in elke rij, elke kolom en elk blokje van 2 bij 2 staat elke vorm precies één keer. Wat hoort op het vraagteken?', cells, qi: q, opts: o, ans: 0, why: `${cap(een(cs[sol[q]], vs[sol[q]]))}. Kijk naar de rij, de kolom en het blokje: die vorm mist daar nog.` };
    }
    return null;
  }

  /* ---- spiegelen ---- */
  function spiegelen(R, d) {
    const g = d <= 10 ? 3 : 4, nCells = d <= 6 ? 3 : d <= 12 ? 4 : d <= 16 ? 5 : 6, twee = d >= 9;
    const kleuren = R.shuf(KLEUREN).slice(0, d >= 19 ? 3 : twee ? 2 : 1);
    const axis = d >= 15 && R.r() < .5 ? 'h' : 'v';
    const flipV = p => p.map(([i, c]) => [Math.floor(i / g) * g + (g - 1 - i % g), c]);
    const flipH = p => p.map(([i, c]) => [(g - 1 - Math.floor(i / g)) * g + i % g, c]);
    const norm = p => p.slice().sort((a, b) => a[0] - b[0]);
    const fig = p => ({ k: 'raster', g, p: norm(p) });
    for (let tries = 0; tries < 40; tries++) {
      const pos = R.shuf([...Array(g * g).keys()]).slice(0, nCells);
      const src = pos.map((i, j) => [i, kleuren[j % kleuren.length]]);
      const ans = axis === 'v' ? flipV(src) : flipH(src);
      if (key(norm(ans)) === key(norm(src))) continue;
      const moved = ans.map((x, j) => j === 0 ? [(x[0] + 1) % (g * g), x[1]] : x);
      const recol = twee ? ans.map(([i, c]) => [i, kleuren[(kleuren.indexOf(c) + 1) % kleuren.length]]) : null;
      const cand = [src, axis === 'v' ? flipH(src) : flipV(src), flipH(flipV(src)), recol, moved].filter(Boolean).map(fig).filter(f => new Set(f.p.map(x => x[0])).size === f.p.length);
      const o = opties(fig(ans), R.shuf(cand));
      if (!o) continue;
      return { type: 'mirror', q: axis === 'v' ? 'De spiegel staat rechts van het plaatje. Wat zie je in de spiegel?' : 'De spiegel staat onder het plaatje. Wat zie je in de spiegel?', src: fig(src), axis, opts: o, ans: 0, why: axis === 'v' ? 'In een spiegel wordt links rechts. Wat dicht bij de spiegel zit, blijft dicht bij de spiegel. Boven en onder blijven hetzelfde.' : 'In een spiegel eronder wordt boven onder. Wat dicht bij de spiegel zit, blijft dicht bij de spiegel. Links en rechts blijven hetzelfde.' };
    }
    return null;
  }

  /* ---- robotroute ---- */
  const DIRS = { '→': [0, 1], '←': [0, -1], '↓': [1, 0], '↑': [-1, 0] };
  function loop(n, walls, start, moves) { let [r, c] = start; for (const m of moves) { r += DIRS[m][0]; c += DIRS[m][1]; if (r < 0 || c < 0 || r >= n || c >= n || walls.has(r * n + c)) return null; } return [r, c]; }
  function robotroute(R, d) {
    const n = d <= 8 ? 4 : d <= 15 ? 5 : 6, nWalls = d <= 5 ? 1 : d <= 10 ? 3 : d <= 13 ? 4 : d <= 15 ? 5 : d <= 17 ? 7 : 9, minLen = d <= 5 ? 3 : d <= 10 ? 4 : d <= 12 ? 5 : d <= 15 ? 6 : d <= 17 ? 7 : 8, maxLen = d >= 16 ? 10 : 8, minTurns = d >= 16 ? 3 : d >= 11 ? 2 : 0;
    for (let tries = 0; tries < 150; tries++) {
      const cellsAll = R.shuf([...Array(n * n).keys()]);
      const s = cellsAll[0], t = cellsAll[1], walls = new Set(cellsAll.slice(2, 2 + nWalls));
      const start = [Math.floor(s / n), s % n], goal = [Math.floor(t / n), t % n];
      // kortste weg (BFS)
      const prev = new Map([[s, null]]), qu = [s];
      while (qu.length) { const x = qu.shift(); if (x === t) break; for (const m of R.shuf(Object.keys(DIRS))) { const r = Math.floor(x / n) + DIRS[m][0], c = x % n + DIRS[m][1], y = r * n + c; if (r < 0 || c < 0 || r >= n || c >= n || walls.has(y) || prev.has(y)) continue; prev.set(y, [x, m]); qu.push(y); } }
      if (!prev.has(t)) continue;
      const path = []; for (let x = t; prev.get(x); x = prev.get(x)[0]) path.unshift(prev.get(x)[1]);
      if (path.length < minLen || path.length > maxLen) continue;
      const turns = path.filter((m, i) => i && m !== path[i - 1]).length;
      if (turns < minTurns) continue;
      const fails = mv => { const e = loop(n, walls, start, mv); return !e || e[0] !== goal[0] || e[1] !== goal[1]; };
      const cand = [];
      for (let k = 0; k < 40 && cand.length < 8; k++) {
        const mv = path.slice(); const kind = R.int(0, 3);
        if (kind === 0) { const i = R.int(0, mv.length - 1); mv[i] = R.pick(Object.keys(DIRS).filter(x => x !== mv[i])); }
        else if (kind === 1) mv.splice(R.int(0, mv.length - 1), 1);
        else if (kind === 2) mv.splice(R.int(0, mv.length), 0, R.pick(Object.keys(DIRS)));
        else mv.sort(() => R.r() - .5);
        if (fails(mv)) cand.push(mv.join(' '));
      }
      const o = opties(path.join(' '), cand);
      if (!o) continue;
      return { type: 'route', q: 'Welke pijlen brengen de robot naar de bal? Hij mag niet tegen een blok of van het veld af.', n, start, goal, walls: [...walls].map(w => [Math.floor(w / n), w % n]), opts: o, ans: 0, why: `${path.join(' ')}: volg de pijlen vanaf de robot, dan kom je om de blokken heen precies bij de bal.` };
    }
    return null;
  }

  const MAKERS = { text: getallen, matrix, series: reeks, odd: anders, analogy: analogie, balance: weegschaal, grid: rooster, code: codekraker, sudoku, mirror: spiegelen, route: robotroute };
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
