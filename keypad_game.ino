#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <math.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

const byte rows[4] = {9, 8, 7, 6};
const byte cols[4] = {5, 4, 3, 2};

const char keys[4][4] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};

const unsigned long ROUND_MS = 100000UL;
const unsigned long BONUS_MS = 10000UL;
const unsigned long FEEDBACK_MS = 1000UL;

unsigned long timeBonus = 0;
unsigned long feedbackStart = 0;
unsigned long roundStart = 0;

byte numbers[4];
bool used[4];
byte count = 0;

// 0 = รอเริ่ม, 1 = เล่น, 2 = หมดเวลา
byte state = 0;

// 0 = ไม่มีข้อความ, 1 = ถูก, 2 = ใช้เลขไม่ครบ, 3 = ผิด
byte feedback = 0;

int goal = 24;
int score = 0;
int lastSeconds = -1;

float result = 0;
char operation = 0;
bool needNumber = true;

// อ่านค่าจาก Keypad 4x4
char readKey() {
  for (byte r = 0; r < 4; r++) {
    pinMode(rows[r], OUTPUT);
    digitalWrite(rows[r], LOW);
    delayMicroseconds(5);

    for (byte c = 0; c < 4; c++) {
      if (digitalRead(cols[c]) == LOW) {
        pinMode(rows[r], INPUT_PULLUP);
        return keys[r][c];
      }
    }

    pinMode(rows[r], INPUT_PULLUP);
  }

  return 0;
}

// คำนวณทางคณิตศาสตร์
float calculate(float a, float b, char op) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;

    case '/':
      if (b == 0) return NAN;
      return a / b;
  }

  return a;
}

// คำนวณเวลาที่เหลือ
int secondsLeft() {
  unsigned long elapsed = millis() - roundStart;
  unsigned long totalTime = ROUND_MS + timeBonus;

  if (elapsed >= totalTime) return 0;

  return (totalTime - elapsed + 999UL) / 1000UL;
}

// ล้างข้อความหนึ่งแถวบน LCD
void clearLine(byte row) {
  lcd.setCursor(0, row);
  lcd.print("                ");
  lcd.setCursor(0, row);
}

// แสดงผลบน LCD
void show() {
  if (state != 1) return;

  int seconds = secondsLeft();
  lastSeconds = seconds;

  // แถวบน: เป้าหมาย เวลา และคะแนน
  clearLine(0);
  lcd.print("T:");
  lcd.print(goal);
  lcd.print(' ');
  lcd.print(seconds);
  lcd.print("s S:");
  lcd.print(score);

  // แถวล่าง
  clearLine(1);

  if (feedback == 1) {
    lcd.print("Correct! +10s");
    return;
  }

  if (feedback == 2) {
    lcd.print("Use all 4 nums!");
    return;
  }

  if (feedback == 3) {
    lcd.print("Incorrect!");
    return;
  }

  // แสดงตัวเลขที่เหลือ
  for (byte i = 0; i < 4; i++) {
    if (used[i]) {
      lcd.print('-');
    } else {
      lcd.print(numbers[i]);
    }

    lcd.print(' ');
  }

  lcd.print('=');
  lcd.print(result, 1);

  if (operation) {
    lcd.print(operation);
  }
}

// ล้างคำตอบ แต่ไม่เปลี่ยนโจทย์
void resetAnswer() {
  for (byte i = 0; i < 4; i++) {
    used[i] = false;
  }

  count = 0;
  result = 0;
  operation = 0;
  needNumber = true;
}

// สุ่มโจทย์ใหม่
void newPuzzle() {
  const char ops[4] = {'+', '-', '*', '/'};
  bool found = false;

  for (int attempt = 0; attempt < 500; attempt++) {
    for (byte i = 0; i < 4; i++) {
      numbers[i] = random(1, 10);
    }

    float value = numbers[0];

    for (byte i = 1; i < 4; i++) {
      value = calculate(
        value,
        numbers[i],
        ops[random(0, 4)]
      );
    }

    if (!isfinite(value)) continue;
    if (value < 9.999 || value > 99.001) continue;

    int target = (int)round(value);

    if (target >= 10 && target <= 99 &&
        fabs(value - target) < 0.001) {
      goal = target;
      found = true;
      break;
    }
  }

  // โจทย์สำรองหากสุ่มไม่สำเร็จ
  if (!found) {
    numbers[0] = 1;
    numbers[1] = 2;
    numbers[2] = 3;
    numbers[3] = 4;
    goal = 24;
  }

  // สลับตำแหน่งตัวเลข
  for (byte i = 3; i > 0; i--) {
    byte j = random(i + 1);

    byte temp = numbers[i];
    numbers[i] = numbers[j];
    numbers[j] = temp;
  }

  resetAnswer();
}

// เริ่มเกมใหม่
void startRound() {
  randomSeed(micros() ^ analogRead(A3));

  score = 0;
  timeBonus = 0;
  feedback = 0;

  newPuzzle();

  roundStart = millis();
  lastSeconds = -1;
  state = 1;

  lcd.clear();
  show();
}

// จบเกมเมื่อหมดเวลา
void endRound() {
  state = 2;
  feedback = 0;

  lcd.clear();
  lcd.print("Time up! Score:");
  lcd.setCursor(0, 1);
  lcd.print(score);
  lcd.print(" # play again");
}

// จัดการการกดปุ่ม
void handleKey(char key) {
  if (state != 1) {
    if (key == '#') {
      startRound();
    }
    return;
  }

  if (secondsLeft() == 0) {
    endRound();
    return;
  }

  // ระหว่างแสดงข้อความ ไม่รับคำสั่งใหม่
  if (feedback != 0) return;

  // * = ล้างคำตอบ
  if (key == '*') {
    resetAnswer();
    show();
    return;
  }

  // เลือกตัวเลข 0-9
  if (key >= '0' && key <= '9') {
    if (!needNumber || count >= 4) return;

    byte value = key - '0';
    int index = -1;

    // ค้นหาตัวเลขที่ยังไม่ได้ใช้
    for (byte i = 0; i < 4; i++) {
      if (!used[i] && numbers[i] == value) {
        index = i;
        break;
      }
    }

    if (index == -1) return;

    if (count == 0) {
      result = value;
    } else {
      result = calculate(result, value, operation);
    }

    used[index] = true;
    count++;
    operation = 0;
    needNumber = false;

    show();
    return;
  }

  // A = +, B = -, C = *, D = /
  if (key >= 'A' && key <= 'D') {
    if (count == 0 || count >= 4 || needNumber) {
      return;
    }

    operation = key == 'A' ? '+' :
                key == 'B' ? '-' :
                key == 'C' ? '*' : '/';

    needNumber = true;

    show();
    return;
  }

  // # = ส่งคำตอบ หรือข้ามข้อ
  if (key == '#') {

    // ข้ามข้อได้เฉพาะเมื่อยังไม่ใช้ตัวเลขเลย
    if (count == 0) {
      newPuzzle();
      show();
      return;
    }

    // ใช้ตัวเลขไม่ครบ 4 ตัว
    if (count < 4) {
      feedback = 2;
      feedbackStart = millis();
      show();
      return;
    }

    // ใช้ครบ 4 ตัว แต่รูปแบบคำตอบยังไม่สมบูรณ์
    if (needNumber || operation != 0) {
      feedback = 3;
      feedbackStart = millis();
      show();
      return;
    }

    // ตรวจคำตอบเมื่อใช้ตัวเลขครบทั้ง 4 ตัว
    if (isfinite(result) &&
        fabs(result - goal) < 0.001) {

      // ตอบถูก
      score++;
      timeBonus += BONUS_MS;

      feedback = 1;
      feedbackStart = millis();

      show();

    } else {

      // ตอบผิด
      feedback = 3;
      feedbackStart = millis();

      show();
    }
  }
}

void setup() {
  for (byte i = 0; i < 4; i++) {
    pinMode(rows[i], INPUT_PULLUP);
    pinMode(cols[i], INPUT_PULLUP);
  }

  lcd.init();
  lcd.backlight();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Math Game 100s");
  lcd.setCursor(0, 1);
  lcd.print("# Start round");
}

void loop() {
  // ตรวจสอบเวลา
  if (state == 1) {
    if (secondsLeft() == 0) {
      endRound();
    } else {

      // จัดการข้อความแจ้งเตือน
      if (feedback != 0 &&
          millis() - feedbackStart >= FEEDBACK_MS) {

        byte previousFeedback = feedback;
        feedback = 0;

        if (previousFeedback == 1) {
          // ตอบถูกแล้ว ไปโจทย์ใหม่
          newPuzzle();
        } else {
          // ตอบผิดหรือใช้เลขไม่ครบ
          // เริ่มทำโจทย์เดิมใหม่
          resetAnswer();
        }

        show();
      }

      // อัปเดตเวลาบน LCD
      if (secondsLeft() != lastSeconds) {
        show();
      }
    }
  }

  // กรองการเด้งของปุ่ม (Debounce)
  static char previous = 0;
  static char accepted = 0;
  static unsigned long changed = 0;

  char key = readKey();

  if (key != previous) {
    previous = key;
    changed = millis();
  }

  if (millis() - changed >= 25 &&
      key != accepted) {

    accepted = key;

    if (key) {
      handleKey(key);
    }
  }
}