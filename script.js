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