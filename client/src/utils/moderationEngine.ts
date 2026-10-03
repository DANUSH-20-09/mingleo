// Client-side quick safety validation engine

const TOXIC_PATTERNS = [
  // Telugu (Transliterated & Script)
  'lanja', 'denga', 'dengu', 'dengutha', 'puku', 'pooku', 'gudda', 'boku', 'modda', 'munda',
  'kutha', 'lafoot', 'veshya', 'చావురా', 'లంజ', 'దెంగ', 'పూకు', 'గుద్ద', 'మొడ్డ', 'ముండ',
  // Hindi
  'madarchod', 'behenchod', 'chutiya', 'bhosdike', 'randi', 'gaand', 'gandu', 'lund', 'harami',
  'मादरचोद', 'बहनचोद', 'चूतिया', 'भोसडीके', 'रंडी',
  // Tamil
  'thevidiya', 'ootha', 'poolu', 'koothi', 'punda', 'thayoli', 'baadu', 'தேவிடியா', 'பூலு',
  // English
  'fuck', 'bitch', 'cunt', 'dick', 'pussy', 'nigger', 'faggot', 'kill yourself', 'kys', 'send nudes', 'show tits'
];

export function quickClientModeration(text: string): { isClean: boolean; flaggedWord?: string } {
  if (!text) return { isClean: true };
  const lower = text.toLowerCase().replace(/[@4]/g, 'a').replace(/[3]/g, 'e').replace(/[1!]/g, 'i').replace(/[0]/g, 'o');

  for (const word of TOXIC_PATTERNS) {
    const wordLower = word.toLowerCase();
    const regex = new RegExp(`(^|\\W)${wordLower}(\\W|$)`, 'i');
    if (regex.test(lower) || (wordLower.length >= 4 && lower.replace(/\s+/g, '').includes(wordLower))) {
      return { isClean: false, flaggedWord: word };
    }
  }

  return { isClean: true };
}
