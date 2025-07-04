// client/utils/preferenceCategories.ts

export interface PreferenceCategory {
  [key: string]: string;
}

export interface PreferenceCategories {
  [category: string]: PreferenceCategory;
}

// Standardized User Preference Categories for Caffis
export const USER_PREFERENCE_CATEGORIES: PreferenceCategories = {
  ageRange: {
    "18-24": "Giovane (18-24)",
    "25-34": "Adulto Giovane (25-34)", 
    "35-44": "Adulto (35-44)",
    "45-54": "Maturo (45-54)",
    "55+": "Esperto (55+)"
  },

  coffeePersonality: {
    "quick": "Veloce - Espresso e via",
    "balanced": "Equilibrato - Un caffè normale", 
    "slow": "Tranquillo - Cappuccino con calma"
  },

  socialEnergy: {
    "introvert": "Introverso - Preferisco conversazioni intime",
    "ambivert": "Equilibrato - Dipende dall'umore",
    "extrovert": "Estroverso - Amo conoscere tante persone"
  },

  conversationTopics: {
    "work": "Lavoro e Carriera",
    "hobbies": "Hobby e Passioni",
    "life_stories": "Storie di Vita",
    "current_events": "Attualità e News",
    "creative": "Arte e Creatività"
  },

  groupPreference: {
    "one_on_one": "Uno-a-uno - Solo io e un'altra persona",
    "small_group": "Piccolo gruppo - 3-4 persone",
    "larger_group": "Gruppo grande - 5+ persone"
  },

  locationPreference: {
    "quiet": "Tranquillo - Posto silenzioso e riservato",
    "lively": "Vivace - Caffetteria animata e sociale",
    "outdoor": "All'aperto - Terrazza o giardino",
    "coworking": "Coworking - Posto per lavorare insieme"
  },

  timePreference: {
    "spontaneous": "Spontaneo - Decido all'ultimo momento",
    "flexible": "Flessibile - Con un po' di preavviso",
    "planned": "Pianificato - Organizzo tutto in anticipo"
  },

  socialGoals: {
    "friendship": "Amicizie - Cerco nuovi amici sinceri",
    "networking": "Networking - Opportunità professionali", 
    "fun": "Divertimento - Solo per socializzare",
    "learning": "Apprendimento - Scambiare conoscenze"
  },

  meetingFrequency: {
    "daily": "Quotidiano - Ogni giorno se possibile",
    "weekly": "Settimanale - Una volta a settimana",
    "biweekly": "Quindicinale - Ogni due settimane", 
    "monthly": "Mensile - Una volta al mese"
  }
};

// AI matching keywords for each category
export const AI_KEYWORDS: { [category: string]: { [key: string]: string[] } } = {
  ageRange: {
    "18-24": ["giovane", "ragazzo", "ragazza", "università", "studio", "18", "19", "20", "21", "22", "23", "24"],
    "25-34": ["25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "adulto"],
    "35-44": ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44"],
    "45-54": ["45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "maturo"],
    "55+": ["55", "56", "57", "58", "59", "60", "senior", "anziano"]
  },

  coffeePersonality: {
    "quick": ["veloce", "espresso", "fretta", "rapido", "via", "presto"],
    "balanced": ["normale", "classico", "equilibrato", "standard", "solito"],
    "slow": ["calma", "cappuccino", "lento", "rilassato", "tranquillo"]
  },

  socialEnergy: {
    "introvert": ["timido", "riservato", "tranquillo", "introverso"],
    "ambivert": ["dipende", "equilibrato", "normale", "medio"],
    "extrovert": ["socievole", "estroverso", "aperto"]
  },

  conversationTopics: {
    "work": ["lavoro", "carriera", "professionale", "business"],
    "hobbies": ["hobby", "passioni", "sport", "musica"],
    "life_stories": ["storie", "vita", "esperienze", "racconti"],
    "current_events": ["news", "attualità", "politica"],
    "creative": ["arte", "creatività", "design"]
  },

  groupPreference: {
    "one_on_one": ["una", "solo", "persona", "uno", "1"],
    "small_group": ["piccolo", "gruppo", "3", "4", "poche"],
    "larger_group": ["grande", "tante", "molte", "5"]
  },

  locationPreference: {
    "quiet": ["tranquillo", "silenzioso", "riservato", "quiete"],
    "lively": ["vivace", "animato", "sociale"],
    "outdoor": ["aperto", "fuori", "terrazza"],
    "coworking": ["lavorare", "computer", "studio"]
  },

  timePreference: {
    "spontaneous": ["spontaneo", "subito", "ora", "improvviso"],
    "flexible": ["flessibile", "preavviso"],
    "planned": ["pianificare", "organizzare", "anticipo"]
  },

  socialGoals: {
    "friendship": ["amici", "amicizia"],
    "networking": ["networking", "lavoro", "professionale"],
    "fun": ["divertimento", "divertire"],
    "learning": ["imparare", "conoscenze"]
  },

  meetingFrequency: {
    "daily": ["giorno", "quotidiano", "spesso"],
    "weekly": ["settimana", "settimanale"],
    "biweekly": ["quindicinale", "tanto"],
    "monthly": ["mese", "mensile", "raramente"]
  }
};

// Function to match user input to categories
export function matchUserInputToCategory(userInput: string, category: string): string | null {
  const input = userInput.toLowerCase();
  const keywords = AI_KEYWORDS[category];
  
  if (!keywords) return null;
  
  // Check each category option
  for (const [key, keywordList] of Object.entries(keywords)) {
    for (const keyword of keywordList) {
      if (input.includes(keyword)) {
        return key;
      }
    }
  }
  
  return null; // No match found
}

// Get display text for a category value
export function getCategoryDisplayText(category: string, value: string): string {
  return USER_PREFERENCE_CATEGORIES[category]?.[value] || value;
}
