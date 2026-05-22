/**
 * 风扇琴模拟器 · 多语言
 * zh | zh-TW | en | ja
 */

const FAN_I18N = {
  zh: {
    pageTitle: "风扇琴 — 模拟器",
    htmlLang: "zh-CN",
    header: {
      title: "风扇琴",
      titleEn: "Electric Fan Harp",
      subtitle: "光电压弦 · 孔数 × 转速 → 音高 · 模拟设计工具",
    },
    lang: { zh: "中文", "zh-TW": "繁體", en: "EN", ja: "日本語", es: "ES" },
    viz: {
      title: "光学转盘 · 旋律演奏",
      discAria: "转盘可视化",
      harpTitle: "环轨琴键",
      playMode: "放音模式",
      modeSustain: "持续 · 点击开/关",
      modeOnce: "单次 · 按住发声",
      harpAria: "可点击的环轨演奏区",
      strumHint: "扫弦：按住并在环轨上划过（内→外或外→内）",
      harpStatus: "先开总音量，再点击演奏 · 键盘 1–8",
      waveAria: "方波波形",
      spectrumAria: "谐波频谱",
      hint: "孔形决定高电平持续时间（占空比）：基频仍由 N×RPM 决定，脉冲宽窄改变谐波 → 音色",
    },
    shortcuts: {
      title: "快捷键",
      mode: "切换演奏模式",
      rings: "环轨（按住发声）",
      wheel: "调压区滚轮 · 电压",
      shiftWheel: "推弦步进减半",
    },
    controls: {
      title: "演奏控制",
      freq: "频率",
      note: "音名",
      cents: "偏差",
      pulses: "脉冲/秒",
      duty: "占空比",
      pulseWidth: "高电平时长",
      ringSelect: "同心圆轨道（孔数预设）",
      resetDefaults: "恢复全部默认设置",
      holes: "孔数 N",
      holeShape: "孔形与形变（占空比 → 音色）",
      holeType: "孔形类型",
      shapeCircle: "圆孔",
      shapeSlot: "方孔 · 矩形槽（可调长宽）",
      shapeArc: "环形弧孔（切向拉长）",
      presetNarrow: "窄脉冲 · 短促明亮",
      presetSquare: "对称方波 · 50%",
      presetWide: "宽脉冲 · 环形饱满",
      tangential: "切向角宽",
      tangentialHint: "（相对相邻孔间距，越窄高电平越短）",
      radial: "径向高度",
      radialHint: "（槽在轨道上的径向宽度，影响光斑截面）",
      circleSize: "圆孔直径感",
      rpm: "转速 RPM",
      speed: "风速档（变调按键）",
      low: "弱",
      mid: "中",
      high: "强",
      presetLow: "弱档 RPM",
      presetMid: "中档 RPM",
      presetHigh: "强档 RPM",
      variac: "推弦 · 调压器（电压 → 转速）",
      variacSens: "推弦灵敏度",
      variacSensFine: "精细",
      variacSensMid: "标准",
      variacSensFast: "快速",
      variacStepHint: "滚轮每步 ±{step} V · Shift ±{stepFine}",
      variacStepHintActive: "Shift 微调中 · 每步 ±{step} V",
      voltage: "供电电压 V",
      linkVoltage: "电压联动转速（模拟 VARIAC 推弦）",
      master: "总音量",
      volOn: "开",
      volOff: "关",
      volHintOn: "总音量已开 · 用环轨琴键演奏",
      volHintOff: "打开总音量后，用环轨琴键演奏",
      volNeedMaster: "请先打开演奏区「总音量」再演奏",
      shortcuts: "快捷键：M 切换演奏模式 · 数字键 1–8 对应环轨 · 按住发声",
      wheelHint: "滚轮推弦；Shift 临时减半步进；灵敏度低=微调、高=快推",
    },
    calcPanel: {
      title: "反向计算 · 目标音高",
      desc: "已知想要的音名，反推所需转速或孔数，便于实物设计。",
      targetNote: "目标音名",
      tableTitle: "你的八轨同心圆 · 当前转速对照表",
      heatmap: "孔数 × 转速 热力图（频率 Hz）",
      thTrack: "轨道",
      thHoles: "孔数",
      thDesignNote: "设计音名",
      thDesignFreq: "设计频率",
      thCurrentFreq: "当前频率",
      thNeedRpm: "达成该音所需 RPM",
      thCents: "与目标差 (¢)",
    },
    footer:
      "原理：CD 式光学扫描的放大版 — 孔洞即「凹坑」，光 Pick 输出模拟方波，直通功放。公式 f = N·RPM/60 中 N 为每转脉冲数（孔数）。",
    timbre: {
      veryNarrow: "极窄脉冲 · 高频谐波丰富、音色偏亮且「尖」",
      narrow: "窄脉冲 · 明亮、类似短促拨弦",
      square: "近对称方波 · 奇次谐波突出、经典「方波」感",
      wide: "宽脉冲 · 低次谐波增强、音色更厚",
      ring: "环形长孔 · 高电平时间长、饱满而柔",
    },
    harp: {
      statusSustain: "持续模式：点击开/关 · 扫弦划过 · 键盘 1–8 切换",
      statusOnce: "单次模式：按住发声 · 扫弦 · 键盘 1–8",
      latched: "（已锁定，再点关闭）",
      onceHint: "（单次）",
      playing: "第 {ring} 轨 · {design} · {freq} Hz ({note}){extra}",
      inner: "内",
      outer: "外",
    },
    disc: {
      lightOpen: "光通 · D={duty}%",
      blocked: "遮挡 · {shape}",
      shapeCircle: "圆孔",
      shapeSlot: "方孔",
      shapeArc: "弧孔",
    },
    wave: "脉冲方波 · {freq} Hz · 占空比 {duty}%",
    spectrum: "谐波幅度（占空比改变 → 音色改变，基频位置不变）",
    heat: { holes: "孔数 N →", rpm: "RPM →" },
    ringOpt: "第 {ring} 轨 · {holes} 孔 · 设计 {note} (≈{rpm} RPM)",
    tableTrack: "第 {ring} 轨",
    centsRel: " (相对 {note}: {cents} ¢)",
    calc: {
      target: "目标音 <strong>{note}</strong> ≈ <strong>{freq} Hz</strong>",
      rpmNeed:
        "当前孔数 <strong>{holes}</strong> 时，所需转速：<strong>{rpm} RPM</strong>（公式 RPM = f × 60 ÷ N）",
      holesNeed:
        "当前转速 <strong>{rpm} RPM</strong> 时，所需孔数（取整）：<strong>{holes}</strong>（公式 N = f × 60 ÷ RPM）",
      current:
        "当前组合发出 <strong>{freq} Hz</strong> ({note})，与目标相差 <strong>{cents} ¢</strong>",
    },
  },

  "zh-TW": {
    pageTitle: "風扇琴 — 模擬器",
    htmlLang: "zh-TW",
    header: {
      title: "風扇琴",
      titleEn: "Electric Fan Harp",
      subtitle: "光電壓弦 · 孔數 × 轉速 → 音高 · 模擬設計工具",
    },
    lang: { zh: "简体", "zh-TW": "繁體", en: "EN", ja: "日本語", es: "ES" },
    viz: {
      title: "光學轉盤 · 旋律演奏",
      discAria: "轉盤視覺化",
      harpTitle: "環軌琴鍵",
      playMode: "放音模式",
      modeSustain: "持續 · 點擊開/關",
      modeOnce: "單次 · 按住發聲",
      harpAria: "可點擊的環軌演奏區",
      strumHint: "掃弦：按住並在環軌上劃過（內→外或外→內）",
      harpStatus: "先開總音量，再點擊演奏 · 鍵盤 1–8",
      waveAria: "方波波形",
      spectrumAria: "諧波頻譜",
      hint: "孔形決定高電平持續時間（占空比）：基頻仍由 N×RPM 決定，脈衝寬窄改變諧波 → 音色",
    },
    shortcuts: {
      title: "快捷鍵",
      mode: "切換演奏模式",
      rings: "環軌（按住發聲）",
      wheel: "調壓區滾輪 · 電壓",
      shiftWheel: "推弦步進減半",
    },
    controls: {
      title: "演奏控制",
      freq: "頻率",
      note: "音名",
      cents: "偏差",
      pulses: "脈衝/秒",
      duty: "占空比",
      pulseWidth: "高電平時長",
      ringSelect: "同心圓軌道（孔數預設）",
      resetDefaults: "恢復全部預設設定",
      holes: "孔數 N",
      holeShape: "孔形與形變（占空比 → 音色）",
      holeType: "孔形類型",
      shapeCircle: "圓孔",
      shapeSlot: "方孔 · 矩形槽（可調長寬）",
      shapeArc: "環形弧孔（切向拉長）",
      presetNarrow: "窄脈衝 · 短促明亮",
      presetSquare: "對稱方波 · 50%",
      presetWide: "寬脈衝 · 環形飽滿",
      tangential: "切向角寬",
      tangentialHint: "（相鄰孔間距，越窄高電平越短）",
      radial: "徑向高度",
      radialHint: "（槽在軌道上的徑向寬度，影響光斑截面）",
      circleSize: "圓孔直徑感",
      rpm: "轉速 RPM",
      speed: "風速檔（變調按鍵）",
      low: "弱",
      mid: "中",
      high: "強",
      presetLow: "弱檔 RPM",
      presetMid: "中檔 RPM",
      presetHigh: "強檔 RPM",
      variac: "推弦 · 調壓器（電壓 → 轉速）",
      variacSens: "推弦靈敏度",
      variacSensFine: "精細",
      variacSensMid: "標準",
      variacSensFast: "快速",
      variacStepHint: "滾輪每步 ±{step} V · Shift ±{stepFine}",
      variacStepHintActive: "Shift 微調中 · 每步 ±{step} V",
      voltage: "供電電壓 V",
      linkVoltage: "電壓聯動轉速（模擬 VARIAC 推弦）",
      master: "總音量",
      volOn: "開",
      volOff: "關",
      volHintOn: "總音量已開 · 用環軌琴鍵演奏",
      volHintOff: "打開總音量後，用環軌琴鍵演奏",
      volNeedMaster: "請先打開演奏區「總音量」再演奏",
      shortcuts: "快捷鍵：M 切換演奏模式 · 數字鍵 1–8 環軌 · 按住發聲",
      wheelHint: "滾輪推弦；Shift 臨時減半步進；靈敏度低=微調、高=快推",
    },
    calcPanel: {
      title: "反向計算 · 目標音高",
      desc: "已知想要的音名，反推所需轉速或孔數，便於實物設計。",
      targetNote: "目標音名",
      tableTitle: "你的八軌同心圓 · 當前轉速對照表",
      heatmap: "孔數 × 轉速 熱力圖（頻率 Hz）",
      thTrack: "軌道",
      thHoles: "孔數",
      thDesignNote: "設計音名",
      thDesignFreq: "設計頻率",
      thCurrentFreq: "當前頻率",
      thNeedRpm: "達成該音所需 RPM",
      thCents: "與目標差 (¢)",
    },
    footer:
      "原理：CD 式光學掃描的放大版 — 孔洞即「凹坑」，光 Pick 輸出模擬方波，直通功放。公式 f = N·RPM/60 中 N 為每轉脈衝數（孔數）。",
    timbre: {
      veryNarrow: "極窄脈衝 · 高頻諧波豐富、音色偏亮且「尖」",
      narrow: "窄脈衝 · 明亮、類似短促撥弦",
      square: "近對稱方波 · 奇次諧波突出、經典「方波」感",
      wide: "寬脈衝 · 低次諧波增強、音色更厚",
      ring: "環形長孔 · 高電平時間長、飽滿而柔",
    },
    harp: {
      statusSustain: "持續模式：點擊開/關 · 掃弦劃過 · 鍵盤 1–8 切換",
      statusOnce: "單次模式：按住發聲 · 掃弦 · 鍵盤 1–8",
      latched: "（已鎖定，再點關閉）",
      onceHint: "（單次）",
      playing: "第 {ring} 軌 · {design} · {freq} Hz ({note}){extra}",
      inner: "內",
      outer: "外",
    },
    disc: {
      lightOpen: "光通 · D={duty}%",
      blocked: "遮擋 · {shape}",
      shapeCircle: "圓孔",
      shapeSlot: "方孔",
      shapeArc: "弧孔",
    },
    wave: "脈衝方波 · {freq} Hz · 占空比 {duty}%",
    spectrum: "諧波幅度（占空比改變 → 音色改變，基頻位置不變）",
    heat: { holes: "孔數 N →", rpm: "RPM →" },
    ringOpt: "第 {ring} 軌 · {holes} 孔 · 設計 {note} (≈{rpm} RPM)",
    tableTrack: "第 {ring} 軌",
    centsRel: " (相對 {note}: {cents} ¢)",
    calc: {
      target: "目標音 <strong>{note}</strong> ≈ <strong>{freq} Hz</strong>",
      rpmNeed:
        "當前孔數 <strong>{holes}</strong> 時，所需轉速：<strong>{rpm} RPM</strong>（公式 RPM = f × 60 ÷ N）",
      holesNeed:
        "當前轉速 <strong>{rpm} RPM</strong> 時，所需孔數（取整）：<strong>{holes}</strong>（公式 N = f × 60 ÷ RPM）",
      current:
        "當前組合發出 <strong>{freq} Hz</strong> ({note})，與目標相差 <strong>{cents} ¢</strong>",
    },
  },

  en: {
    pageTitle: "Electric Fan Harp — Simulator",
    htmlLang: "en",
    header: {
      title: "Electric Fan Harp",
      titleEn: "Fan Synthesizer",
      subtitle: "Optical strings · holes × RPM → pitch · design tool",
    },
    lang: { zh: "中文", "zh-TW": "繁體", en: "EN", ja: "日本語", es: "ES" },
    viz: {
      title: "Optical disc · performance",
      discAria: "Disc visualization",
      harpTitle: "Ring keys",
      playMode: "Playback mode",
      modeSustain: "Sustain · tap on/off",
      modeOnce: "Single · hold to play",
      harpAria: "Clickable ring keyboard",
      strumHint: "Strum: hold and drag across rings (in or out)",
      harpStatus: "Turn master volume on, then play · keys 1–8",
      waveAria: "Square waveform",
      spectrumAria: "Harmonic spectrum",
      hint: "Hole shape sets duty cycle: pitch from N×RPM; pulse width changes timbre via harmonics",
    },
    shortcuts: {
      title: "Shortcuts",
      mode: "Toggle play mode",
      rings: "Rings (hold to play)",
      wheel: "Variac zone · voltage",
      shiftWheel: "Half bend step",
    },
    controls: {
      title: "Performance",
      freq: "Frequency",
      note: "Note",
      cents: "Deviation",
      pulses: "Pulses/s",
      duty: "Duty cycle",
      pulseWidth: "High time",
      ringSelect: "Concentric track (hole preset)",
      resetDefaults: "Reset all to defaults",
      holes: "Holes N",
      holeShape: "Hole shape (duty → timbre)",
      holeType: "Shape type",
      shapeCircle: "Round hole",
      shapeSlot: "Rectangular slot",
      shapeArc: "Arc slot (tangential)",
      presetNarrow: "Narrow · bright",
      presetSquare: "Square wave · 50%",
      presetWide: "Wide · full ring",
      tangential: "Tangential width",
      tangentialHint: "(vs. hole spacing; narrower = shorter high)",
      radial: "Radial height",
      radialHint: "(slot width on track; affects beam cross-section)",
      circleSize: "Hole diameter",
      rpm: "Speed RPM",
      speed: "Fan speed presets",
      low: "Low",
      mid: "Mid",
      high: "High",
      presetLow: "Low RPM",
      presetMid: "Mid RPM",
      presetHigh: "High RPM",
      variac: "Bend · variac (voltage → RPM)",
      variacSens: "Bend sensitivity",
      variacSensFine: "Fine",
      variacSensMid: "Normal",
      variacSensFast: "Fast",
      variacStepHint: "Wheel ±{step} V · Shift ±{stepFine}",
      variacStepHintActive: "Shift fine-tune · ±{step} V per step",
      voltage: "Supply voltage V",
      linkVoltage: "Link voltage to RPM (VARIAC bend)",
      master: "Master volume",
      volOn: "On",
      volOff: "Off",
      volHintOn: "Volume on · use ring keys to play",
      volHintOff: "Turn volume on, then play ring keys",
      volNeedMaster: "Turn on master volume in the play area first",
      shortcuts: "Shortcuts: M mode · keys 1–8 rings · hold to play",
      wheelHint: "Wheel to bend; Shift halves step; low sens. = fine, high = fast",
    },
    calcPanel: {
      title: "Inverse calc · target pitch",
      desc: "Pick a target note; get required RPM or hole count for hardware design.",
      targetNote: "Target note",
      tableTitle: "8 rings · at current RPM",
      heatmap: "Holes × RPM heatmap (Hz)",
      thTrack: "Track",
      thHoles: "Holes",
      thDesignNote: "Design note",
      thDesignFreq: "Design Hz",
      thCurrentFreq: "Current Hz",
      thNeedRpm: "RPM for note",
      thCents: "vs target (¢)",
    },
    footer:
      "Like CD optical scanning at scale — holes are “pits”; photodiode → analog square wave to amp. f = N·RPM/60, N = holes per revolution.",
    timbre: {
      veryNarrow: "Very narrow pulse · bright, sharp harmonics",
      narrow: "Narrow pulse · bright pluck-like",
      square: "Near 50% square · odd harmonics, classic square tone",
      wide: "Wide pulse · stronger lows, thicker tone",
      ring: "Long arc hole · long high, full and soft",
    },
    harp: {
      statusSustain: "Sustain: tap on/off · strum · keys 1–8",
      statusOnce: "Single: hold to play · strum · keys 1–8",
      latched: " (latched, tap to off)",
      onceHint: " (single)",
      playing: "Track {ring} · {design} · {freq} Hz ({note}){extra}",
      inner: "In",
      outer: "Out",
    },
    disc: {
      lightOpen: "Open · D={duty}%",
      blocked: "Blocked · {shape}",
      shapeCircle: "round",
      shapeSlot: "slot",
      shapeArc: "arc",
    },
    wave: "Pulse · {freq} Hz · duty {duty}%",
    spectrum: "Harmonics (duty changes timbre, fundamental fixed)",
    heat: { holes: "Holes N →", rpm: "RPM →" },
    ringOpt: "Track {ring} · {holes} holes · {note} (≈{rpm} RPM)",
    tableTrack: "Track {ring}",
    centsRel: " (vs {note}: {cents} ¢)",
    calc: {
      target: "Target <strong>{note}</strong> ≈ <strong>{freq} Hz</strong>",
      rpmNeed:
        "At <strong>{holes}</strong> holes, need <strong>{rpm} RPM</strong> (RPM = f × 60 ÷ N)",
      holesNeed:
        "At <strong>{rpm} RPM</strong>, need <strong>{holes}</strong> holes (N = f × 60 ÷ RPM)",
      current:
        "Now <strong>{freq} Hz</strong> ({note}), <strong>{cents} ¢</strong> from target",
    },
  },

  ja: {
    pageTitle: "扇風琴 — シミュレータ",
    htmlLang: "ja",
    header: {
      title: "扇風琴",
      titleEn: "Electric Fan Harp",
      subtitle: "光電圧弦 · 穴数 × 回転数 → 音高 · 設計ツール",
    },
    lang: { zh: "中文", "zh-TW": "繁體", en: "EN", ja: "日本語", es: "ES" },
    viz: {
      title: "光学ディスク · 演奏",
      discAria: "ディスク表示",
      harpTitle: "リング鍵盤",
      playMode: "発音モード",
      modeSustain: "持続 · タップで on/off",
      modeOnce: "単発 · 押している間発音",
      harpAria: "クリック可能なリング鍵盤",
      strumHint: "ストラム：押したままリングをなぞる（内↔外）",
      harpStatus: "マスター音量 on 後に演奏 · キー 1–8",
      waveAria: "方形波",
      spectrumAria: "倍音スペクトル",
      hint: "穴形がデューティ比を決定。音高は N×RPM。パルス幅で倍音＝音色が変化",
    },
    shortcuts: {
      title: "ショートカット",
      mode: "演奏モード切替",
      rings: "リング（押し続け）",
      wheel: "調圧エリア · 電圧",
      shiftWheel: "ベンド半分の刻み",
    },
    controls: {
      title: "演奏コントロール",
      freq: "周波数",
      note: "音名",
      cents: "偏差",
      pulses: "パルス/秒",
      duty: "デューティ比",
      pulseWidth: "ハイ時間",
      ringSelect: "同心円トラック（穴数プリセット）",
      resetDefaults: "すべて初期設定に戻す",
      holes: "穴数 N",
      holeShape: "穴形と変形（デューティ → 音色）",
      holeType: "穴の形",
      shapeCircle: "円孔",
      shapeSlot: "角穴 · 矩形スロット",
      shapeArc: "弧状スロット",
      presetNarrow: "狭パルス · 明るい",
      presetSquare: "方形波 · 50%",
      presetWide: "広パルス · リング状",
      tangential: "接線方向の幅",
      tangentialHint: "（穴間隔に対する割合。狭いほどハイが短い）",
      radial: "径方向の高さ",
      radialHint: "（トラック上のスロット幅）",
      circleSize: "円孔の大きさ",
      rpm: "回転数 RPM",
      speed: "風量段（転調）",
      low: "弱",
      mid: "中",
      high: "強",
      presetLow: "弱 RPM",
      presetMid: "中 RPM",
      presetHigh: "強 RPM",
      variac: "ベンド · 調圧器（電圧 → RPM）",
      variacSens: "ベンド感度",
      variacSensFine: "精密",
      variacSensMid: "標準",
      variacSensFast: "高速",
      variacStepHint: "ホイール ±{step} V · Shift ±{stepFine}",
      variacStepHintActive: "Shift 微調整 · 1 目 ±{step} V",
      voltage: "電圧 V",
      linkVoltage: "電圧連動 RPM（VARIAC ベンド）",
      master: "マスター音量",
      volOn: "オン",
      volOff: "オフ",
      volHintOn: "音量オン · リング鍵盤で演奏",
      volHintOff: "音量をオンにしてリング鍵盤で演奏",
      volNeedMaster: "演奏エリアのマスター音量をオンにしてください",
      shortcuts: "ショートカット：M モード · 1–8 リング · 押し続けて発音",
      wheelHint: "ホイール推弦；Shift で刻み半分；感度低=微調、高=速いベンド",
    },
    calcPanel: {
      title: "逆算 · 目標音高",
      desc: "目標音から必要な RPM または穴数を計算。",
      targetNote: "目標音名",
      tableTitle: "8 トラック · 現在 RPM での対照",
      heatmap: "穴数 × RPM ヒートマップ（Hz）",
      thTrack: "トラック",
      thHoles: "穴数",
      thDesignNote: "設計音",
      thDesignFreq: "設計 Hz",
      thCurrentFreq: "現在 Hz",
      thNeedRpm: "必要 RPM",
      thCents: "差 (¢)",
    },
    footer:
      "CD 式光学読取の拡大版。穴が「ピット」、光 Pick → 方形波をアンプへ。f = N·RPM/60。",
    timbre: {
      veryNarrow: "極窄パルス · 高次倍音が豊かで明るく鋭い",
      narrow: "窄パルス · 明るい撥弦風",
      square: "50% 近い方形 · 奇数倍音、典型的な方形波",
      wide: "広パルス · 低次倍音が強く厚い音色",
      ring: "長い弧穴 · ハイが長く丸みのある音",
    },
    harp: {
      statusSustain: "持続：タップ on/off · ストラム · キー 1–8",
      statusOnce: "単発：押している間発音 · ストラム · キー 1–8",
      latched: "（ロック中、再タップで off）",
      onceHint: "（単発）",
      playing: "第 {ring} 軌 · {design} · {freq} Hz ({note}){extra}",
      inner: "内",
      outer: "外",
    },
    disc: {
      lightOpen: "導通 · D={duty}%",
      blocked: "遮断 · {shape}",
      shapeCircle: "円孔",
      shapeSlot: "角穴",
      shapeArc: "弧",
    },
    wave: "パルス波 · {freq} Hz · デューティ {duty}%",
    spectrum: "倍音（デューティで音色変化、基本周波数は不変）",
    heat: { holes: "穴数 N →", rpm: "RPM →" },
    ringOpt: "第 {ring} 軌 · {holes} 穴 · {note} (≈{rpm} RPM)",
    tableTrack: "第 {ring} 軌",
    centsRel: " ({note} 比: {cents} ¢)",
    calc: {
      target: "目標 <strong>{note}</strong> ≈ <strong>{freq} Hz</strong>",
      rpmNeed:
        "穴数 <strong>{holes}</strong> のとき必要 RPM：<strong>{rpm}</strong>",
      holesNeed:
        "RPM <strong>{rpm}</strong> のとき必要穴数：<strong>{holes}</strong>",
      current:
        "現在 <strong>{freq} Hz</strong> ({note})、目標差 <strong>{cents} ¢</strong>",
    },
  },

  es: {
    pageTitle: "Ventilador Harpa — Simulador",
    htmlLang: "es",
    header: {
      title: "Ventilador Harpa",
      titleEn: "Electric Fan Harp",
      subtitle: "Cuerdas ópticas · agujeros × RPM → tono · herramienta de diseño",
    },
    lang: { zh: "中文", "zh-TW": "繁體", en: "EN", ja: "日本語", es: "ES" },
    viz: {
      title: "Disco óptico · interpretación",
      playMode: "Modo de sonido",
      modeSustain: "Sostenido · toque on/off",
      modeOnce: "Pulsación · mantener para sonar",
      harpAria: "Teclado de anillos",
      strumHint: "Rasgueo: mantén y pasa por los anillos",
      harpStatus: "Activa el volumen maestro · teclas 1–8",
      waveAria: "Onda cuadrada",
      spectrumAria: "Espectro armónico",
      hint: "La forma del agujero define el ciclo de trabajo; el tono viene de N×RPM",
    },
    shortcuts: {
      title: "Atajos",
      mode: "Cambiar modo",
      rings: "Anillos (mantener)",
      wheel: "Zona variac · voltaje",
      shiftWheel: "Mitad de paso de bend",
    },
    controls: {
      title: "Control de interpretación",
      freq: "Frecuencia",
      note: "Nota",
      cents: "Desviación",
      pulses: "Pulsos/s",
      duty: "Ciclo de trabajo",
      pulseWidth: "Tiempo alto",
      ringSelect: "Pista concéntrica",
      resetDefaults: "Restaurar valores predeterminados",
      holes: "Agujeros N",
      holeShape: "Forma del agujero (ciclo → timbre)",
      holeType: "Tipo de forma",
      shapeCircle: "Agujero redondo",
      shapeSlot: "Ranura rectangular",
      shapeArc: "Ranura en arco",
      presetNarrow: "Pulso estrecho · brillante",
      presetSquare: "Onda cuadrada · 50%",
      presetWide: "Pulso ancho · anillo pleno",
      tangential: "Anchura tangencial",
      tangentialHint: "(vs. espacio entre agujeros)",
      radial: "Altura radial",
      radialHint: "(anchura de la ranura en la pista)",
      circleSize: "Diámetro del agujero",
      rpm: "RPM",
      speed: "Velocidades del ventilador",
      low: "Baja",
      mid: "Media",
      high: "Alta",
      presetLow: "RPM baja",
      presetMid: "RPM media",
      presetHigh: "RPM alta",
      variac: "Variación · variac (voltaje → RPM)",
      variacSens: "Sensibilidad del bend",
      variacSensFine: "Fina",
      variacSensMid: "Normal",
      variacSensFast: "Rápida",
      variacStepHint: "Rueda ±{step} V · Shift ±{stepFine}",
      variacStepHintActive: "Shift afinado · ±{step} V por paso",
      voltage: "Voltaje V",
      linkVoltage: "Voltaje vinculado a RPM",
      master: "Volumen maestro",
      volOn: "On",
      volOff: "Off",
      volHintOn: "Volumen activo · usa el teclado de anillos",
      volHintOff: "Activa el volumen maestro para tocar",
      volNeedMaster: "Activa el volumen maestro en el área de interpretación",
      shortcuts: "Atajos: M modo · teclas 1–8 anillos · mantener para sonar",
      wheelHint: "Rueda para bend; Shift mitad de paso; baja sens. = fino, alta = rápido",
    },
    calcPanel: {
      title: "Cálculo inverso · tono objetivo",
      desc: "Elige una nota; obtén RPM o agujeros necesarios.",
      targetNote: "Nota objetivo",
      tableTitle: "8 anillos · a RPM actual",
      heatmap: "Mapa agujeros × RPM (Hz)",
      thTrack: "Pista",
      thHoles: "Agujeros",
      thDesignNote: "Nota diseño",
      thDesignFreq: "Hz diseño",
      thCurrentFreq: "Hz actual",
      thNeedRpm: "RPM necesaria",
      thCents: "vs objetivo (¢)",
    },
    footer:
      "Como lectura óptica CD a escala: los agujeros son “pits”; fotodiodo → onda cuadrada al amplificador. f = N·RPM/60.",
    timbre: {
      veryNarrow: "Pulso muy estrecho · brillante y agudo",
      narrow: "Pulso estrecho · tipo punteo",
      square: "Casi 50% cuadrada · armónicos impares",
      wide: "Pulso ancho · graves más fuertes",
      ring: "Agujero largo · sonido pleno y suave",
    },
    harp: {
      statusSustain: "Sostenido: toque on/off · rasgueo · teclas 1–8",
      statusOnce: "Pulsación: mantener · rasgueo · teclas 1–8",
      latched: " (bloqueado, toque para apagar)",
      onceHint: " (pulsación)",
      playing: "Pista {ring} · {design} · {freq} Hz ({note}){extra}",
      inner: "Int",
      outer: "Ext",
    },
    disc: {
      lightOpen: "Abierto · D={duty}%",
      blocked: "Bloqueado · {shape}",
      shapeCircle: "redondo",
      shapeSlot: "ranura",
      shapeArc: "arco",
    },
    wave: "Pulso · {freq} Hz · ciclo {duty}%",
    spectrum: "Armónicos (el ciclo cambia el timbre)",
    heat: { holes: "Agujeros N →", rpm: "RPM →" },
    ringOpt: "Pista {ring} · {holes} agujeros · {note} (≈{rpm} RPM)",
    tableTrack: "Pista {ring}",
    centsRel: " (vs {note}: {cents} ¢)",
    calc: {
      target: "Objetivo <strong>{note}</strong> ≈ <strong>{freq} Hz</strong>",
      rpmNeed: "Con <strong>{holes}</strong> agujeros: <strong>{rpm} RPM</strong>",
      holesNeed: "A <strong>{rpm} RPM</strong>: <strong>{holes}</strong> agujeros",
      current: "Ahora <strong>{freq} Hz</strong> ({note}), <strong>{cents} ¢</strong> del objetivo",
    },
  },
};

let currentLang = localStorage.getItem("fan-harp-lang") || "zh";

function getNested(obj, path) {
  return path.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

function interpolate(str, params) {
  if (!str || !params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`
  );
}

function t(key, params) {
  const pack = FAN_I18N[currentLang] || FAN_I18N.zh;
  let val = getNested(pack, key);
  if (val == null) val = getNested(FAN_I18N.zh, key);
  if (val == null) return key;
  return interpolate(val, params);
}

function setLanguage(lang) {
  if (!FAN_I18N[lang]) return;
  currentLang = lang;
  localStorage.setItem("fan-harp-lang", lang);
  applyStaticTranslations();
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  if (typeof window.onFanLangChange === "function") {
    window.onFanLangChange();
  }
}

function applyStaticTranslations() {
  const pack = FAN_I18N[currentLang] || FAN_I18N.zh;
  document.documentElement.lang = pack.htmlLang;
  document.title = pack.pageTitle;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = getNested(pack, key);
    if (val == null) return;
    if (el.id === "masterVolumeLabel") return;
    if (el.hasAttribute("data-i18n-html")) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });

  document.querySelectorAll("#holeShape option[data-i18n]").forEach((opt) => {
    const key = opt.getAttribute("data-i18n");
    const val = getNested(pack, key);
    if (val != null) opt.textContent = val;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const val = getNested(pack, key);
    if (val != null) el.setAttribute("aria-label", val);
  });

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const k = `lang.${btn.dataset.lang}`;
    const val = getNested(pack, k);
    if (val) btn.textContent = val;
  });
}

function initI18n() {
  applyStaticTranslations();
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });
}

window.t = t;
window.setLanguage = setLanguage;
window.currentLang = () => currentLang;
window.initI18n = initI18n;
