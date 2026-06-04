const SVG_NS = "http://www.w3.org/2000/svg";

const fallbackRagData = {
  hotelStyles: [
    {
      id: "bamboo_house",
      name: "竹管木框旅館",
      description: "木框固定竹管，呈現常見校園昆蟲旅館。",
      frameShape: "house",
      palette: { wood: "#9a6a3c", woodDark: "#68411f", roof: "#6b3f24", hole: "#3a2414", tube: "#d19a57" },
      holePattern: "bamboo_grid",
      caption: "造型參考：木框、斜屋頂、竹管巢材"
    }
  ],
  solitaryBees: [
    {
      id: "mason_bee",
      name: "泥蜂或壁蜂類",
      appearance: "深色身體、透明翅、會以泥土封口的獨居蜂概念。",
      colors: { head: "#10191b", thorax: "#1f3438", abdomen: "#29454a", stripe: "#6e8f93", wing: "#c7eef8", pollen: "#e4b54a" },
      preferredHoleSize: "small",
      defaultSeal: "mud",
      caption: "獨居蜂示意：單獨築巢、不形成大型蜂群"
    }
  ],
  nestMaterials: [
    { id: "pollen", name: "花粉團", color: "#f4c95d", description: "幼蟲食物。" },
    { id: "mud", name: "泥土封口", color: "#8a5b38", description: "封閉巢口。" }
  ],
  sceneEvents: [
    { id: "complete_lifecycle", name: "完整築巢到羽化", weight: 1, steps: ["飛來", "築巢", "封口", "羽化離巢"] }
  ]
};

const state = {
  data: fallbackRagData,
  playing: true,
  speed: 1,
  timers: [],
  animations: [],
  holes: [],
  currentHole: null,
  currentBee: null,
  currentHotel: null
};

const svg = document.getElementById("sceneSvg");
const layers = {
  plants: document.getElementById("plantsLayer"),
  hotel: document.getElementById("hotelLayer"),
  nest: document.getElementById("nestLayer"),
  bee: document.getElementById("beeLayer"),
  annotations: document.getElementById("annotationLayer"),
  time: document.getElementById("timeLayer")
};

const ui = {
  narration: document.getElementById("sceneNarration"),
  hotelName: document.getElementById("hotelName"),
  beeName: document.getElementById("beeName"),
  eventName: document.getElementById("eventName"),
  restartBtn: document.getElementById("restartBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  speedRange: document.getElementById("speedRange"),
  dataStatus: document.getElementById("dataStatus")
};

function el(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "text") {
      node.textContent = value;
    } else {
      node.setAttribute(key, value);
    }
  });
  children.forEach(child => node.appendChild(child));
  return node;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight ?? 1;
    if (roll <= 0) return item;
  }
  return items[0];
}

function delay(ms) {
  return new Promise(resolve => {
    const startedAt = performance.now();
    const target = ms / state.speed;
    function tick(now) {
      if (!state.playing) {
        const timer = window.setTimeout(() => tick(performance.now()), 120);
        state.timers.push(timer);
        return;
      }
      if (now - startedAt >= target) {
        resolve();
        return;
      }
      const timer = window.setTimeout(() => tick(performance.now()), 80);
      state.timers.push(timer);
    }
    tick(startedAt);
  });
}

async function animateNode(node, keyframes, options) {
  const animation = node.animate(keyframes, {
    fill: "forwards",
    easing: "ease-in-out",
    ...options,
    duration: (options.duration ?? 1000) / state.speed
  });
  state.animations.push(animation);
  await delay(options.duration ?? 1000);
}

function stopAll() {
  state.timers.forEach(timer => window.clearTimeout(timer));
  state.animations.forEach(animation => animation.cancel());
  state.timers = [];
  state.animations = [];
}

function setText(step, narration) {
  ui.eventName.textContent = step;
  ui.narration.textContent = narration;
}

async function loadRagData() {
  try {
    const response = await fetch("./data/insect-hotel-rag.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    ui.dataStatus.textContent = "資料來源：data/insect-hotel-rag.json";
    return data;
  } catch (error) {
    ui.dataStatus.textContent = "資料來源：內建 fallback。建議用本機伺服器開啟以讀取 JSON。";
    return fallbackRagData;
  }
}

function drawPlants() {
  clear(layers.plants);
  const plantGroup = el("g");
  const flowers = [
    [90, 590, "#e8705f"], [145, 610, "#f0b84b"], [1060, 570, "#d96fae"],
    [1135, 612, "#f0b84b"], [1185, 575, "#e8705f"], [1010, 622, "#ffffff"]
  ];
  flowers.forEach(([x, y, color], index) => {
    plantGroup.appendChild(el("path", {
      d: `M${x} ${y + 48} C${x - 8} ${y + 20}, ${x + 8} ${y + 18}, ${x} ${y}`,
      fill: "none",
      stroke: "#36744d",
      "stroke-width": 5,
      "stroke-linecap": "round"
    }));
    plantGroup.appendChild(el("ellipse", { cx: x - 9, cy: y + 22, rx: 13, ry: 7, fill: "#4f9a60", transform: `rotate(-32 ${x - 9} ${y + 22})` }));
    plantGroup.appendChild(el("ellipse", { cx: x + 11, cy: y + 31, rx: 13, ry: 7, fill: "#4f9a60", transform: `rotate(28 ${x + 11} ${y + 31})` }));
    for (let i = 0; i < 6; i += 1) {
      const angle = i * 60;
      plantGroup.appendChild(el("ellipse", {
        cx: x,
        cy: y,
        rx: 7,
        ry: 15,
        fill: color,
        opacity: ".92",
        transform: `rotate(${angle} ${x} ${y})`
      }));
    }
    plantGroup.appendChild(el("circle", { cx: x, cy: y, r: 6, fill: index % 2 ? "#6b3f24" : "#f6d36d" }));
  });
  layers.plants.appendChild(plantGroup);
}

function drawHotel(hotel) {
  clear(layers.hotel);
  clear(layers.nest);
  clear(layers.annotations);
  clear(layers.time);
  state.holes = [];

  const p = hotel.palette;
  const group = el("g", { id: "hotelGraphic" });
  const x = 530;
  const y = hotel.frameShape === "tall_house" ? 170 : 205;
  const width = hotel.frameShape === "block" ? 360 : 405;
  const height = hotel.frameShape === "tall_house" ? 430 : 365;

  if (hotel.frameShape !== "block") {
    group.appendChild(el("path", {
      d: `M${x - 42} ${y + 52} L${x + width / 2} ${y - 58} L${x + width + 42} ${y + 52} Z`,
      fill: p.roof,
      stroke: p.woodDark,
      "stroke-width": 12,
      "stroke-linejoin": "round"
    }));
  }

  group.appendChild(el("rect", {
    x, y, width, height,
    rx: hotel.frameShape === "block" ? 36 : 20,
    fill: p.wood,
    stroke: p.woodDark,
    "stroke-width": 14
  }));

  for (let i = 0; i < 9; i += 1) {
    const yy = y + 26 + i * (height / 9);
    group.appendChild(el("path", {
      d: `M${x + 20} ${yy} C${x + 98} ${yy - 12}, ${x + 190} ${yy + 14}, ${x + width - 22} ${yy - 2}`,
      fill: "none",
      stroke: i % 2 ? "rgba(255,255,255,.14)" : "rgba(70,36,14,.18)",
      "stroke-width": 4,
      "stroke-linecap": "round"
    }));
  }

  const cols = hotel.holePattern === "drilled_block" ? 5 : 6;
  const rows = hotel.holePattern === "mixed" ? 5 : 4;
  const startX = x + 58;
  const startY = y + 65;
  const gapX = (width - 116) / (cols - 1);
  const gapY = (height - 130) / (rows - 1);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = startX + col * gapX + (row % 2 ? 9 : 0);
      const cy = startY + row * gapY;
      const radius = hotel.holePattern === "mixed"
        ? [18, 23, 14, 20, 16, 24][(row + col) % 6]
        : hotel.holePattern === "drilled_block"
          ? [18, 24, 15, 21, 17][(row * cols + col) % 5]
          : 24;
      const hole = el("g", { class: "hole", "data-row": row, "data-col": col });
      if (hotel.holePattern === "bamboo_grid" || hotel.holePattern === "mixed") {
        hole.appendChild(el("circle", { cx, cy, r: radius + 8, fill: p.tube, stroke: p.woodDark, "stroke-width": 4 }));
      }
      hole.appendChild(el("circle", { cx, cy, r: radius, fill: p.hole }));
      hole.appendChild(el("circle", { cx: cx - radius * .3, cy: cy - radius * .28, r: Math.max(3, radius * .14), fill: "rgba(255,255,255,.2)" }));
      group.appendChild(hole);
      state.holes.push({ cx, cy, radius, group: hole, sealed: false });
    }
  }

  group.appendChild(el("rect", { x: x + 28, y: y + height - 26, width: width - 56, height: 22, rx: 11, fill: "rgba(63,35,18,.28)" }));
  layers.hotel.appendChild(group);

  const caption = el("g", { transform: "translate(525 640)" }, [
    el("rect", { x: 0, y: 0, width: 430, height: 46, rx: 23, fill: "rgba(255,250,240,.86)", stroke: "rgba(31,77,67,.22)" }),
    el("text", { x: 24, y: 30, fill: "#153b37", "font-size": 20, "font-weight": 800, text: hotel.caption })
  ]);
  layers.annotations.appendChild(caption);
}

function drawBee(bee) {
  clear(layers.bee);
  const c = bee.colors;
  const group = el("g", { id: "beeRig", transform: "translate(-245 210) scale(1)" });
  const bob = el("g", { class: "bee-bob" });

  bob.appendChild(el("ellipse", { class: "wing back", cx: 8, cy: -24, rx: 31, ry: 15, fill: c.wing, opacity: ".55", transform: "rotate(-27 8 -24)" }));
  bob.appendChild(el("ellipse", { class: "wing", cx: 50, cy: -22, rx: 34, ry: 16, fill: c.wing, opacity: ".68", transform: "rotate(22 50 -22)" }));
  bob.appendChild(el("ellipse", { cx: 8, cy: 0, rx: 23, ry: 21, fill: c.head }));
  bob.appendChild(el("ellipse", { cx: 45, cy: 2, rx: 31, ry: 25, fill: c.thorax }));
  bob.appendChild(el("ellipse", { cx: 91, cy: 6, rx: 41, ry: 27, fill: c.abdomen }));

  for (let i = 0; i < 3; i += 1) {
    bob.appendChild(el("path", {
      d: `M${73 + i * 18} -14 C${80 + i * 18} -2, ${80 + i * 18} 14, ${73 + i * 18} 25`,
      fill: "none",
      stroke: c.stripe,
      "stroke-width": 5,
      opacity: ".78"
    }));
  }

  bob.appendChild(el("circle", { cx: -4, cy: -5, r: 4, fill: "#f8fbfb" }));
  bob.appendChild(el("circle", { cx: -5, cy: -5, r: 2, fill: "#101010" }));
  bob.appendChild(el("path", { d: "M-14 -17 C-38 -38, -52 -38, -61 -46", fill: "none", stroke: c.head, "stroke-width": 4, "stroke-linecap": "round" }));
  bob.appendChild(el("path", { d: "M-8 -21 C-25 -48, -38 -54, -45 -65", fill: "none", stroke: c.head, "stroke-width": 4, "stroke-linecap": "round" }));

  [[32, 25], [55, 28], [83, 31]].forEach(([lx, ly]) => {
    bob.appendChild(el("path", { d: `M${lx} ${ly} C${lx - 8} ${ly + 20}, ${lx - 8} ${ly + 31}, ${lx - 19} ${ly + 42}`, fill: "none", stroke: "#201812", "stroke-width": 5, "stroke-linecap": "round" }));
  });

  bob.appendChild(el("circle", { id: "pollenLoad", cx: 52, cy: 32, r: 0, fill: c.pollen, opacity: ".95" }));
  group.appendChild(bob);
  layers.bee.appendChild(group);
  state.currentBee = group;
  return group;
}

function drawAnnotation(target, title, body) {
  clear(layers.annotations);
  const x = Math.min(target.cx + 58, 830);
  const y = Math.max(target.cy - 88, 64);
  const safeBody = body.length > 18 ? `${body.slice(0, 18)}...` : body;
  const group = el("g", { opacity: 0 });
  group.appendChild(el("path", {
    d: `M${target.cx + target.radius + 6} ${target.cy} C${target.cx + 70} ${target.cy - 28}, ${x - 32} ${y + 40}, ${x} ${y + 40}`,
    fill: "none",
    stroke: "#1b6d5b",
    "stroke-width": 4,
    "stroke-linecap": "round"
  }));
  group.appendChild(el("rect", { x, y, width: 310, height: 92, rx: 22, fill: "rgba(255,250,240,.94)", stroke: "rgba(31,77,67,.24)" }));
  group.appendChild(el("text", { x: x + 22, y: y + 34, fill: "#153b37", "font-size": 22, "font-weight": 900, text: title }));
  group.appendChild(el("text", { x: x + 22, y: y + 66, fill: "#5c6f68", "font-size": 17, text: safeBody }));
  layers.annotations.appendChild(group);
  animateNode(group, [{ opacity: 0 }, { opacity: 1 }], { duration: 350 });
}

function makeSeal(hole, sealType, materialData) {
  const color = materialData?.color ?? "#8a5b38";
  const seal = el("g", { class: "seal", opacity: 0 });
  if (sealType === "leaf") {
    for (let i = 0; i < 5; i += 1) {
      seal.appendChild(el("ellipse", {
        cx: hole.cx + (i - 2) * 7,
        cy: hole.cy + (i % 2 ? -4 : 5),
        rx: hole.radius * .45,
        ry: hole.radius * .23,
        fill: color,
        transform: `rotate(${i * 37 - 38} ${hole.cx + (i - 2) * 7} ${hole.cy})`
      }));
    }
  } else {
    seal.appendChild(el("circle", { cx: hole.cx, cy: hole.cy, r: hole.radius * .92, fill: color }));
    seal.appendChild(el("circle", { cx: hole.cx - 8, cy: hole.cy - 6, r: 4, fill: "rgba(255,255,255,.18)" }));
    seal.appendChild(el("circle", { cx: hole.cx + 9, cy: hole.cy + 7, r: 3, fill: "rgba(40,20,8,.2)" }));
  }
  layers.nest.appendChild(seal);
  return seal;
}

function makeNestCell(hole, index, color) {
  const cell = el("g", { opacity: 0 });
  const offset = index * 10;
  cell.appendChild(el("ellipse", { cx: hole.cx - offset, cy: hole.cy, rx: 8, ry: 13, fill: color, opacity: ".96" }));
  cell.appendChild(el("circle", { cx: hole.cx - offset + 2, cy: hole.cy - 2, r: 3, fill: "#fff4c7", opacity: ".85" }));
  layers.nest.appendChild(cell);
  return cell;
}

function showTimeLapse() {
  clear(layers.time);
  const group = el("g", { transform: "translate(170 120)", opacity: 0 });
  group.appendChild(el("circle", { class: "time-spin", cx: 0, cy: 0, r: 46, fill: "none", stroke: "#f0b84b", "stroke-width": 8, "stroke-dasharray": "44 18" }));
  group.appendChild(el("text", { x: 70, y: -8, fill: "#153b37", "font-size": 26, "font-weight": 900, text: "數週後" }));
  group.appendChild(el("text", { x: 70, y: 24, fill: "#5c6f68", "font-size": 18, text: "卵、幼蟲、繭在巢室中發育" }));
  layers.time.appendChild(group);
  return animateNode(group, [{ opacity: 0 }, { opacity: 1 }], { duration: 420 });
}

async function flyBeeTo(x, y, scale = 1, duration = 1800) {
  const bee = state.currentBee;
  if (!state.playing) {
    while (!state.playing) await delay(120);
  }
  await animateNode(bee, [
    { transform: bee.getAttribute("transform") || "translate(-245 210) scale(1)" },
    { transform: `translate(${x} ${y}) scale(${scale})` }
  ], { duration });
  bee.setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
}

async function inspectHoles(holes) {
  for (const hole of holes) {
    await flyBeeTo(hole.cx - 110, hole.cy - 28, .78, 800);
    const ring = el("circle", {
      class: "pulse",
      cx: hole.cx,
      cy: hole.cy,
      r: hole.radius + 15,
      fill: "none",
      stroke: "#f0b84b",
      "stroke-width": 5,
      opacity: ".5"
    });
    layers.nest.appendChild(ring);
    await delay(480);
    ring.remove();
  }
}

async function provisionNest(hole, bee, material) {
  const cells = [];
  for (let trip = 0; trip < 4; trip += 1) {
    setText("搬運食物", `${bee.name}多次往返，帶回花粉或巢材。這裡用概念動畫表示巢室逐漸被準備好。`);
    document.getElementById("pollenLoad")?.setAttribute("r", trip % 2 === 0 ? 9 : 0);
    await flyBeeTo(245 + Math.random() * 80, 230 + Math.random() * 90, .74, 900);
    await flyBeeTo(hole.cx - 96, hole.cy - 26, .74, 900);
    document.getElementById("pollenLoad")?.setAttribute("r", 0);
    const cell = makeNestCell(hole, trip, material.color);
    cells.push(cell);
    await animateNode(cell, [{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(1)" }], { duration: 360 });
  }
  return cells;
}

async function sealAndEmerge(hole, bee, sealType) {
  const material = state.data.nestMaterials.find(item => item.id === sealType) || state.data.nestMaterials.find(item => item.id === "mud");
  setText("封口", `${material.name}出現，代表雌蜂完成一段巢室後封閉洞口。`);
  await flyBeeTo(hole.cx - 105, hole.cy - 32, .76, 700);
  const seal = makeSeal(hole, sealType, material);
  await animateNode(seal, [{ opacity: 0, transform: "scale(.35)" }, { opacity: 1, transform: "scale(1)" }], { duration: 700 });
  hole.sealed = true;
  drawAnnotation(hole, material.name, material.description);
  await flyBeeTo(1120, 170, .62, 1600);
  await showTimeLapse();
  await delay(1450);

  setText("羽化離巢", "新成蜂咬開封口，從巢管中爬出並飛離。這是成果展示用的簡化生命週期動畫。");
  clear(layers.annotations);
  const cracks = el("g", { opacity: 0 });
  cracks.appendChild(el("path", { d: `M${hole.cx - 10} ${hole.cy - 15} L${hole.cx + 2} ${hole.cy - 3} L${hole.cx - 3} ${hole.cy + 11} L${hole.cx + 12} ${hole.cy + 18}`, fill: "none", stroke: "#2c190e", "stroke-width": 4, "stroke-linecap": "round" }));
  layers.nest.appendChild(cracks);
  await animateNode(cracks, [{ opacity: 0 }, { opacity: 1 }], { duration: 450 });
  await animateNode(seal, [{ opacity: 1 }, { opacity: .16 }], { duration: 650 });
  const newBee = drawBee(bee);
  newBee.setAttribute("transform", `translate(${hole.cx - 55} ${hole.cy - 10}) scale(.5)`);
  await flyBeeTo(hole.cx - 118, hole.cy - 58, .62, 700);
  await flyBeeTo(1390, 120, .76, 1900);
}

async function playCycle() {
  stopAll();
  clear(layers.nest);
  clear(layers.annotations);
  clear(layers.time);

  const hotel = pick(state.data.hotelStyles);
  const bee = pick(state.data.solitaryBees);
  const event = weightedPick(state.data.sceneEvents);
  const material = pick(state.data.nestMaterials.filter(item => item.id === "pollen" || item.id === bee.defaultSeal || item.id === "mixed"));

  state.currentHotel = hotel;
  ui.hotelName.textContent = hotel.name;
  ui.beeName.textContent = bee.name;
  ui.eventName.textContent = event.name;

  drawPlants();
  drawHotel(hotel);
  drawBee(bee);

  const targetCandidates = state.holes.filter(hole => {
    if (bee.preferredHoleSize === "small") return hole.radius <= 19;
    if (bee.preferredHoleSize === "medium") return hole.radius >= 17 && hole.radius <= 24;
    return true;
  });
  const target = pick(targetCandidates.length ? targetCandidates : state.holes);
  state.currentHole = target;

  setText("飛來", `${bee.name}飛向${hotel.name}。${bee.caption}`);
  await flyBeeTo(250, 220, .8, 1600);
  await delay(350);

  const inspectList = [pick(state.holes), pick(state.holes), target].filter(Boolean);
  setText("探查洞口", "獨居蜂會在洞口附近短暫停留，尋找合適的管徑與位置。");
  await inspectHoles(inspectList);

  if (event.id === "inspect_and_leave") {
    setText("環境不合適", "這一輪隨機事件是探查後離開，表示不是每次來訪都會築巢。");
    drawAnnotation(target, "未築巢", "短暫探查也是可記錄的觀察事件。");
    await delay(850);
    await flyBeeTo(1380, 235, .76, 1800);
    await delay(900);
    if (state.playing) playCycle();
    return;
  }

  setText("產卵築巢", `${bee.name}選定洞口，開始準備巢室。動畫以花粉團、卵與巢室色塊簡化呈現。`);
  drawAnnotation(target, "選定洞口", "展示簡化，現場不拆巢。");
  await provisionNest(target, bee, material);
  await sealAndEmerge(target, bee, bee.defaultSeal);

  await delay(900);
  if (state.playing) playCycle();
}

ui.restartBtn.addEventListener("click", () => {
  state.playing = true;
  ui.pauseBtn.textContent = "暫停";
  playCycle();
});

ui.pauseBtn.addEventListener("click", () => {
  state.playing = !state.playing;
  ui.pauseBtn.textContent = state.playing ? "暫停" : "繼續";
  state.animations.forEach(animation => {
    if (state.playing) animation.play();
    else animation.pause();
  });
  if (state.playing && state.animations.every(animation => animation.playState === "finished")) {
    playCycle();
  }
});

ui.speedRange.addEventListener("input", event => {
  state.speed = Number(event.target.value);
});

loadRagData().then(data => {
  state.data = data;
  playCycle();
});
