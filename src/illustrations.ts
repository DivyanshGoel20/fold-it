// Hand-made flat vector illustrations. Each sits on the bottom edge of its viewBox
// so the bottom of the art is "the ground".

export interface Art {
  vb: [number, number];
  svg: string;
}

export const ART: Record<string, Art> = {
  rbc: {
    vb: [100, 100],
    svg: `<defs><radialGradient id="rbcg" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ef6a5e"/><stop offset="1" stop-color="#b8302b"/></radialGradient></defs>
    <circle cx="50" cy="50" r="48" fill="url(#rbcg)"/><circle cx="50" cy="52" r="26" fill="#a92a26" opacity=".55"/>
    <ellipse cx="36" cy="30" rx="14" ry="7" fill="#fff" opacity=".25" transform="rotate(-25 36 30)"/>`,
  },
  hair: {
    vb: [100, 100],
    svg: `<circle cx="50" cy="50" r="48" fill="#4a2f22"/><circle cx="50" cy="50" r="41" fill="#6b4532"/>
    <circle cx="50" cy="50" r="13" fill="#3d261b"/>
    <path d="M18 40 Q50 6 84 40" stroke="#9a6b51" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>
    <g fill="#5a3a2a" opacity=".6"><circle cx="30" cy="62" r="3"/><circle cx="68" cy="66" r="2.5"/><circle cx="58" cy="30" r="2"/><circle cx="72" cy="46" r="2"/></g>`,
  },
  mite: {
    vb: [130, 100],
    svg: `<g stroke="#b99a6f" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M40 60 L18 82 L10 98"/><path d="M52 66 L40 88 L34 98"/><path d="M78 66 L90 88 L96 98"/><path d="M90 60 L112 82 L120 98"/>
      <path d="M40 48 L14 36"/><path d="M90 48 L116 36"/></g>
    <ellipse cx="65" cy="56" rx="38" ry="30" fill="#e9d4b2"/><ellipse cx="58" cy="46" rx="22" ry="12" fill="#f6e8d0" opacity=".8"/>
    <ellipse cx="65" cy="26" rx="12" ry="9" fill="#d4b98f"/>
    <g stroke="#cfb68d" stroke-width="2" fill="none" opacity=".7"><path d="M40 62 Q65 74 90 62"/><path d="M44 72 Q65 82 86 72"/></g>`,
  },
  salt: {
    vb: [100, 100],
    svg: `<path d="M50 6 L94 28 L50 50 L6 28 Z" fill="#ffffff"/><path d="M6 28 L50 50 L50 98 L6 76 Z" fill="#e2e9ef"/>
    <path d="M94 28 L50 50 L50 98 L94 76 Z" fill="#c9d4dd"/>
    <path d="M50 6 L94 28 L94 76 L50 98 L6 76 L6 28 Z" fill="none" stroke="#b7c3cd" stroke-width="2" stroke-linejoin="round"/>
    <path d="M20 40 L36 48" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
  },
  sand: {
    vb: [120, 100],
    svg: `<path d="M8 72 L22 30 L58 8 L98 20 L114 58 L96 94 L40 98 L10 88 Z" fill="#dcb67c"/>
    <path d="M58 8 L98 20 L114 58 L70 52 Z" fill="#e9c995"/><path d="M70 52 L114 58 L96 94 L40 98 Z" fill="#c39a5f"/>
    <path d="M8 72 L22 30 L70 52 L40 98 L10 88 Z" fill="#d2aa6d"/>
    <circle cx="44" cy="40" r="5" fill="#f3dcb2" opacity=".8"/>`,
  },
  poppy: {
    vb: [110, 100],
    svg: `<path d="M10 58 C6 24 40 4 66 8 C96 12 108 42 100 66 C92 92 60 100 38 94 C20 89 12 76 10 58 Z" fill="#46505f"/>
    <path d="M24 40 C30 20 56 12 74 18" stroke="#6b7689" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g fill="#39414d"><circle cx="40" cy="60" r="4"/><circle cx="62" cy="52" r="4"/><circle cx="80" cy="66" r="4"/><circle cx="54" cy="78" r="4"/><circle cx="30" cy="76" r="3"/><circle cx="74" cy="34" r="3"/></g>`,
  },
  ant: {
    vb: [220, 100],
    svg: `<g stroke="#2a1f1d" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M96 58 L80 80 L66 98"/><path d="M108 60 L108 84 L100 98"/><path d="M118 58 L136 80 L150 98"/>
      <path d="M44 34 Q30 6 14 10"/><path d="M50 32 Q46 4 30 0"/></g>
    <ellipse cx="164" cy="56" rx="44" ry="28" fill="#33231f"/><ellipse cx="108" cy="52" rx="22" ry="14" fill="#3b2a25"/>
    <circle cx="58" cy="44" r="18" fill="#3b2a25"/>
    <ellipse cx="156" cy="44" rx="20" ry="8" fill="#6d4f45" opacity=".6"/><circle cx="52" cy="40" r="4" fill="#0d0908"/>`,
  },
  ladybug: {
    vb: [140, 100],
    svg: `<g stroke="#1d1d1f" stroke-width="5" stroke-linecap="round"><path d="M40 84 L30 98"/><path d="M70 88 L70 98"/><path d="M100 84 L110 98"/></g>
    <path d="M16 86 C16 34 50 10 76 10 C106 10 130 36 130 86 Z" fill="#e2392f"/>
    <path d="M73 10 L73 86" stroke="#1d1d1f" stroke-width="3"/>
    <g fill="#1d1d1f"><circle cx="48" cy="44" r="10"/><circle cx="100" cy="42" r="10"/><circle cx="40" cy="70" r="8"/><circle cx="108" cy="70" r="8"/><circle cx="74" cy="62" r="7"/></g>
    <path d="M4 86 C4 66 16 58 28 58 C26 70 22 80 22 86 Z" fill="#1d1d1f"/>
    <path d="M40 24 C52 16 64 14 70 14" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>`,
  },
  blueberry: {
    vb: [100, 100],
    svg: `<defs><radialGradient id="bbg" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#7c8fd6"/><stop offset=".6" stop-color="#4a5aa6"/><stop offset="1" stop-color="#2f3a78"/></radialGradient></defs>
    <circle cx="50" cy="52" r="46" fill="url(#bbg)"/><circle cx="50" cy="52" r="46" fill="#d9e2ff" opacity=".12"/>
    <path d="M50 12 L54 20 L63 18 L58 25 L64 31 L55 30 L50 38 L45 30 L36 31 L42 25 L37 18 L46 20 Z" fill="#2a3266"/>`,
  },
  coin: {
    vb: [100, 100],
    svg: `<defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2d27a"/><stop offset="1" stop-color="#c49434"/></linearGradient></defs>
    <circle cx="50" cy="50" r="49" fill="#b78a2f"/><circle cx="50" cy="50" r="45" fill="url(#cg)"/>
    <circle cx="50" cy="50" r="36" fill="none" stroke="#b78a2f" stroke-width="2" opacity=".6"/>
    <path d="M40 34 C40 26 60 26 60 34 C60 42 40 44 40 54 C40 66 60 66 60 58" stroke="#a87c27" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="34" cy="28" rx="12" ry="6" fill="#fff" opacity=".35" transform="rotate(-35 34 28)"/>`,
  },
  golf: {
    vb: [100, 100],
    svg: `<defs><radialGradient id="gg" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d4dae0"/></radialGradient></defs>
    <circle cx="50" cy="50" r="49" fill="url(#gg)"/>
    <g fill="#c3cad2">${Array.from({ length: 30 }, (_, i) => {
      const a = i * 2.39996, r = 8 + Math.sqrt(i) * 7.4;
      return `<circle cx="${(50 + Math.cos(a) * r).toFixed(1)}" cy="${(50 + Math.sin(a) * r).toFixed(1)}" r="3"/>`;
    }).join('')}</g>`,
  },
  mug: {
    vb: [130, 100],
    svg: `<path d="M92 40 C120 40 120 78 92 78" stroke="#d65a40" stroke-width="10" fill="none"/>
    <path d="M14 26 L100 26 L94 92 C93 97 89 100 84 100 L30 100 C25 100 21 97 20 92 Z" fill="#e8694d"/>
    <ellipse cx="57" cy="26" rx="43" ry="7" fill="#c24f37"/><ellipse cx="57" cy="27" rx="38" ry="5" fill="#5a3826"/>
    <path d="M30 40 L32 86" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".3"/>
    <g stroke="#9aa3ad" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"><path d="M44 16 C38 10 50 6 44 0"/><path d="M62 16 C56 10 68 6 62 0"/></g>`,
  },
  cat: {
    vb: [90, 100],
    svg: `<path d="M64 96 C88 96 92 70 78 64" stroke="#3f4352" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M20 100 C10 70 18 46 30 40 L60 40 C72 46 78 70 68 100 Z" fill="#4a4f60"/>
    <path d="M22 18 L26 0 L38 12 L52 12 L64 0 L68 18 C72 32 62 44 45 44 C28 44 18 32 22 18 Z" fill="#4a4f60"/>
    <path d="M28 6 L36 14 L30 16 Z M62 6 L54 14 L60 16 Z" fill="#e8a3a3"/>
    <ellipse cx="36" cy="26" rx="4" ry="5" fill="#f2d16b"/><ellipse cx="54" cy="26" rx="4" ry="5" fill="#f2d16b"/>
    <ellipse cx="36" cy="26" rx="1.5" ry="4" fill="#222"/><ellipse cx="54" cy="26" rx="1.5" ry="4" fill="#222"/>
    <path d="M42 34 L48 34 L45 37 Z" fill="#e8a3a3"/><path d="M34 70 C40 80 50 80 56 70" stroke="#5c6275" stroke-width="3" fill="none" opacity=".7"/>`,
  },
  toddler: {
    vb: [56, 100],
    svg: `<circle cx="28" cy="18" r="15" fill="#f1c7a4"/><path d="M14 14 C14 2 42 2 42 14 C36 8 22 8 14 14 Z" fill="#7a4b2f"/>
    <circle cx="22" cy="20" r="1.8" fill="#333"/><circle cx="34" cy="20" r="1.8" fill="#333"/><path d="M24 26 Q28 29 32 26" stroke="#c0846a" stroke-width="1.5" fill="none"/>
    <path d="M10 40 C10 34 46 34 46 40 L48 68 L8 68 Z" fill="#f4c242"/>
    <path d="M10 42 L2 60" stroke="#f1c7a4" stroke-width="6" stroke-linecap="round"/><path d="M46 42 L54 60" stroke="#f1c7a4" stroke-width="6" stroke-linecap="round"/>
    <path d="M10 66 L46 66 L44 96 L32 96 L28 76 L24 96 L12 96 Z" fill="#4f7cc4"/>
    <rect x="10" y="94" width="15" height="6" rx="3" fill="#e05a4f"/><rect x="31" y="94" width="15" height="6" rx="3" fill="#e05a4f"/>`,
  },
  adult: {
    vb: [44, 100],
    svg: `<circle cx="22" cy="10" r="8.5" fill="#e3b08c"/><path d="M13 9 C13 0 31 0 31 9 C27 5 18 5 13 9 Z" fill="#2f2a28"/>
    <path d="M9 22 C9 19 35 19 35 22 L37 54 L7 54 Z" fill="#3e6fb0"/>
    <path d="M9 24 L3 50" stroke="#3e6fb0" stroke-width="6" stroke-linecap="round"/><path d="M35 24 L41 50" stroke="#3e6fb0" stroke-width="6" stroke-linecap="round"/>
    <circle cx="3" cy="52" r="3" fill="#e3b08c"/><circle cx="41" cy="52" r="3" fill="#e3b08c"/>
    <path d="M8 53 L36 53 L34 97 L24.5 97 L22 64 L19.5 97 L10 97 Z" fill="#2c3445"/>
    <rect x="7" y="96" width="13" height="4" rx="2" fill="#1a1a1a"/><rect x="24" y="96" width="13" height="4" rx="2" fill="#1a1a1a"/>`,
  },
  elephant: {
    vb: [150, 100],
    svg: `<path d="M24 40 C24 18 50 8 80 10 C110 12 128 24 130 48 L130 70 L120 70 L120 100 L104 100 L102 74 L56 74 L54 100 L38 100 L38 72 C28 66 24 54 24 40 Z" fill="#9aa1ac"/>
    <path d="M112 30 C132 20 150 30 146 52 C144 64 140 76 142 92 C142 98 134 98 134 92 C132 78 132 66 130 58" fill="#9aa1ac"/>
    <path d="M96 22 C82 24 78 44 86 58 C94 66 108 60 112 48 Z" fill="#848b97"/>
    <path d="M128 56 C134 62 140 62 144 58" stroke="#f3eee2" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="120" cy="34" r="2.4" fill="#2b2b2b"/>
    <path d="M24 40 C16 44 14 54 18 60" stroke="#8a919c" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M40 30 C60 20 90 18 104 22" stroke="#b3b9c2" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>`,
  },
  giraffe: {
    vb: [80, 100],
    svg: `<path d="M10 62 C10 54 18 50 30 50 L60 50 C66 50 70 54 70 60 L70 66 L66 66 L66 100 L60 100 L58 70 L22 70 L20 100 L14 100 L14 70 C11 68 10 66 10 62 Z" fill="#e9b25a"/>
    <path d="M52 54 L60 12 L70 12 L66 54 Z" fill="#e9b25a"/>
    <path d="M56 4 C60 0 76 2 78 8 C80 14 74 16 68 16 L58 16 C54 14 54 8 56 4 Z" fill="#e9b25a"/>
    <path d="M60 4 L60 -2 M66 3 L66 -3" stroke="#8a5a2b" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="70" cy="8" r="1.6" fill="#2b2b2b"/>
    <g fill="#a8642c" opacity=".85"><circle cx="24" cy="58" r="4"/><circle cx="36" cy="62" r="3.5"/><circle cx="48" cy="57" r="4"/><circle cx="60" cy="62" r="3"/><circle cx="62" cy="40" r="2.5"/><circle cx="60" cy="28" r="2.5"/><circle cx="64" cy="20" r="2"/><circle cx="58" cy="48" r="2.5"/></g>
    <path d="M10 60 C4 66 4 74 6 78" stroke="#c98d3e" stroke-width="2" fill="none"/>`,
  },
  house: {
    vb: [110, 100],
    svg: `<rect x="14" y="40" width="82" height="60" fill="#f3e4c7"/>
    <path d="M4 44 L55 4 L106 44 Z" fill="#c45a44"/><rect x="74" y="10" width="10" height="22" fill="#9e4535"/>
    <g fill="#8fc6ea"><rect x="24" y="50" width="16" height="16" rx="1"/><rect x="70" y="50" width="16" height="16" rx="1"/><rect x="24" y="76" width="16" height="16" rx="1"/></g>
    <g stroke="#fff" stroke-width="2"><path d="M32 50 V66 M24 58 H40 M78 50 V66 M70 58 H86 M32 76 V92 M24 84 H40"/></g>
    <rect x="62" y="72" width="18" height="28" fill="#7a5235"/><circle cx="76" cy="87" r="1.5" fill="#f2c46b"/>
    <rect x="14" y="40" width="82" height="4" fill="#e1cfac"/>`,
  },
  whale: {
    vb: [56, 100],
    svg: `<path d="M8 100 L28 86 L48 100 C40 96 34 94 28 92 C22 94 16 96 8 100 Z" fill="#46688f"/>
    <path d="M28 90 C16 76 12 50 14 30 C16 12 22 2 30 2 C40 2 46 14 46 32 C46 54 40 76 28 90 Z" fill="#5a80a8"/>
    <path d="M30 4 C38 6 42 18 42 32 C42 50 38 68 30 84 C34 64 36 44 34 24 C33 14 32 8 30 4 Z" fill="#a9c3dc"/>
    <g stroke="#89a9c8" stroke-width="1.5" opacity=".9"><path d="M34 12 V40 M37 14 V44 M40 18 V46"/></g>
    <path d="M16 46 C6 50 4 60 6 66 C10 60 14 56 18 54 Z" fill="#46688f"/>
    <circle cx="24" cy="20" r="1.8" fill="#1d2b3a"/>`,
  },
  arc: {
    vb: [90, 100],
    svg: `<path fill-rule="evenodd" fill="#e6d6b6" d="M4 18 H86 V100 H62 V62 C62 48 54 40 45 40 C36 40 28 48 28 62 V100 H4 Z"/>
    <rect x="0" y="8" width="90" height="12" fill="#d9c7a2"/><rect x="2" y="2" width="86" height="7" fill="#e6d6b6"/>
    <rect x="4" y="26" width="82" height="3" fill="#cdb98f"/>
    <g fill="#d3c099"><rect x="10" y="40" width="10" height="24" rx="2"/><rect x="70" y="40" width="10" height="24" rx="2"/></g>
    <path d="M28 62 C28 48 36 40 45 40 C54 40 62 48 62 62" fill="none" stroke="#cdb98f" stroke-width="3"/>`,
  },
  liberty: {
    vb: [44, 100],
    svg: `<path d="M6 100 L8 72 L36 72 L38 100 Z" fill="#cbb58e"/><rect x="4" y="66" width="36" height="7" fill="#b9a27a"/>
    <path d="M10 62 L12 50 L32 50 L34 62 Z" fill="#cbb58e"/><rect x="8" y="60" width="28" height="7" fill="#b9a27a"/>
    <path d="M14 50 C12 40 14 28 18 22 L26 22 C30 28 31 40 30 50 Z" fill="#6fb3a2"/>
    <path d="M26 24 L32 6" stroke="#6fb3a2" stroke-width="4" stroke-linecap="round"/>
    <path d="M32 6 C29 2 32 -3 33 -4 C35 -1 36 2 33 6 Z" fill="#f4b942"/>
    <circle cx="21" cy="18" r="4" fill="#6fb3a2"/>
    <path d="M17 15 L14 11 M19.5 14 L18.5 9 M22.5 14 L23.5 9 M25 15 L28 11" stroke="#6fb3a2" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M16 30 L12 34 L15 36" fill="#5c9c8c"/><path d="M18 32 C20 40 22 46 22 50" stroke="#5c9c8c" stroke-width="1.5" fill="none"/>`,
  },
  pyramid: {
    vb: [165, 100],
    svg: `<path d="M82 2 L163 100 L2 100 Z" fill="#e3c27e"/><path d="M82 2 L163 100 L96 100 Z" fill="#c8a25a"/>
    <g stroke="#cfae6a" stroke-width="1" opacity=".7"><path d="M66 22 H96 M50 42 H112 M34 62 H128 M18 82 H146"/></g>`,
  },
  eiffel: {
    vb: [42, 100],
    svg: `<g fill="#8a6a55">
      <path d="M20 0 L22 0 L22.6 10 L19.4 10 Z"/>
      <path d="M18.6 10 L23.4 10 L26 34 L16 34 Z"/>
      <rect x="14.5" y="33" width="13" height="2.6" rx=".5"/>
      <path d="M15.5 35.5 L26.5 35.5 L33 64 L9 64 Z"/>
      <rect x="7" y="62.5" width="28" height="3" rx=".5"/>
      <path d="M8 65.5 L34 65.5 L42 100 L32 100 C30 88 26 82 21 82 C16 82 12 88 10 100 L0 100 Z"/></g>
    <g stroke="#a8876f" stroke-width=".8" opacity=".9" fill="none"><path d="M17 14 L25 30 M25 14 L17 30 M17 40 L29 60 M25 40 L13 60 M12 70 L30 96 M30 70 L12 96"/></g>`,
  },
  empire: {
    vb: [32, 100],
    svg: `<path d="M15.5 0 H16.5 V12 H15.5 Z" fill="#9aa1ab"/><path d="M14 12 H18 L18.6 20 H13.4 Z" fill="#c4c9d1"/>
    <path d="M12 20 H20 V30 H12 Z M10 30 H22 V40 H10 Z M8 40 H24 V56 H8 Z M5 56 H27 V100 H5 Z" fill="#c9ced6"/>
    <path d="M18 20 H20 V30 H18 Z M20 30 H22 V40 H20 Z M21 40 H24 V56 H21 Z M23 56 H27 V100 H23 Z" fill="#aab1bc"/>
    <g stroke="#e9edf2" stroke-width=".6" opacity=".9"><path d="M9 44 V54 M12 44 V54 M15 44 V54 M18 44 V54 M8 60 V98 M11 60 V98 M14 60 V98 M17 60 V98 M20 60 V98"/></g>`,
  },
  burj: {
    vb: [22, 100],
    svg: `<path d="M10.6 0 L11.4 0 L11.8 18 L10.2 18 Z" fill="#a9b6c4"/>
    <path d="M9.6 18 H12.4 L13 32 H9 Z M8.6 32 H13.4 L14.4 48 H7.6 Z M7 48 H15 L16.4 64 H5.6 Z M5 64 H17 L18.8 80 H3.2 Z M2.6 80 H19.4 L22 100 H0 Z" fill="#c8d3de"/>
    <path d="M11 18 H12.4 L13 32 H11 Z M11 32 H13.4 L14.4 48 H11 Z M11 48 H15 L16.4 64 H11 Z M11 64 H17 L18.8 80 H11 Z M11 80 H19.4 L22 100 H11 Z" fill="#a8b6c6"/>`,
  },
  fuji: {
    vb: [400, 100],
    svg: `<defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f74a3"/><stop offset="1" stop-color="#7d93bd"/></linearGradient></defs>
    <path d="M0 100 C70 84 130 50 172 6 C178 2 222 2 228 6 C270 50 330 84 400 100 Z" fill="url(#fg)"/>
    <path d="M152 26 C164 14 170 8 172 6 C178 2 222 2 228 6 C232 10 238 16 248 26 C238 32 232 24 224 34 C216 24 208 36 198 28 C190 36 182 26 174 34 C168 28 160 32 152 26 Z" fill="#fbfcff"/>`,
  },
  everest: {
    vb: [360, 100],
    svg: `<defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c7895"/><stop offset="1" stop-color="#4d5875"/></linearGradient></defs>
    <path d="M0 100 L46 52 L70 66 L118 22 L140 34 L176 0 L206 30 L224 18 L270 60 L300 46 L360 100 Z" fill="url(#eg)"/>
    <path d="M176 0 L206 30 L196 32 L184 22 L170 34 L160 18 Z M118 22 L140 34 L128 38 L118 30 L106 36 Z M224 18 L246 38 L232 36 L220 28 L212 30 Z" fill="#f4f7fc"/>
    <path d="M176 0 L206 30 L224 18 L270 60 L300 46 L360 100 L190 100 Z" fill="#3e4862" opacity=".35"/>`,
  },
};

// Small icons for altitude markers (24x24 viewBox)
export const ICONS: Record<string, string> = {
  jet: `<path d="M21 14v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V7l-8 5v2l8-2.5V17l-2 1.5V20l3.5-1 3.5 1v-1.5L13 17v-5.5z" fill="currentColor"/>`,
  skydiver: `<circle cx="12" cy="5" r="2.4" fill="currentColor"/><path d="M4 9l8 2 8-2M12 11v5m0 0l-4 5m4-5l4 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  rocket: `<path d="M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10z" fill="currentColor"/><circle cx="12" cy="9" r="1.8" fill="#0b1630"/><path d="M9 16l-1 5 4-2 4 2-1-5" fill="currentColor" opacity=".6"/>`,
  aurora: `<path d="M2 16c3-6 5-6 8 0s5 6 8 0 3-4 4-4" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M2 10c3-5 5-5 8 0s5 5 8 0" stroke="currentColor" stroke-width="1.6" fill="none" opacity=".5" stroke-linecap="round"/>`,
  iss: `<rect x="10" y="9" width="4" height="6" rx="1" fill="currentColor"/><path d="M3 12h18" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="6" width="5" height="12" rx=".5" fill="currentColor" opacity=".55"/><rect x="17" y="6" width="5" height="12" rx=".5" fill="currentColor" opacity=".55"/>`,
  telescope: `<rect x="8" y="4" width="8" height="15" rx="2" fill="currentColor"/><rect x="2" y="9" width="5" height="5" fill="currentColor" opacity=".55"/><rect x="17" y="9" width="5" height="5" fill="currentColor" opacity=".55"/><circle cx="12" cy="5.5" r="2" fill="#0b1630"/>`,
  satellite: `<rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)" fill="currentColor"/><path d="M5 5l4 4M15 15l4 4" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="1" width="6" height="6" rx="1" transform="rotate(45 4 4)" fill="currentColor" opacity=".55"/><rect x="17" y="17" width="6" height="6" rx="1" transform="rotate(45 20 20)" fill="currentColor" opacity=".55"/>`,
  moon: `<circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="9" cy="9" r="2" fill="#000" opacity=".2"/><circle cx="15" cy="14" r="2.6" fill="#000" opacity=".2"/>`,
  planet: `<circle cx="12" cy="12" r="7" fill="currentColor"/>`,
  ringed: `<circle cx="12" cy="12" r="6" fill="currentColor"/><ellipse cx="12" cy="12" rx="11" ry="3.2" stroke="currentColor" stroke-width="1.5" fill="none" transform="rotate(-18 12 12)"/>`,
  sun: `<circle cx="12" cy="12" r="5.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></g>`,
  probe: `<circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9V2M8 16l-5 5M16 16l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  star: `<path d="M12 2l2.6 7.1L22 9.6l-5.8 4.6 2 7.3L12 17.3 5.8 21.5l2-7.3L2 9.6l7.4-.5z" fill="currentColor"/>`,
  galaxy: `<path d="M12 12c0-3 3-5 6-3M12 12c0 3-3 5-6 3M12 12c3 0 5 3 3 6M12 12c-3 0-5-3-3-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/>`,
  ruler: `<path d="M3 12h18" stroke="currentColor" stroke-width="2"/><path d="M5 9v6M19 9v6M12 10v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  cloud: `<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A4 4 0 1 1 17 18z" fill="currentColor"/>`,
  earth: `<circle cx="12" cy="12" r="9" fill="currentColor"/>`,
  universe: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2.5"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/>`,
};

export const GALAXY_SVG = `<svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="gcore"><stop offset="0" stop-color="#fff6dc"/><stop offset=".25" stop-color="#ffd9a0" stop-opacity=".9"/><stop offset="1" stop-color="#7a6cff" stop-opacity="0"/></radialGradient>
    <radialGradient id="ghalo"><stop offset="0" stop-color="#9fb4ff" stop-opacity=".35"/><stop offset="1" stop-color="#3b2d8a" stop-opacity="0"/></radialGradient>
    <filter id="gblur"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>
  <circle r="100" fill="url(#ghalo)"/>
  <g filter="url(#gblur)" fill="none" stroke-linecap="round">
    ${[0, 90, 180, 270].map((r) => `<path transform="rotate(${r})" d="M0 0 C 20 -6 40 4 46 26 C 52 52 30 78 -6 86" stroke="#c9d4ff" stroke-width="10" opacity=".35"/>
    <path transform="rotate(${r + 12})" d="M0 0 C 18 -4 36 6 40 26 C 44 48 26 70 -4 76" stroke="#ffe7c2" stroke-width="3.5" opacity=".55"/>`).join('')}
  </g>
  <g fill="#fff">${Array.from({ length: 140 }, (_, i) => {
    const a = i * 0.7 + (i % 4) * Math.PI / 2, r = 6 + (i * 37 % 80);
    const x = Math.cos(a + r / 30) * r, y = Math.sin(a + r / 30) * r;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.4 + (i % 5) * 0.18).toFixed(2)}" opacity="${(0.35 + (i % 7) / 12).toFixed(2)}"/>`;
  }).join('')}</g>
  <circle r="30" fill="url(#gcore)"/>
</svg>`;

export const ANDROMEDA_SVG = `<svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="acore"><stop offset="0" stop-color="#fff8e8"/><stop offset=".3" stop-color="#ffd8b0" stop-opacity=".8"/><stop offset=".7" stop-color="#8f84ff" stop-opacity=".25"/><stop offset="1" stop-color="#3b2d8a" stop-opacity="0"/></radialGradient>
    <filter id="ablur"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <g transform="rotate(-32) scale(1 .38)">
    <circle r="98" fill="url(#acore)"/>
    <g filter="url(#ablur)" fill="none" stroke="#d6dcff" opacity=".45"><ellipse rx="70" ry="66" stroke-width="5"/><ellipse rx="48" ry="44" stroke-width="4"/></g>
  </g>
</svg>`;
