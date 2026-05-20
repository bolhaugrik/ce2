import type { CE2Composition } from '@ce2/core'

export const ZAVA_PROMO: CE2Composition = {
  "schema_version": "2.0",
  "meta": {
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "title": "Zava.hu webáruház bérlés — Pilot program"
  },
  "globals": {
    "background_color": "#0a0e27"
  },
  "audio_pool": [],
  "assets": [
    {
      "id": "music_bg_mp3",
      "kind": "audio",
      "url": "/assets/music.mp3",
      "duration_sec": 150
    },
    {
      "id": "vid_bg_mp4",
      "kind": "video",
      "url": "/assets/video.mp4",
      "duration_sec": 27
    }
  ],
  "bundles": [
    {
      "id": "bundle_cd_1",
      "kind": "countdown",
      "version": 1,
      "inputs": {
        "from_number": 196,
        "to_number": 0,
        "format": "integer",
        "color": "#90d4fe",
        "font_size_pct": 17
      },
      "exposes": {
        "editable_layers": ["countdown.visual"],
        "timing_hooks": ["enter", "exit"]
      },
      "meta": { "source": "preset_emit" }
    }
  ],
  "spanning_layers": [
    {
      "id": "music_bg",
      "label": "Háttérzene",
      "layer": "music",
      "source": { "kind": "asset", "asset_id": "music_bg_mp3" },
      "start": { "kind": "moment_start" },
      "duration": { "kind": "until_anchor", "anchor_ref": "moment.m_cta.end" },
      "volume": 0.9
    },
    {
      "id": "vid_1",
      "label": "Videó háttér",
      "layer": "video",
      "source": { "kind": "asset", "asset_id": "vid_bg_mp4", "trim": { "in_sec": 0, "out_sec": 27 } },
      "start": { "kind": "moment_start" },
      "duration": { "kind": "until_anchor", "anchor_ref": "moment.m_cta.end" },
      "opacity": 0.6,
      "attached_effects": [{ "kind": "blur.gaussian", "radius_px": 15 }]
    }
  ],
  "moments": [
    {
      "id": "m_hook",
      "label": "Hook — kérdés",
      "layers": [
        {
          "id": "txt_hook_q",
          "label": "Hook kérdés",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "WEBÁRUHÁZAT INDÍTANÁL?",
            "font_family": "Montserrat", "font_weight": 800, "font_size_pct": 5.5,
            "color": "#ffffff", "text_align": "center", "max_width_pct": 88,
            "letter_spacing_em": 0.02, "line_height": 1.25
          }},
          "position": "screen.center",
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 2.5 },
          "attached_effects": [
            { "kind": "text.shadow", "color": "#000000", "offset_x": 0, "offset_y": 3, "blur_px": 10 } as any,
            { "kind": "motion.float", "amplitude_px": 8, "period_sec": 2 }
          ],
          "in_transition": { "kind": "fade", "duration_sec": 0.3 },
          "out_transition": { "kind": "fade", "duration_sec": 0.3 }
        },
        {
          "id": "txt_hook_sub",
          "label": "Hook alcím",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "De nem akarsz fejlesztőkre várni?",
            "font_family": "Inter", "font_weight": 500, "font_size_pct": 4.5,
            "color": "#7dd3fc", "text_align": "center", "max_width_pct": 80
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 1190 } },
          "start": { "kind": "after_previous", "offset_sec": -1.5 },
          "duration": { "kind": "fixed_sec", "value": 1.5 },
          "in_transition": { "kind": "fade", "duration_sec": 0.3 }
        }
      ]
    },
    {
      "id": "m_problem",
      "label": "Probléma",
      "layers": [
        {
          "id": "txt_problem",
          "label": "Probléma fő szöveg",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "Egy webshop fejlesztése",
            "font_family": "Inter", "font_weight": 600, "font_size_pct": 4.5,
            "color": "#ffffff", "text_align": "center", "max_width_pct": 85
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 300 } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 3 },
          "in_transition": { "kind": "fade", "duration_sec": 0.3 },
          "out_transition": { "kind": "fade", "duration_sec": 0.3 }
        },
        {
          "id": "txt_problem_big",
          "label": "Probléma nagy szó",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "HÓNAPOK",
            "font_family": "Anton", "font_weight": 900, "font_size_pct": 9.5,
            "color": "#ef4444", "text_align": "center", "letter_spacing_em": 0.05
          }},
          "position": "screen.center",
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 3 },
          "attached_effects": [
            { "kind": "motion.shake", "intensity_px": 3, "speed": "normal" },
            { "kind": "text.shadow", "color": "#000000", "offset_x": 4, "offset_y": 4, "blur_px": 8 } as any
          ],
          "in_transition": { "kind": "zoom_in", "duration_sec": 0.4 },
          "out_transition": { "kind": "fade", "duration_sec": 0.3 }
        },
        {
          "id": "txt_problem_sub",
          "label": "Probléma alcím",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "és milliós költség...",
            "font_family": "Inter", "font_weight": 500, "font_style": "italic", "font_size_pct": 4.5,
            "color": "#fca5a5", "text_align": "center"
          }},
          "position": { "anchor": "screen.bottom-center", "offset": { "x": 0, "y": -197 } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 3 },
          "in_transition": { "kind": "slide", "from": "bottom", "duration_sec": 0.4 } as any
        }
      ]
    },
    {
      "id": "m_solution",
      "label": "Megoldás — Zava",
      "layers": [
        {
          "id": "txt_solution_label",
          "label": "Megoldás label",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "VAN EGY JOBB ÚT",
            "font_family": "Inter", "font_weight": 700, "font_size_pct": 3.5,
            "color": "#7dd3fc", "text_align": "center", "letter_spacing_em": 0.2
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 538 } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 4 },
          "in_transition": { "kind": "fade", "duration_sec": 0.4 }
        },
        {
          "id": "txt_brand",
          "label": "Brand név",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "zava.hu",
            "font_family": "Montserrat", "font_weight": 900, "font_size_pct": 10.5,
            "color": "#ffffff", "text_align": "center", "letter_spacing_em": -0.02
          }},
          "position": "screen.center",
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 4 },
          "attached_effects": [
            { "kind": "text.neon", "glow_color": "#7dd3fc", "glow_size_px": 25, "intensity": 1.2 } as any
          ],
          "in_transition": { "kind": "blur_in", "duration_sec": 0.5 },
          "out_transition": { "kind": "zoom_out", "duration_sec": 0.5 }
        },
        {
          "id": "txt_brand_sub",
          "label": "Brand alcím",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "Webáruház bérlés havi díjért",
            "font_family": "Inter", "font_weight": 500, "font_size_pct": 5,
            "color": "#e0e7ff", "text_align": "center", "max_width_pct": 100,
            "text_transform": "uppercase"
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 1248 } },
          "start": { "kind": "after_previous", "offset_sec": -3 },
          "duration": { "kind": "fixed_sec", "value": 3 },
          "in_transition": { "kind": "zoom_in", "duration_sec": 0.5 },
          "out_transition": { "kind": "zoom_out", "duration_sec": 0.5 }
        }
      ]
    },
    {
      "id": "m_benefits",
      "label": "Előnyök",
      "layers": [
        {
          "id": "txt_benefits_title",
          "label": "Előnyök cím",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "MIÉRT ÉRI MEG?",
            "font_family": "Montserrat", "font_weight": 800, "font_size_pct": 4.5,
            "color": "#fbbf24", "text_align": "center", "letter_spacing_em": 0.05
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 300 } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 5 },
          "in_transition": { "kind": "fade", "duration_sec": 0.3 },
          "out_transition": { "kind": "fade", "duration_sec": 0.3 }
        },
        {
          "id": "txt_b1", "label": "✓ Indulás 24 óra alatt",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "✓ Indulás 24 óra alatt",
            "font_family": "Inter", "font_weight": 600, "font_size_pct": 3,
            "color": "#ffffff", "text_align": "left", "max_width_pct": 100
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 730 } },
          "start": { "kind": "anchor", "anchor_ref": "moment.m_benefits.start", "offset_sec": 0 },
          "duration": { "kind": "until_anchor", "anchor_ref": "moment.m_benefits.end" },
          "in_transition": { "kind": "slide", "from": "left", "duration_sec": 0.4 } as any
        },
        {
          "id": "txt_b2", "label": "✓ Nincs fejlesztési költség",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "✓ Nincs fejlesztési költség",
            "font_family": "Inter", "font_weight": 600, "font_size_pct": 3,
            "color": "#ffffff", "text_align": "left", "max_width_pct": 100
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 864 } },
          "start": { "kind": "anchor", "anchor_ref": "moment.m_benefits.start", "offset_sec": 1 },
          "duration": { "kind": "until_anchor", "anchor_ref": "moment.m_benefits.end" },
          "in_transition": { "kind": "slide", "from": "left", "duration_sec": 0.4 } as any
        },
        {
          "id": "txt_b3", "label": "✓ Folyamatos támogatás",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "✓ Folyamatos támogatás",
            "font_family": "Inter", "font_weight": 600, "font_size_pct": 3,
            "color": "#ffffff", "text_align": "left", "max_width_pct": 100
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 998 } },
          "start": { "kind": "anchor", "anchor_ref": "moment.m_benefits.start", "offset_sec": 2 },
          "duration": { "kind": "until_anchor", "anchor_ref": "moment.m_benefits.end" },
          "in_transition": { "kind": "slide", "from": "left", "duration_sec": 0.4 } as any
        },
        {
          "id": "txt_b4", "label": "✓ Skálázható megoldás",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "✓ Skálázható megoldás",
            "font_family": "Inter", "font_weight": 600, "font_size_pct": 3,
            "color": "#ffffff", "text_align": "left", "max_width_pct": 100
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 1133 } },
          "start": { "kind": "anchor", "anchor_ref": "moment.m_benefits.start", "offset_sec": 3 },
          "duration": { "kind": "until_anchor", "anchor_ref": "moment.m_benefits.end" },
          "in_transition": { "kind": "slide", "from": "left", "duration_sec": 0.4 } as any
        }
      ]
    },
    {
      "id": "m_pilot",
      "label": "Pilot program",
      "layers": [
        {
          "id": "shape_pilot_bg",
          "label": "Sárga háttér",
          "layer": "vector",
          "source": { "kind": "shape", "shape": "rect", "geom": { "x": 0, "y": 0, "width": 1080, "height": 1920, "fill": "#fbbf24" } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 4 },
          "opacity": 0.6, "z_within_layer": 2,
          "in_transition": { "kind": "fade", "duration_sec": 0.3 },
          "out_transition": { "kind": "fade", "duration_sec": 0.3 }
        },
        {
          "id": "txt_pilot_label",
          "label": "Pilot label",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "PILOT PROGRAM",
            "font_family": "Anton", "font_weight": 900, "font_size_pct": 5,
            "color": "#0a0e27", "text_align": "center", "letter_spacing_em": 0.1
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 480 } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 4 },
          "z_within_layer": 2,
          "in_transition": { "kind": "slide", "from": "top", "duration_sec": 0.4 } as any
        },
        {
          "id": "txt_pilot_main",
          "label": "Pilot fő szöveg",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "Csak az első\n20 partner!",
            "font_family": "Montserrat", "font_weight": 900, "font_size_pct": 6.5,
            "color": "#0a0e27", "text_align": "center", "line_height": 1.1
          }},
          "position": "screen.center",
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 4 },
          "z_within_layer": 2,
          "attached_effects": [
            { "kind": "motion.pulse", "scale_min": 0.97, "scale_max": 1.04, "period_sec": 0.9 } as any
          ],
          "in_transition": { "kind": "zoom_in", "duration_sec": 0.5 }
        },
        {
          "id": "txt_pilot_offer",
          "label": "Pilot ajánlat",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "Kedvezményes havi díj + ingyenes beüzemelés",
            "font_family": "Inter", "font_weight": 600, "font_size_pct": 3.5,
            "color": "#0a0e27", "text_align": "center", "max_width_pct": 88
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 1498 } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 4 },
          "z_within_layer": 2,
          "in_transition": { "kind": "fade", "duration_sec": 0.4 }
        },
        {
          "id": "cd_vis_2",
          "label": "Visszaszámláló",
          "layer": "vector",
          "bundle_id": "bundle_cd_1",
          "bundle_role": "countdown.visual",
          "source": { "kind": "computed", "logic_id": "countdown_visual", "inputs": {} },
          "position": { "anchor": "screen.center", "offset": { "x": 0, "y": 296 } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "until_anchor", "anchor_ref": "moment.m_pilot.end" },
          "opacity": 0.4, "z_within_layer": 1,
          "in_transition": { "kind": "fade", "duration_sec": 0.3 },
          "out_transition": { "kind": "fade", "duration_sec": 0.3 },
          "attached_effects": [
            { "kind": "motion.pulse", "scale_min": 0.95, "scale_max": 1.81, "period_sec": 1 } as any,
            { "kind": "motion.shake", "intensity_px": 27, "speed": "fast" }
          ]
        }
      ]
    },
    {
      "id": "m_cta",
      "label": "CTA — Jelentkezés",
      "layers": [
        {
          "id": "txt_cta_top",
          "label": "CTA fő szöveg",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "JELENTKEZZ MOST!",
            "font_family": "Anton", "font_weight": 900, "font_size_pct": 8,
            "color": "#fbbf24", "text_align": "center", "letter_spacing_em": 0.05
          }},
          "position": { "anchor": "screen.top-center", "offset": { "x": 0, "y": 251 } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 4 },
          "attached_effects": [
            { "kind": "motion.pulse", "scale_min": 0.96, "scale_max": 1.06, "period_sec": 0.7 } as any,
            { "kind": "text.shadow", "color": "#000000", "offset_x": 0, "offset_y": 4, "blur_px": 12 } as any
          ],
          "in_transition": { "kind": "zoom_in", "duration_sec": 0.4 },
          "out_transition": { "kind": "fade", "duration_sec": 0.4 }
        },
        {
          "id": "txt_cta_url",
          "label": "CTA URL",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "zava.hu/pilot",
            "font_family": "Montserrat", "font_weight": 700, "font_size_pct": 6,
            "color": "#ffffff", "text_align": "center", "letter_spacing_em": 0.05
          }},
          "position": "screen.center",
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 4 },
          "attached_effects": [
            { "kind": "text.neon", "glow_color": "#7dd3fc", "glow_size_px": 18, "intensity": 1 } as any
          ],
          "in_transition": { "kind": "fade", "duration_sec": 0.4 }
        },
        {
          "id": "txt_cta_sub",
          "label": "CTA alcím",
          "layer": "vector",
          "source": { "kind": "text", "payload": {
            "content": "Korlátozott helyek\nne maradj le!",
            "font_family": "Inter", "font_weight": 500, "font_style": "italic", "font_size_pct": 4.5,
            "color": "#fca5a5", "text_align": "center"
          }},
          "position": { "anchor": "screen.bottom-center", "offset": { "x": 0, "y": -87 } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 4 },
          "in_transition": { "kind": "fade", "duration_sec": 0.5 }
        }
      ]
    }
  ]
} as CE2Composition
