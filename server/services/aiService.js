import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Intelligent Fallback Analyzer for when API keys are not provided or offline.
 * Provides rich, detailed explanations, ranked causes, and accurate code diffs for common student errors.
 */
function analyzeErrorLocally(errorText, codeSnippet, language) {
  const text = (errorText || '').toLowerCase();
  const code = codeSnippet || '';
  const lang = (language || 'javascript').toLowerCase();

  // Pattern 1: JavaScript Cannot read properties of undefined / null
  if (text.includes('cannot read properties of undefined') || text.includes('cannot read property') || text.includes('of null')) {
    const propertyMatch = errorText.match(/reading ['"]?(\w+)['"]?/i) || errorText.match(/property ['"]?(\w+)['"]? of undefined/i);
    const propName = propertyMatch ? propertyMatch[1] : 'property';

    return {
      errorType: 'TypeError',
      category: 'Runtime Error (Null / Undefined Reference)',
      severity: 'High',
      explanation: `You are trying to access '.${propName}' on a variable that is currently undefined or null. In JavaScript, you cannot read properties of values that do not exist yet (like waiting for an API response or referencing an empty object).`,
      causes: [
        {
          rank: 1,
          title: 'Asynchronous data not loaded yet',
          likelihood: 'High',
          explanation: 'Your component or function rendered before API data finished fetching, so the parent object is undefined.'
        },
        {
          rank: 2,
          title: 'Incorrect or misspelled property chain',
          likelihood: 'Medium',
          explanation: `The object structure might be nested differently (e.g. data.user.${propName} instead of user.${propName}).`
        },
        {
          rank: 3,
          title: 'Uninitialized state or variable',
          likelihood: 'Medium',
          explanation: 'The variable was declared without an initial default value like {} or [].'
        }
      ],
      suggestedFix: {
        fixedCode: code ? code.replace(new RegExp(`(\\w+)\\.${propName}`, 'g'), `$1?.${propName} || 'N/A'`) : `// Use Optional Chaining (?.) or default value:\nconst safeValue = user?.${propName} ?? 'Default';`,
        codeDiff: `--- Broken Code\n+++ Fixed Code\n- const val = user.${propName};\n+ const val = user?.${propName} ?? 'Default';`,
        stepByStep: [
          `Add optional chaining: Replace 'object.${propName}' with 'object?.${propName}' so it won't crash if object is undefined.`,
          'Provide initial state (e.g. useState({})) to ensure the object exists during the first render.',
          'Add a loading guard (if (!data) return <Loading />;) before accessing properties.'
        ],
        explanation: `Optional chaining (?.) safely evaluates to undefined instead of throwing a fatal TypeError if the left-hand operand is null or undefined.`
      },
      preventionTips: [
        'Always use optional chaining (?.) for nested API responses.',
        'Initialize state variables with empty objects {} or arrays [] rather than undefined.',
        'Use TypeScript or PropTypes to catch missing properties at compile time.'
      ],
      tags: ['javascript', 'typeerror', 'optional-chaining', 'null-safety', 'async']
    };
  }

  // Pattern 2: Python IndexError: list index out of range
  if (text.includes('indexerror') || text.includes('list index out of range')) {
    return {
      errorType: 'IndexError',
      category: 'Runtime Error (Array / List Bounds)',
      severity: 'High',
      explanation: 'You tried to access an item in a list using an index number that does not exist because the list is shorter than that index.',
      causes: [
        {
          rank: 1,
          title: 'Off-by-one indexing error',
          likelihood: 'High',
          explanation: 'Python uses zero-based indexing (0 to len - 1). For a list of 5 items, the valid indices are 0 to 4. Accessing index 5 throws an IndexError.'
        },
        {
          rank: 2,
          title: 'List is empty when accessed',
          likelihood: 'Medium',
          explanation: 'The list was expected to contain elements but was never populated or got cleared.'
        },
        {
          rank: 3,
          title: 'Loop limit exceeds length',
          likelihood: 'Medium',
          explanation: 'Using range(len(items) + 1) or an uncontrolled while loop that increments past the end.'
        }
      ],
      suggestedFix: {
        fixedCode: code ? code.replace(/(\w+)\[(\w+)\]/g, '($1[$2] if $2 < len($1) else None)') : `# Safe list access pattern:\nif index < len(my_list):\n    item = my_list[index]\nelse:\n    item = None # or handle empty`,
        codeDiff: `--- Broken Code\n+++ Fixed Code\n- item = my_list[i]\n+ if i < len(my_list):\n+     item = my_list[i]`,
        stepByStep: [
          'Verify the length of the list using len(my_list) before indexing.',
          'Remember the last valid element is at index len(my_list) - 1 or my_list[-1].',
          'Prefer iterating directly over items with "for item in my_list:" instead of using index counters.'
        ],
        explanation: 'Directly checking bounds or using Pythonic for-in loops prevents indexing into non-existent slots.'
      },
      preventionTips: [
        'Iterate directly with "for item in items" instead of "for i in range(len(items))".',
        'Use negative index items[-1] to access the last element safely.',
        'Check "if my_list:" before accessing items to confirm it is not empty.'
      ],
      tags: ['python', 'indexerror', 'lists', 'off-by-one', 'bounds-checking']
    };
  }

  // Pattern 3: Python TypeError (unsupported operand, concatenate str and int)
  if (text.includes('can only concatenate str') || text.includes('unsupported operand type(s) for +:')) {
    return {
      errorType: 'TypeError',
      category: 'Type Mismatch Error',
      severity: 'Medium',
      explanation: 'Python does not automatically convert numbers to strings when combining them with the "+" operator. You are trying to concatenate a string and an integer/float directly.',
      causes: [
        {
          rank: 1,
          title: 'Concatenating string with integer using +',
          likelihood: 'High',
          explanation: 'Expressions like "Score: " + score fail if score is an integer.'
        },
        {
          rank: 2,
          title: 'Input function returns string',
          likelihood: 'Medium',
          explanation: 'user_input = input() returns a string, but is being used in mathematical addition.'
        }
      ],
      suggestedFix: {
        fixedCode: code ? code.replace(/\+\s*(\w+)/g, '+ str($1)') : `# Use f-strings for clean formatting:\nresult = f"Score: {score}"`,
        codeDiff: `--- Broken Code\n+++ Fixed Code\n- message = "Score is: " + score\n+ message = f"Score is: {score}"`,
        stepByStep: [
          'Use an f-string: f"Your score: {score}" (preferred modern Python approach).',
          'Explicitly cast the number to string: str(number).',
          'If doing math, convert the string input to integer: int(input_value).'
        ],
        explanation: 'Python is strongly typed and refuses to guess whether you meant string concatenation or mathematical addition.'
      },
      preventionTips: [
        'Adopt Python 3.6+ f-strings (f"{variable}") for all string formatting.',
        'Always wrap input() with int() or float() when expecting numerical input.'
      ],
      tags: ['python', 'typeerror', 'type-casting', 'f-strings', 'strings']
    };
  }

  // Pattern 4: Java NullPointerException
  if (text.includes('nullpointerexception') || text.includes('java.lang.nullpointerexception')) {
    return {
      errorType: 'NullPointerException',
      category: 'Runtime Error (Null Dereference)',
      severity: 'Critical',
      explanation: 'A variable points to null (no memory address allocated), but your code attempted to invoke a method, read a field, or calculate its length.',
      causes: [
        {
          rank: 1,
          title: 'Uninitialized object variable',
          likelihood: 'High',
          explanation: 'A class member or local variable was declared but never instantiated with new.'
        },
        {
          rank: 2,
          title: 'Method returned null unexpectedly',
          likelihood: 'Medium',
          explanation: 'A lookup (e.g. map.get(key) or findUser()) returned null when the target was not found.'
        }
      ],
      suggestedFix: {
        fixedCode: `// Add a null check or use Optional:\nif (myObject != null) {\n    myObject.doSomething();\n} else {\n    // handle null safely\n}`,
        codeDiff: `--- Broken Code\n+++ Fixed Code\n- myObject.doSomething();\n+ if (myObject != null) {\n+     myObject.doSomething();\n+ }`,
        stepByStep: [
          'Check the line mentioned in the stack trace and locate which variable is being dereferenced.',
          'Add an explicit null guard: if (variable != null) { ... }',
          'Use Java 8+ Optional<T> or Objects.requireNonNull() for cleaner APIs.'
        ],
        explanation: 'Guarding method calls with null checks or using Optionals prevents the JVM from throwing NPEs.'
      },
      preventionTips: [
        'Use Optional<T> for methods that might not return a value.',
        'Use @NonNull and @Nullable annotations in IDEs.',
        'Initialize collections with empty collections: Collections.emptyList().'
      ],
      tags: ['java', 'nullpointerexception', 'null-safety', 'jvm', 'defensive-programming']
    };
  }

  // Pattern 5: React Infinite Re-render / useEffect loop
  if (text.includes('maximum update depth exceeded') || text.includes('too many re-renders') || (text.includes('useeffect') && text.includes('infinite'))) {
    return {
      errorType: 'ReactRenderError',
      category: 'Logic / Lifecycle Infinite Loop',
      severity: 'Critical',
      explanation: 'React has detected an infinite loop of component re-renders. This almost always happens when a state setter (like setCount) is called inside a useEffect or during render without proper dependency guards.',
      causes: [
        {
          rank: 1,
          title: 'State updated inside useEffect without dependency array',
          likelihood: 'High',
          explanation: 'useEffect(() => { setState(x); }) runs on every single render, setting state triggers a new render, causing an infinite loop.'
        },
        {
          rank: 2,
          title: 'Calling handler immediately instead of passing function',
          likelihood: 'High',
          explanation: 'Writing onClick={handleClick()} instead of onClick={() => handleClick()} executes the handler on render.'
        }
      ],
      suggestedFix: {
        fixedCode: `// 1. Pass empty dependency array [] to run once on mount:\nuseEffect(() => {\n    fetchData();\n}, []);\n\n// 2. Or pass callback to onClick:\n<button onClick={() => handleClick()}>Click</button>`,
        codeDiff: `--- Broken Code\n+++ Fixed Code\n- useEffect(() => { setCount(count + 1); });\n+ useEffect(() => { setCount(c => c + 1); }, []);`,
        stepByStep: [
          'Check your useEffect calls and ensure you provided a second argument (the dependency array []).',
          'Check onClick and onChange props: make sure you pass an arrow function () => doSomething(), not doSomething().',
          'Use functional state updates (setCount(prev => prev + 1)) if updating based on previous value.'
        ],
        explanation: 'Providing dependency arrays tells React when to skip running effects, breaking the infinite render cycle.'
      },
      preventionTips: [
        'Always include dependency arrays in useEffect.',
        'Never call state setters directly in the component body.',
        'Enable eslint-plugin-react-hooks in your linter.'
      ],
      tags: ['react', 'useeffect', 'infinite-loop', 'state-management', 'hooks']
    };
  }

  // Pattern 6: C/C++ Segmentation fault
  if (text.includes('segmentation fault') || text.includes('segfault') || text.includes('sigsegv')) {
    return {
      errorType: 'SegmentationFault',
      category: 'Memory Access Violation (SIGSEGV)',
      severity: 'Critical',
      explanation: 'Your program tried to access a memory address that it does not have permission to read or write (such as dereferencing a NULL pointer, accessing an array past its allocated bounds, or using freed memory).',
      causes: [
        {
          rank: 1,
          title: 'Dereferencing a NULL or uninitialized pointer',
          likelihood: 'High',
          explanation: 'A pointer was set to nullptr/NULL or garbage memory, and *ptr was called.'
        },
        {
          rank: 2,
          title: 'Buffer overflow or array index out of bounds',
          likelihood: 'High',
          explanation: 'Writing to array[i] where i >= size corrupts stack or heap memory.'
        },
        {
          rank: 3,
          title: 'Stack overflow from runaway recursion',
          likelihood: 'Medium',
          explanation: 'A recursive function missing a base case exhausts the call stack limit.'
        }
      ],
      suggestedFix: {
        fixedCode: `// Always check pointers before dereferencing:\nif (ptr != nullptr) {\n    std::cout << *ptr << std::endl;\n}\n\n// Use modern C++ containers:\nstd::vector<int> items = {1, 2, 3};\nint val = items.at(index); // Throws out_of_range exception instead of crashing`,
        codeDiff: `--- Broken Code\n+++ Fixed Code\n- *ptr = 100;\n+ if (ptr != nullptr) {\n+     *ptr = 100;\n+ }`,
        stepByStep: [
          'Initialize all pointers to nullptr.',
          'Verify pointers are not nullptr before accessing -> or *.',
          'Compile with debug symbols (-g) and AddressSanitizer (-fsanitize=address) to see the exact crash line.'
        ],
        explanation: 'Guarding pointers and compiling with AddressSanitizer helps catch illegal memory operations before crash.'
      },
      preventionTips: [
        'Prefer smart pointers (std::unique_ptr, std::shared_ptr) over raw pointers.',
        'Use std::vector::at() instead of raw pointer arithmetic.',
        'Run with AddressSanitizer: g++ -fsanitize=address -g main.cpp'
      ],
      tags: ['cpp', 'c', 'segfault', 'sigsegv', 'pointers', 'memory']
    };
  }

  // Pattern 7: General / Generic Syntax or Runtime Fallback
  const detectedType = (text.match(/([A-Za-z]+Error|[A-Za-z]+Exception)/i) || ['Error', 'RuntimeError'])[1];

  return {
    errorType: detectedType,
    category: text.includes('syntax') ? 'Syntax / Parsing Error' : 'Runtime Execution Error',
    severity: 'Medium',
    explanation: `BugSense AI analyzed this error: "${errorText.slice(0, 100)}...". This occurs when the execution environment encounters an unexpected value, invalid syntax, or unmet operation contract.`,
    causes: [
      {
        rank: 1,
        title: 'Mismatched types or unexpected null value',
        likelihood: 'High',
        explanation: 'Check whether variables supplied to functions or operators have the data structure you expected.'
      },
      {
        rank: 2,
        title: 'Missing import or undefined variable',
        likelihood: 'Medium',
        explanation: 'A referenced symbol was not imported, declared in scope, or initialized.'
      },
      {
        rank: 3,
        title: 'Syntax punctuation or unclosed brackets',
        likelihood: 'Low',
        explanation: 'Check for missing parentheses, brackets, colons, or mismatched quotes.'
      }
    ],
    suggestedFix: {
      fixedCode: code ? `// Fixed implementation with safety guard:\ntry {\n  ${code.split('\n').join('\n  ')}\n} catch (err) {\n  console.error("Safely handled error:", err);\n}` : '// Review line referenced in error trace and add defensive checks.',
      codeDiff: `--- Original\n+++ Defensive Handling\n+ try {\n    // Code here\n+ } catch (err) {\n+   console.error("Handled:", err);\n+ }`,
      stepByStep: [
        'Inspect the line number and function mentioned in the stack trace.',
        'Print or log the values of involved variables just before the failing line.',
        'Wrap potentially failing operations in a try/catch or defensive if-condition.'
      ],
      explanation: 'Validating variables before operations and defensive error handling stops the crash.'
    },
    preventionTips: [
      'Write unit tests covering edge cases (empty strings, null values, empty lists).',
      'Use a linter (ESLint, Flake8) to catch common mistakes before running.'
    ],
    tags: [lang, detectedType.toLowerCase(), 'debugging', 'best-practices']
  };
}

/**
 * Main AI Analysis function
 * Tries Google Gemini API first if configured; seamlessly falls back to the intelligent expert engine.
 */
export async function explainErrorWithAI({ errorText, codeSnippet = '', language = '', userApiKey = '' }) {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-1.5-flash'];
    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `
You are BugSense AI — an empathetic, world-class CS educator and debugging mentor for students.
Analyze the following error message and code snippet. Return a strictly valid JSON response.

Input:
Language: ${language || 'Auto-detect'}
Error / Stack Trace:
"""
${errorText}
"""

Code Snippet:
"""
${codeSnippet || 'No code provided'}
"""

JSON Structure required:
{
  "errorType": "String (e.g. TypeError, IndexError, NullPointerException)",
  "category": "String (e.g. Runtime Error, Syntax Error, Logic Error, Type Mismatch)",
  "severity": "Critical | High | Medium | Low",
  "explanation": "Clear, student-friendly explanation in plain English without confusing jargon.",
  "causes": [
    {
      "rank": 1,
      "title": "Short cause summary",
      "likelihood": "High | Medium | Low",
      "explanation": "Why this happens"
    }
  ],
  "suggestedFix": {
    "fixedCode": "Full corrected code snippet",
    "codeDiff": "Unified diff style representation with - for deleted lines and + for added lines",
    "stepByStep": ["Step 1...", "Step 2...", "Step 3..."],
    "explanation": "Why this fix works"
  },
  "preventionTips": ["Tip 1...", "Tip 2..."],
  "tags": ["tag1", "tag2", "tag3"]
}
`;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);
        return {
          ...parsed,
          source: 'ai',
          modelUsed: modelName
        };
      } catch (aiErr) {
        console.warn(`[AI Service] Gemini model ${modelName} attempt:`, aiErr.message);
        // Continue to next candidate model
      }
    }

    console.warn('[AI Service] All live Gemini attempts failed, utilizing intelligent fallback engine.');
    const fallback = analyzeErrorLocally(errorText, codeSnippet, language);
    return {
      ...fallback,
      source: 'ai_fallback',
      aiNotice: 'Live AI service temporarily unavailable or rate-limited; powered by BugSense Built-in Intelligent Rule Engine.'
    };
  }

  // If no Gemini API key is configured, use built-in engine
  const localAnalysis = analyzeErrorLocally(errorText, codeSnippet, language);
  return {
    ...localAnalysis,
    source: 'ai_fallback',
    aiNotice: 'Powered by BugSense Built-in Intelligent Engine. (Add GEMINI_API_KEY in Settings for unlimited custom LLM queries)'
  };
}
