// จำลองเกมบนเว็บ — แปลตรรกะมาจาก keypad_game.ino ให้ทำงานเหมือนบอร์ดจริง
(() => {
  const ROUND_MS = 100000, BONUS_MS = 10000, FEEDBACK_MS = 1000;
  const KEYS = [['1','2','3','A'],['4','5','6','B'],['7','8','9','C'],['*','0','#','D']];

  let timeBonus = 0, feedbackStart = 0, roundStart = 0;
  let numbers = [0, 0, 0, 0], used = [false, false, false, false], count = 0;
  let state = 0, feedback = 0, goal = 24, score = 0, lastSeconds = -1;
  let result = 0, operation = '', needNumber = true;
  let lines = ['Math Game 100s', '# Start round'];

  const row0 = document.getElementById('lcd0');
  const row1 = document.getElementById('lcd1');
  const pad = document.getElementById('simPad');

  const rand = (a, b) => a + Math.floor(Math.random() * (b - a));

  function calculate(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
    }
    return a;
  }

  function secondsLeft() {
    const elapsed = Date.now() - roundStart;
    const total = ROUND_MS + timeBonus;
    if (elapsed >= total) return 0;
    return Math.floor((total - elapsed + 999) / 1000);
  }

  // จำลองการพิมพ์ float แบบ Arduino lcd.print(x, 1)
  function fmt(x) {
    if (Number.isNaN(x)) return 'nan';
    if (!Number.isFinite(x)) return 'inf';
    return x.toFixed(1);
  }

  function render() {
    row0.textContent = lines[0].padEnd(16).slice(0, 16);
    row1.textContent = lines[1].padEnd(16).slice(0, 16);
  }

  function show() {
    if (state !== 1) return;
    const seconds = secondsLeft();
    lastSeconds = seconds;
    lines[0] = `T:${goal} ${seconds}s S:${score}`;

    if (feedback === 1) lines[1] = 'Correct! +10s';
    else if (feedback === 2) lines[1] = 'Use all 4 nums!';
    else if (feedback === 3) lines[1] = 'Incorrect!';
    else {
      let s = '';
      for (let i = 0; i < 4; i++) s += (used[i] ? '-' : numbers[i]) + ' ';
      lines[1] = s + '=' + fmt(result) + (operation || '');
    }
    render();
  }

  function resetAnswer() {
    used = [false, false, false, false];
    count = 0; result = 0; operation = ''; needNumber = true;
  }

  function newPuzzle() {
    const ops = ['+', '-', '*', '/'];
    let found = false;
    for (let attempt = 0; attempt < 500; attempt++) {
      for (let i = 0; i < 4; i++) numbers[i] = rand(1, 10);
      let value = numbers[0];
      for (let i = 1; i < 4; i++) value = calculate(value, numbers[i], ops[rand(0, 4)]);
      if (!Number.isFinite(value)) continue;
      if (value < 9.999 || value > 99.001) continue;
      const target = Math.round(value);
      if (target >= 10 && target <= 99 && Math.abs(value - target) < 0.001) {
        goal = target; found = true; break;
      }
    }
    if (!found) { numbers = [1, 2, 3, 4]; goal = 24; }
    for (let i = 3; i > 0; i--) {
      const j = rand(0, i + 1);
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    resetAnswer();
  }

  function startRound() {
    score = 0; timeBonus = 0; feedback = 0;
    newPuzzle();
    roundStart = Date.now();
    lastSeconds = -1;
    state = 1;
    show();
  }

  function endRound() {
    state = 2; feedback = 0;
    lines = ['Time up! Score:', `${score} # play again`];
    render();
  }

  function handleKey(key) {
    if (state !== 1) { if (key === '#') startRound(); return; }
    if (secondsLeft() === 0) { endRound(); return; }
    if (feedback !== 0) return;

    if (key === '*') { resetAnswer(); show(); return; }

    if (key >= '0' && key <= '9') {
      if (!needNumber || count >= 4) return;
      const value = Number(key);
      const index = numbers.findIndex((n, i) => !used[i] && n === value);
      if (index === -1) return;
      result = count === 0 ? value : calculate(result, value, operation);
      used[index] = true; count++; operation = ''; needNumber = false;
      show(); return;
    }

    if (key >= 'A' && key <= 'D') {
      if (count === 0 || count >= 4 || needNumber) return;
      operation = { A: '+', B: '-', C: '*', D: '/' }[key];
      needNumber = true;
      show(); return;
    }

    if (key === '#') {
      if (count === 0) { newPuzzle(); show(); return; }
      if (count < 4) { feedback = 2; feedbackStart = Date.now(); show(); return; }
      if (needNumber || operation) { feedback = 3; feedbackStart = Date.now(); show(); return; }
      if (Number.isFinite(result) && Math.abs(result - goal) < 0.001) {
        score++; timeBonus += BONUS_MS; feedback = 1;
      } else {
        feedback = 3;
      }
      feedbackStart = Date.now();
      show();
    }
  }

  // เทียบเท่า loop() — เรียกซ้ำทุก 50ms
  setInterval(() => {
    if (state !== 1) return;
    if (secondsLeft() === 0) { endRound(); return; }
    if (feedback !== 0 && Date.now() - feedbackStart >= FEEDBACK_MS) {
      const prev = feedback;
      feedback = 0;
      if (prev === 1) newPuzzle(); else resetAnswer();
      show();
    }
    if (secondsLeft() !== lastSeconds) show();
  }, 50);

  // สร้างปุ่ม Keypad
  KEYS.flat().forEach(k => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = k;
    b.dataset.key = k;
    const special = /[A-D*#]/.test(k);
    b.className = `aspect-square rounded-lg text-xl md:text-2xl font-bold text-white shadow
      active:scale-95 transition select-none ${special ? 'bg-rose-400 hover:bg-rose-500' : 'bg-sky-400 hover:bg-sky-500'}`;
    b.addEventListener('click', () => handleKey(k));
    pad.appendChild(b);
  });

  // รองรับคีย์บอร์ดคอมพิวเตอร์
  const KB = { '+': 'A', '-': 'B', '*': 'C', 'x': 'C', 'X': 'C', '/': 'D', 'Enter': '#', 'Escape': '*', 'Backspace': '*' };
  document.addEventListener('keydown', e => {
    let k = /^[0-9]$/.test(e.key) ? e.key : KB[e.key];
    if (!k && /^[a-dA-D#]$/.test(e.key)) k = e.key.toUpperCase();
    if (!k) return;
    e.preventDefault();
    handleKey(k);
    const btn = pad.querySelector(`[data-key="${CSS.escape(k)}"]`);
    if (btn) { btn.classList.add('ring-4', 'ring-yellow-300'); setTimeout(() => btn.classList.remove('ring-4', 'ring-yellow-300'), 120); }
  });

  render();
})();
