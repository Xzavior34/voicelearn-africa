import { wordErrorRate, characterErrorRate, codeSwitchPreservation, lexicalOverlapProxy } from '../lib/benchmark/metrics';
import { extractIntent } from '../lib/tutor/intent';
import { processLearnerTurn } from '../lib/tutor/session';
import { createInitialSession } from '../lib/tutor/schema';

const reference = "Why does negative times negative equal positive? My name is Philip, I am a software engineer, and how are you doing today? I hope you're doing very well.";

const saharaEn = "Why does negative times negative equal positive? My name is Philip, I am a software engineer, and how are you doing today? I hope youre doing very well.";
const saharaPcm = "Why does negative plus negative equal positive my name is Philip. I am a suture engineer and how are you doing today? I hope youre doing very well";

console.log("=== Sahara (en mode) ===");
console.log("WER:", wordErrorRate(reference, saharaEn));
console.log("CER:", characterErrorRate(reference, saharaEn));
console.log("Code-switch preservation:", codeSwitchPreservation(reference, saharaEn));
console.log("Lexical overlap:", lexicalOverlapProxy(reference, saharaEn));
const intentEn = extractIntent(saharaEn);
console.log("Intent concept:", intentEn.matchedConcept?.id);
console.log("Intent need:", intentEn.understanding.learningNeed);

console.log("\n=== Sahara (en-pcm mode) ===");
console.log("WER:", wordErrorRate(reference, saharaPcm));
console.log("CER:", characterErrorRate(reference, saharaPcm));
console.log("Code-switch preservation:", codeSwitchPreservation(reference, saharaPcm));
console.log("Lexical overlap:", lexicalOverlapProxy(reference, saharaPcm));
const intentPcm = extractIntent(saharaPcm);
console.log("Intent concept:", intentPcm.matchedConcept?.id);
console.log("Intent need:", intentPcm.understanding.learningNeed);

console.log("\n=== Downstream Tutor (en transcript) ===");
const session = createInitialSession();
const turn = processLearnerTurn(session, saharaEn);
console.log("Tutor matched:", turn.tutorResponse ? "YES" : "NO");
console.log("Follow-up Q:", turn.tutorResponse?.followUpQuestion);
console.log("Understanding:", turn.understandingSummary);
