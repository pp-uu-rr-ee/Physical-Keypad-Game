// สีทั้งหมดอ้างอิงตัวแปรใน theme.css
const v = name => `rgb(var(--${name}) / <alpha-value>)`;

// ตั้งค่า Tailwind (ต้องโหลดหลัง cdn.tailwindcss.com)
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        lcd: ['VT323', '"JetBrains Mono"', 'monospace'],
      },
      colors: {
        white: '#ffffff',
        surface: v('surface'),
        slate: {
          50: v('paper'), 100: v('s100'), 200: v('s200'), 300: v('s300'), 400: v('s400'),
          500: v('s500'), 600: v('s600'), 700: v('s700'), 800: v('s800'), 900: v('s900'),
        },
        brand: {
          50: v('b50'), 100: v('b100'), 200: v('b200'), 300: v('b300'), 400: v('b400'),
          500: v('b500'), 600: v('b600'), 700: v('b700'), 800: v('b800'), 900: v('b900'), 950: v('b950'),
        },
        lcd: { bg: v('lcd'), text: v('lcd-ink') },
        kp: v('kp'), bezel: v('bezel'), lcdpcb: v('lcdpcb'), pad: v('pad'),
        keynum: v('keynum'), keyop: v('keyop'),
        code: { DEFAULT: v('code'), ink: v('code-ink') },
        row: { DEFAULT: v('row'), soft: v('row-soft') },
        col: { DEFAULT: v('col'), soft: v('col-soft') },
        ok: { DEFAULT: v('ok'), soft: v('ok-soft') },
        bad: { DEFAULT: v('bad'), soft: v('bad-soft') },
        note: { DEFAULT: v('note'), line: v('note-line'), ink: v('note-ink') },
      },
      borderRadius: { lg: '6px', xl: '8px', '2xl': '10px', '3xl': '14px' },
    },
  },
};

// รายการหน้าทั้งหมดของเว็บ
const PAGES = [
  { id: 'abstract', href: 'index.html',   label: 'บทคัดย่อ' },
  { id: 'circuit',  href: 'circuit.html', label: 'การต่อวงจร' },
  { id: 'howto',    href: 'howto.html',   label: 'วิธีเล่น' },
  { id: 'video',    href: 'video.html',   label: 'วิดีโอ' },
  { id: 'code',     href: 'code.html',    label: 'อธิบายโค้ด' },
];

// วาดจอ LCD 16×2 เป็นช่องตัวอักษร 32 ช่องเหมือนจอจริง
window.LCD = {
  paint(el, lines) {
    if (!el.firstChild) {
      el.classList.add('lcd-grid');
      el.setAttribute('role', 'img');
      for (let i = 0; i < 32; i++) {
        const c = document.createElement('span');
        c.className = 'lcd-cell';
        el.appendChild(c);
      }
    }
    const text = lines.map(l => String(l).padEnd(16).slice(0, 16)).join('');
    [...text].forEach((ch, i) => { el.children[i].textContent = ch === ' ' ? '' : ch; });
    el.setAttribute('aria-label', lines.join(' / '));
  },
};

function renderHeader(current) {
  const links = PAGES.map(p => {
    const active = p.id === current;
    return `<a href="${p.href}" class="px-3 py-2 rounded-lg text-sm font-medium transition
      ${active ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
      ${active ? 'aria-current="page"' : ''}>${p.label}</a>`;
  }).join('');

  return `
  <header class="sticky z-40 bg-surface/90 backdrop-blur border-b border-slate-200" style="top: env(safe-area-inset-top, 0px)">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
      <a href="index.html" class="flex items-center gap-2.5 shrink-0 text-slate-900">
        <span class="grid grid-cols-2 gap-0.5 w-8 h-8 p-1 rounded-md bg-kp" aria-hidden="true">
          <span class="rounded-sm bg-keynum"></span><span class="rounded-sm bg-keynum"></span>
          <span class="rounded-sm bg-keynum"></span><span class="rounded-sm bg-keyop"></span>
        </span>
        <span class="font-semibold" style="font-family: var(--font-display)">Keypad Math Game</span>
      </a>
      <div class="flex items-center gap-1">
        <nav class="hidden md:flex items-center gap-1" aria-label="เมนูหลัก">${links}</nav>
        <button id="menuBtn" type="button" class="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100" aria-label="เปิดเมนู" aria-expanded="false">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
    <nav id="mobileNav" class="md:hidden hidden border-t border-slate-200 px-4 py-2 flex-col gap-1" aria-label="เมนูหลัก">${links}</nav>
  </header>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const current = document.body.dataset.page;
  document.body.insertAdjacentHTML('afterbegin', renderHeader(current));

  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('mobileNav');
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('hidden') === false;
    nav.classList.toggle('flex', open);
    btn.setAttribute('aria-expanded', String(open));
  });

  // จอ LCD ตัวอย่างในหน้า: <div data-lcd="บรรทัดบน|บรรทัดล่าง">
  document.querySelectorAll('[data-lcd]').forEach(el => LCD.paint(el, el.dataset.lcd.split('|')));
});
