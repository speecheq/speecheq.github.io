/**
 * SpeechEQ demo — leaderboard + radar share this config.
 * Subscale order matches SpeechEQ config.yaml (EQ-i 2.0: 5 mains × 3 subscales).
 * Results are combined over SpeechEQ_1000 + SpeechEQ_v2.
 * "overall" and "scores" are pooled accuracy (%) values.
 * "seq" follows the robust SEQ calculation in analysis/eval_explorer.py.
 */
(function () {
  var main = [
    "Self-Perception",
    "Self-Expression",
    "Interpersonal",
    "Decision Making",
    "Stress Management",
  ];

  var subs = [
    "Self-Regard",
    "Self-Actualization",
    "Emotional Self-Awareness",
    "Emotional Expression",
    "Assertiveness",
    "Independence",
    "Interpersonal Relationships",
    "Empathy",
    "Social Responsibility",
    "Problem Solving",
    "Reality Testing",
    "Impulse Control",
    "Flexibility",
    "Stress Tolerance",
    "Optimism",
  ];

  var axisTitles = subs.map(function (s, i) {
    return main[Math.floor(i / 3)] + " – " + s;
  });

  window.SPEECHEQ_CONFIG = {
    pageTitle: "SpeechEQ: Benchmarking Emotional Intelligence Quotient in Socially Aware Voice Conversational Models",
    subtitle:
      "",
    anonymizationNote:
      "",

    eqAxes: subs,
    axisTitles: axisTitles,
    eqMainScales: main,

    models: [
      {
        id: "Qwen3-Omni-30B",
        type: "Audio LLM",
        overall: 74.6,
        seq: 147.26,
        scores: [
          76.2, 70.9, 73.5, 78.5, 71.2, 72.8, 74.5, 77.8, 67.3, 75.5, 76.5, 80.5, 74.8,
          75.2, 73.8,
        ],
        seqScores: [
          248.39, 214.66, 127.24, 159.44, 152.03, 208.76, 132.19, 153.96, 111.47, 179.25,
          151.85, 158.46, 164.08, 151.85, 130.35,
        ],
      },
      {
        id: "Cascade (description)",
        type: "SER-LLM",
        overall: 60.0,
        seq: 115.29,
        scores: [
          52.6, 53.0, 68.5, 63.2, 54.0, 60.9, 66.2, 75.2, 57.0, 54.6, 61.3, 60.9, 52.6,
          59.3, 60.3,
        ],
        seqScores: [
          103.37, 110.12, 121.79, 122.76, 115.90, 155.65, 114.72, 148.34, 100.00, 113.49,
          110.12, 110.12, 94.94, 112.65, 110.96,
        ],
      },
      {
        id: "Cascade (numeric)",
        type: "SER-LLM",
        overall: 55.2,
        seq: 107.22,
        scores: [
          54.3, 55.6, 60.3, 50.0, 49.3, 49.7, 55.0, 60.6, 61.6, 48.7, 50.7, 59.3, 53.6,
          56.0, 63.9,
        ],
        seqScores: [
          106.74, 106.74, 111.67, 100.00, 100.00, 100.00, 100.00, 117.99, 108.09, 89.88,
          100.00, 121.36, 100.00, 107.59, 115.18,
        ],
      },
      {
        id: "gpt-audio-1.5",
        type: "Audio LLM",
        overall: 55.7,
        seq: 100.0,
        scores: [
          55.5, 53.6, 52.3, 55.6, 58.4, 54.0, 55.0, 56.7, 59.6, 51.7, 54.6, 52.6, 60.6,
          56.3, 58.5,
        ],
        seqScores: [
          100.00, 89.88, 95.33, 100.00, 107.23, 110.12, 101.84, 100.00, 100.00, 96.63,
          89.88, 89.88, 115.18, 100.00, 100.00,
        ],
      },
      {
        id: "gemini-2.5-pro",
        type: "Audio LLM",
        overall: 66.0,
        seq: 123.45,
        scores: [
          67.2, 63.2, 67.9, 73.2, 61.9, 65.9, 69.5, 68.2, 59.3, 64.2, 61.9, 74.5, 63.6, 64.9, 65.6
        ],
        seqScores: [
          134.69, 120.23, 117.90, 133.11, 110.12, 197.80, 117.90, 129.23, 102.76, 137.10, 
          109.11, 134.85, 114.61, 112.14, 110.12
        ],
      },
      {
        id: "kimi-audio-7b-instruct",
        type: "Audio LLM",
        overall: 49.1,
        seq: 86.59,
        scores: [
          47.7, 48.0, 43.4, 48.0, 52.0, 49.7, 51.3, 48.0, 50.3, 49.7, 48.7, 51.3, 52.3, 50.3, 45.7
        ],
        seqScores: [
          86.99, 76.87, 81.32, 85.28, 86.51, 83.14, 89.88, 89.88, 89.88, 86.51, 85.84, 
          89.88, 88.76, 89.88, 84.82
        ],
      },
      {
        id: "mimo-audio-7b-instruct",
        type: "Audio LLM",
        overall: 51.4,
        seq: 91.76,
        scores: [
          47.0, 52.0, 52.6, 51.0, 60.9, 48.7, 47.4, 54.3, 52.6, 52.6, 49.0, 47.4, 55.0, 48.0, 53.0
        ],
        seqScores: [
          81.21, 89.88, 94.55, 93.56, 105.62, 100.00, 89.88, 91.01, 95.40, 98.31, 88.87,
           84.26, 87.63, 83.81, 91.57
        ],
      },
      {
        id: "fun-audio-chat-8b",
        type: "Audio LLM",
        overall: 60.5,
        seq: 108.55,
        scores: [
          59.3, 55.3, 63.9, 66.9, 59.9, 52.3, 60.9, 60.9, 58.9, 58.9, 65.6, 62.6, 61.9, 63.6, 56.0
        ],
        seqScores: [
          110.12, 101.45, 107.00, 117.48, 102.25, 100.00, 103.11, 108.99, 100.00, 128.67, 
          114.16, 105.62, 104.50, 106.07, 100.00
        ],
      },
      {
        id: "Qwen2.5-Omni-3B",
        type: "Audio LLM",
        overall: 55.2,
        seq: 98.12,
        scores: [
          51.7, 57.6, 56.0, 55.3, 52.6, 51.3, 58.6, 54.6, 52.6, 55.3, 58.6, 56.6, 57.0,
          55.0, 55.0,
        ],
        seqScores: [
          83.14, 100.00, 100.00, 96.21, 94.22, 100.00, 98.16, 98.88, 89.88, 100.00,
          107.59, 100.00, 101.69, 92.41, 97.47,
        ],
      },
      {
        id: "Qwen2.5-Omni-7B",
        type: "Audio LLM",
        overall: 50.5,
        seq: 89.88,
        scores: [
          50.7, 43.7, 48.0, 49.7, 50.7, 47.0, 51.7, 47.7, 48.3, 52.6, 46.0, 57.9, 56.3,
          53.6, 53.0,
        ],
        seqScores: [
          89.88, 32.55, 90.66, 89.88, 86.99, 64.59, 89.88, 89.88, 85.16, 103.37, 81.03,
          98.88, 89.88, 89.88, 99.16,
        ],
      },
    ],

    radarPalette: [
      "rgba(46, 134, 222, 0.22)",
      "rgba(155, 89, 182, 0.22)",
      "rgba(22, 160, 133, 0.22)",
      "rgba(230, 126, 34, 0.22)",
      "rgba(128, 128, 128, 0.18)",
      "rgba(31, 119, 180, 0.14)",
      "rgba(231, 76, 60, 0.18)",
      "rgba(212, 172, 13, 0.18)",
      "rgba(232, 67, 147, 0.18)",
      "rgba(141, 110, 99, 0.18)",
    ],

    radarBorder: [
      "#2E86DE", "#9B59B6", "#16A085", "#E67E22", "#808080",
      "#1F77B4", "#E74C3C", "#D4AC0D", "#E84393", "#8D6E63",
    ],

    bibtex: `@inproceedings{anonymous2026speecheq,
  title     = {SpeechEQ: Benchmarking Emotional Intelligence Quotient in Socially Aware Voice Conversational Models},
  author    = {Anonymous},
  booktitle = {Under Review},
  year      = {2026},
  note      = {Anonymized submission; venue and details to be updated after acceptance}
}`,
  };
})();
