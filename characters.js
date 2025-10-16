/* ===========================================================
   Resort Life Sim — CHARACTERS (sourced from your previous build)
   - Preserves your original structure & values 1:1
   - Exposes window.CHARACTERS (array) and window.CHARACTER_PICS (name→URL)
   - No ES module exports (plain <script> compatible)
   =========================================================== */

/* ---- Character Pictures (from previous characterManager.js) ---- */
window.CHARACTER_PICS = {
  "zambia": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/zambia.png?v=1743943328604",
  "tulin": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/tulin.png?v=1743943336246",
  "esra": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/esra.png?v=1743943341609",
  "seher": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/seher.png?v=1743943347168",
  "sevgi": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/sevgi.png?v=1743943355033",
  "mehtap": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/mehtap.png?v=1743943368394",
  "ayca": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/ayca.png?v=1743943378760",
  "anastasia": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/anastasia.png?v=1743943382999",
  "sibel": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/sibel.png?v=1743943388817",
  "merve": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/charpics/merve.png?v=1743943492543",
  "selma": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/selma.png?v=1743943643448",
  "gulsah": "https://cdn.glitch.global/dfa54b71-8a23-47dd-9bd1-577841ad2835/gulsah.png?v=1743943669114"
};

/* ---- Characters (from your previous characters.js; unchanged fields) ---- */
window.CHARACTERS = [
  {
    "name": "Tulin",
    "age": 34,
    "height": 170,
    "weight": 56,
    "sexual_orientation": "bisexual",
    "background": "Yoga and tennis player, fit and attractive",
    "fighting_attributes": {
      "strength": 70,
      "agility": 75,
      "stamina": 65,
      "technique": 70,
      "reflexes": 75,
      "punching": 70,
      "kicking": 70,
      "endurance": 75
    },
    "physical_attributes": {
      "attractiveness": 80,
      "seduction": 75,
      "flirtiness": 70
    },
    "mental_attributes": {
      "dominance": 50,
      "loyalty": 60,
      "stability": 55,
      "craziness": 60,
      "jealousy": 30,
      "monogamy": 40,
      "cheating": 60
    },
    "championships": 0,
    "traits": ["Strategist"],
    // injury tracking
    "injuryLevel": null,    // "light", "moderate", "severe" or null
    "injuryDuration": 0     // how many days remaining
  },
  {
    "name": "Sevgi",
    "age": 29,
    "height": 165,
    "weight": 60,
    "sexual_orientation": "bisexual",
    "background": "Teacher and amateur runner, kind and cerebral",
    "fighting_attributes": {
      "strength": 65,
      "agility": 70,
      "stamina": 75,
      "technique": 72,
      "reflexes": 68,
      "punching": 62,
      "kicking": 66,
      "endurance": 80
    },
    "physical_attributes": {
      "attractiveness": 75,
      "seduction": 65,
      "flirtiness": 55
    },
    "mental_attributes": {
      "dominance": 40,
      "loyalty": 85,
      "stability": 80,
      "craziness": 30,
      "jealousy": 35,
      "monogamy": 70,
      "cheating": 15
    },
    "championships": 0,
    "traits": ["Empath"],
    "injuryLevel": null,
    "injuryDuration": 0
  },
  {
    "name": "Selma",
    "age": 31,
    "height": 170,
    "weight": 62,
    "sexual_orientation": "lesbian",
    "background": "Fitness instructor and sports coach, muscular and dominant",
    "fighting_attributes": {
      "strength": 90,
      "agility": 70,
      "stamina": 78,
      "technique": 68,
      "reflexes": 72,
      "punching": 85,
      "kicking": 75,
      "endurance": 75
    },
    "physical_attributes": {
      "attractiveness": 82,
      "seduction": 70,
      "flirtiness": 65
    },
    "mental_attributes": {
      "dominance": 85,
      "loyalty": 50,
      "stability": 60,
      "craziness": 50,
      "jealousy": 45,
      "monogamy": 35,
      "cheating": 55
    },
    "championships": 0,
    "traits": ["Dominant"],
    "injuryLevel": null,
    "injuryDuration": 0
  },
  {
    "name": "Seher",
    "age": 27,
    "height": 168,
    "weight": 57,
    "sexual_orientation": "bisexual",
    "background": "Dancer and Pilates trainer, flexible and calculating",
    "fighting_attributes": {
      "strength": 62,
      "agility": 80,
      "stamina": 68,
      "technique": 74,
      "reflexes": 82,
      "punching": 60,
      "kicking": 78,
      "endurance": 70
    },
    "physical_attributes": {
      "attractiveness": 83,
      "seduction": 78,
      "flirtiness": 80
    },
    "mental_attributes": {
      "dominance": 55,
      "loyalty": 45,
      "stability": 58,
      "craziness": 62,
      "jealousy": 40,
      "monogamy": 35,
      "cheating": 65
    },
    "championships": 0,
    "traits": ["Seductress"],
    "injuryLevel": null,
    "injuryDuration": 0
  },
  {
    "name": "Merve",
    "age": 26,
    "height": 166,
    "weight": 55,
    "sexual_orientation": "bisexual",
    "background": "Amateur MMA fan and blogger, quick learner",
    "fighting_attributes": {
      "strength": 60,
      "agility": 72,
      "stamina": 70,
      "technique": 68,
      "reflexes": 70,
      "punching": 64,
      "kicking": 66,
      "endurance": 72
    },
    "physical_attributes": {
      "attractiveness": 77,
      "seduction": 66,
      "flirtiness": 62
    },
    "mental_attributes": {
      "dominance": 48,
      "loyalty": 65,
      "stability": 68,
      "craziness": 45,
      "jealousy": 38,
      "monogamy": 55,
      "cheating": 35
    },
    "championships": 0,
    "traits": ["Adaptive"],
    "injuryLevel": null,
    "injuryDuration": 0
  },
  {
    "name": "Mehtap",
    "age": 33,
    "height": 171,
    "weight": 61,
    "sexual_orientation": "bisexual",
    "background": "Boxing gym owner, stern and uncompromising",
    "fighting_attributes": {
      "strength": 80,
      "agility": 68,
      "stamina": 75,
      "technique": 72,
      "reflexes": 68,
      "punching": 82,
      "kicking": 62,
      "endurance": 78
    },
    "physical_attributes": {
      "attractiveness": 79,
      "seduction": 60,
      "flirtiness": 50
    },
    "mental_attributes": {
      "dominance": 80,
      "loyalty": 55,
      "stability": 70,
      "craziness": 40,
      "jealousy": 35,
      "monogamy": 45,
      "cheating": 30
    },
    "championships": 0,
    "traits": ["Hardliner"],
    "injuryLevel": null,
    "injuryDuration": 0
  },
  {
    "name": "Gulsah",
    "age": 25,
    "height": 164,
    "weight": 53,
    "sexual_orientation": "bisexual",
    "background": "Sprinter with an infectious laugh and sneaky streak",
    "fighting_attributes": {
      "strength": 58,
      "agility": 78,
      "stamina": 66,
      "technique": 65,
      "reflexes": 80,
      "punching": 60,
      "kicking": 70,
      "endurance": 68
    },
    "physical_attributes": {
      "attractiveness": 76,
      "seduction": 68,
      "flirtiness": 74
    },
    "mental_attributes": {
      "dominance": 42,
      "loyalty": 50,
      "stability": 55,
      "craziness": 62,
      "jealousy": 45,
      "monogamy": 40,
      "cheating": 55
    },
    "championships": 0,
    "traits": ["Trickster"],
    "injuryLevel": null,
    "injuryDuration": 0
  },
  {
    "name": "Esra",
    "age": 27,
    "height": 169,
    "weight": 58,
    "sexual_orientation": "bisexual",
    "background": "Ex-fencer, precise and cool-headed",
    "fighting_attributes": {
      "strength": 66,
      "agility": 74,
      "stamina": 70,
      "technique": 80,
      "reflexes": 78,
      "punching": 64,
      "kicking": 68,
      "endurance": 72
    },
    "physical_attributes": {
      "attractiveness": 81,
      "seduction": 70,
      "flirtiness": 60
    },
    "mental_attributes": {
      "dominance": 52,
      "loyalty": 70,
      "stability": 72,
      "craziness": 38,
      "jealousy": 32,
      "monogamy": 60,
      "cheating": 25
    },
    "championships": 0,
    "traits": ["Precise"],
    "injuryLevel": null,
    "injuryDuration": 0
  },
  {
    "name": "Ayca",
    "age": 29,
    "height": 172,
    "weight": 60,
    "sexual_orientation": "bisexual",
    "background": "Volleyball player; upbeat, daring and competitive",
    "fighting_attributes": {
      "strength": 72,
      "agility": 76,
      "stamina": 73,
      "technique": 68,
      "reflexes": 74,
      "punching": 70,
      "kicking": 72,
      "endurance": 76
    },
    "physical_attributes": {
      "attractiveness": 84,
      "seduction": 72,
      "flirtiness": 78
    },
    "mental_attributes": {
      "dominance": 60,
      "loyalty": 55,
      "stability": 62,
      "craziness": 58,
      "jealousy": 40,
      "monogamy": 45,
      "cheating": 50
    },
    "championships": 0,
    "traits": ["Sparkplug"],
    "injuryLevel": null,
    "injuryDuration": 0
  },
  {
    "name": "Zambia",
    "age": 32,
    "height": 175,
    "weight": 64,
    "sexual_orientation": "bisexual",
    "background": "Powerlifter and charismatic alpha presence",
    "fighting_attributes": {
      "strength": 92,
      "agility": 70,
      "stamina": 78,
      "technique": 70,
      "reflexes": 68,
      "punching": 86,
      "kicking": 72,
      "endurance": 80
    },
    "physical_attributes": {
      "attractiveness": 85,
      "seduction": 68,
      "flirtiness": 60
    },
    "mental_attributes": {
      "dominance": 90,
      "loyalty": 45,
      "stability": 65,
      "craziness": 50,
      "jealousy": 42,
      "monogamy": 35,
      "cheating": 55
    },
    "championships": 0,
    "traits": ["Alpha"],
    "injuryLevel": null,
    "injuryDuration": 0
  },
  {
    "name": "Anastasia",
    "age": 27,
    "height": 168,
    "weight": 57,
    "sexual_orientation": "bisexual",
    "background": "Gymnast with poise and a wicked smirk",
    "fighting_attributes": {
      "strength": 62,
      "agility": 82,
      "stamina": 69,
      "technique": 76,
      "reflexes": 80,
      "punching": 58,
      "kicking": 74,
      "endurance": 70
    },
    "physical_attributes": {
      "attractiveness": 86,
      "seduction": 78,
      "flirtiness": 82
    },
    "mental_attributes": {
      "dominance": 58,
      "loyalty": 50,
      "stability": 60,
      "craziness": 66,
      "jealousy": 42,
      "monogamy": 40,
      "cheating": 58
    },
    "championships": 0,
    "traits": ["Temptress"],
    "injuryLevel": null,
    "injuryDuration": 0
  },
  {
    "name": "Sibel",
    "age": 30,
    "height": 169,
    "weight": 59,
    "sexual_orientation": "bisexual",
    "background": "Judo black belt, carries herself with quiet danger",
    "fighting_attributes": {
      "strength": 74,
      "agility": 70,
      "stamina": 74,
      "technique": 82,
      "reflexes": 72,
      "punching": 66,
      "kicking": 70,
      "endurance": 78
    },
    "physical_attributes": {
      "attractiveness": 80,
      "seduction": 62,
      "flirtiness": 50
    },
    "mental_attributes": {
      "dominance": 65,
      "loyalty": 70,
      "stability": 72,
      "craziness": 40,
      "jealousy": 36,
      "monogamy": 60,
      "cheating": 25
    },
    "championships": 0,
    "traits": ["Tactician"],
    "injuryLevel": null,
    "injuryDuration": 0
  }
];
