// ตั้งค่า Tailwind (ต้องโหลดหลัง cdn.tailwindcss.com)
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef8ff', 100: '#d8eeff', 200: '#b9e0ff', 300: '#89cdff',
          400: '#52b0fd', 500: '#2a8ef9', 600: '#1470ee', 700: '#0d5ad7',
          800: '#1149ae', 900: '#144089', 950: '#112853',
        },
        lcd: { bg: '#1d3a8a', text: '#e6f0ff' },
      },
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

function renderHeader(current) {
  const links = PAGES.map(p => {
    const active = p.id === current;
    return `<a href="${p.href}" class="px-3 py-2 rounded-lg text-sm font-medium transition
      ${active ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
      ${active ? 'aria-current="page"' : ''}>${p.label}</a>`;
  }).join('');

  return `
  <header class="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-200">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
      <a href="index.html" class="flex items-center gap-2 font-bold text-slate-900 shrink-0">
        <span class="grid grid-cols-2 gap-0.5 w-8 h-8 p-1 rounded-lg bg-slate-800">
          <span class="rounded-sm bg-sky-300"></span><span class="rounded-sm bg-sky-300"></span>
          <span class="rounded-sm bg-sky-300"></span><span class="rounded-sm bg-rose-400"></span>
        </span>
        <span>Keypad Math Game</span>
      </a>
      <nav class="hidden md:flex items-center gap-1">${links}</nav>
      <button id="menuBtn" class="md:hidden p-2 rounded-lg hover:bg-slate-100" aria-label="เปิดเมนู">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
    <nav id="mobileNav" class="md:hidden hidden border-t border-slate-200 px-4 py-2 flex-col gap-1">${links}</nav>
  </header>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const current = document.body.dataset.page;
  document.body.insertAdjacentHTML('afterbegin', renderHeader(current));

  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('mobileNav');
  btn.addEventListener('click', () => {
    nav.classList.toggle('hidden');
    nav.classList.toggle('flex');
  });
});
