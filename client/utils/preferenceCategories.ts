// client/utils/preferenceCategories.ts - Updated with Smart Matching

export interface PreferenceCategory {
  [key: string]: string;
}

export interface PreferenceCategories {
  [category: string]: PreferenceCategory;
}

// Enhanced matching rules with natural language understanding
interface MatchingRule {
  category: string;
  value: string;
  patterns: string[];
  synonyms: string[];
  context_clues: string[];
  numbers?: number[];
}

const ENHANCED_MATCHING_RULES: MatchingRule[] = [
  // AGE RANGE
  {
    category: 'ageRange',
    value: '18-24',
    patterns: ['giovane', 'ragazzo', 'ragazza', 'università', 'studio', 'studente'],
    synonyms: ['young', 'jeune', 'joven'],
    context_clues: ['ventun', 'venti', 'diciannove', 'diciotto'],
    numbers: [18, 19, 20, 21, 22, 23, 24]
  },
  {
    category: 'ageRange',
    value: '25-34',
    patterns: ['adulto', 'lavoratore', 'professionale', 'carriera'],
    synonyms: ['adult', 'adulte', 'adulto'],
    context_clues: ['venti', 'trenta', 'lavoro'],
    numbers: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34]
  },
  {
    category: 'ageRange',
    value: '35-44',
    patterns: ['maturo', 'esperienza', 'famiglia', 'responsabilità'],
    synonyms: ['mature', 'matur', 'maduro'],
    context_clues: ['quaranta', 'trent'],
    numbers: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44]
  },
  {
    category: 'ageRange',
    value: '45-54',
    patterns: ['esperto', 'senior', 'veterano'],
    synonyms: ['expert', 'senior', 'experto'],
    context_clues: ['cinquanta', 'quarant'],
    numbers: [45, 46, 47, 48, 49, 50, 51, 52, 53, 54]
  },
  {
    category: 'ageRange',
    value: '55+',
    patterns: ['anziano', 'pensionato', 'saggezza', 'nonno', 'nonna'],
    synonyms: ['elderly', 'âgé', 'anciano'],
    context_clues: ['sessanta', 'settanta', 'pensione'],
    numbers: [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80]
  },

  // COFFEE PERSONALITY
  {
    category: 'coffeePersonality',
    value: 'quick',
    patterns: ['veloce', 'espresso', 'fretta', 'rapido', 'presto', 'sbrigare', 'velocissimo', 'rapidissimo'],
    synonyms: ['fast', 'quick', 'rapid', 'vite', 'rápido'],
    context_clues: ['tempo', 'lavoro', 'occupato', 'impegnato']
  },
  {
    category: 'coffeePersonality',
    value: 'balanced',
    patterns: ['normale', 'classico', 'equilibrato', 'standard', 'solito', 'medio', 'regolare', 'tutti', 'come'],
    synonyms: ['normal', 'classic', 'standard', 'normal', 'clásico'],
    context_clues: ['tutti', 'comune', 'tipico']
  },
  {
    category: 'coffeePersonality',
    value: 'slow',
    patterns: ['calma', 'cappuccino', 'lento', 'rilassato', 'tranquillo', 'pausa', 'godere'],
    synonyms: ['slow', 'calm', 'relaxed', 'lent', 'lento'],
    context_clues: ['tempo', 'chiacchierare', 'conversazione']
  },

  // SOCIAL ENERGY
  {
    category: 'socialEnergy',
    value: 'introvert',
    patterns: ['timido', 'riservato', 'tranquillo', 'introverso', 'silenzioso', 'schivo'],
    synonyms: ['shy', 'introverted', 'timide', 'tímido'],
    context_clues: ['poche', 'persone', 'intimate', 'privato']
  },
  {
    category: 'socialEnergy',
    value: 'ambivert',
    patterns: ['normale', 'equilibrato', 'medio', 'dipende', 'situazione', 'tutti', 'come', 'persona'],
    synonyms: ['normal', 'balanced', 'normal', 'normal'],
    context_clues: ['umore', 'momento', 'contesto']
  },
  {
    category: 'socialEnergy',
    value: 'extrovert',
    patterns: ['socievole', 'estroverso', 'aperto', 'chiacchierone', 'amichevole', 'solare'],
    synonyms: ['social', 'extroverted', 'social', 'social'],
    context_clues: ['tante', 'persone', 'festa', 'gruppo']
  },

  // CONVERSATION TOPICS
  {
    category: 'conversationTopics',
    value: 'work',
    patterns: ['lavoro', 'carriera', 'professionale', 'business', 'ufficio', 'progetto', 'lavorare', 'solamente'],
    synonyms: ['work', 'career', 'travail', 'trabajo'],
    context_clues: ['azienda', 'collega', 'meeting']
  },
  {
    category: 'conversationTopics',
    value: 'hobbies',
    patterns: ['hobby', 'passioni', 'sport', 'musica', 'film', 'giochi', 'interessi', 'svago'],
    synonyms: ['hobbies', 'passion', 'loisirs', 'aficiones'],
    context_clues: ['tempo', 'libero', 'divertimento']
  },
  {
    category: 'conversationTopics',
    value: 'life_stories',
    patterns: ['storie', 'vita', 'esperienze', 'racconti', 'viaggi', 'famiglia', 'ricordi'],
    synonyms: ['stories', 'life', 'histoires', 'historias'],
    context_clues: ['passato', 'vissuto', 'esperienza']
  },
  {
    category: 'conversationTopics',
    value: 'current_events',
    patterns: ['news', 'attualità', 'politica', 'notizie', 'mondo', 'società', 'eventi'],
    synonyms: ['news', 'politics', 'actualités', 'noticias'],
    context_clues: ['giornale', 'televisione', 'internet']
  },
  {
    category: 'conversationTopics',
    value: 'creative',
    patterns: ['arte', 'creatività', 'design', 'pittura', 'fotografia', 'scrittura', 'artistico'],
    synonyms: ['art', 'creative', 'art', 'arte'],
    context_clues: ['museo', 'galleria', 'mostra']
  },

  // GROUP PREFERENCE
  {
    category: 'groupPreference',
    value: 'one_on_one',
    patterns: ['una', 'persona', 'sola', 'uno', 'individuale', 'privato', 'intimo', 'bene', 'pure'],
    synonyms: ['one', 'alone', 'seul', 'solo'],
    context_clues: ['tranquillo', 'personale', 'privato'],
    numbers: [1]
  },
  {
    category: 'groupPreference',
    value: 'small_group',
    patterns: ['piccolo', 'gruppo', 'poche', 'persone', 'ristretto', 'selezionato'],
    synonyms: ['small', 'group', 'petit', 'pequeño'],
    context_clues: ['amici', 'conoscenti'],
    numbers: [2, 3, 4]
  },
  {
    category: 'groupPreference',
    value: 'larger_group',
    patterns: ['grande', 'gruppo', 'tante', 'persone', 'molte', 'numeroso', 'festa'],
    synonyms: ['large', 'big', 'grand', 'grande'],
    context_clues: ['sociale', 'animato'],
    numbers: [5, 6, 7, 8, 9, 10]
  },

  // LOCATION PREFERENCE
  {
    category: 'locationPreference',
    value: 'quiet',
    patterns: ['tranquillo', 'silenzioso', 'riservato', 'quiete', 'pace', 'calmo', 'tranquilo'],
    synonyms: ['quiet', 'silent', 'calme', 'tranquilo'],
    context_clues: ['biblioteca', 'angolo', 'appartato']
  },
  {
    category: 'locationPreference',
    value: 'lively',
    patterns: ['vivace', 'animato', 'sociale', 'allegro', 'movimentato', 'energia'],
    synonyms: ['lively', 'animated', 'animé', 'animado'],
    context_clues: ['gente', 'musica', 'movimento']
  },
  {
    category: 'locationPreference',
    value: 'outdoor',
    patterns: ['aperto', 'fuori', 'terrazza', 'giardino', 'natura', 'aria', 'mare', 'parco', 'vicino'],
    synonyms: ['outdoor', 'outside', 'dehors', 'exterior'],
    context_clues: ['sole', 'cielo', 'verde']
  },
  {
    category: 'locationPreference',
    value: 'coworking',
    patterns: ['lavorare', 'computer', 'studio', 'produttivo', 'wifi', 'scrivania'],
    synonyms: ['work', 'study', 'travail', 'trabajo'],
    context_clues: ['laptop', 'progetto', 'concentrazione']
  },

  // SOCIAL GOALS
  {
    category: 'socialGoals',
    value: 'friendship',
    patterns: ['amici', 'amicizia', 'relazioni', 'legame', 'compagnia', 'affetto'],
    synonyms: ['friends', 'friendship', 'amitié', 'amistad'],
    context_clues: ['sincero', 'duraturo', 'vero']
  },
  {
    category: 'socialGoals',
    value: 'networking',
    patterns: ['networking', 'lavoro', 'professionale', 'opportunità', 'contatti', 'business'],
    synonyms: ['network', 'professional', 'réseau', 'contactos'],
    context_clues: ['carriera', 'collaborazione', 'progetto']
  },
  {
    category: 'socialGoals',
    value: 'fun',
    patterns: ['divertimento', 'divertire', 'svago', 'relax', 'spensierato', 'ridere'],
    synonyms: ['fun', 'entertainment', 'amusement', 'diversión'],
    context_clues: ['ridere', 'scherzare', 'leggerezza']
  },
  {
    category: 'socialGoals',
    value: 'learning',
    patterns: ['imparare', 'conoscenze', 'cultura', 'sapere', 'crescita', 'scoprire'],
    synonyms: ['learn', 'knowledge', 'apprendre', 'aprender'],
    context_clues: ['nuovo', 'esperienza', 'intelligente']
  },

  // MEETING FREQUENCY
  {
    category: 'meetingFrequency',
    value: 'daily',
    patterns: ['giorno', 'quotidiano', 'spesso', 'sempre', 'frequente', 'continuo'],
    synonyms: ['daily', 'often', 'quotidien', 'diario'],
    context_clues: ['ogni', 'tutti', 'giorni']
  },
  {
    category: 'meetingFrequency',
    value: 'weekly',
    patterns: ['settimana', 'settimanale', 'regolare', 'fisso'],
    synonyms: ['weekly', 'regular', 'hebdomadaire', 'semanal'],
    context_clues: ['volta', 'per']
  },
  {
    category: 'meetingFrequency',
    value: 'biweekly',
    patterns: ['quindicinale', 'tanto', 'qualche', 'volta', 'periodo'],
    synonyms: ['sometimes', 'occasionally', 'parfois', 'a veces'],
    context_clues: ['due', 'settimane']
  },
  {
    category: 'meetingFrequency',
    value: 'monthly',
    patterns: ['mese', 'mensile', 'raramente', 'poco', 'occasionale'],
    synonyms: ['monthly', 'rarely', 'mensuel', 'mensual'],
    context_clues: ['una', 'volta', 'al']
  }
];

// Simple Levenshtein distance for typo detection
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Enhanced matching function with fuzzy logic
export function smartMatchUserInput(userInput: string, category: string): string | null {
  const input = userInput.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  console.log(`🧠 Smart matching for category: ${category}, input: "${input}"`);

  const categoryRules = ENHANCED_MATCHING_RULES.filter(rule => rule.category === category);
  
  for (const rule of categoryRules) {
    let score = 0;
    
    // Check for numbers (especially for age)
    if (rule.numbers) {
      const numbers = input.match(/\d+/g);
      if (numbers) {
        for (const num of numbers) {
          if (rule.numbers.includes(parseInt(num))) {
            score += 100; // High score for exact number match
            console.log(`🎯 Number match: ${num} -> ${rule.value}`);
          }
        }
      }
    }
    
    // Check exact pattern matches
    for (const pattern of rule.patterns) {
      if (input.includes(pattern)) {
        score += 50;
        console.log(`✅ Pattern match: "${pattern}" -> ${rule.value}`);
      }
    }
    
    // Check synonyms (other languages)
    for (const synonym of rule.synonyms) {
      if (input.includes(synonym)) {
        score += 40;
        console.log(`🌍 Synonym match: "${synonym}" -> ${rule.value}`);
      }
    }
    
    // Check context clues
    for (const clue of rule.context_clues) {
      if (input.includes(clue)) {
        score += 20;
        console.log(`💡 Context clue: "${clue}" -> ${rule.value}`);
      }
    }
    
    // Fuzzy matching for typos (simple edit distance)
    for (const pattern of rule.patterns) {
      if (pattern.length > 3) { // Only for longer words
        const distance = levenshteinDistance(input, pattern);
        if (distance <= 2 && distance < pattern.length / 2) {
          score += 30 - (distance * 10);
          console.log(`🔧 Fuzzy match: "${input}" ≈ "${pattern}" (distance: ${distance}) -> ${rule.value}`);
        }
      }
    }
    
    // If we have a good score, return this match
    if (score >= 30) {
      console.log(`🎉 Match found: ${rule.value} (score: ${score})`);
      return rule.value;
    }
  }
  
  console.log(`❌ No match found for: "${input}"`);
  return null;
}

// Get user-friendly confirmation messages
export function getSmartConfirmation(category: string, value: string, userInput: string): string {
  const rule = ENHANCED_MATCHING_RULES.find(r => r.category === category && r.value === value);
  if (!rule) return `Ho capito: "${value}"`;
  
  // Personalized confirmations based on what the user said
  const input = userInput.toLowerCase();
  
  switch (category) {
    case 'ageRange':
      if (input.includes('24') || input.includes('venti')) {
        return "Perfetto! Sei nel gruppo dei giovani adulti! 🎓";
      }
      break;
      
    case 'locationPreference':
      if (input.includes('mare')) {
        return "Fantastico! Ti piacciono i posti tranquilli vista mare! 🌊";
      }
      if (input.includes('aperto') || input.includes('fuori')) {
        return "Ottimo! Preferisci gli spazi all'aperto! 🌳";
      }
      break;
      
    case 'coffeePersonality':
      if (input.includes('velocissimo') || input.includes('rapidissimo')) {
        return "Capito! Sei una persona super veloce con il caffè! ⚡";
      }
      break;
      
    case 'socialEnergy':
      if (input.includes('normale') || input.includes('tutti')) {
        return "Perfetto! Sei una persona equilibrata come la maggior parte di noi! 😊";
      }
      break;
      
    case 'conversationTopics':
      if (input.includes('solamente') || input.includes('solo')) {
        return "Chiaro! Ti concentri principalmente sul lavoro! 💼";
      }
      break;
  }
  
  // Default confirmation with display text
  const displayText = getCategoryDisplayText(category, value);
  return `Perfetto! Ho capito: "${displayText}" ✅`;
}

// Get display text for categories
export function getCategoryDisplayText(category: string, value: string): string {
  const categories: { [key: string]: { [key: string]: string } } = {
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

  return categories[category]?.[value] || value;
}

// Legacy function for backwards compatibility
export function matchUserInputToCategory(userInput: string, category: string): string | null {
  return smartMatchUserInput(userInput, category);
}