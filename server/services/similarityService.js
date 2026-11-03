import { ErrorCase } from '../models/ErrorCase.js';

/**
 * Normalizes error strings to create an invariant signature
 * Strips file paths, line/col numbers, hex memory addresses, timestamps
 */
export function generateErrorSignature(errorText, language = '') {
  if (!errorText) return 'unknown';

  let cleaned = errorText
    .toLowerCase()
    // Remove stack file paths and line numbers
    .replace(/(?:[a-z]:)?[/\\](?:[\w.-]+[/\\])+[\w.-]+(?::\d+)?(?::\d+)?/gi, '')
    // Remove line numbers like "line 42", "at line 15:3"
    .replace(/\b(?:line|at|column|col)\s*\d+(?::\d+)?\b/gi, '')
    // Remove hex addresses like 0x7ffd234...
    .replace(/0x[0-9a-fA-F]+/g, '')
    // Remove timestamps
    .replace(/\d{4}-\d{2}-\d{2}[t\s]\d{2}:\d{2}:\d{2}/gi, '')
    // Remove quotes
    .replace(/['"`]/g, '')
    // Replace multiple whitespaces/newlines with single space
    .replace(/\s+/g, ' ')
    .trim();

  // Extract primary error type (e.g. TypeError, IndexError, NullPointerException)
  const typeMatch = cleaned.match(/\b([A-Za-z]+Error|[A-Za-z]+Exception|Segmentation fault|AssertionError|SyntaxError)\b/i);
  const errorType = typeMatch ? typeMatch[1].toLowerCase() : 'error';

  // Get leading 60 chars of cleaned message
  const coreMsg = cleaned
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);

  const langPrefix = language && language !== 'auto' ? language.toLowerCase() : 'any';
  return `${langPrefix}:${errorType}:${coreMsg}`;
}

/**
 * Calculates Token-based Jaccard similarity between two strings
 */
function calculateTokenSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const tokenize = (s) =>
    s.toLowerCase()
      .replace(/[^a-z0-9_]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

  const set1 = new Set(tokenize(str1));
  const set2 = new Set(tokenize(str2));

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  for (const token of set1) {
    if (set2.has(token)) intersection++;
  }

  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Detect language heuristically if not specified or 'auto'
 */
export function detectLanguage(errorText = '', code = '') {
  const combined = `${errorText} ${code}`.toLowerCase();
  
  if (combined.includes('traceback (most recent call last)') || combined.includes('def ') || combined.includes('print(') || combined.includes('elif ') || combined.includes('import numpy') || combined.includes('syntaxerror: invalid syntax')) {
    return 'python';
  }
  if (combined.includes('uncaught typeerror') || combined.includes('cannot read properties of undefined') || combined.includes('console.log') || combined.includes('const ') || combined.includes('useState') || combined.includes('async function') || combined.includes('=>')) {
    return 'javascript';
  }
  if (combined.includes('java.lang.') || combined.includes('system.out.println') || combined.includes('public static void main') || combined.includes('nullpointerexception')) {
    return 'java';
  }
  if (combined.includes('segmentation fault (core dumped)') ||
      combined.includes('#include') ||
      combined.includes('std::') ||
      combined.includes('cout') ||
      combined.includes('cin') ||
      combined.includes('endl') ||
      combined.includes('int main') ||
      combined.includes('nullptr') ||
      combined.includes('sigfpe') ||
      combined.includes('malloc(')) {
    return 'cpp';
  }
  if (combined.includes('select ') || combined.includes('from ') || combined.includes('where ') || combined.includes('syntax error at or near')) {
    return 'sql';
  }
  return 'javascript'; // sensible default
}

/**
 * Searches MongoDB for previously solved similar errors
 */
export async function findSimilarSolvedErrors({ errorText, codeSnippet = '', language = '', minSimilarity = 0.45, limit = 5 }) {
  if (!errorText && !codeSnippet) {
    return { matches: [], bestMatch: null };
  }

  const detectedLang = (!language || language === 'auto') ? detectLanguage(errorText, codeSnippet) : language.toLowerCase();
  const signature = generateErrorSignature(errorText, detectedLang);

  const queryTokens = errorText
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2)
    .slice(0, 10)
    .join(' ');

  let candidates = [];

  // Stage 1: Exact / Close signature match
  try {
    const signatureMatches = await ErrorCase.find({
      $or: [
        { errorSignature: signature },
        { errorSignature: { $regex: signature.split(':').slice(0, 2).join(':'), $options: 'i' } }
      ]
    }).limit(10).lean();

    candidates.push(...signatureMatches);
  } catch (err) {
    console.warn('[Similarity] Signature search note:', err.message);
  }

  // Stage 2: MongoDB Full-Text Search
  if (queryTokens) {
    try {
      const textFilter = {
        $text: { $search: queryTokens }
      };
      if (detectedLang && detectedLang !== 'auto') {
        textFilter.language = detectedLang;
      }

      const textMatches = await ErrorCase.find(
        textFilter,
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .lean();

      candidates.push(...textMatches);
    } catch (err) {
      // If text index query has issues or not ready, fallback to regex
      try {
        const keywords = queryTokens.split(' ').slice(0, 3).filter(Boolean);
        if (keywords.length > 0) {
          const regexQuery = keywords.map(k => `(?=.*${k})`).join('');
          const regexMatches = await ErrorCase.find({
            errorMessage: { $regex: regexQuery, $options: 'i' }
          }).limit(8).lean();
          candidates.push(...regexMatches);
        }
      } catch (regexErr) {
        console.warn('[Similarity] Fallback search error:', regexErr.message);
      }
    }
  }

  // Stage 3: Broad search if candidates still low
  if (candidates.length === 0) {
    try {
      const broadMatches = await ErrorCase.find(
        detectedLang && detectedLang !== 'auto' ? { language: detectedLang } : {}
      )
      .sort({ helpfulVotes: -1, timesSolved: -1 })
      .limit(10)
      .lean();
      candidates.push(...broadMatches);
    } catch (err) {
      console.warn('[Similarity] Broad search error:', err.message);
    }
  }

  // Deduplicate by _id
  const uniqueCandidatesMap = new Map();
  candidates.forEach(c => {
    uniqueCandidatesMap.set(c._id.toString(), c);
  });
  const uniqueCandidates = Array.from(uniqueCandidatesMap.values());

  // Stage 4: Score and rank candidates
  const scoredMatches = uniqueCandidates.map(c => {
    const errSim = calculateTokenSimilarity(errorText, c.errorMessage || c.rawError);
    const codeSim = codeSnippet ? calculateTokenSimilarity(codeSnippet, c.codeSnippet || '') : 0;
    
    // Language agreement bonus
    const langBonus = (c.language && c.language.toLowerCase() === detectedLang) ? 0.20 : 0.0;
    
    // Exact signature match bonus
    const sigBonus = (c.errorSignature === signature) ? 0.35 : 0.0;
    
    // Helpful vote reputation bonus
    const voteBonus = Math.min((c.helpfulVotes || 0) * 0.02, 0.10);

    // Weighted composite similarity
    let rawScore = (errSim * 0.50) + (codeSim * 0.15) + langBonus + sigBonus + voteBonus;
    const similarityScore = Math.min(Math.round(rawScore * 100), 99);

    return {
      ...c,
      similarityScore,
      matchPercentage: similarityScore,
      isExact: similarityScore >= 88
    };
  });

  // Filter by threshold and sort descending by similarity score
  const filteredMatches = scoredMatches
    .filter(m => m.similarityScore >= (minSimilarity * 100))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  return {
    matches: filteredMatches,
    bestMatch: filteredMatches.length > 0 ? filteredMatches[0] : null,
    detectedLanguage: detectedLang,
    signature
  };
}
