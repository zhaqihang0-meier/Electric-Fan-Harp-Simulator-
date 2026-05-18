/**
 * 风扇琴 Fan Synthesizer 模拟器
 * 核心公式: f (Hz) = N (孔数) × RPM / 60
 */

const A4 = 440;
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** 你的八轨同心圆设计 */
const FAN_RINGS = [
  { ring: 1, holes: 18, designNote: "G3" },
  { ring: 2, holes: 24, designNote: "C4" },
  { ring: 3, holes: 27, designNote: "D5" },
  { ring: 4, holes: 30, designNote: "E5" },
  { ring: 5, holes: 32, designNote: "F5" },
  { ring: 6, holes: 36, designNote: "G5" },
  { ring: 7, holes: 40, designNote: "A5" },
  { ring: 8, holes: 48, designNote: "C6" },
];

function defaultRingHoles() {
  return FAN_RINGS.map((r) => r.holes);
}

const DEFAULT_SETTINGS = {
  rpm: 654,
  voltage: 220,
  linkVoltage: true,
  holeShape: "circle",
  tangentialSpan: 50,
  radialSpan: 40,
  circleSize: 35,
  presetLow: 520,
  presetMid: 654,
  presetHigh: 820,
  vMin: 160,
  vMax: 240,
  rpmAtVMin: 400,
  rpmAtVMax: 900,
};

const state = {
  ringHoles: defaultRingHoles(),
  holes: 18,
  rpm: 654,
  voltage: 220,
  linkVoltage: true,
  selectedRing: 0,
  animAngle: 0,
  lastFrame: 0,
  holeShape: "circle",
  tangentialSpan: 50,
  radialSpan: 40,
  circleSize: 35,
  harpHover: -1,
  harpFlashRing: -1,
  harpFlashUntil: 0,
  harpPlayMode: "sustain",
  harpStrumTrail: [],
  masterOn: false,
};

let audioCtx = null;
let masterGain = null;
let harpBus = null;
const MASTER_GAIN_ON = 0.7;
/** @type {Map<number, { osc: OscillatorNode, g: GainNode, latched: boolean }>} */
const harpVoices = new Map();
/** @type {Set<OscillatorNode>} */
const activePlucks = new Set();
/** @type {Map<number, number>} pointerId → ringIndex */
const harpPointers = new Map();

const HARP_LAYOUT = {
  cx: 36,
  arcStart: -0.72,
  arcEnd: 0.72,
  innerR: 24,
  outerR: 158,
  stroke: 14,
};

// —— 音乐理论 ——

function noteToFreq(noteStr) {
  const m = noteStr.trim().match(/^([A-Ga-g])(#{1,2}|b{1,2})?(-?\d+)$/);
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const octave = parseInt(m[3], 10);
  let semi = NOTE_NAMES.indexOf(letter);
  if (semi < 0) return null;
  const acc = m[2] || "";
  if (acc.includes("#")) semi += acc.length;
  if (acc.toLowerCase().includes("b")) semi -= acc.length;
  const midi = (octave + 1) * 12 + semi;
  return A4 * Math.pow(2, (midi - 69) / 12);
}

function freqToNote(freq) {
  if (!freq || freq <= 0) return { name: "—", cents: 0, midi: 0 };
  const midi = 69 + 12 * Math.log2(freq / A4);
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return { name: `${name}${octave}`, cents, midi: rounded };
}

function buildNoteOptions() {
  const notes = [];
  for (let o = 2; o <= 7; o++) {
    for (const n of NOTE_NAMES) {
      notes.push(`${n}${o}`);
    }
  }
  return notes;
}

// —— 物理公式 ——

function freqFromHolesAndRpm(holes, rpm) {
  return (holes * rpm) / 60;
}

function rpmForTargetFreq(holes, targetFreq) {
  if (!holes || !targetFreq) return 0;
  return (targetFreq * 60) / holes;
}

function holesForTargetFreq(rpm, targetFreq) {
  if (!rpm || !targetFreq) return 0;
  return Math.round((targetFreq * 60) / rpm);
}

function voltageToRpm(v, vMin, vMax, rpmMin, rpmMax) {
  const t = (v - vMin) / (vMax - vMin);
  const clamped = Math.max(0, Math.min(1, t));
  return rpmMin + clamped * (rpmMax - rpmMin);
}

/** 相邻孔中心角间距（弧度） */
function holeSpacingRad(holes) {
  return (Math.PI * 2) / Math.max(1, holes);
}

/**
 * 由孔形与形变参数计算：角向开孔宽度、占空比、高电平时间
 * 占空比 D = 开孔角宽 / 孔间距角宽 → 方波高电平占比 → 谐波结构（音色）
 */
function getPulseGeometry(holes = state.holes) {
  const spacing = holeSpacingRad(holes);
  let angularWidth;

  if (state.holeShape === "circle") {
    const d = state.circleSize / 100;
    angularWidth = spacing * d * 0.95;
  } else if (state.holeShape === "slot") {
    angularWidth = spacing * (state.tangentialSpan / 100) * 0.95;
  } else {
    angularWidth = spacing * (state.tangentialSpan / 100) * 0.95;
  }

  angularWidth = Math.max(spacing * 0.03, Math.min(spacing * 0.92, angularWidth));
  const duty = angularWidth / spacing;
  return {
    angularWidth,
    spacing,
    duty,
    radialFrac: state.radialSpan / 100,
  };
}

function pulseWidthMs(freq, duty) {
  if (!freq || freq <= 0) return 0;
  return (duty / freq) * 1000;
}

function isPickOpen(animAngle, holes, angularWidth) {
  const spacing = holeSpacingRad(holes);
  const pickAngle = 0;
  for (let i = 0; i < holes; i++) {
    const center = i * spacing + animAngle;
    let da = pickAngle - center;
    da = ((da + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (Math.abs(da) < angularWidth / 2) return true;
  }
  return false;
}

function pulseWaveAt(phase01, duty) {
  const p = phase01 % 1;
  return p < duty ? 1 : -1;
}

function harmonicAmplitudes(duty, count = 24) {
  const amps = [];
  for (let n = 1; n <= count; n++) {
    amps.push((2 / (n * Math.PI)) * Math.abs(Math.sin(n * Math.PI * duty)));
  }
  return amps;
}

function timbreLabel(duty) {
  if (duty < 0.2) return t("timbre.veryNarrow");
  if (duty < 0.38) return t("timbre.narrow");
  if (duty <= 0.62) return t("timbre.square");
  if (duty < 0.8) return t("timbre.wide");
  return t("timbre.ring");
}

// —— DOM ——

const $ = (id) => document.getElementById(id);

function getInputs() {
  return {
    vMin: parseFloat($("vMin").value) || 160,
    vMax: parseFloat($("vMax").value) || 240,
    rpmAtVMin: parseFloat($("rpmAtVMin").value) || 400,
    rpmAtVMax: parseFloat($("rpmAtVMax").value) || 900,
  };
}

function getRingHoles(ringIndex) {
  return state.ringHoles[ringIndex] ?? FAN_RINGS[ringIndex].holes;
}

function saveCurrentRingHoles() {
  state.ringHoles[state.selectedRing] = state.holes;
}

function syncHoles(v, persistToRing = true) {
  state.holes = Math.max(1, Math.min(200, v));
  $("holes").value = state.holes;
  $("holesNum").value = state.holes;
  $("holesVal").textContent = state.holes;
  if (persistToRing) saveCurrentRingHoles();
}

function syncRpm(v) {
  state.rpm = Math.max(0, v);
  $("rpm").value = Math.min(1500, state.rpm);
  $("rpmNum").value = Math.round(state.rpm);
  $("rpmVal").textContent = Math.round(state.rpm);
  $("rpmBadge").textContent = `${Math.round(state.rpm)} RPM`;
}

function updateUI(options = {}) {
  const freq = freqFromHolesAndRpm(state.holes, state.rpm);
  const note = freqToNote(freq);
  const ring = FAN_RINGS[state.selectedRing];
  const designFreq = ring ? noteToFreq(ring.designNote) : null;
  const designCents =
    designFreq && freq > 0
      ? Math.round(1200 * Math.log2(freq / designFreq))
      : null;

  $("formulaLive").textContent = `${freq.toFixed(2)} Hz`;
  $("freqHz").textContent = `${freq.toFixed(2)} Hz`;
  $("noteName").textContent = note.name;
  $("centsOff").textContent =
    note.name === "—" ? "—" : `${note.cents >= 0 ? "+" : ""}${note.cents} ¢`;
  $("pulsesPerSec").textContent = freq > 0 ? freq.toFixed(1) : "—";

  const geo = getPulseGeometry();
  $("dutyPct").textContent = `${(geo.duty * 100).toFixed(1)} %`;
  $("pulseWidthMs").textContent =
    freq > 0 ? `${pulseWidthMs(freq, geo.duty).toFixed(3)} ms` : "—";
  $("shapeNote").textContent = timbreLabel(geo.duty);

  if (designCents !== null && ring) {
    $("centsOff").textContent += t("centsRel", {
      note: ring.designNote,
      cents: `${designCents >= 0 ? "+" : ""}${designCents}`,
    });
  }

  updateCalcPanel(freq);
  updateRingsTable(freq);
  drawHeatmap();
  updateShapeParamVisibility();
  drawHarp();
}

function updateCalcPanel(currentFreq) {
  const target = $("targetNote").value;
  const targetFreq = noteToFreq(target);
  const holesNeeded = holesForTargetFreq(state.rpm, targetFreq);
  const rpmAtCurrentHoles = rpmForTargetFreq(state.holes, targetFreq);
  const centsDiff = targetFreq
    ? Math.round(1200 * Math.log2(currentFreq / targetFreq))
    : 0;

  $("calcResults").innerHTML = [
    `<div>${t("calc.target", { note: target, freq: targetFreq.toFixed(2) })}</div>`,
    `<div>${t("calc.rpmNeed", { holes: state.holes, rpm: rpmAtCurrentHoles.toFixed(1) })}</div>`,
    `<div>${t("calc.holesNeed", { rpm: Math.round(state.rpm), holes: holesNeeded })}</div>`,
    `<div>${t("calc.current", { freq: currentFreq.toFixed(2), note: freqToNote(currentFreq).name, cents: centsDiff })}</div>`,
  ].join("");
}

function updateRingsTable() {
  const tbody = $("ringsBody");
  tbody.innerHTML = "";
  FAN_RINGS.forEach((r, i) => {
    const designFreq = noteToFreq(r.designNote);
    const holes = getRingHoles(i);
    const currentFreq = freqFromHolesAndRpm(holes, state.rpm);
    const needRpm = rpmForTargetFreq(holes, designFreq);
    const cents =
      designFreq > 0 && currentFreq > 0
        ? Math.round(1200 * Math.log2(currentFreq / designFreq))
        : 0;
    const tr = document.createElement("tr");
    if (i === state.selectedRing) tr.className = "active-ring";
    tr.innerHTML = `
      <td>${t("tableTrack", { ring: r.ring })}</td>
      <td>${holes}</td>
      <td>${r.designNote}</td>
      <td>${designFreq.toFixed(2)} Hz</td>
      <td>${currentFreq.toFixed(2)} Hz</td>
      <td>${needRpm.toFixed(1)}</td>
      <td>${cents >= 0 ? "+" : ""}${cents}</td>
    `;
    tr.style.cursor = "pointer";
    tr.addEventListener("click", () => selectRing(i));
    tbody.appendChild(tr);
  });
}

function refreshRingSelectOptions() {
  const ringSelect = $("ringSelect");
  if (!ringSelect) return;
  const val = ringSelect.value;
  ringSelect.innerHTML = "";
  FAN_RINGS.forEach((r, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    const holes = getRingHoles(i);
    const needRpm = rpmForTargetFreq(holes, noteToFreq(r.designNote));
    opt.textContent = t("ringOpt", {
      ring: r.ring,
      holes,
      note: r.designNote,
      rpm: needRpm.toFixed(0),
    });
    ringSelect.appendChild(opt);
  });
  ringSelect.value = val || "0";
}

function selectRing(index, fromHarp = false) {
  saveCurrentRingHoles();
  state.selectedRing = index;
  syncHoles(getRingHoles(index), false);
  const opt = $("ringSelect");
  opt.value = String(index);
  updateUI();
  if (fromHarp) drawHarp();
}

function resetAllDefaults() {
  releaseAllHarpVoices();
  state.ringHoles = defaultRingHoles();
  state.selectedRing = 0;
  state.rpm = DEFAULT_SETTINGS.rpm;
  state.voltage = DEFAULT_SETTINGS.voltage;
  state.linkVoltage = DEFAULT_SETTINGS.linkVoltage;
  state.holeShape = DEFAULT_SETTINGS.holeShape;
  state.tangentialSpan = DEFAULT_SETTINGS.tangentialSpan;
  state.radialSpan = DEFAULT_SETTINGS.radialSpan;
  state.circleSize = DEFAULT_SETTINGS.circleSize;

  $("holeShape").value = state.holeShape;
  $("tangentialSpan").value = state.tangentialSpan;
  $("radialSpan").value = state.radialSpan;
  $("circleSize").value = state.circleSize;
  $("tangentialVal").textContent = state.tangentialSpan;
  $("radialVal").textContent = state.radialSpan;
  $("circleSizeVal").textContent = state.circleSize;

  $("presetLow").value = DEFAULT_SETTINGS.presetLow;
  $("presetMid").value = DEFAULT_SETTINGS.presetMid;
  $("presetHigh").value = DEFAULT_SETTINGS.presetHigh;
  $("vMin").value = DEFAULT_SETTINGS.vMin;
  $("vMax").value = DEFAULT_SETTINGS.vMax;
  $("rpmAtVMin").value = DEFAULT_SETTINGS.rpmAtVMin;
  $("rpmAtVMax").value = DEFAULT_SETTINGS.rpmAtVMax;
  $("voltage").value = state.voltage;
  $("voltVal").textContent = state.voltage;
  $("linkVoltage").checked = state.linkVoltage;

  document.querySelectorAll(".speed-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector('.speed-btn[data-preset="mid"]')?.classList.add("active");

  syncHoles(getRingHoles(0), false);
  syncRpm(state.rpm);
  $("ringSelect").value = "0";
  refreshRingSelectOptions();
  updateShapeParamVisibility();
  updateUI();
}

function releaseAllHarpVoices() {
  [...harpVoices.keys()].forEach((i) => releaseHarpRing(i));
}

function setMasterVolume(on) {
  state.masterOn = on;
  const label = $("masterVolumeLabel");
  const hint = $("volumeHint");
  if (label) label.textContent = on ? t("controls.volOn") : t("controls.volOff");
  if (hint) {
    hint.textContent = on ? t("controls.volHintOn") : t("controls.volHintOff");
    hint.classList.toggle("muted-hint", !on);
  }
  if (!masterGain) return;
  const now = audioCtx?.currentTime ?? 0;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(on ? MASTER_GAIN_ON : 0, now);
  if (!on) releaseAllHarpVoices();
}

async function ensureAudioReady() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = state.masterOn ? MASTER_GAIN_ON : 0;
    masterGain.connect(audioCtx.destination);

    harpBus = audioCtx.createGain();
    harpBus.gain.value = 1;
    harpBus.connect(masterGain);
  }
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
  return audioCtx;
}

async function prepareSound() {
  if (!state.masterOn) {
    const hint = $("volumeHint");
    if (hint) {
      hint.textContent = t("controls.volNeedMaster");
      hint.classList.add("muted-hint");
    }
    return false;
  }
  await ensureAudioReady();
  return true;
}

function ringRadiusPx(ringIndex, canvasH) {
  const cy = canvasH / 2;
  const span = HARP_LAYOUT.outerR - HARP_LAYOUT.innerR;
  const t0 = ringIndex / FAN_RINGS.length;
  const t1 = (ringIndex + 1) / FAN_RINGS.length;
  const gap = 3;
  return {
    cy,
    inner: HARP_LAYOUT.innerR + span * t0 + gap,
    outer: HARP_LAYOUT.innerR + span * t1 - gap,
    mid: HARP_LAYOUT.innerR + span * (t0 + t1) / 2,
  };
}

function getHarpRingAt(canvas, x, y) {
  const h = canvas.height;
  const { cx, arcStart, arcEnd } = HARP_LAYOUT;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  let angle = Math.atan2(dy, dx);
  if (angle < arcStart || angle > arcEnd) return -1;

  for (let i = FAN_RINGS.length - 1; i >= 0; i--) {
    const { inner, outer } = ringRadiusPx(i, h);
    const hitPad = HARP_LAYOUT.stroke * 0.55;
    if (dist >= inner - hitPad && dist <= outer + hitPad) return i;
  }
  return -1;
}

function drawHarp() {
  const canvas = $("harpCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const { cx, arcStart, arcEnd } = HARP_LAYOUT;
  const cy = h / 2;
  const now = performance.now();

  ctx.fillStyle = "#010409";
  ctx.fillRect(0, 0, w, h);

  FAN_RINGS.forEach((ring, i) => {
    const { inner, outer, mid } = ringRadiusPx(i, h);
    const isHover = state.harpHover === i;
    const isSelected = state.selectedRing === i;
    const isFlash = state.harpFlashRing === i && now < state.harpFlashUntil;
    const isPlaying =
      harpVoices.has(i) ||
      (state.harpFlashRing === i && now < state.harpFlashUntil);

    ctx.beginPath();
    ctx.arc(cx, cy, mid, arcStart, arcEnd);
    ctx.strokeStyle = "#21262d";
    ctx.lineWidth = outer - inner + 4;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, mid, arcStart, arcEnd);
    const hue = 28 + i * 14;
    if (isFlash || isPlaying) {
      ctx.strokeStyle = `hsl(${hue}, 90%, 62%)`;
      ctx.lineWidth = outer - inner + 8;
      ctx.shadowColor = `hsl(${hue}, 90%, 55%)`;
      ctx.shadowBlur = 14;
    } else if (isHover || isSelected) {
      ctx.strokeStyle = isSelected ? "#f0883e" : `hsl(${hue}, 75%, 55%)`;
      ctx.lineWidth = outer - inner + (isHover ? 6 : 4);
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = `hsl(${hue}, 45%, 42%)`;
      ctx.lineWidth = outer - inner + 2;
      ctx.shadowBlur = 0;
    }
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.shadowBlur = 0;

    const labelAngle = 0.12;
    const lx = Math.min(cx + mid * Math.cos(labelAngle) + 3, w - 34);
    const ly = cy + mid * Math.sin(labelAngle);
    const freq = freqFromHolesAndRpm(getRingHoles(i), state.rpm);
    ctx.fillStyle = isPlaying || isHover ? "#e6edf3" : "#8b949e";
    ctx.font = i < 3 ? "9px sans-serif" : "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(ring.designNote, lx, ly + 3);
    if (isHover || isSelected) {
      ctx.font = "8px sans-serif";
      ctx.fillStyle = "#6e7681";
      ctx.fillText(`${freq.toFixed(0)}Hz`, lx, ly + 13);
    }
  });

  if (state.harpStrumTrail.length > 1) {
    ctx.strokeStyle = "rgba(88, 166, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    state.harpStrumTrail.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }

  ctx.fillStyle = "#484f58";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(t("harp.inner"), cx - 10, cy - HARP_LAYOUT.outerR - 4);
  ctx.fillText(t("harp.outer"), cx - 10, cy + HARP_LAYOUT.outerR + 12);
}

function defaultHarpStatusText() {
  return state.harpPlayMode === "sustain"
    ? t("harp.statusSustain")
    : t("harp.statusOnce");
}

function setHarpStatus(ringIndex) {
  const el = $("harpStatus");
  if (!el) return;
  if (ringIndex < 0) {
    el.textContent = defaultHarpStatusText();
    el.classList.remove("playing");
    return;
  }
  const ring = FAN_RINGS[ringIndex];
  const freq = freqFromHolesAndRpm(getRingHoles(ringIndex), state.rpm);
  const note = freqToNote(freq);
  const latched = harpVoices.get(ringIndex)?.latched;
  const modeHint =
    state.harpPlayMode === "sustain"
      ? latched
        ? t("harp.latched")
        : ""
      : t("harp.onceHint");
  el.textContent = t("harp.playing", {
    ring: ring.ring,
    design: ring.designNote,
    freq: freq.toFixed(1),
    note: note.name,
    extra: modeHint,
  });
  el.classList.add("playing");
}

function releaseHarpRing(ringIndex) {
  const voice = harpVoices.get(ringIndex);
  if (!voice || !audioCtx) {
    harpVoices.delete(ringIndex);
    return;
  }
  const t = audioCtx.currentTime;
  voice.g.gain.cancelScheduledValues(t);
  voice.g.gain.setValueAtTime(Math.max(voice.g.gain.value, 0.0001), t);
  voice.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  voice.osc.stop(t + 0.09);
  harpVoices.delete(ringIndex);
  drawHarp();
}

function buildPeriodicWave(duty) {
  const n = 64;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    imag[i] = 0;
  }
  return audioCtx.createPeriodicWave(real, imag, { disableNormalization: false });
}

async function startHarpVoice(ringIndex, { latched = false, duration = 0.5 } = {}) {
  if (ringIndex < 0 || ringIndex >= FAN_RINGS.length) return;
  if (!(await prepareSound())) return;

  const holes = getRingHoles(ringIndex);
  const freq = freqFromHolesAndRpm(holes, state.rpm);
  if (freq < 20) return;

  if (latched) releaseHarpRing(ringIndex);

  const duty = getPulseGeometry(holes).duty;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  try {
    osc.setPeriodicWave(buildPeriodicWave(duty));
  } catch {
    osc.type = "square";
  }
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(harpBus);

  const peak = latched ? 0.55 : 0.65;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.012);

  const voice = { osc, g, latched };

  if (latched) {
    g.gain.setValueAtTime(peak, t + 0.012);
    osc.start(t);
    harpVoices.set(ringIndex, voice);
  } else {
    g.gain.setValueAtTime(peak, t + 0.012);
    g.gain.linearRampToValueAtTime(0, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.05);
    activePlucks.add(osc);
    osc.onended = () => {
      activePlucks.delete(osc);
      drawHarp();
    };
  }

  state.harpFlashRing = ringIndex;
  state.harpFlashUntil = performance.now() + 180;
  drawHarp();
  return voice;
}

async function toggleHarpLatch(ringIndex, selectUi = true) {
  const voice = harpVoices.get(ringIndex);
  if (voice?.latched) {
    releaseHarpRing(ringIndex);
    setHarpStatus(ringIndex);
    return;
  }
  await startHarpVoice(ringIndex, { latched: true });
  if (selectUi) selectRing(ringIndex, true);
  setHarpStatus(ringIndex);
}

async function pluckHarpRing(ringIndex, { selectUi = false, duration = 0.48 } = {}) {
  if (harpVoices.get(ringIndex)?.latched) {
    releaseHarpRing(ringIndex);
  }
  await startHarpVoice(ringIndex, { latched: false, duration });
  if (selectUi) selectRing(ringIndex, true);
  state.harpFlashRing = ringIndex;
  state.harpFlashUntil = performance.now() + 140;
  if (selectUi) setHarpStatus(ringIndex);
}

let strumLastRing = -1;
let strumLastAt = 0;

function strumHarpRing(ringIndex) {
  const now = performance.now();
  if (ringIndex === strumLastRing && now - strumLastAt < 30) return;
  strumLastRing = ringIndex;
  strumLastAt = now;
  void pluckHarpRing(ringIndex, { duration: 0.38 });
  state.harpFlashRing = ringIndex;
  state.harpFlashUntil = now + 110;
  drawHarp();
}

function harpPointerDown(ringIndex) {
  if (state.harpPlayMode === "once") {
    void pluckHarpRing(ringIndex, { selectUi: true });
  }
}

function harpPointerUp(ringIndex, wasStrum) {
  if (wasStrum || ringIndex < 0) return;
  if (state.harpPlayMode === "sustain") {
    void toggleHarpLatch(ringIndex, true);
  }
}

function bindHarpControls() {
  const canvas = $("harpCanvas");
  if (!canvas) return;

  document.querySelectorAll('input[name="harpPlayMode"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      state.harpPlayMode = e.target.value;
      if (state.harpPlayMode === "once") {
        releaseAllHarpVoices();
      }
      setHarpStatus(state.harpHover);
      drawHarp();
    });
  });

  const pickRing = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { ring: getHarpRingAt(canvas, x, y), x, y };
  };

  const pointerSessions = new Map();

  canvas.addEventListener("pointermove", (e) => {
    const { ring, x, y } = pickRing(e);
    if (state.harpHover !== ring) {
      state.harpHover = ring;
      drawHarp();
    }
    if (ring >= 0) setHarpStatus(ring);
    else if (harpPointers.size === 0) setHarpStatus(-1);

    const session = pointerSessions.get(e.pointerId);
    if (!session?.active) return;

    session.trail.push({ x, y });
    if (session.trail.length > 24) session.trail.shift();
    state.harpStrumTrail = session.trail;

    const dist = Math.hypot(x - session.startX, y - session.startY);
    if (dist > 6 && !session.isStrum) {
      session.isStrum = true;
      canvas.classList.add("harp-strumming");
      strumHarpRing(session.lastRing);
      selectRing(session.lastRing, true);
      setHarpStatus(session.lastRing);
    }

    if (ring >= 0 && ring !== session.lastRing) {
      session.lastRing = ring;
      if (session.isStrum) {
        strumHarpRing(ring);
        selectRing(ring, true);
        setHarpStatus(ring);
      }
    }
    drawHarp();
  });

  canvas.addEventListener("pointerleave", () => {
    state.harpHover = -1;
    state.harpStrumTrail = [];
    drawHarp();
    if (harpPointers.size === 0) setHarpStatus(-1);
  });

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const { ring, x, y } = pickRing(e);
    if (ring < 0) return;

    harpPointers.set(e.pointerId, ring);
    pointerSessions.set(e.pointerId, {
      active: true,
      startX: x,
      startY: y,
      lastRing: ring,
      isStrum: false,
      trail: [{ x, y }],
    });
    state.harpStrumTrail = [{ x, y }];
    harpPointerDown(ring);
  });

  const endPointer = (e) => {
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    const session = pointerSessions.get(e.pointerId);
    const ring = harpPointers.get(e.pointerId);
    harpPointers.delete(e.pointerId);
    pointerSessions.delete(e.pointerId);
    state.harpStrumTrail = [];
    canvas.classList.remove("harp-dragging", "harp-strumming");

    if (ring !== undefined && session) {
      harpPointerUp(ring, session.isStrum);
    }

    if (harpPointers.size === 0 && state.harpHover < 0) {
      setHarpStatus(-1);
    } else if (state.harpHover >= 0) {
      setHarpStatus(state.harpHover);
    }
    drawHarp();
  };

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  const keysToggled = new Set();

  window.addEventListener("keydown", (e) => {
    if (e.target.matches("input, select, textarea")) return;
    const n = parseInt(e.key, 10);
    if (n < 1 || n > 8) return;
    const code = e.code || `Digit${n}`;
    if (e.repeat || keysToggled.has(code)) return;
    keysToggled.add(code);

    const i = n - 1;
    if (state.harpPlayMode === "sustain") {
      void toggleHarpLatch(i, true);
    } else {
      void pluckHarpRing(i, { selectUi: true });
    }
  });

  window.addEventListener("keyup", (e) => {
    const n = parseInt(e.key, 10);
    if (n < 1 || n > 8) return;
    keysToggled.delete(e.code || `Digit${n}`);
  });
}

// —— 可视化 ——

function drawDisc(timestamp) {
  const canvas = $("discCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = w * 0.42;

  if (!state.lastFrame) state.lastFrame = timestamp;
  const dt = (timestamp - state.lastFrame) / 1000;
  state.lastFrame = timestamp;
  state.animAngle += (state.rpm / 60) * Math.PI * 2 * dt;

  ctx.fillStyle = "#010409";
  ctx.fillRect(0, 0, w, h);

  // 同心圆轨道示意
  FAN_RINGS.forEach((r, i) => {
    const radius = maxR * (0.35 + (i / (FAN_RINGS.length - 1)) * 0.65);
    const isActive = i === state.selectedRing;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isActive ? "#f0883e" : "#30363d";
    ctx.lineWidth = isActive ? 2.5 : 1;
    ctx.stroke();
  });

  const active = FAN_RINGS[state.selectedRing];
  const activeRadius =
    maxR * (0.35 + (state.selectedRing / (FAN_RINGS.length - 1)) * 0.65);
  const holes = state.holes;
  const geo = getPulseGeometry(holes);
  const trackHalf = Math.max(6, activeRadius * 0.09 * geo.radialFrac);

  // 旋转圆盘
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.animAngle);

  ctx.beginPath();
  ctx.arc(0, 0, activeRadius + 10, 0, Math.PI * 2);
  ctx.fillStyle = "#21262d";
  ctx.fill();
  ctx.strokeStyle = "#484f58";
  ctx.stroke();

  for (let i = 0; i < holes; i++) {
    const a = (i / holes) * Math.PI * 2;
    ctx.fillStyle = "#010409";
    ctx.strokeStyle = "#484f58";
    ctx.lineWidth = 0.5;

    if (state.holeShape === "arc") {
      const inner = activeRadius - trackHalf;
      const outer = activeRadius + trackHalf;
      const half = geo.angularWidth / 2;
      ctx.beginPath();
      ctx.arc(0, 0, outer, a - half, a + half);
      ctx.arc(0, 0, inner, a + half, a - half, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.save();
      ctx.rotate(a);
      ctx.translate(activeRadius, 0);
      if (state.holeShape === "circle") {
        const r = Math.max(2.5, (geo.angularWidth * activeRadius) / 2);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const tangLen = geo.angularWidth * activeRadius;
        const radH = trackHalf * 2;
        ctx.beginPath();
        ctx.rect(-tangLen / 2, -radH / 2, tangLen, radH);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  ctx.restore();

  // LED 与光 Pick（固定不转）
  const pickX = cx + activeRadius + 28;
  const ledX = cx - activeRadius - 28;
  const beamY = cy;

  ctx.fillStyle = "#ffe066";
  ctx.shadowColor = "#ffe066";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(ledX, beamY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#3fb950";
  ctx.beginPath();
  ctx.arc(pickX, beamY, 7, 0, Math.PI * 2);
  ctx.fill();

  const open = isPickOpen(state.animAngle, holes, geo.angularWidth);

  ctx.strokeStyle = open ? "rgba(255, 224, 102, 0.85)" : "rgba(255, 224, 102, 0.15)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(ledX, beamY);
  ctx.lineTo(pickX, beamY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = open ? "#58a6ff" : "#484f58";
  ctx.font = "11px sans-serif";
  const shapeLabel =
    state.holeShape === "circle"
      ? t("disc.shapeCircle")
      : state.holeShape === "slot"
        ? t("disc.shapeSlot")
        : t("disc.shapeArc");
  ctx.fillText(
    open
      ? t("disc.lightOpen", { duty: (geo.duty * 100).toFixed(0) })
      : t("disc.blocked", { shape: shapeLabel }),
    cx - 36,
    cy + activeRadius + 24
  );

  drawWaveform(timestamp, geo.duty, freqFromHolesAndRpm(state.holes, state.rpm));
  drawSpectrum(geo.duty);
  requestAnimationFrame(drawDisc);
}

function drawWaveform(timestamp, duty, freq) {
  const canvas = $("waveCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = "#010409";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#30363d";
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  if (freq <= 0) return;

  const cycles = 4;
  const phase0 = ((timestamp / 1000) * freq) % 1;

  ctx.strokeStyle = "#58a6ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const phase = phase0 + (x / w) * cycles;
    const p = phase % 1;
    const val = p < duty ? 1 : -1;
    const y = h / 2 - val * (h * 0.38);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = "#8b949e";
  ctx.font = "10px sans-serif";
  ctx.fillText(
    t("wave", { freq: freq.toFixed(1), duty: (duty * 100).toFixed(1) }),
    8,
    14
  );
}

function drawSpectrum(duty) {
  const canvas = $("spectrumCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const amps = harmonicAmplitudes(duty, 20);
  const maxAmp = Math.max(...amps, 0.01);

  ctx.fillStyle = "#010409";
  ctx.fillRect(0, 0, w, h);

  const barW = (w - 24) / amps.length;
  amps.forEach((a, i) => {
    const bh = (a / maxAmp) * (h - 22);
    const hue = 200 - (a / maxAmp) * 120;
    ctx.fillStyle = `hsl(${hue}, 65%, 52%)`;
    ctx.fillRect(12 + i * barW, h - 8 - bh, barW * 0.72, bh);
  });

  ctx.fillStyle = "#8b949e";
  ctx.font = "10px sans-serif";
  ctx.fillText(t("spectrum"), 8, 12);
}

function drawHeatmap() {
  const canvas = $("heatCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const padL = 44;
  const padB = 32;
  const padT = 16;
  const plotW = w - padL - 12;
  const plotH = h - padB - padT;

  const holesMin = 12;
  const holesMax = 52;
  const rpmMin = 400;
  const rpmMax = 900;

  let fMin = Infinity;
  let fMax = 0;
  for (let n = holesMin; n <= holesMax; n += 2) {
    for (let r = rpmMin; r <= rpmMax; r += 20) {
      const f = freqFromHolesAndRpm(n, r);
      fMin = Math.min(fMin, f);
      fMax = Math.max(fMax, f);
    }
  }

  ctx.fillStyle = "#010409";
  ctx.fillRect(0, 0, w, h);

  for (let py = 0; py < plotH; py++) {
    const rpm = rpmMax - (py / plotH) * (rpmMax - rpmMin);
    for (let px = 0; px < plotW; px++) {
      const holes = holesMin + (px / plotW) * (holesMax - holesMin);
      const f = freqFromHolesAndRpm(holes, rpm);
      const t = (f - fMin) / (fMax - fMin);
      const hue = 220 - t * 200;
      ctx.fillStyle = `hsl(${hue}, 70%, ${25 + t * 35}%)`;
      ctx.fillRect(padL + px, padT + py, 1, 1);
    }
  }

  // 当前点
  const px =
    padL + ((state.holes - holesMin) / (holesMax - holesMin)) * plotW;
  const py =
    padT + ((rpmMax - state.rpm) / (rpmMax - rpmMin)) * plotH;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#8b949e";
  ctx.font = "10px sans-serif";
  ctx.fillText(t("heat.holes"), padL + plotW / 2 - 20, h - 8);
  ctx.save();
  ctx.translate(12, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(t("heat.rpm"), 0, 0);
  ctx.restore();

  // 标注八轨设计点（中档 654 RPM 参考线）
  const refRpm = parseFloat($("presetMid").value) || 654;
  FAN_RINGS.forEach((ring, i) => {
    const x = padL + ((getRingHoles(i) - holesMin) / (holesMax - holesMin)) * plotW;
    const y = padT + ((rpmMax - refRpm) / (rpmMax - rpmMin)) * plotH;
    ctx.fillStyle = "#f0883e";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateShapeParamVisibility() {
  const shape = state.holeShape;
  document.querySelectorAll(".shape-param").forEach((el) => {
    const modes = (el.dataset.for || "").split(" ");
    el.style.display = modes.includes(shape) ? "block" : "none";
  });
}

function applyShapePreset(preset) {
  if (preset === "narrow") {
    state.tangentialSpan = 12;
    state.circleSize = 12;
    state.radialSpan = 25;
  } else if (preset === "wide") {
    state.tangentialSpan = 78;
    state.circleSize = 55;
    state.radialSpan = 70;
    if (state.holeShape === "circle") state.holeShape = "arc";
  } else {
    state.tangentialSpan = 50;
    state.circleSize = 35;
    state.radialSpan = 40;
  }
  $("tangentialSpan").value = state.tangentialSpan;
  $("radialSpan").value = state.radialSpan;
  $("circleSize").value = state.circleSize;
  $("tangentialVal").textContent = state.tangentialSpan;
  $("radialVal").textContent = state.radialSpan;
  $("circleSizeVal").textContent = state.circleSize;
  if (preset === "wide") $("holeShape").value = "arc";
  else if (preset === "square") $("holeShape").value = "slot";
  state.holeShape = $("holeShape").value;
  updateShapeParamVisibility();
  updateUI();
}

function bindHoleShapeControls() {
  $("holeShape").addEventListener("change", (e) => {
    state.holeShape = e.target.value;
    updateShapeParamVisibility();
    updateUI();
  });

  $("tangentialSpan").addEventListener("input", (e) => {
    state.tangentialSpan = parseInt(e.target.value, 10);
    $("tangentialVal").textContent = state.tangentialSpan;
    updateUI();
  });

  $("radialSpan").addEventListener("input", (e) => {
    state.radialSpan = parseInt(e.target.value, 10);
    $("radialVal").textContent = state.radialSpan;
    updateUI();
  });

  $("circleSize").addEventListener("input", (e) => {
    state.circleSize = parseInt(e.target.value, 10);
    $("circleSizeVal").textContent = state.circleSize;
    updateUI();
  });

  document.querySelectorAll(".shape-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyShapePreset(btn.dataset.preset));
  });
}

// —— 初始化 ——

function init() {
  const ringSelect = $("ringSelect");
  refreshRingSelectOptions();
  ringSelect.addEventListener("change", () => selectRing(parseInt(ringSelect.value, 10)));

  const targetNote = $("targetNote");
  buildNoteOptions().forEach((n) => {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    if (n === "A4") opt.selected = true;
    targetNote.appendChild(opt);
  });
  targetNote.addEventListener("change", updateUI);

  $("holes").addEventListener("input", (e) => {
    syncHoles(parseInt(e.target.value, 10), true);
    updateUI();
  });
  $("holesNum").addEventListener("change", (e) => {
    syncHoles(parseInt(e.target.value, 10), true);
    updateUI();
  });

  $("resetDefaults").addEventListener("click", resetAllDefaults);

  $("rpm").addEventListener("input", (e) => {
    state.linkVoltage = false;
    $("linkVoltage").checked = false;
    syncRpm(parseFloat(e.target.value));
    updateUI();
  });
  $("rpmNum").addEventListener("change", (e) => {
    state.linkVoltage = false;
    $("linkVoltage").checked = false;
    syncRpm(parseFloat(e.target.value));
    updateUI();
  });

  $("voltage").addEventListener("input", (e) => {
    state.voltage = parseFloat(e.target.value);
    $("voltVal").textContent = state.voltage;
    if ($("linkVoltage").checked) {
      const { vMin, vMax, rpmAtVMin, rpmAtVMax } = getInputs();
      syncRpm(voltageToRpm(state.voltage, vMin, vMax, rpmAtVMin, rpmAtVMax));
    }
    updateUI();
  });

  ["vMin", "vMax", "rpmAtVMin", "rpmAtVMax", "presetLow", "presetMid", "presetHigh"].forEach(
    (id) => {
      $(id).addEventListener("change", () => {
        if ($("linkVoltage").checked) {
          const { vMin, vMax, rpmAtVMin, rpmAtVMax } = getInputs();
          syncRpm(voltageToRpm(state.voltage, vMin, vMax, rpmAtVMin, rpmAtVMax));
        }
        updateUI();
      });
    }
  );

  $("linkVoltage").addEventListener("change", (e) => {
    state.linkVoltage = e.target.checked;
    if (state.linkVoltage) {
      const { vMin, vMax, rpmAtVMin, rpmAtVMax } = getInputs();
      syncRpm(voltageToRpm(state.voltage, vMin, vMax, rpmAtVMin, rpmAtVMax));
      updateUI();
    }
  });

  document.querySelectorAll(".speed-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".speed-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const preset = btn.dataset.preset;
      const map = {
        low: "presetLow",
        mid: "presetMid",
        high: "presetHigh",
      };
      syncRpm(parseFloat($(map[preset]).value) || 0);
      state.linkVoltage = false;
      $("linkVoltage").checked = false;
      updateUI();
    });
  });

  $("masterVolume").addEventListener("change", async (e) => {
    setMasterVolume(e.target.checked);
    if (e.target.checked) await ensureAudioReady();
  });

  initI18n();
  window.onFanLangChange = () => {
    refreshRingSelectOptions();
    setMasterVolume(state.masterOn);
    updateUI();
    if (state.harpHover >= 0) setHarpStatus(state.harpHover);
    else setHarpStatus(-1);
  };

  bindHoleShapeControls();
  bindHarpControls();
  updateShapeParamVisibility();
  drawHarp();
  setHarpStatus(-1);
  setMasterVolume(false);

  selectRing(0);
  document.querySelector('.speed-btn[data-preset="mid"]').classList.add("active");
  requestAnimationFrame(drawDisc);
}

init();
