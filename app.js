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
    },
    {
      id: "log_block",
      name: "鑽孔木塊旅館",
      description: "以木塊鑽孔呈現不同孔徑，外觀接近枯木或自然巢材。",
      frameShape: "block",
      palette: { wood: "#7d522e", woodDark: "#4b2d19", roof: "#8b5a30", hole: "#22120a", tube: "#b9834f" },
      holePattern: "drilled_block",
      caption: "造型參考：厚木塊、鑽孔、自然木紋"
    }
  ],
  solitaryBees: [
    {
      id: "leafcutter_bee",
      name: "切葉蜂類",
      appearance: "常以葉片或植物碎片分隔巢室的蜂類概念。",
      colors: { head: "#1d1915", thorax: "#33251c", abdomen: "#5b4630", stripe: "#c49a62", wing: "#c9eef5", pollen: "#f2c14e" },
      preferredHoleSize: "medium",
      defaultSeal: "leaf",
      caption: "切葉蜂類示意：葉片材料、攜粉行為"
    },
    {
      id: "carpenter_bee",
      name: "木蜂類",
      appearance: "利用木質孔洞或木材隧道築巢的蜂類概念。",
      colors: { head: "#121212", thorax: "#171f23", abdomen: "#20282c", stripe: "#7f8c5a", wing: "#c7eef8", pollen: "#e4b54a" },
      preferredHoleSize: "large",
      defaultSeal: "wood_fiber",
      caption: "木蜂類示意：偏好木質孔洞或木材隧道"
    },
    {
      id: "reed_bee",
      name: "蘆蜂",
      appearance: "利用中空莖或枯枝髓心築巢的蜂類概念。",
      colors: { head: "#1b211c", thorax: "#26372b", abdomen: "#314a35", stripe: "#8fb06a", wing: "#d6f6fb", pollen: "#efc95a" },
      preferredHoleSize: "small",
      defaultSeal: "pith",
      caption: "蘆蜂示意：利用中空莖與細孔巢材築巢"
    },
    {
      id: "potter_wasp",
      name: "泥壺蜂",
      appearance: "以泥土築成壺狀或泥室構造的蜂類近親概念。",
      colors: { head: "#21150e", thorax: "#3d2a1a", abdomen: "#1f1b16", stripe: "#9b7442", wing: "#d8f5fb", pollen: "#f0c95a" },
      preferredHoleSize: "medium",
      defaultSeal: "mud",
      caption: "泥壺蜂示意：利用泥土築巢或封閉巢室"
    }
  ],
  nestMaterials: [
    { id: "pollen", name: "花粉團", color: "#f4c95d", description: "幼蟲食物。" },
    { id: "leaf", name: "葉片封口", color: "#5ca66b", description: "葉片材料。" },
    { id: "mud", name: "泥土封口", color: "#8a5b38", description: "封閉巢口。" },
    { id: "wood_fiber", name: "木屑隔間", color: "#b98952", description: "木質材料。" },
    { id: "pith", name: "莖髓隔間", color: "#c9b36d", description: "中空莖材料。" }
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
  monthIndex: 4,
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
  speedRange: document.getElementById("speedRange")
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
    return await response.json();
  } catch (error) {
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

function getSeasonActivity(month) {
  if (month >= 5 && month <= 8) return { level: "high", active: 5, sealed: 8, nesting: 5, label: "夏季高峰：頻繁入住、搬運與封口" };
  if (month >= 3 && month <= 4) return { level: "rising", active: 3, sealed: 3, nesting: 3, label: "春季甦醒：開始探查與築巢" };
  if (month >= 9 && month <= 10) return { level: "late", active: 2, sealed: 6, nesting: 2, label: "秋季後段：封口巢室變多" };
  return { level: "quiet", active: 1, sealed: 4, nesting: 1, label: "低活動期：多數巢室安靜等待" };
}

function drawMonthTimeline(month, activity) {
  clear(layers.time);
  const group = el("g", { transform: "translate(132 42)" });
  group.appendChild(el("rect", { x: 0, y: 0, width: 1048, height: 72, rx: 26, fill: "rgba(255,250,240,.74)", stroke: "rgba(31,77,67,.18)" }));
  group.appendChild(el("text", { x: 26, y: 29, fill: "#153b37", "font-size": 17, "font-weight": 900, text: "1-12 月入住情況" }));
  group.appendChild(el("text", { x: 26, y: 55, fill: "#5c6f68", "font-size": 15, text: activity.label }));

  for (let i = 1; i <= 12; i += 1) {
    const x = 220 + (i - 1) * 73;
    const summer = i >= 5 && i <= 8;
    const height = summer ? 34 : i >= 3 && i <= 10 ? 23 : 13;
    group.appendChild(el("line", { x1: x, y1: 50, x2: x, y2: 50 - height, stroke: summer ? "#f0b84b" : "#6aa97b", "stroke-width": 9, "stroke-linecap": "round", opacity: i === month ? "1" : ".48" }));
    group.appendChild(el("text", { x, y: 63, "text-anchor": "middle", fill: i === month ? "#153b37" : "#6b7d76", "font-size": 13, "font-weight": i === month ? 900 : 700, text: `${i}` }));
    if (i === month) {
      group.appendChild(el("circle", { cx: x, cy: 16, r: 15, fill: "#2f7c5d", opacity: ".95" }));
      group.appendChild(el("text", { x, y: 21, "text-anchor": "middle", fill: "#fffaf0", "font-size": 14, "font-weight": 900, text: `${i}` }));
    }
  }
  layers.time.appendChild(group);
}

function drawHotel(hotel, layout, index) {
  const p = hotel.palette;
  const group = el("g", { class: "hotel-graphic", "data-hotel": hotel.id });
  const x = layout.x;
  const y = layout.y;
  const width = layout.width;
  const height = layout.height;

  if (hotel.frameShape !== "block") {
    group.appendChild(el("path", {
      d: `M${x - 34} ${y + 45} L${x + width / 2} ${y - 50} L${x + width + 34} ${y + 45} Z`,
      fill: p.roof,
      stroke: p.woodDark,
      "stroke-width": 10,
      "stroke-linejoin": "round"
    }));
  }

  group.appendChild(el("rect", {
    x, y, width, height,
    rx: hotel.frameShape === "block" ? 34 : 19,
    fill: p.wood,
    stroke: p.woodDark,
    "stroke-width": 12
  }));

  for (let i = 0; i < 8; i += 1) {
    const yy = y + 22 + i * (height / 8);
    group.appendChild(el("path", {
      d: `M${x + 18} ${yy} C${x + 80} ${yy - 10}, ${x + 154} ${yy + 12}, ${x + width - 20} ${yy - 2}`,
      fill: "none",
      stroke: i % 2 ? "rgba(255,255,255,.13)" : "rgba(70,36,14,.18)",
      "stroke-width": 3.5,
      "stroke-linecap": "round"
    }));
  }

  const cols = hotel.holePattern === "drilled_block" ? 5 : 6;
  const rows = hotel.holePattern === "mixed" ? 5 : 4;
  const startX = x + 48;
  const startY = y + 58;
  const gapX = (width - 96) / (cols - 1);
  const gapY = (height - 116) / (rows - 1);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = startX + col * gapX + (row % 2 ? 7 : 0);
      const cy = startY + row * gapY;
      const radius = hotel.holePattern === "mixed"
        ? [15, 20, 12, 18, 14, 21][(row + col) % 6]
        : hotel.holePattern === "drilled_block"
          ? [16, 22, 13, 19, 15][(row * cols + col) % 5]
          : 20;
      const hole = el("g", { class: "hole", "data-row": row, "data-col": col, "data-hotel": hotel.id });
      if (hotel.holePattern === "bamboo_grid" || hotel.holePattern === "mixed") {
        hole.appendChild(el("circle", { cx, cy, r: radius + 7, fill: p.tube, stroke: p.woodDark, "stroke-width": 3.5 }));
      }
      hole.appendChild(el("circle", { cx, cy, r: radius, fill: p.hole }));
      hole.appendChild(el("circle", { cx: cx - radius * .3, cy: cy - radius * .28, r: Math.max(3, radius * .14), fill: "rgba(255,255,255,.2)" }));
      group.appendChild(hole);
      state.holes.push({ cx, cy, radius, group: hole, sealed: false, hotel, hotelIndex: index });
    }
  }

  group.appendChild(el("rect", { x: x + 24, y: y + height - 24, width: width - 48, height: 19, rx: 10, fill: "rgba(63,35,18,.28)" }));
  group.appendChild(el("text", { x: x + width / 2, y: y + height + 38, "text-anchor": "middle", fill: "#153b37", "font-size": 19, "font-weight": 900, text: hotel.name }));
  group.appendChild(el("text", { x: x + width / 2, y: y + height + 62, "text-anchor": "middle", fill: "#5c6f68", "font-size": 14, text: hotel.caption.replace("造型參考：", "") }));
  layers.hotel.appendChild(group);
}

function drawHotels(hotels) {
  clear(layers.hotel);
  clear(layers.nest);
  clear(layers.annotations);
  state.holes = [];
  const layouts = [
    { x: 350, y: 194, width: 330, height: 328 },
    { x: 790, y: 226, width: 340, height: 292 }
  ];
  hotels.slice(0, 2).forEach((hotel, index) => drawHotel(hotel, layouts[index], index));
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

function markNestState(hole, bee, status, visibleCells = 2) {
  const material = state.data.nestMaterials.find(item => item.id === bee.defaultSeal) || state.data.nestMaterials.find(item => item.id === "mud");
  const pollen = state.data.nestMaterials.find(item => item.id === "pollen") || material;
  const cellGroup = el("g", { class: `nest-state ${status}` });
  for (let i = 0; i < visibleCells; i += 1) {
    const offset = i * 9;
    cellGroup.appendChild(el("ellipse", { cx: hole.cx - offset, cy: hole.cy + (i % 2 ? 5 : -3), rx: 6.5, ry: 10.5, fill: i % 2 ? material.color : pollen.color, opacity: ".82" }));
    cellGroup.appendChild(el("circle", { cx: hole.cx - offset + 2, cy: hole.cy - 1, r: 2.4, fill: "#fff4c7", opacity: ".78" }));
  }
  layers.nest.appendChild(cellGroup);

  if (status === "sealed" || status === "emerging") {
    const seal = makeSeal(hole, bee.defaultSeal, material);
    seal.setAttribute("opacity", status === "sealed" ? ".86" : ".72");
    hole.sealed = true;
    hole.sealNode = seal;
    if (status === "emerging") {
      const cracks = makeCracks(hole);
      cracks.setAttribute("opacity", ".85");
    }
  }
}

function makeCracks(hole) {
  const cracks = el("g", { class: "cracks", opacity: 0 });
  cracks.appendChild(el("path", { d: `M${hole.cx - 10} ${hole.cy - 15} L${hole.cx + 2} ${hole.cy - 3} L${hole.cx - 3} ${hole.cy + 11} L${hole.cx + 12} ${hole.cy + 18}`, fill: "none", stroke: "#2c190e", "stroke-width": 4, "stroke-linecap": "round" }));
  layers.nest.appendChild(cracks);
  return cracks;
}

function seedNestStates(activity) {
  const bees = state.data.solitaryBees;
  const shuffled = [...state.holes].sort(() => Math.random() - .5);
  let cursor = 0;
  for (let i = 0; i < activity.sealed && cursor < shuffled.length; i += 1, cursor += 1) {
    markNestState(shuffled[cursor], pick(bees), i % 5 === 0 ? "emerging" : "sealed", 1 + (i % 3));
  }
  for (let i = 0; i < activity.nesting && cursor < shuffled.length; i += 1, cursor += 1) {
    markNestState(shuffled[cursor], pick(bees), "nesting", 1 + (i % 3));
  }
}

function drawBusyBees(activity) {
  const group = el("g", { class: "busy-bees", opacity: activity.level === "quiet" ? ".38" : ".76" });
  const count = activity.active;
  for (let i = 0; i < count; i += 1) {
    const bee = pick(state.data.solitaryBees);
    const c = bee.colors;
    const startX = 120 + i * 170;
    const y = 145 + (i % 3) * 54;
    const mini = el("g", { transform: `translate(${startX} ${y}) scale(.25)` });
    mini.appendChild(el("ellipse", { cx: 42, cy: -18, rx: 28, ry: 13, fill: c.wing, opacity: ".55" }));
    mini.appendChild(el("ellipse", { cx: 8, cy: 0, rx: 20, ry: 18, fill: c.head }));
    mini.appendChild(el("ellipse", { cx: 42, cy: 2, rx: 28, ry: 22, fill: c.thorax }));
    mini.appendChild(el("ellipse", { cx: 84, cy: 5, rx: 36, ry: 23, fill: c.abdomen }));
    mini.appendChild(el("path", { d: "M-12 -16 C-32 -34, -42 -36, -52 -44", fill: "none", stroke: c.head, "stroke-width": 4, "stroke-linecap": "round" }));
    mini.appendChild(el("circle", { cx: 44, cy: 30, r: 8, fill: c.pollen, opacity: i % 2 ? "0" : ".9" }));
    group.appendChild(mini);
    animateNode(mini, [
      { transform: `translate(${startX} ${y}) scale(.25)` },
      { transform: `translate(${startX + 120 + Math.random() * 60} ${y + (i % 2 ? 32 : -28)}) scale(.25)` },
      { transform: `translate(${startX + 250 + Math.random() * 80} ${y + (i % 3 - 1) * 36}) scale(.25)` }
    ], { duration: 3800 + i * 360 });
  }
  layers.bee.appendChild(group);
}

function showTimeLapse() {
  const group = el("g", { transform: "translate(920 128)", opacity: 0 });
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
  const cracks = makeCracks(hole);
  await animateNode(cracks, [{ opacity: 0 }, { opacity: .45 }, { opacity: 1 }], { duration: 900 });
  await animateNode(seal, [{ opacity: 1 }, { opacity: .55 }, { opacity: .16 }], { duration: 1200 });
  const newBee = drawBee(bee);
  newBee.setAttribute("transform", `translate(${hole.cx - 55} ${hole.cy - 10}) scale(.5)`);
  await flyBeeTo(hole.cx - 118, hole.cy - 58, .62, 700);
  await flyBeeTo(1390, 120, .76, 1900);
}

async function emergeFromExistingSeal(hole, bee) {
  if (!hole?.sealNode) return;
  setText("舊巢破口", `當月也可能看到先前已封口的巢室慢慢破口，新的${bee.name}從管內離開。`);
  drawAnnotation(hole, "已封口巢室", "不是每個洞口都同一天完成，有些正在等待羽化。");
  await delay(650);
  const cracks = makeCracks(hole);
  await animateNode(cracks, [{ opacity: 0 }, { opacity: .4 }, { opacity: 1 }], { duration: 1100 });
  await animateNode(hole.sealNode, [{ opacity: .86 }, { opacity: .52 }, { opacity: .2 }], { duration: 1300 });
  const emerged = drawBee(bee);
  emerged.setAttribute("transform", `translate(${hole.cx - 58} ${hole.cy - 10}) scale(.48)`);
  await flyBeeTo(hole.cx - 118, hole.cy - 58, .58, 650);
  await flyBeeTo(1390, 130 + Math.random() * 120, .68, 1500);
}

async function playCycle() {
  stopAll();
  state.monthIndex = (state.monthIndex % 12) + 1;
  const month = state.monthIndex;
  const activity = getSeasonActivity(month);

  clear(layers.nest);
  clear(layers.annotations);
  clear(layers.bee);

  const hotels = state.data.hotelStyles.length >= 2 ? state.data.hotelStyles.slice(0, 2) : [state.data.hotelStyles[0], state.data.hotelStyles[0]];
  const bee = pick(state.data.solitaryBees);
  const event = weightedPick(state.data.sceneEvents);
  const material = pick(state.data.nestMaterials.filter(item => item.id === "pollen" || item.id === bee.defaultSeal || item.id === "mixed"));

  state.currentHotel = hotels[0];
  ui.hotelName.textContent = hotels.map(item => item.name).join(" + ");
  ui.beeName.textContent = bee.name;
  ui.eventName.textContent = `${month}月｜${event.name}`;

  drawPlants();
  drawMonthTimeline(month, activity);
  drawHotels(hotels);
  drawBee(bee);
  seedNestStates(activity);
  drawBusyBees(activity);

  const targetCandidates = state.holes.filter(hole => !hole.sealed).filter(hole => {
    if (bee.preferredHoleSize === "small") return hole.radius <= 19;
    if (bee.preferredHoleSize === "medium") return hole.radius >= 17 && hole.radius <= 24;
    if (bee.preferredHoleSize === "large") return hole.radius >= 22;
    return true;
  });
  const target = pick(targetCandidates.length ? targetCandidates : state.holes);
  state.currentHole = target;

  setText("飛來", `${month}月的${activity.label}。${bee.name}飛向${target.hotel.name}，${bee.caption}`);
  await flyBeeTo(250, 220, .8, 1600);
  await delay(350);

  const inspectList = [pick(state.holes), pick(state.holes), target].filter(Boolean);
  setText("探查洞口", "獨居蜂會在洞口附近短暫停留，尋找合適的管徑與位置。");
  await inspectHoles(inspectList);

  const emergingCandidates = state.holes.filter(hole => hole.sealed && hole.sealNode);
  if (emergingCandidates.length && month >= 5 && Math.random() > .35) {
    await emergeFromExistingSeal(pick(emergingCandidates), pick(state.data.solitaryBees));
    drawBee(bee);
  }

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
