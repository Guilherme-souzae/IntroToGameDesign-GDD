/* =========================================================
   "Hyperspace" effect: stars that turn into streaks of light
   ========================================================= */
(function () {
  const canvas = document.getElementById("hyperspace");
  if (!canvas) return; // safety: do nothing if the canvas is missing
  const ctx = canvas.getContext("2d");

  // ---- Settings (tweak freely) ----
  const STAR_COUNT = 450;     // number of stars
  const SPEED = 0.012;        // travel speed
  const TRAIL = 14;           // streak length (higher = longer lines)
  const MAX_DEPTH = 1;        // maximum star depth
  const LINE_WIDTH = 1.4;     // maximum line thickness

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w, h, cx, cy, stars = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2;
  }

  function newStar(randomDepth) {
    return {
      x: (Math.random() - 0.5) * 2,   // -1 to 1
      y: (Math.random() - 0.5) * 2,
      z: randomDepth ? Math.random() * MAX_DEPTH : MAX_DEPTH,
    };
  }

  function init() {
    resize();
    stars = Array.from({ length: STAR_COUNT }, () => newStar(true));
  }

  // projects the star's 3D position onto the screen
  function project(x, y, z) {
    const scale = Math.max(w, h) * 0.5;
    return [cx + (x / z) * scale * 0.5, cy + (y / z) * scale * 0.5];
  }

  function frame() {
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-star").trim() || "#ffffff";

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineCap = "round";

    for (const s of stars) {
      // "behind" position (streak tail) and current position (head)
      const tail = project(s.x, s.y, Math.min(s.z + SPEED * TRAIL, MAX_DEPTH * 1.5));
      const head = project(s.x, s.y, s.z);

      // closer = brighter and thicker
      const near = 1 - s.z / MAX_DEPTH;
      ctx.globalAlpha = Math.min(1, 0.15 + near * 1.1);
      ctx.lineWidth = 0.3 + near * LINE_WIDTH;

      ctx.beginPath();
      ctx.moveTo(tail[0], tail[1]);
      ctx.lineTo(head[0], head[1]);
      ctx.stroke();

      s.z -= SPEED * (0.4 + near * 1.6); // closer to the screen = faster

      const out = head[0] < -50 || head[0] > w + 50 || head[1] < -50 || head[1] > h + 50;
      if (s.z <= 0.02 || out) Object.assign(s, newStar(false));
    }
    ctx.globalAlpha = 1;
    // if the OS has "reduce motion" on, draw a single static frame only
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  init();
  requestAnimationFrame(frame);
})();

/* =========================================================
   Terminal image viewer (carousel)
   The terminal text turns into a panel with image + caption.
   ========================================================= */
(function () {
  // ---- EDIT YOUR SLIDES HERE ----------------------------------------
  // src:   path to the image (relative to index.html)
  // title: short heading shown above the text
  // text:  caption that is "typed" in the terminal when the slide shows
  const SLIDES = [
    {
      src: "content/img1.jpeg",
      title: "LOG 001 // DEPARTURE",
      text: "Final launch window confirmed. All crew members accounted for. Oxygen reserves at 100%.",
    },
    {
      src: "content/img2.jpg",
      title: "LOG 002 // SIGNAL LOST",
      text: "Contact with the mothership was lost at 03:14. Black box recording has started.",
    }
  ];

  const TYPING_SPEED = 18; // ms per character (lower = faster)
  // -------------------------------------------------------------------

  const $ = (id) => document.getElementById(id);
  const terminal = $("terminal");
  const toggle = $("terminal-toggle");
  const textBox = $("terminal-text");
  const viewer = $("viewer");
  const frame = $("viewer-frame");
  const img = $("viewer-img");
  const fallback = $("viewer-fallback");
  const titleEl = $("viewer-title");
  const captionEl = $("viewer-text");
  const dotsEl = $("viewer-dots");
  const countEl = $("viewer-count");
  const prevBtn = $("viewer-prev");
  const nextBtn = $("viewer-next");

  if (!terminal || !toggle || !viewer || SLIDES.length === 0) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let typingTimer = null;
  let swapTimer = null;

  // ---- dots ----
  const dots = SLIDES.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "viewer-dot";
    b.setAttribute("aria-label", "Go to slide " + (i + 1));
    b.addEventListener("click", () => show(i));
    dotsEl.appendChild(b);
    return b;
  });

  // ---- typewriter ----
  function type(text) {
    clearTimeout(typingTimer);
    if (reduceMotion) { captionEl.textContent = text; return; }
    captionEl.textContent = "";
    let n = 0;
    (function step() {
      n += 1;
      captionEl.textContent = text.slice(0, n);
      if (n < text.length) typingTimer = setTimeout(step, TYPING_SPEED);
    })();
  }

  // ---- show a slide ----
  function show(i) {
    index = (i + SLIDES.length) % SLIDES.length;
    const slide = SLIDES[index];

    titleEl.textContent = slide.title;
    countEl.textContent = String(index + 1).padStart(2, "0") + " / " + String(SLIDES.length).padStart(2, "0");
    dots.forEach((d, k) => d.classList.toggle("is-active", k === index));
    type(slide.text);

    // fade out, swap the image, fade in
    clearTimeout(swapTimer);
    img.classList.add("is-changing");
    fallback.hidden = true;
    swapTimer = setTimeout(() => {
      img.alt = slide.title;
      img.src = slide.src;
    }, reduceMotion ? 0 : 150);

    // preload the next image
    new Image().src = SLIDES[(index + 1) % SLIDES.length].src;
  }

  img.addEventListener("load", () => {
    fallback.hidden = true;
    img.classList.remove("is-changing");
  });
  img.addEventListener("error", () => {
    fallback.hidden = false;
    img.classList.remove("is-changing");
  });

  // ---- open / close ----
  function setOpen(open) {
    terminal.classList.toggle("is-open", open);
    viewer.hidden = !open;
    textBox.hidden = open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close image viewer" : "Open image viewer");
    if (open) show(index);
    else clearTimeout(typingTimer);
  }

  toggle.addEventListener("click", () => setOpen(!terminal.classList.contains("is-open")));
  prevBtn.addEventListener("click", () => show(index - 1));
  nextBtn.addEventListener("click", () => show(index + 1));

  // ---- keyboard ----
  document.addEventListener("keydown", (e) => {
    if (!terminal.classList.contains("is-open")) return;
    if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "Escape") setOpen(false);
  });

  // ---- swipe (touch / mouse drag) ----
  let startX = null;
  frame.addEventListener("pointerdown", (e) => { startX = e.clientX; });
  frame.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
  });
  frame.addEventListener("pointercancel", () => { startX = null; });
})();