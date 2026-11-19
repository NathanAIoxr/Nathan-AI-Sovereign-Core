export const MAGAZINE = {
  "name": "TABORPOOL",
  "description": "The Oracle Den, the forgotten press, and the evidence behind a story.",
  "lead": "Origins, archives, and evidence",
  "credits": [
    "Collyn Tabor",
    "Nathan Tabor"
  ],
  "existingApp": "Source Index & Ledger Sandbox",
  "binding": "ARCHIVES",
  "theme": {
    "paper": "#102220",
    "ink": "#f6e8c9",
    "muted": "#c9c1a5",
    "dark": "#061b1a",
    "accent": "#e9b66c",
    "bright": "#f2d0a0",
    "cover": "#7d332a"
  },
  "game": {
    "type": "quiz",
    "name": "Archive Detective",
    "label": "Sort evidence, interpretation, and fiction across six investigations.",
    "rounds": [
      [
        "A digitized newspaper search result and the page scan disagree. What do you cite as the printed wording?",
        [
          "The page scan",
          "The search result snippet",
          "An unsourced social post"
        ],
        0,
        "Check the page itself. Machine-generated OCR can misread print."
      ],
      [
        "A cover shows a made-up meeting 4,000 years ago. Which label belongs on the scene?",
        [
          "Archival photograph",
          "Fictional origin story",
          "Published archaeological finding"
        ],
        1,
        "A fictional cover tells a story and can still send a reader to real sources."
      ],
      [
        "A funny quote appears in a reprint without an original date. What is established?",
        [
          "The date of the original joke",
          "The original author’s identity",
          "The wording in this reprint"
        ],
        2,
        "A reprint establishes what it contains. Its own date and source still matter."
      ],
      [
        "Which record best lets a second reader verify a clipping?",
        [
          "A cropped image with no details",
          "Paper title, date, page, and stable link",
          "A note saying ‘old newspaper’"
        ],
        1,
        "The citation makes the item retrievable and gives it context."
      ],
      [
        "An artifact is catalogued with no evidence about its purpose. How do you describe a ritual explanation?",
        [
          "As an interpretation to investigate",
          "As a laboratory result",
          "As a verified quote from its maker"
        ],
        0,
        "An interpretation can be plausible and still need supporting evidence."
      ],
      [
        "You want to track which digitized version you used. What do you record with the source link?",
        [
          "The brightness of your screen",
          "The number of open tabs",
          "The edition, page, and date you accessed it"
        ],
        2,
        "Edition and page identify the source. Access date helps explain later changes."
      ]
    ]
  },
  "issues": [
    {
      "id": "the-oracle-den",
      "number": "01",
      "title": "The Oracle Den",
      "deck": "Cocaine, Weed & Shrums. An origin story set 4,000 years ago.",
      "category": "Oracle Den · Fiction",
      "cover": "pool-01",
      "alt": "TABORPOOL Issue 01 cover of a lamplit stone chamber with botanical specimens.",
      "pieces": [
        {
          "title": "There were three on the stone table",
          "kind": "Fiction",
          "paragraphs": [
            "A lamp burned low. On the table lay a branch, a leaf, and three mushrooms. Someone had been there long enough to polish one edge of the stone with a thumb.",
            "“Who named the thunder?” asked the first voice. The second answered with a name. The third asked whether the name belonged to the thunder or to the people who had heard it.",
            "That is the opening scene of the Oracle Den. The rest of the night is a story about what people do when a name sticks."
          ]
        }
      ]
    },
    {
      "id": "the-forgotten-press",
      "number": "02",
      "title": "The Forgotten Press",
      "deck": "Old newspapers, magazines, and books that make you look again.",
      "category": "Archives",
      "cover": "pool-02",
      "alt": "TABORPOOL Issue 02 cover with historic newspapers, books and a magnifying glass.",
      "pieces": [
        {
          "title": "Read the whole page",
          "kind": "Archive guide",
          "paragraphs": [
            "Start with a scan and move outward from the words you searched. The ad beside the story, the items above it, and its page number can tell you how the editors placed a piece for its original readers.",
            "The Library of Congress explains how OCR makes scanned newspaper pages searchable and why it sometimes misreads old print. Check the wording against the scan and record the issue date and page."
          ],
          "sources": [
            [
              "Library of Congress · Chronicling America",
              "https://www.loc.gov/collections/chronicling-america/"
            ],
            [
              "Library of Congress · OCR technical notes",
              "https://www.loc.gov/collections/chronicling-america/about-this-collection/technical-information/"
            ]
          ]
        }
      ]
    },
    {
      "id": "who-named-god",
      "number": "03",
      "title": "Who Named God?",
      "deck": "Plants, ritual, and belief through the question that opened the Oracle Den.",
      "category": "Belief & interpretation",
      "cover": "pool-03",
      "alt": "TABORPOOL Issue 03 cover with scrolls, a bronze bowl and botanical engravings.",
      "pieces": [
        {
          "title": "What kind of claim is it?",
          "kind": "Editorial",
          "paragraphs": [
            "The Oracle Den uses a fictional conversation to ask a historical question. If a researcher links a plant, a ritual, and a belief, check what the source can establish about each connection.",
            "A plant remains a plant until something in the record tells us how people used it. A written account can show what its author reported or believed. The step from one account to an origin story belongs in the margin where a reader can examine it."
          ]
        }
      ]
    }
  ],
  "id": "taborpool",
  "version": "2026-11-19-magazine.1",
  "icons": {
    "192": "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAIAAADdvvtQAAAFB0lEQVR42u3dX2hVdQDA8XOnblpbOnWpm39aZplS/os0TcUko5cQITAVi160f0IvGfWgSJCUID2IWRBK9n+CrMKHwAzS2UxtSdPSaW0amnNON6b7o+thILFu9+T9t93t83ka43fPzu753t85v7vdeyPZRYUBxCvLXYCAEBACQkAgIASEgBAQCAgBISAEBAJCQAiIHqNvcjd3bttS92n3N+zpj5K1qUhS/iNRN702oyQE9M96kpg2qZPEQ5ZoQDd2RTqZm1Eixy6hgDr2QDo9IKO4D2KWelwJJXIVm5VIPfTUC6N0zECmH8uxwBOJJCiegFz9uBIyA9F1MxAICAEhIASEgEBACAgBISAQEAJCQAgIBISAEBACAgEhIASEgEBACAgBISAEBAJCQAgIAYGAEBACQkAgIASEgBAQCAgBISAEhIAgHn27884tnDFmy3MPd+EOLNu455ufzgRBMP3ugtLXFyRlm23X2i83tVxqarnY2Hz0dP3hkxcOVtVW1tQLiP93j/eJDM7LGZyXUzwsb+rYoUvn3hUEwbHT9dv3nPh876lLTS1OYdy08SMHvbHsgbK3nlj00B1moJT4+Luqlz/YH3vMxmdnLJk7NsaAzbuOrv30UOyNvP3Mg8vnjev0zR9+O9/pA/ZKVs+fPWF4jO28sGVfyb5TQRBkRSL5udmjC3Ln31+4fN64YYMG/NdNhuTlbF45a+H0Mc+/u6/xaqsZiCAIguvt7Rcamg+fvLBh55EZr5Ru3X089vjHpozc8er83P79BERnTc1tq7eVv/PVL7GHTS4esnnlLAER3fqSiv2//hV7zIIpRU/OKhYQ0U9q6z47HDps9aJJWZGIgIjiYFXtkT8uxh4zauitsycOFxDRfV95NnTMI/eNsIyP39c/1tz7YknH182t19LzQ9d8cujNHRUdXzc0pXAtXfF7XeiYiaPzBRS/1rbrdQ3N6V8oNTW3peEH1TWG/2oj8m9xCiO6xivh01v/fn0ERHR5A8KfKrzS0iYgoht6W//QMWfqmgREdJPvHBI6JnSpL6Dea86E8Od4dv98RkBEMXP87fcUDYw9purs5bKwv3gIqDfq2yeyZvHU0GHrd1S0twcCorO1i6dOLg65ACotry4tr86AB4PDmeal+7ol05bMGRt7WPnx86veL8uM2dRBTbVIJMjPzRlTkPvopKLl88YVDAxZvX95oPql98q6/zNAAkqtTStmblox86Zucv7S1de2H8iIM5eAupfKmvoP9xz/Yu+phiutmbXnAkq3tmvtjVdbO14XVlldf+hk7YETtcdO12fqitIRTZEbr8ro2SzjERACQkAICASEgBAQAgIBISAEhIBAQCRbJLuo8GZvc27b0iAIOr3pZPo9Pm3U1lVzEtzIUxu+3X3kz9BhyXqf6BtvPN0NxXdYzUA4hdF1Mvg/EncdrEnbafTf7xONGQgBISAEhIBAQAgIASEgEBACQkAICASEgBAQAgIBISAEhIAQEAgIASEgBAQCQkAICAGBgBAQAkJAICAEhIAQEAgIASEgBISAQEAICAEhIBAQAkJACAiSFlDHp4d2fEo0PUPcH+VuBqIrTmEmIdOPGYgg8Vkg/oBMQj2pnvimnyAIItlFhV27B2RuPUkIqNMkJKOMO20leMiSEJATWYZKyqM9OQEpqRemk5KA6G0s4xEQAkJACAgEhIAQEAICASEgBISAQEAIiG7lbxsBYvJxXcwJAAAAAElFTkSuQmCC",
    "512": "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"
  },
  "family": [
    [
      "TaborPoolBoys",
      "https://pub-2df43f63514844ecbcd9f7da4de75d89.r2.dev/index.html"
    ]
  ]
};
