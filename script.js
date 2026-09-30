document.getElementById("year").textContent = String(new Date().getFullYear());

const header = document.querySelector(".site-header");
window.addEventListener(
  "scroll",
  () => {
    header.classList.toggle("scrolled", window.scrollY > 12);
  },
  { passive: true }
);

const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

reveals.forEach((el) => observer.observe(el));

/* —— Visualization tabs —— */
const tabs = document.querySelectorAll(".viz-tab");
const panels = {
  bisection: document.getElementById("viz-bisection"),
  newton: document.getElementById("viz-newton"),
  matrix: document.getElementById("viz-matrix"),
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const key = tab.dataset.viz;
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    Object.entries(panels).forEach(([name, panel]) => {
      const show = name === key;
      panel.hidden = !show;
      panel.classList.toggle("is-hidden", !show);
    });
    if (key === "newton") renderNewtonBars();
    if (key === "matrix") renderMatrix(matrixStep);
    if (key === "bisection") drawBisection(bisectStep);
  });
});

/* —— Bisection chart —— */
function f(x) {
  return x * x * x - x - 2;
}

const bisectSteps = (() => {
  const steps = [];
  let xl = 1;
  let xu = 2;
  for (let i = 0; i < 7; i++) {
    const xr = (xl + xu) / 2;
    steps.push({ xl, xu, xr });
    if (f(xl) * f(xr) < 0) xu = xr;
    else xl = xr;
  }
  return steps;
})();

let bisectStep = 0;
let playTimer = null;

function xToSvg(x) {
  const minX = 0.8;
  const maxX = 2.2;
  return 40 + ((x - minX) / (maxX - minX)) * 560;
}

function yToSvg(y) {
  const minY = -3;
  const maxY = 5;
  return 200 - ((y - minY) / (maxY - minY)) * 160;
}

function drawBisection(stepIndex) {
  const svg = document.getElementById("bisect-svg");
  const label = document.getElementById("bisect-step-label");
  if (!svg || !label) return;

  const { xl, xu, xr } = bisectSteps[stepIndex];
  const points = [];
  for (let i = 0; i <= 60; i++) {
    const x = 0.8 + (i / 60) * 1.4;
    points.push(`${xToSvg(x)},${yToSvg(f(x))}`);
  }

  svg.innerHTML = `
    <line class="zero-line" x1="40" y1="${yToSvg(0)}" x2="600" y2="${yToSvg(0)}" />
    <line class="axis-line" x1="40" y1="20" x2="40" y2="210" />
    <line class="axis-line" x1="40" y1="210" x2="600" y2="210" />
    <text class="axis-label" x="40" y="228">x</text>
    <text class="axis-label" x="18" y="28">f(x)</text>
    <polyline class="curve" points="${points.join(" ")}" />
    <rect class="interval-band" x="${xToSvg(xl)}" y="20" width="${Math.max(2, xToSvg(xu) - xToSvg(xl))}" height="190" />
    <line class="bound-line" x1="${xToSvg(xl)}" y1="20" x2="${xToSvg(xl)}" y2="210" />
    <line class="bound-line" x1="${xToSvg(xu)}" y1="20" x2="${xToSvg(xu)}" y2="210" />
    <circle class="mid-dot" cx="${xToSvg(xr)}" cy="${yToSvg(f(xr))}" r="5" />
    <text class="axis-label" x="${xToSvg(xl)}" y="18" text-anchor="middle">xl=${xl.toFixed(3)}</text>
    <text class="axis-label" x="${xToSvg(xu)}" y="18" text-anchor="middle">xu=${xu.toFixed(3)}</text>
    <text class="axis-label" x="${xToSvg(xr)}" y="${yToSvg(f(xr)) - 10}" text-anchor="middle">xr</text>
  `;

  label.textContent = `Iteration ${stepIndex} · interval [${xl.toFixed(3)}, ${xu.toFixed(3)}]`;
}

document.getElementById("bisect-next")?.addEventListener("click", () => {
  bisectStep = Math.min(bisectSteps.length - 1, bisectStep + 1);
  drawBisection(bisectStep);
});

document.getElementById("bisect-prev")?.addEventListener("click", () => {
  bisectStep = Math.max(0, bisectStep - 1);
  drawBisection(bisectStep);
});

document.getElementById("bisect-play")?.addEventListener("click", (e) => {
  const btn = e.currentTarget;
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
    btn.textContent = "Play";
    return;
  }
  btn.textContent = "Pause";
  if (bisectStep >= bisectSteps.length - 1) bisectStep = 0;
  drawBisection(bisectStep);
  playTimer = setInterval(() => {
    if (bisectStep >= bisectSteps.length - 1) {
      clearInterval(playTimer);
      playTimer = null;
      btn.textContent = "Play";
      return;
    }
    bisectStep += 1;
    drawBisection(bisectStep);
  }, 700);
});

drawBisection(0);

/* —— Newton error bars —— */
const newtonErrors = [42, 18, 6.2, 1.4, 0.22, 0.03];
let newtonDrawn = false;

function renderNewtonBars() {
  const host = document.getElementById("newton-bars");
  if (!host || newtonDrawn) return;
  const max = Math.max(...newtonErrors);
  host.innerHTML = newtonErrors
    .map(
      (err, i) => `
      <div class="bar-col">
        <div class="bar" style="height:${Math.max(8, (err / max) * 140)}px; animation-delay:${i * 0.08}s" title="${err}%"></div>
        <span class="bar-label">i${i + 1}</span>
      </div>`
    )
    .join("");
  newtonDrawn = true;
}

/* —— Gaussian matrix steps —— */
const matrixSteps = [
  {
    label: "Step 0 · original A|b",
    cells: [2, 1, -1, 8, -3, -1, 2, -11, -2, 1, 2, -3],
  },
  {
    label: "Step 1 · eliminate column 1",
    cells: [2, 1, -1, 8, 0, 0.5, 0.5, 1, 0, 2, 1, 5],
  },
  {
    label: "Step 2 · eliminate column 2",
    cells: [2, 1, -1, 8, 0, 0.5, 0.5, 1, 0, 0, -1, 1],
  },
  {
    label: "Step 3 · upper triangular",
    cells: [2, 1, -1, 8, 0, 0.5, 0.5, 1, 0, 0, -1, 1],
  },
];

let matrixStep = 0;

function cellColor(value) {
  const t = Math.max(-1, Math.min(1, value / 12));
  if (t >= 0) {
    const a = 0.12 + t * 0.55;
    return `rgba(61, 214, 165, ${a})`;
  }
  const a = 0.12 + Math.abs(t) * 0.45;
  return `rgba(232, 160, 122, ${a})`;
}

function renderMatrix(stepIndex) {
  const host = document.getElementById("matrix-viz");
  const label = document.getElementById("matrix-step-label");
  if (!host || !label) return;
  const step = matrixSteps[stepIndex];
  label.textContent = step.label;
  host.innerHTML = step.cells
    .map((v, i) => {
      const isB = i % 4 === 3;
      return `<div class="matrix-cell${isB ? " is-b" : ""}" style="background:${cellColor(v)};color:#e8f2ef">${Number.isInteger(v) ? v : v.toFixed(1)}</div>`;
    })
    .join("");
}

document.getElementById("matrix-next")?.addEventListener("click", () => {
  matrixStep = Math.min(matrixSteps.length - 1, matrixStep + 1);
  renderMatrix(matrixStep);
});

document.getElementById("matrix-prev")?.addEventListener("click", () => {
  matrixStep = Math.max(0, matrixStep - 1);
  renderMatrix(matrixStep);
});

renderMatrix(0);
