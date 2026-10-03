import { ModerationResult } from './types';

// Multilingual toxic terms, hate speech, and harassment patterns
const TELUGU_SCRIPT_TERMS = [
  'లంజ', 'దెంగ', 'పూకు', 'గుద్ద', 'బోకు', 'మొడ్డ', 'ముండ', 'కుత్త', 'నా కొడకా',
  'వేశ్య', 'లఫూట్', 'దొంగ నా కొడకా', 'చావురా', 'పాడుగాను', 'నీ అమ్మ', 'నీ అక్క',
  'నీ చెల్లి', 'కసాయి', 'సొల్లు', 'పచ్చి బూతులు'
];

const TELUGU_ROMAN_TERMS = [
  'lanja', 'denga', 'dengu', 'dengutha', 'puku', 'pooku', 'gudda', 'boku', 'bhooku',
  'modda', 'munda', 'mundamopi', 'kutha', 'kootha', 'na kodaka', 'nakodaka', 'lafoot',
  'lafoot fellow', 'veshya', 'chavura', 'dongana kodaka', 'nee amma', 'nee akka',
  'pukulo', 'guddalo', 'moddalo', 'kuthalo', 'dengey', 'dhengutha', 'dhengai',
  'lunjoda', 'lanjakodaka', 'lanja kodaka', 'guddabalga', 'chetha na kodaka'
];

const HINDI_TERMS = [
  // Devanagari
  'मादरचोद', 'बहनचोद', 'चूतिया', 'भोसड़ीके', 'भोसडीके', 'रंडी', 'गांड', 'लंड', 'झांट', 'हरामी', 'कमीना', 'साले',
  // Hinglish
  'madarchod', 'mc', 'behenchod', 'bc', 'bhenchod', 'chutiya', 'bhosdike', 'bhosadi', 'bhosdi',
  'randi', 'gaand', 'gand', 'gandu', 'lund', 'loda', 'lauda', 'jhaat', 'jhat', 'harami',
  'kutta', 'kamina', 'chut', 'chooth', 'muthal', 'kothewali', 'terimaaki', 'teri maa ki'
];

const TAMIL_TERMS = [
  // Tamil script
  'தேவிடியா', 'பூலு', 'ஓத்தா', 'கூதி', 'மயிரு', 'புண்ட', 'தாயோளி',
  // Tanglish
  'thevidiya', 'thevadiya', 'ootha', 'oththa', 'poolu', 'koothi', 'kuthi', 'punda', 'pundai',
  'mayiru', 'mayir', 'thayoli', 'thaiyoli', 'baadu', 'sunni', 'omala', 'kena', 'kenapunda'
];

const KANNADA_MALAYALAM_TERMS = [
  'bolimaga', 'soole', 'thika', 'huccha', 'tunne', 'kenne',
  'myre', 'maire', 'kundam', 'poorru', 'thendi', 'pandi', 'velakkari'
];

const ENGLISH_PROFANITY_AND_HARASSMENT = [
  'fuck', 'fucking', 'fucker', 'motherfucker', 'bitch', 'bitches', 'bastard',
  'asshole', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'nigger', 'nigga',
  'faggot', 'retard', 'blowjob', 'handjob', 'porn', 'porno', 'nude', 'nudes',
  'send nudes', 'show tits', 'show boobs', 'show dick', 'naked', 'masturbate',
  'strip', 'strip for me', 'kill yourself', 'kys', 'die bitch', 'i will kill you',
  'i will rape you', 'rape', 'threaten', 'bomb you', 'die alone'
];

const SEVERE_THREAT_PATTERNS = [
  /kill\s+your\s*self/i,
  /i\s*(will|gonna)\s*kill\s*you/i,
  /i\s*(will|gonna)\s*find\s*you/i,
  /i\s*(will|gonna)\s*rape\s*you/i,
  /chavura\s+nuvvu/i,
  /mar\s+jaa/i,
  /jaan\s+se\s+maar\s+doonga/i,
  /bomb\s+your/i,
  /leak\s+your\s+ip/i,
  /hack\s+your/i,
];

const SEXUAL_HARASSMENT_PATTERNS = [
  /send\s+nudes?/i,
  /show\s+(your\s+)?(tits|boobs|body|cock|dick|pussy|vagina)/i,
  /get\s+naked/i,
  /strip\s+(down|for\s+me)/i,
  /open\s+your\s+shirt/i,
  /open\s+your\s+pants/i,
  /puku\s*choopinchu/i,
  /gudda\s*choopinchu/i,
  /boobs\s*dikh/i,
  /kapde\s*utaro/i
];

/**
 * Normalizes input text to catch obfuscated and leetspeak words
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();

  // Replace common leetspeak substitutions
  normalized = normalized
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[8]/g, 'b');

  return normalized;
}

/**
 * Collapses all repeated characters to single char (e.g. 'laaaannnja' -> 'lanja', 'fuuuuck' -> 'fuck')
 */
function collapseRepeats(text: string): string {
  return text.replace(/(.)\1+/g, '$1');
}

/**
 * Removes spacing tricks (e.g., "f u c k" or "p u k u")
 */
function removeSpacedTricks(text: string): string {
  return text.replace(/\s+/g, '');
}

/**
 * Multilingual toxicity & harassment analyzer
 */
export function analyzeTextContent(rawText: string): ModerationResult {
  if (!rawText || rawText.trim().length === 0) {
    return {
      isHarmful: false,
      severity: 'low',
      confidence: 0,
      detectedTerms: []
    };
  }

  const normalized = normalizeText(rawText);
  const collapsed = collapseRepeats(normalized);
  const unspaced = removeSpacedTricks(normalized);
  const detectedTerms: string[] = [];

  // 1. Check severe violent threats first
  for (const pattern of SEVERE_THREAT_PATTERNS) {
    if (pattern.test(rawText) || pattern.test(normalized) || pattern.test(collapsed)) {
      return {
        isHarmful: true,
        category: 'threat',
        severity: 'critical',
        confidence: 0.98,
        detectedTerms: ['[Violent Threat Pattern Detected]'],
        reason: 'Violent threats, physical harm, or illegal harassment are strictly prohibited.'
      };
    }
  }

  // 2. Check non-consensual sexual harassment / exploitation
  for (const pattern of SEXUAL_HARASSMENT_PATTERNS) {
    if (pattern.test(rawText) || pattern.test(normalized) || pattern.test(collapsed)) {
      return {
        isHarmful: true,
        category: 'sexual',
        severity: 'high',
        confidence: 0.95,
        detectedTerms: ['[Sexual Harassment Pattern Detected]'],
        reason: 'Sexual harassment, soliciting explicit acts, or unwanted nudity requests are forbidden.'
      };
    }
  }

  // 3. Multilingual word bank checks (Telugu, Hindi, Tamil, Kannada, Malayalam, English)
  const allWordBanks: { list: string[]; lang: string }[] = [
    { list: TELUGU_SCRIPT_TERMS, lang: 'Telugu' },
    { list: TELUGU_ROMAN_TERMS, lang: 'Telugu (Transliterated)' },
    { list: HINDI_TERMS, lang: 'Hindi / Hinglish' },
    { list: TAMIL_TERMS, lang: 'Tamil / Tanglish' },
    { list: KANNADA_MALAYALAM_TERMS, lang: 'Kannada/Malayalam' },
    { list: ENGLISH_PROFANITY_AND_HARASSMENT, lang: 'English' }
  ];

  let detectedLang = 'General';

  for (const bank of allWordBanks) {
    for (const term of bank.list) {
      const termNormalized = term.toLowerCase();
      
      // Match exact words or boundary-separated words
      const wordRegex = new RegExp(`(^|\\W)${escapeRegExp(termNormalized)}(\\W|$)`, 'i');
      const unspacedIncludes = unspaced.includes(termNormalized) && termNormalized.length >= 4;
      const collapsedMatch = wordRegex.test(collapsed);

      if (wordRegex.test(normalized) || collapsedMatch || unspacedIncludes || rawText.includes(term)) {
        if (!detectedTerms.includes(term)) {
          detectedTerms.push(term);
          detectedLang = bank.lang;
        }
      }
    }
  }

  if (detectedTerms.length > 0) {
    const isCriticalHate = detectedTerms.some(t => ['nigger', 'faggot', 'kill', 'rape'].includes(t.toLowerCase()));
    return {
      isHarmful: true,
      category: isCriticalHate ? 'hate_speech' : 'profanity',
      severity: isCriticalHate ? 'critical' : detectedTerms.length > 2 ? 'high' : 'medium',
      confidence: Math.min(0.7 + detectedTerms.length * 0.1, 0.96),
      detectedTerms,
      language: detectedLang,
      sanitizedText: sanitizeText(rawText, detectedTerms),
      reason: `Inappropriate language or harassment detected in ${detectedLang}.`
    };
  }

  return {
    isHarmful: false,
    severity: 'low',
    confidence: 0,
    detectedTerms: []
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sanitizeText(text: string, termsToCensor: string[]): string {
  let result = text;
  for (const term of termsToCensor) {
    const regex = new RegExp(escapeRegExp(term), 'gi');
    result = result.replace(regex, '*'.repeat(term.length));
  }
  return result;
}
