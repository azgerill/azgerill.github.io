const container = document.querySelector('.starting-texts');
const items = Array.from(container.children)
  .filter(node => !['cake-container','cake-countdown','post-cake-prompt'].includes(node.id))
  .map(node => {
  if (node.tagName === 'BUTTON') {
    node.style.display = 'none';
    return { node, button: true };
  }
  const text = node.textContent.trim();
  node.textContent = '';
  return { node, text };
});
const count = 200;
const defaults = { origin: { y: 0.7 } };

// Typing speed (ms per character). Lower = faster. Restored to normal.
let typingSpeed = 45; // normal speed

function setTypingSpeed(ms) {
  typingSpeed = ms;
  console.log('Typing speed set to', ms);
}

function resetTypingSpeed() {
  typingSpeed = 45;
  console.log('Typing speed reset to', typingSpeed);
}

// Expose to global so you can call from console: setTypingSpeed(45) or resetTypingSpeed()
window.setTypingSpeed = setTypingSpeed;
window.resetTypingSpeed = resetTypingSpeed;

function fire(particleRatio, opts) {
  confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) }));
}

let currentIndex = 0;

// Cake lit/unlit logic: shows lit image, waits 4s, switches to unlit, then calls optional callback
function initializeCakeSequence(done) {
  const cakeContainer = document.getElementById('cake-container');
  const cakeImage = document.getElementById('cake-image');

  if (!cakeContainer || !cakeImage) {
    console.error('Cake elements not found', cakeContainer, cakeImage);
    if (done) done();
    return;
  }

  cakeContainer.style.display = 'block';

  const litCandidates = ['./cake lit.png', './cake%20lit.png', 'cake lit.png', 'cake%20lit.png', encodeURI('./cake lit.png')];
  const unlitCandidates = ['./cake unlit.png', './cake%20unlit.png', 'cake unlit.png', 'cake%20unlit.png', encodeURI('./cake unlit.png')];

  function attemptSequentialLoad(imgEl, candidates, onLoaded, onAllFailed) {
    let idx = 0;
    function tryNext() {
      if (idx >= candidates.length) {
        if (onAllFailed) onAllFailed();
        return;
      }
      const src = candidates[idx++];
      imgEl.onload = () => onLoaded(src);
      imgEl.onerror = () => {
        console.warn('Failed to load image:', src);
        tryNext();
      };
      imgEl.src = src;
    }
    tryNext();
  }

  // Prefer the encoded filename so the cake appears promptly; start the
  // countdown exactly when the image successfully loads. If that fails,
  // fall back to other candidates.
  const initialLit = './cake%20lit.png';
  cakeContainer.style.display = 'block';

  function startCountdownAndSwitch() {
    const countdownEl = document.getElementById('cake-countdown');
    let countdownRaf = null;
    const durationMs = 4000;
    const endTime = performance.now() + durationMs;

    function update() {
      const remaining = Math.max(0, Math.ceil((endTime - performance.now()) / 1000));
      if (countdownEl) countdownEl.textContent = remaining > 0 ? remaining.toString() : '';
      if (performance.now() < endTime) countdownRaf = requestAnimationFrame(update);
      else countdownRaf = null;
    }
    update();

    setTimeout(() => {
      if (countdownRaf) cancelAnimationFrame(countdownRaf);
      const countdownElLocal = document.getElementById('cake-countdown');
      if (countdownElLocal) countdownElLocal.textContent = '';
      attemptSequentialLoad(cakeImage, unlitCandidates, (unlitSrc) => {
        cakeImage.src = unlitSrc;
        if (done) setTimeout(done, 120);
      }, () => {
        console.error('All unlit image candidates failed');
        if (done) done();
      });
    }, durationMs);
  }

  cakeImage.onload = () => {
    cakeContainer.style.display = 'block';
    const promptEl = document.getElementById('post-cake-prompt');
    if (promptEl) promptEl.style.display = 'block';
    startCountdownAndSwitch();
  };
  cakeImage.onerror = () => {
    const remaining = litCandidates.filter(s => s !== initialLit);
    attemptSequentialLoad(cakeImage, remaining, (loadedSrc) => {
      // startCountdownAndSwitch will run when that src loads (img.onload)
    }, () => {
      console.error('All lit image candidates failed');
      if (done) done();
    });
  };

  // Try the common encoded filename immediately.
  cakeImage.src = initialLit;
}

function typeNext() {
  if (currentIndex >= items.length) return;
  const item = items[currentIndex];
  if (item.button) {
    item.node.style.display = 'inline-block';
    currentIndex += 1;
    setTimeout(typeNext, 700);
    return;
  }

  const { node, text } = item;
  let charIndex = 0;
  const speed = typingSpeed;
  const interval = setInterval(() => {
    node.textContent += text.charAt(charIndex);
    charIndex += 1;
    if (charIndex >= text.length) {
      clearInterval(interval);
        if (text === 'HAPPY BIRTHDAY!!!') {
          // Confetti burst uniquely for happy birthday
          fire(0.25, { spread: 26, startVelocity: 55 });
          fire(0.2, { spread: 60 });
          fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
          fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
          fire(0.1, { spread: 120, startVelocity: 45 });
          currentIndex += 1;
          setTimeout(typeNext, 2800);
          return;
        }
        // When we finish the "CAKE TIME!!!" line, show cake lit for 4s,
        // switch to unlit, then continue to the next item.
        if (text === 'CAKE TIME!!!') {
          // Advance index now so the next line is ready to type after the cake sequence.
          currentIndex += 1;
          // Start cake sequence (no callback). Continue typing after ~4.2s.
          initializeCakeSequence();
          setTimeout(typeNext, 4200);
          return;
        }
      currentIndex += 1;
      setTimeout(typeNext, 600);
    }
  }, speed);
}

typeNext();

// Flying-heart spawn logic
function spawnHeart(xPercent) {
  const heart = document.createElement('div');
  // choose random variant and color
  const shapes = ['heart'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  heart.className = 'heart ' + shape;
  const colors = ['#004d24', '#00a84d', '#00d96f', '#1ec95e', '#00b856', '#18b344', '#2dd8b0', '#0d7a47'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  heart.style.setProperty('--color', color);
  heart.style.setProperty('--left', xPercent + '%');
  // fly straight up (no drift)
  heart.style.setProperty('--dx', '0px');
  // random duration
  const duration = (1.6 + Math.random() * 1.6).toFixed(2) + 's';
  heart.style.setProperty('--duration', duration);
  // random size
  const size = Math.floor(12 + Math.random() * 18) + 'px';
  heart.style.setProperty('--size', size);

  document.body.appendChild(heart);
  // allow styles to apply then animate
  requestAnimationFrame(() => heart.classList.add('animate'));

  heart.addEventListener('animationend', () => heart.remove());
}

// attach click to the sending-hearts element
const sendEl = document.getElementById('send-heart');
if (sendEl) {
  sendEl.style.cursor = 'pointer';
  sendEl.addEventListener('click', () => {
    // spawn a burst of hearts
    for (let i = 0; i < 24; i++) {
      setTimeout(() => spawnHeart(50 + (Math.random() - 0.5) * 30), i * 55);
    }
  });
}

// Attach heart burst to the visible button (pointerdown so it occurs before navigation)
const visibleBtn = document.querySelector('.starting-texts button');
if (visibleBtn) {
  visibleBtn.addEventListener('pointerdown', (e) => {
    const rect = visibleBtn.getBoundingClientRect();
    const xPercent = (rect.left + rect.width / 2) / window.innerWidth * 100;
    for (let i = 0; i < 16; i++) {
      setTimeout(() => spawnHeart(xPercent + (Math.random() - 0.5) * 20), i * 45);
    }
  });
}

// Auto-spawn small hearts during typing
// Spawn occasionally near the node being typed into
function setupAutoSpawn() {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      const node = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      if (!node) continue;
      // higher chance to spawn during typing
      if (Math.random() < 0.28) {
        const r = node.getBoundingClientRect();
        const randX = r.left + Math.random() * Math.max(r.width, 8);
        const xPercent = (randX / window.innerWidth) * 100;
        spawnHeart(xPercent);
      }
    }
  });

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(t => observer.observe(t, { characterData: true }));

  // disconnect after a while to avoid leaks
  setTimeout(() => observer.disconnect(), 20000);
}

// start observing immediately so hearts can spawn during the typing animation
setupAutoSpawn();