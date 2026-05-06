const buttons = document.querySelectorAll("[data-action]");
const landing = document.querySelector(".landing");
const main = document.querySelector("#birthdayMain");
const photo = document.querySelector(".photo");
const momentPhoto = document.querySelector(".moment-photo");
const revealItems = document.querySelectorAll(".reveal");
const surprise = document.querySelector("#surprise");
const playMessage = document.querySelector("#playMessage");
const tinyWish = document.querySelector("#tinyWish");
const gameBoard = document.querySelector("#gameBoard");
const gamePrompt = document.querySelector("#gamePrompt");
const signatureMessage = document.querySelector("#signatureMessage");

const colors = ["#ff6fa7", "#ffd166", "#65dfc2", "#71c7ff", "#a994ff"];
const wishes = [
  "You are loved more than you know.",
  "Your smile can light up the whole day.",
  "May your cake be sweet and your dreams be huge.",
  "Mummy loves you.",
  "Daddy loves you too."
];

let wishIndex = 0;
let activeBits = 0;
let audioContext;
let sparkleTimer;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

photo.addEventListener("error", () => {
  const avatar = [
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1100'>",
    "<defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='%23ffd166'/><stop offset='.5' stop-color='%23ff6fa7'/><stop offset='1' stop-color='%2371c7ff'/></linearGradient></defs>",
    "<rect width='900' height='1100' rx='52' fill='url(%23g)'/>",
    "<circle cx='325' cy='430' r='42' fill='%23291f34'/><circle cx='575' cy='430' r='42' fill='%23291f34'/>",
    "<path d='M300 625q150 135 300 0' fill='none' stroke='%23291f34' stroke-width='46' stroke-linecap='round'/>",
    "<text x='450' y='930' text-anchor='middle' font-size='180' font-family='Trebuchet MS, Arial' font-weight='800' fill='white'>M</text>",
    "</svg>"
  ].join("");

  photo.src = `data:image/svg+xml,${avatar}`;
}, { once: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    softBurst(entry.target, 6);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.32 });

revealItems.forEach((item) => observer.observe(item));

buttons.forEach((button) => {
  button.addEventListener("click", () => runAction(button));
});

function runAction(button) {
  const action = button.dataset.action;
  button.classList.remove("pulse");
  void button.offsetWidth;
  button.classList.add("pulse");

  if (action === "enter") {
    enterBirthday(button);
    return;
  }

  if (action === "surprise") {
    surprise.textContent = wishes[wishIndex];
    wishIndex = nextIndex();
    softBurst(button, 18);
    playSparkleRun();
    return;
  }

  if (action === "candles") {
    playMessage.textContent = "Game on: tap every candle flame.";
    playPop();
    startGame("candles");
    return;
  }

  if (action === "balloons") {
    playMessage.textContent = "Game on: catch the floating balloons.";
    playLift();
    startGame("balloons");
    return;
  }

  if (action === "stars") {
    playMessage.textContent = "Game on: collect the twinkling stars.";
    playSparkleRun();
    startGame("stars");
    return;
  }

  if (action === "photo") {
    shimmerPhoto(momentPhoto);
    playSparkleRun();
    return;
  }

  if (action === "signature") {
    signatureMessage.classList.add("is-visible");
    button.textContent = "Secret note opened";
    button.disabled = true;
    softBurst(button, 18);
    playSuccess();
    return;
  }

  tinyWish.textContent = wishes[wishIndex];
  wishIndex = nextIndex();
  softBurst(button, 16);
  playPop();
}

photo.addEventListener("click", () => {
  shimmerPhoto(photo);
  playSparkleRun();
});

momentPhoto.addEventListener("click", () => {
  shimmerPhoto(momentPhoto);
  playSparkleRun();
});

function enterBirthday(button) {
  startAudio();
  playWelcome();
  button.textContent = "Opening...";
  button.disabled = true;
  document.body.classList.remove("landing-active");
  document.body.classList.add("has-glitter");
  main.removeAttribute("aria-hidden");
  softBurst(button, 28);
  makeBalloons(button, 10);

  window.setTimeout(() => {
    landing.classList.add("is-hidden");
    document.querySelector(".hero").scrollIntoView({ behavior: "smooth", block: "start" });
    startGlitter();
  }, 220);
}

function nextIndex() {
  return (wishIndex + 1) % wishes.length;
}

function softBurst(source, amount) {
  const rect = source.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  for (let i = 0; i < amount; i += 1) {
    createBit("spark", x, y);
  }
}

function makeBalloons(source, amount) {
  const rect = source.getBoundingClientRect();

  for (let i = 0; i < amount; i += 1) {
    createBit(
      "float-away",
      rect.left + Math.random() * rect.width,
      rect.top + rect.height / 2
    );
  }
}

function makeCandles(source, amount) {
  const rect = source.getBoundingClientRect();

  for (let i = 0; i < amount; i += 1) {
    createBit(
      "candle",
      rect.left + (rect.width / amount) * i + rect.width / amount / 2,
      rect.top + rect.height / 2
    );
  }
}

function startGame(type) {
  const settings = {
    candles: {
      count: 7,
      tokenClass: "candle-token",
      prompt: "Tap 7 glowing candles to make the birthday wish bright.",
      done: "All candles are glowing. Birthday wish unlocked."
    },
    balloons: {
      count: 8,
      tokenClass: "balloon-token",
      prompt: "Catch 8 balloons before they float away.",
      done: "Balloon parade complete."
    },
    stars: {
      count: 9,
      tokenClass: "star-token",
      prompt: "Catch 9 stars to power Mesoma's wish.",
      done: "Star power full. Wish shining."
    }
  }[type];

  let caught = 0;
  gameBoard.innerHTML = "";
  gamePrompt.textContent = settings.prompt;
  gameBoard.append(gamePrompt);

  for (let i = 0; i < settings.count; i += 1) {
    const token = document.createElement("button");
    token.type = "button";
    token.className = `game-token ${settings.tokenClass}`;
    token.setAttribute("aria-label", `Catch ${type}`);
    token.style.setProperty("--token-x", `${12 + Math.random() * 76}%`);
    token.style.setProperty("--token-y", `${18 + Math.random() * 68}%`);
    token.style.setProperty("--token-size", `${2.2 + Math.random() * 1.4}rem`);
    token.style.setProperty("--c", colors[Math.floor(Math.random() * colors.length)]);

    token.addEventListener("click", () => {
      if (token.classList.contains("is-caught")) return;

      caught += 1;
      token.classList.add("is-caught");
      softBurst(token, 5);
      playPop();
      gamePrompt.textContent = `${caught} of ${settings.count} caught.`;
      setTimeout(() => token.remove(), 150);

      if (caught === settings.count) {
        gamePrompt.textContent = settings.done;
        softBurst(gameBoard, 22);
        playSuccess();
      }
    });

    gameBoard.append(token);
  }
}

function startGlitter() {
  if (reducedMotion || sparkleTimer) return;

  sparkleTimer = window.setInterval(() => {
    const x = 20 + Math.random() * (window.innerWidth - 40);
    const y = 20 + Math.random() * (window.innerHeight - 40);
    createBit("spark", x, y);
  }, 950);
}

function createBit(kind, x, y) {
  if (activeBits > 80) return;

  activeBits += 1;
  const bit = document.createElement("span");
  const distance = 60 + Math.random() * 140;
  const angle = Math.random() * Math.PI * 2;

  bit.className = kind;
  bit.setAttribute("aria-hidden", "true");
  bit.style.setProperty("--x", `${x}px`);
  bit.style.setProperty("--y", `${y}px`);
  bit.style.setProperty("--s", `${0.65 + Math.random() * 1.1}rem`);
  bit.style.setProperty("--c", colors[Math.floor(Math.random() * colors.length)]);
  bit.style.setProperty("--tx", `${Math.sin(angle) * distance}px`);
  bit.style.setProperty("--ty", `${Math.cos(angle) * distance}px`);
  bit.style.setProperty("--r", `${Math.random() * 520 - 260}deg`);
  bit.style.setProperty("--d", `${760 + Math.random() * 620}ms`);

  document.body.append(bit);
  bit.addEventListener("animationend", () => {
    activeBits -= 1;
    bit.remove();
  }, { once: true });
}

function shimmerPhoto(image) {
  const rect = image.getBoundingClientRect();

  for (let i = 0; i < 18; i += 1) {
    createPhotoShine(
      rect.left + Math.random() * rect.width,
      rect.top + Math.random() * rect.height
    );
  }
}

function startAudio() {
  if (audioContext) return;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;

  audioContext = new AudioCtor();
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTone(frequency, duration, delay = 0, type = "sine", volume = 0.045) {
  if (!audioContext) return;

  const now = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function playWelcome() {
  [523.25, 659.25, 783.99, 1046.5].forEach((note, index) => {
    playTone(note, 0.18, index * 0.08, "triangle", 0.05);
  });
}

function playSparkleRun() {
  [880, 1174.66, 1567.98].forEach((note, index) => {
    playTone(note, 0.11, index * 0.045, "sine", 0.035);
  });
}

function playPop() {
  playTone(392, 0.08, 0, "square", 0.025);
  playTone(784, 0.1, 0.035, "triangle", 0.03);
}

function playLift() {
  playTone(349.23, 0.18, 0, "sine", 0.035);
  playTone(523.25, 0.2, 0.08, "sine", 0.035);
}

function playSuccess() {
  [523.25, 659.25, 783.99, 987.77, 1318.51].forEach((note, index) => {
    playTone(note, 0.14, index * 0.055, "triangle", 0.045);
  });
}

function createPhotoShine(x, y) {
  if (activeBits > 80) return;

  activeBits += 1;
  const bit = document.createElement("span");
  const distance = 18 + Math.random() * 34;
  const angle = Math.random() * Math.PI * 2;

  bit.className = "photo-shine";
  bit.setAttribute("aria-hidden", "true");
  bit.style.setProperty("--x", `${x}px`);
  bit.style.setProperty("--y", `${y}px`);
  bit.style.setProperty("--s", "0.45rem");
  bit.style.setProperty("--c", colors[Math.floor(Math.random() * colors.length)]);
  bit.style.setProperty("--tx", `${Math.sin(angle) * distance}px`);
  bit.style.setProperty("--ty", `${Math.cos(angle) * distance}px`);
  bit.style.setProperty("--d", `${520 + Math.random() * 420}ms`);

  document.body.append(bit);
  bit.addEventListener("animationend", () => {
    activeBits -= 1;
    bit.remove();
  }, { once: true });
}
