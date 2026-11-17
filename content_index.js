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
      src: "content/cover_art.png",
      title: "LOG 001 // Cover Art (Working Title)",
      text: "Last Breath is a sci-fi survival parkour game set aboard a spaceship carrying the last remnants of humanity. Explore environments with unusual physics and solve puzzles while managing essential resources such as fuel and oxygen.",
    },
    {
      src: "content/hook_art.png",
      title: "LOG 002 // Gameplay Overview",
      text: "In Last Breath, players must navigate a vast, failing spaceship using parkour mechanics, avoid a range of hazards, and solve puzzles—all while their oxygen supply steadily runs out.",
    },
    {
      src: "content/usp_art.png",
      title: "LOG 003 // Unique Selling Points",
      text: "Last Breath offers players a tense and distinctive experience, combining first-person parkour and exploration with unusual physics. Players can also use a range of tools to aid their journey, including a grappling hook and a zero-gravity jetpack."
    }
  ];

  const TYPING_SPEED = 5; // ms per character (lower = faster)
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