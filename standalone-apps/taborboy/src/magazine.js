export const MAGAZINE = {
  "name": "TABORBOY",
  "description": "Candid letters, old kitchens, and stories found in print.",
  "lead": "Letters, recipes, and history",
  "credits": [
    "Collyn Tabor",
    "Nathan Tabor"
  ],
  "existingApp": "Motion Lab & Identity Blank",
  "binding": "TABORBOY_ASSETS",
  "fallbackBinding": "ASSETS",
  "theme": {
    "paper": "#f5edda",
    "ink": "#27221a",
    "muted": "#604439",
    "dark": "#312024",
    "accent": "#8c3026",
    "bright": "#f2d0a0",
    "cover": "#a64032"
  },
  "game": {
    "type": "quiz",
    "name": "Recipe Relay",
    "label": "Choose the next move in six kitchen challenges.",
    "rounds": [
      [
        "Your lentils are rinsed and your aromatics are chopped. What goes into the pot first?",
        [
          "Onion and a little oil",
          "Lemon juice",
          "A handful of cold flatbread"
        ],
        0,
        "Soften the onion before the lentils and water go in."
      ],
      [
        "The lentils have reached a strong boil. What’s the next move?",
        [
          "Turn the heat to its highest setting",
          "Lower the heat and simmer",
          "Take the pot off the stove"
        ],
        1,
        "A steady simmer cooks the lentils gently."
      ],
      [
        "You want a crisp cut edge on the squash. Where do the pieces go?",
        [
          "Stack them in a deep bowl",
          "Cover them with cold water",
          "Spread them in one layer on a baking tray"
        ],
        2,
        "Give the pieces room so their cut sides can brown."
      ],
      [
        "When do you add honey to the figs and yogurt bowl?",
        [
          "Just before serving",
          "Before rinsing the figs",
          "After putting the bowl away"
        ],
        0,
        "A last-minute drizzle stays distinct."
      ],
      [
        "Your modern blue-corn batter looks too thick to spoon. What helps?",
        [
          "Add a spoonful of water at a time",
          "Add a second cup of flour",
          "Cook the dry flour by itself"
        ],
        0,
        "A small amount of water lets you adjust without overshooting."
      ],
      [
        "The pantry recipe came from a magazine but you changed its ingredients. How do you label it?",
        [
          "A verbatim historical recipe",
          "A modern adaptation",
          "An anonymous medieval letter"
        ],
        1,
        "A modern adaptation credits the inspiration and makes the changes clear."
      ]
    ]
  },
  "issues": [
    {
      "id": "letters-and-lost-recipes",
      "number": "01",
      "title": "Letters & Lost Recipes",
      "deck": "A reader’s letter, a clay-tablet cookbook, and a lentil pot you can make tonight.",
      "category": "Letters & recipes",
      "cover": "boy-01",
      "alt": "TABORBOY Issue 01 cover with letters, lentils, honey and flatbread.",
      "pieces": [
        {
          "title": "The letter under the flour tin",
          "kind": "Fiction · Reader letter",
          "paragraphs": [
            "Dear TABORBOY, two years after my neighbor moved away, I found his note in an apron pocket: “You put too much garlic in the soup. Keep doing it.” I had called the recipe mine for twenty years. The note was the first evidence that anybody else remembered it.",
            "So I put on the apron, doubled the garlic, and made enough for somebody else. — A fictional letter from the TABORBOY desk."
          ]
        },
        {
          "title": "Lentils with onion and lemon",
          "kind": "Modern test-kitchen recipe · Serves 4",
          "paragraphs": [
            "A pantry recipe inspired by the idea of cooking from old food records. Yale’s Babylonian collection holds clay tablets that record dishes such as stews and broths."
          ],
          "steps": [
            "Rinse 1 cup brown or green lentils. Dice 1 onion and mince 2 garlic cloves.",
            "Soften the onion in 2 tablespoons olive oil for about 5 minutes. Stir in the garlic and ½ teaspoon ground cumin for 30 seconds.",
            "Add the lentils and 3 cups water. Bring to a boil, then simmer for 25–35 minutes until tender.",
            "Season with salt, 1 tablespoon lemon juice, and chopped parsley. Serve with warm flatbread."
          ],
          "sources": [
            [
              "Yale · Reconstructing Babylonian recipes",
              "https://macmillan.yale.edu/stories/what-did-ancient-babylonians-eat-yale-harvard-team-tested-their-recipes"
            ]
          ]
        }
      ]
    },
    {
      "id": "cleopatras-table",
      "number": "02",
      "title": "Cleopatra’s Table",
      "deck": "Ptolemaic Egypt through museum objects, followed by a modern fig-and-honey breakfast.",
      "category": "History & food",
      "cover": "boy-02",
      "alt": "Lapis and gold TABORBOY Issue 02 cover with figs, pomegranate and an amphora.",
      "pieces": [
        {
          "title": "A table in a changing world",
          "kind": "History",
          "paragraphs": [
            "Cleopatra VII was the final Ptolemaic ruler of Egypt. The Metropolitan Museum’s account of Ptolemaic art describes Egyptian and Greek practices that coexisted, especially in a kingdom whose capital sat on the Mediterranean.",
            "Use the gallery’s objects to ask whose kitchen or dining room survives in the record and whose does not."
          ],
          "sources": [
            [
              "The Met · Ptolemaic Egyptian art",
              "https://www.metmuseum.org/perspectives/egyptian-ptolemaic-art-installation"
            ]
          ]
        },
        {
          "title": "Figs, pomegranate and honey yogurt",
          "kind": "Modern test-kitchen recipe · Serves 2",
          "steps": [
            "Divide 1 cup plain yogurt between two bowls.",
            "Quarter 4 fresh figs and divide them between the bowls with ¼ cup pomegranate arils.",
            "Drizzle with 2 teaspoons honey. Finish with toasted walnuts or leave them out, and serve immediately."
          ]
        }
      ]
    },
    {
      "id": "dine-foodways",
      "number": "03",
      "title": "Diné Foodways",
      "deck": "Blue corn, squash, and New Mexico stories, with the sources in view.",
      "category": "Foodways",
      "cover": "boy-03",
      "alt": "TABORBOY Issue 03 cover featuring blue corn, squash and a New Mexico mesa.",
      "pieces": [
        {
          "title": "Start with the people and the place",
          "kind": "Editor’s notebook",
          "paragraphs": [
            "This issue uses its New Mexico cover to open a reading list on living Diné foodways. Start with Diné educators and community sources when reading about agriculture and food. Record the source and contributor when a recipe or story is shared."
          ],
          "sources": [
            [
              "Diné College Libraries · Diné Bich’iyáán",
              "https://lib.dinecollege.edu/Special-Collections-Series/Navajo-Food-Research"
            ],
            [
              "Navajo Ethno-Agriculture · What we do",
              "https://navajofarming.org/what-we-do/"
            ]
          ]
        },
        {
          "title": "Roast squash and blue-corn cakes",
          "kind": "Modern test-kitchen recipe · Serves 4",
          "steps": [
            "Toss 1 pound cubed winter squash with 1 tablespoon olive oil and a pinch of salt. Roast in a single layer at 425°F for about 25 minutes, turning once.",
            "Mix ½ cup blue cornmeal, ½ cup all-purpose flour, 1 teaspoon baking powder, and ¼ teaspoon salt. Stir in 1 beaten egg and ¾ cup milk.",
            "Spoon small rounds onto a lightly oiled skillet over medium heat. Cook about 2 minutes per side, until both sides are set and browned. Serve with the roasted squash."
          ]
        }
      ]
    }
  ],
  "id": "taborboy",
  "version": "2026-11-19-magazine.1",
  "icons": {
    "192": "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",
    "512": "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"
  },
  "family": [
    [
      "TaborPoolBoys",
      "https://pub-2df43f63514844ecbcd9f7da4de75d89.r2.dev/index.html"
    ]
  ]
};
