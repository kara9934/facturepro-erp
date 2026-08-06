/**
 * @file QrCode.gs
 * @module utils/QrCode
 * @description Générateur de QR code autonome (code pur, aucune dépendance ni
 *              appel réseau), pour encoder l'URL de vérification FNE sur le PDF.
 *              Implémente : encodage octet (byte mode), correction d'erreurs
 *              Reed-Solomon niveau M, sélection automatique de version (1 à 10),
 *              masquage optimal (8 masques + pénalités), info de format/version,
 *              et rendu SVG. Le SVG est net à l'impression et intégrable
 *              directement dans le template HTML du PDF.
 *
 *              Usage : QrCode.svg('https://…', { taille: 132, marge: 4 });
 */
const QrCode = (function () {
  /* --- Corps de Galois GF(256), polynôme primitif 0x11d ---------------- */
  const EXP = new Array(512);
  const LOG = new Array(256);
  (function initGf() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function gfMul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  /* --- Tables par version, niveau M ------------------------------------ */
  // { ec: codewords EC par bloc, groupes: [[nbBlocs, codewords data par bloc], …] }
  const M = {
    1: { ec: 10, g: [[1, 16]] },
    2: { ec: 16, g: [[1, 28]] },
    3: { ec: 26, g: [[1, 44]] },
    4: { ec: 18, g: [[2, 32]] },
    5: { ec: 24, g: [[2, 43]] },
    6: { ec: 16, g: [[4, 27]] },
    7: { ec: 18, g: [[4, 31]] },
    8: { ec: 22, g: [[2, 38], [2, 39]] },
    9: { ec: 22, g: [[3, 36], [2, 37]] },
    10: { ec: 26, g: [[4, 43], [1, 44]] },
  };
  // Positions des motifs d'alignement par version.
  const ALIGN = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  };

  function dataCodewords(v) {
    return M[v].g.reduce((s, grp) => s + grp[0] * grp[1], 0);
  }

  /* --- Reed-Solomon : codewords de correction -------------------------- */
  function rsGenerator(n) {
    let poly = [1];
    for (let i = 0; i < n; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= gfMul(poly[j], EXP[i]);
        next[j + 1] ^= poly[j];
      }
      poly = next;
    }
    return poly;
  }
  function rsEncode(data, n) {
    // rsGenerator renvoie les coefficients de x^0 à x^n (terme dominant en dernier).
    // Le registre à décalage ci-dessous attend les coefficients de x^(n-1) à x^0
    // (terme dominant exclu), d'où l'inversion.
    const div = rsGenerator(n).slice(0, n).reverse();
    const res = new Array(n).fill(0);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ res[0];
      res.shift();
      res.push(0);
      if (factor !== 0) {
        for (let j = 0; j < n; j++) res[j] ^= gfMul(div[j], factor);
      }
    }
    return res;
  }

  /* --- Encodage des données (byte mode) -------------------------------- */
  function toBytes(text) {
    // Encodage UTF-8.
    const out = [];
    for (let i = 0; i < text.length; i++) {
      let c = text.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) { out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
      else if (c >= 0xd800 && c <= 0xdbff) {
        const c2 = text.charCodeAt(++i);
        c = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
        out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      } else { out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
    }
    return out;
  }

  function chooseVersion(nbBytes) {
    for (let v = 1; v <= 10; v++) {
      const countBits = v <= 9 ? 8 : 16;
      const capacityBits = dataCodewords(v) * 8 - 4 - countBits;
      if (nbBytes * 8 <= capacityBits) return v;
    }
    throw new Error('Données trop longues pour un QR code (max ~200 octets).');
  }

  function buildDataBits(bytes, v) {
    const bits = [];
    function push(val, len) { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); }
    push(0x4, 4);                               // indicateur de mode : octet
    push(bytes.length, v <= 9 ? 8 : 16);        // compteur de caractères
    bytes.forEach((b) => push(b, 8));
    const totalBits = dataCodewords(v) * 8;
    // Terminateur (jusqu'à 4 bits) puis alignement octet.
    for (let i = 0; i < 4 && bits.length < totalBits; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);
    // Octets de remplissage alternés 0xEC / 0x11.
    const pads = [0xec, 0x11];
    let p = 0;
    while (bits.length < totalBits) { push(pads[p % 2], 8); p++; }
    // Regroupe en codewords.
    const cw = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      cw.push(b);
    }
    return cw;
  }

  // Entrelacement data + EC selon la structure de blocs.
  function interleave(cw, v) {
    const spec = M[v];
    const blocks = [];
    let idx = 0;
    spec.g.forEach((grp) => {
      for (let b = 0; b < grp[0]; b++) {
        const data = cw.slice(idx, idx + grp[1]);
        idx += grp[1];
        blocks.push({ data: data, ec: rsEncode(data, spec.ec) });
      }
    });
    const maxData = Math.max.apply(null, blocks.map((b) => b.data.length));
    const out = [];
    for (let i = 0; i < maxData; i++) {
      blocks.forEach((b) => { if (i < b.data.length) out.push(b.data[i]); });
    }
    for (let i = 0; i < spec.ec; i++) {
      blocks.forEach((b) => out.push(b.ec[i]));
    }
    return out;
  }

  /* --- Construction de la matrice -------------------------------------- */
  function newMatrix(size) {
    const m = [], reserved = [];
    for (let r = 0; r < size; r++) { m.push(new Array(size).fill(0)); reserved.push(new Array(size).fill(false)); }
    return { m: m, res: reserved, size: size };
  }
  function setF(M2, r, c, val) { M2.m[r][c] = val ? 1 : 0; M2.res[r][c] = true; }

  function placeFinder(M2, r, c) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= M2.size || cc >= M2.size) continue;
        const inRing = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
                       (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6));
        const inCore = (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
        setF(M2, rr, cc, inRing || inCore);
      }
    }
  }
  function placeAlignment(M2, v) {
    const pos = ALIGN[v];
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const r = pos[i], c = pos[j];
        if (M2.res[r][c]) continue; // évite les motifs de recherche
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const ring = Math.max(Math.abs(dr), Math.abs(dc));
            setF(M2, r + dr, c + dc, ring !== 1);
          }
        }
      }
    }
  }
  function placeTiming(M2) {
    for (let i = 8; i < M2.size - 8; i++) {
      if (!M2.res[6][i]) setF(M2, 6, i, i % 2 === 0);
      if (!M2.res[i][6]) setF(M2, i, 6, i % 2 === 0);
    }
  }
  function reserveFormat(M2, v) {
    const size = M2.size;
    for (let i = 0; i <= 8; i++) {
      if (!M2.res[8][i]) M2.res[8][i] = true;
      if (!M2.res[i][8]) M2.res[i][8] = true;
    }
    for (let i = 0; i < 8; i++) {
      M2.res[8][size - 1 - i] = true;
      M2.res[size - 1 - i][8] = true;
    }
    setF(M2, size - 8, 8, true); // module toujours noir
    if (v >= 7) {
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          M2.res[i][size - 11 + j] = true;
          M2.res[size - 11 + j][i] = true;
        }
      }
    }
  }

  function placeData(M2, codewords) {
    const bits = [];
    codewords.forEach((cw) => { for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1); });
    let idx = 0, up = true;
    for (let col = M2.size - 1; col > 0; col -= 2) {
      if (col === 6) col = 5; // saute la colonne de timing
      for (let i = 0; i < M2.size; i++) {
        const row = up ? M2.size - 1 - i : i;
        for (let k = 0; k < 2; k++) {
          const c = col - k;
          if (!M2.res[row][c]) {
            M2.m[row][c] = idx < bits.length ? bits[idx] : 0;
            idx++;
          }
        }
      }
      up = !up;
    }
  }

  function maskFn(k) {
    return [
      (r, c) => (r + c) % 2 === 0,
      (r) => r % 2 === 0,
      (r, c) => c % 3 === 0,
      (r, c) => (r + c) % 3 === 0,
      (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
      (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
      (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
      (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
    ][k];
  }
  function applyMask(M2, k) {
    const fn = maskFn(k);
    const out = { m: M2.m.map((row) => row.slice()), res: M2.res, size: M2.size };
    for (let r = 0; r < M2.size; r++) {
      for (let c = 0; c < M2.size; c++) {
        if (!M2.res[r][c] && fn(r, c)) out.m[r][c] ^= 1;
      }
    }
    return out;
  }

  // BCH pour info de format (15 bits) et version (18 bits).
  function bch(data, gen, glen) {
    let d = data;
    const dlen = Math.floor(Math.log2(gen)) + 1;
    d <<= (dlen - 1);
    let rem = d;
    while (Math.floor(Math.log2(rem)) + 1 >= dlen) {
      rem ^= gen << (Math.floor(Math.log2(rem)) + 1 - dlen);
    }
    return d ^ rem;
  }
  function placeFormat(M2, mask) {
    const data = (0b00 << 3) | mask; // niveau M = 00
    let fmt = bch(data, 0b10100110111, 10);
    fmt ^= 0b101010000010010;
    const size = M2.size;
    const bit = (i) => (fmt >> i) & 1;
    for (let i = 0; i < 15; i++) {
      const b = bit(i);
      // Bande verticale (colonne 8), en sautant la ligne de timing (6).
      if (i < 6) M2.m[i][8] = b;
      else if (i < 8) M2.m[i + 1][8] = b;
      else M2.m[size - 15 + i][8] = b;
      // Bande horizontale (ligne 8), en sautant la colonne de timing (6).
      if (i < 8) M2.m[8][size - 1 - i] = b;
      else if (i < 9) M2.m[8][7] = b;
      else M2.m[8][14 - i] = b;
    }
    M2.m[size - 8][8] = 1; // module toujours noir
  }
  function placeVersion(M2, v) {
    if (v < 7) return;
    let ver = bch(v, 0b1111100100101, 12);
    ver |= v << 12;
    const size = M2.size;
    for (let i = 0; i < 18; i++) {
      const bit = (ver >> i) & 1;
      const r = Math.floor(i / 3), c = i % 3;
      M2.m[r][size - 11 + c] = bit;
      M2.m[size - 11 + c][r] = bit;
    }
  }

  /* --- Pénalités (choix du meilleur masque) ---------------------------- */
  function penalty(M2) {
    const n = M2.size, m = M2.m;
    let p = 0;
    // Règle 1 : séries de même couleur.
    for (let r = 0; r < n; r++) {
      let runC = 1, runR = 1;
      for (let c = 1; c < n; c++) {
        runC = m[r][c] === m[r][c - 1] ? runC + 1 : 1;
        if (runC === 5) p += 3; else if (runC > 5) p += 1;
        runR = m[c][r] === m[c - 1][r] ? runR + 1 : 1;
        if (runR === 5) p += 3; else if (runR > 5) p += 1;
      }
    }
    // Règle 2 : blocs 2x2.
    for (let r = 0; r < n - 1; r++) {
      for (let c = 0; c < n - 1; c++) {
        const v = m[r][c];
        if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) p += 3;
      }
    }
    // Règle 3 : motif 1011101 (0000 avant/après).
    const pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    const pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    function match(line, i, pat) { for (let k = 0; k < 11; k++) if (line[i + k] !== pat[k]) return false; return true; }
    for (let r = 0; r < n; r++) {
      for (let c = 0; c <= n - 11; c++) {
        const row = m[r], col = m.map((x) => x[c]); // col recalculé, ok pour POC
        if (match(m[r], c, pat1) || match(m[r], c, pat2)) p += 40;
      }
    }
    for (let c = 0; c < n; c++) {
      const col = m.map((x) => x[c]);
      for (let r = 0; r <= n - 11; r++) {
        if (match(col, r, pat1) || match(col, r, pat2)) p += 40;
      }
    }
    // Règle 4 : proportion de modules noirs.
    let dark = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) dark += m[r][c];
    const ratio = (dark * 100) / (n * n);
    p += Math.floor(Math.abs(ratio - 50) / 5) * 10;
    return p;
  }

  /* --- Encodage complet -> matrice booléenne --------------------------- */
  function encode(text) {
    const bytes = toBytes(String(text));
    const v = chooseVersion(bytes.length);
    const size = 17 + 4 * v;
    const cw = interleave(buildDataBits(bytes, v), v);

    const base = newMatrix(size);
    placeFinder(base, 0, 0);
    placeFinder(base, 0, size - 7);
    placeFinder(base, size - 7, 0);
    placeAlignment(base, v);
    placeTiming(base);
    reserveFormat(base, v);
    placeData(base, cw);

    let best = null, bestPen = Infinity;
    for (let k = 0; k < 8; k++) {
      const masked = applyMask(base, k);
      placeFormat(masked, k);
      placeVersion(masked, v);
      const pen = penalty(masked);
      if (pen < bestPen) { bestPen = pen; best = masked; }
    }
    return { size: size, modules: best.m.map((row) => row.map((x) => x === 1)) };
  }

  /* --- Rendu SVG ------------------------------------------------------- */
  function svg(text, opts) {
    opts = opts || {};
    const q = encode(text);
    const marge = opts.marge != null ? opts.marge : 4;
    const total = q.size + marge * 2;
    const taille = opts.taille || 132;
    const fond = opts.fond || '#ffffff';
    const couleur = opts.couleur || '#000000';
    let rects = '';
    for (let r = 0; r < q.size; r++) {
      for (let c = 0; c < q.size; c++) {
        if (q.modules[r][c]) rects += '<rect x="' + (c + marge) + '" y="' + (r + marge) + '" width="1" height="1"/>';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + taille + '" height="' + taille +
      '" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + fond + '"/>' +
      '<g fill="' + couleur + '">' + rects + '</g></svg>';
  }

  /* --- Rendu en table HTML (pour le convertisseur PDF de GAS) ---------- */
  /**
   * Rend le QR sous forme de table HTML (une cellule par module). Contrairement
   * au SVG, cette forme est rendue de façon fiable par le convertisseur
   * HTML -> PDF de Google Apps Script. Fournir la classe CSS `qrDark` (fond noir)
   * et une largeur/hauteur de cellule via le <style> du document.
   * @param {string} text
   * @param {{module?:number, marge?:number, couleur?:string}} [opts]
   * @returns {string} HTML (conteneur blanc + table)
   */
  function htmlTable(text, opts) {
    opts = opts || {};
    const q = encode(text);
    const px = opts.module || 3;
    const quiet = opts.marge != null ? opts.marge : 4;
    const dark = opts.couleur || '#000';
    let rows = '';
    for (let r = 0; r < q.size; r++) {
      let cells = '';
      for (let c = 0; c < q.size; c++) {
        cells += q.modules[r][c]
          ? '<td style="width:' + px + 'px;height:' + px + 'px;padding:0;line-height:0;font-size:0;background:' + dark + '"></td>'
          : '<td style="width:' + px + 'px;height:' + px + 'px;padding:0;line-height:0;font-size:0"></td>';
      }
      rows += '<tr>' + cells + '</tr>';
    }
    const pad = quiet * px;
    return '<table cellpadding="0" cellspacing="0" border="0" '
      + 'style="border-collapse:collapse;table-layout:fixed;background:#fff;'
      + 'padding:' + pad + 'px;">' + rows + '</table>';
  }

  return { svg: svg, encode: encode, htmlTable: htmlTable };
})();
