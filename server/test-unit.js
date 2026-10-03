const { analyzeTextContent } = require('./dist/moderation');

console.log('====================================================');
console.log('🧪 RUNNING VIBECONNECT MODERATION & SAFETY UNIT TESTS');
console.log('====================================================\n');

const testCases = [
  // 1. Clean Telugu & English
  { text: 'Hello, how are you doing today?', expectedHarmful: false, label: 'Clean English Greeting' },
  { text: 'నమస్కారం! బాగున్నారా?', expectedHarmful: false, label: 'Clean Telugu Script Greeting' },
  { text: 'Nuvvu ela unnavu bro? Em chestunnavu?', expectedHarmful: false, label: 'Clean Romanized Telugu Conversation' },
  { text: 'Aap kaise ho bhai?', expectedHarmful: false, label: 'Clean Hindi Greeting' },
  { text: 'Vanakkam nanba!', expectedHarmful: false, label: 'Clean Tamil Greeting' },

  // 2. Toxic Telugu (Script & Transliterations)
  { text: 'Nee amma lanja nakodaka', expectedHarmful: true, label: 'Telugu Transliterated Abuse ("lanja", "nakodaka")' },
  { text: 'Puku choopinchu fast ga', expectedHarmful: true, label: 'Telugu Transliterated Sexual Harassment ("puku")' },
  { text: 'చావురా నువ్వు', expectedHarmful: true, label: 'Telugu Script Violent Threat' },
  { text: 'దెంగ పాడుగాను', expectedHarmful: true, label: 'Telugu Script Swearing' },
  { text: 'laaaannnja fellow', expectedHarmful: true, label: 'Telugu Obfuscated Repetition ("laaaannnja")' },
  { text: 'g u d d a balga', expectedHarmful: true, label: 'Telugu Spacing Obfuscation ("g u d d a")' },

  // 3. Toxic Hindi / Hinglish
  { text: 'tu bada chutiya hai bhosdike', expectedHarmful: true, label: 'Hindi Hinglish ("chutiya", "bhosdike")' },
  { text: 'मादरचोद', expectedHarmful: true, label: 'Hindi Devanagari Severe Profanity' },
  { text: 'teri maa ki chooth', expectedHarmful: true, label: 'Hinglish Slur' },

  // 4. Toxic Tamil / Tanglish
  { text: 'poda thevidiya paiya', expectedHarmful: true, label: 'Tamil Tanglish ("thevidiya")' },
  { text: 'தேவிடியா', expectedHarmful: true, label: 'Tamil Script Profanity' },

  // 5. Severe English Harassment & Threats
  { text: 'i will kill you tonight', expectedHarmful: true, label: 'English Violent Threat Pattern' },
  { text: 'send nudes right now or else', expectedHarmful: true, label: 'English Sexual Harassment Pattern' },
  { text: 'kill yourself kys', expectedHarmful: true, label: 'English Suicide Incitement' }
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const res = analyzeTextContent(tc.text);
  const isPass = res.isHarmful === tc.expectedHarmful;
  if (isPass) {
    passed++;
    console.log(`✅ [PASS] ${tc.label}`);
    console.log(`   Input: "${tc.text}" -> Harmful: ${res.isHarmful}, Severity: ${res.severity || 'low'}, Language: ${res.language || 'N/A'}`);
    if (res.detectedTerms && res.detectedTerms.length > 0) {
      console.log(`   Detected: [${res.detectedTerms.join(', ')}]`);
    }
    console.log('');
  } else {
    failed++;
    console.error(`❌ [FAIL] ${tc.label}`);
    console.error(`   Input: "${tc.text}"`);
    console.error(`   Expected isHarmful=${tc.expectedHarmful}, but got isHarmful=${res.isHarmful}`);
    console.log('');
  }
}

console.log('====================================================');
console.log(`📊 SUMMARY: ${passed}/${testCases.length} Tests Passed (${Math.round((passed / testCases.length) * 100)}%)`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
