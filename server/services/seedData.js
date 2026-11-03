import { ErrorCase } from '../models/ErrorCase.js';
import { Feedback } from '../models/Feedback.js';
import { QueryHistory } from '../models/QueryHistory.js';
import { generateErrorSignature } from './similarityService.js';

export const seedErrorCases = [
  {
    errorMessage: "TypeError: Cannot read properties of undefined (reading 'map')",
    rawError: "TypeError: Cannot read properties of undefined (reading 'map')\n    at UserList (src/components/UserList.jsx:14:24)\n    at renderWithHooks (react-dom.development.js:14985)",
    codeSnippet: "function UserList() {\n  const [users, setUsers] = useState();\n\n  return (\n    <div>\n      {users.map(u => <p key={u.id}>{u.name}</p>)}\n    </div>\n  );\n}",
    language: "javascript",
    errorType: "TypeError",
    category: "Runtime Error (Undefined Object)",
    severity: "High",
    explanation: "You called the .map() method on 'users', but 'users' is undefined because useState() was initialized without a default array value.",
    causes: [
      {
        rank: 1,
        title: "Uninitialized useState hook",
        likelihood: "High",
        explanation: "Calling useState() without arguments defaults state to undefined. Array methods like .map() fail immediately."
      },
      {
        rank: 2,
        title: "Asynchronous API fetch delay",
        likelihood: "Medium",
        explanation: "The component renders before the fetch call returns, so users is undefined during first paint."
      }
    ],
    suggestedFix: {
      fixedCode: "function UserList() {\n  // 1. Initialize state with empty array []\n  const [users, setUsers] = useState([]);\n\n  return (\n    <div>\n      {/* 2. Optional chaining for defensive rendering */}\n      {users?.map(u => <p key={u.id}>{u.name}</p>)}\n    </div>\n  );\n}",
      codeDiff: "--- Broken Code\n+++ Fixed Code\n- const [users, setUsers] = useState();\n- {users.map(u => <p key={u.id}>{u.name}</p>)}\n+ const [users, setUsers] = useState([]);\n+ {users?.map(u => <p key={u.id}>{u.name}</p>)}",
      stepByStep: [
        "Pass an empty array [] to useState: const [users, setUsers] = useState([]);",
        "Add optional chaining users?.map() so it never crashes even if null is passed."
      ],
      explanation: "Initializing with [] guarantees users is always an array with access to .map() even before data loads."
    },
    preventionTips: [
      "Always initialize state matching the expected shape: useState([]) for lists, useState({}) for objects.",
      "Use TypeScript to enforce non-nullable array types."
    ],
    tags: ["javascript", "react", "typeerror", "map", "hooks", "undefined"],
    helpfulVotes: 48,
    unhelpfulVotes: 1,
    timesQueried: 65,
    timesSolved: 47,
    source: "verified_seed"
  },
  {
    errorMessage: "IndexError: list index out of range",
    rawError: "Traceback (most recent call last):\n  File \"grades.py\", line 7, in <module>\n    top_student = scores[len(scores)]\nIndexError: list index out of range",
    codeSnippet: "scores = [88, 92, 79, 95]\n# Trying to get the last score:\nlast_score = scores[len(scores)]\nprint(\"Last score:\", last_score)",
    language: "python",
    errorType: "IndexError",
    category: "Runtime Error (List Bounds)",
    severity: "High",
    explanation: "In Python, list indices start at 0 and end at len(scores) - 1. Accessing index len(scores) is one position beyond the end of the list.",
    causes: [
      {
        rank: 1,
        title: "Off-by-one index error",
        likelihood: "High",
        explanation: "In a list with 4 elements, valid indices are 0, 1, 2, 3. Index 4 does not exist."
      },
      {
        rank: 2,
        title: "Attempting to access last element using length",
        likelihood: "High",
        explanation: "Students coming from other languages often write array[array.length] instead of array[len - 1] or array[-1]."
      }
    ],
    suggestedFix: {
      fixedCode: "scores = [88, 92, 79, 95]\n# Pythonic safe way to get the last element:\nlast_score = scores[-1]\nprint(\"Last score:\", last_score)",
      codeDiff: "--- Broken Code\n+++ Fixed Code\n- last_score = scores[len(scores)]\n+ last_score = scores[-1]",
      stepByStep: [
        "Replace scores[len(scores)] with scores[-1] to grab the last item cleanly.",
        "Alternatively, subtract 1: scores[len(scores) - 1]."
      ],
      explanation: "Python supports negative indexing where -1 refers to the last element of any sequence."
    },
    preventionTips: [
      "Use scores[-1] for last element.",
      "Never write manual index loops when 'for item in scores:' works."
    ],
    tags: ["python", "indexerror", "lists", "off-by-one", "bounds"],
    helpfulVotes: 56,
    unhelpfulVotes: 0,
    timesQueried: 82,
    timesSolved: 56,
    source: "verified_seed"
  },
  {
    errorMessage: "TypeError: can only concatenate str (not \"int\") to str",
    rawError: "Traceback (most recent call last):\n  File \"app.py\", line 4, in <module>\n    print(\"Total price: $\" + price)\nTypeError: can only concatenate str (not \"int\") to str",
    codeSnippet: "price = 25\nquantity = 3\ntotal = price * quantity\nprint(\"Total price: $\" + total)",
    language: "python",
    errorType: "TypeError",
    category: "Type Mismatch",
    severity: "Medium",
    explanation: "Python cannot concatenate strings and integers directly using the + operator. You must either use an f-string or convert the number using str().",
    causes: [
      {
        rank: 1,
        title: "Implicit type coercion assumption",
        likelihood: "High",
        explanation: "Unlike JavaScript, Python is strongly typed and will not automatically turn numbers into strings."
      }
    ],
    suggestedFix: {
      fixedCode: "price = 25\nquantity = 3\ntotal = price * quantity\n# Use modern f-string:\nprint(f\"Total price: ${total}\")",
      codeDiff: "--- Broken Code\n+++ Fixed Code\n- print(\"Total price: $\" + total)\n+ print(f\"Total price: ${total}\")",
      stepByStep: [
        "Convert the print statement into an f-string: print(f\"Total price: ${total}\")",
        "Or convert total to a string: str(total)"
      ],
      explanation: "f-strings (formatted string literals) handle type conversion automatically and are cleaner."
    },
    preventionTips: [
      "Use Python 3.6+ f-strings for all output formatting.",
      "Never use + to build strings when variables contain non-string data."
    ],
    tags: ["python", "typeerror", "strings", "f-strings", "type-casting"],
    helpfulVotes: 39,
    unhelpfulVotes: 2,
    timesQueried: 51,
    timesSolved: 38,
    source: "verified_seed"
  },
  {
    errorMessage: "java.lang.NullPointerException: Cannot invoke \"String.length()\" because \"name\" is null",
    rawError: "Exception in thread \"main\" java.lang.NullPointerException: Cannot invoke \"String.length()\" because \"name\" is null\n    at StudentService.validateName(StudentService.java:18)\n    at Main.main(Main.java:6)",
    codeSnippet: "public class StudentService {\n    public static boolean validateName(String name) {\n        // Error when name is null:\n        return name.length() > 3;\n    }\n}",
    language: "java",
    errorType: "NullPointerException",
    category: "Runtime Error (Null Dereference)",
    severity: "Critical",
    explanation: "The variable 'name' is null (pointing to no memory location), and calling .length() throws a NullPointerException.",
    causes: [
      {
        rank: 1,
        title: "Missing null check before dereferencing",
        likelihood: "High",
        explanation: "Calling any method on a reference that is null causes JVM to halt with NPE."
      }
    ],
    suggestedFix: {
      fixedCode: "public class StudentService {\n    public static boolean validateName(String name) {\n        // Safe check using short-circuit &&:\n        return name != null && name.length() > 3;\n    }\n}",
      codeDiff: "--- Broken Code\n+++ Fixed Code\n- return name.length() > 3;\n+ return name != null && name.length() > 3;",
      stepByStep: [
        "Add 'name != null &&' before accessing .length()",
        "Java uses short-circuit evaluation, so if name is null, .length() will not be called."
      ],
      explanation: "Short-circuit boolean logic stops evaluation immediately if the first condition is false."
    },
    preventionTips: [
      "Guard string parameters with name != null || name.isBlank().",
      "Use Objects.requireNonNullElse(name, \"\")."
    ],
    tags: ["java", "nullpointerexception", "npe", "strings", "validation"],
    helpfulVotes: 32,
    unhelpfulVotes: 0,
    timesQueried: 40,
    timesSolved: 32,
    source: "verified_seed"
  },
  {
    errorMessage: "Segmentation fault (core dumped)",
    rawError: "Segmentation fault (core dumped)\n./a.out: line 12: memory access violation at 0x0",
    codeSnippet: "#include <iostream>\n\nint main() {\n    int *ptr = nullptr;\n    // Dereferencing null pointer:\n    *ptr = 42;\n    std::cout << *ptr << std::endl;\n    return 0;\n}",
    language: "cpp",
    errorType: "SegmentationFault",
    category: "Memory Access Violation (SIGSEGV)",
    severity: "Critical",
    explanation: "Your program attempted to write to memory address 0x0 (nullptr). The operating system blocked the operation and terminated the program to protect memory.",
    causes: [
      {
        rank: 1,
        title: "Dereferencing a nullptr or uninitialized pointer",
        likelihood: "High",
        explanation: "Pointers must point to valid allocated memory before dereferencing with *."
      }
    ],
    suggestedFix: {
      fixedCode: "#include <iostream>\n\nint main() {\n    int value = 42;\n    int *ptr = &value; // Point to valid allocated integer\n\n    if (ptr != nullptr) {\n        *ptr = 100;\n        std::cout << \"Value: \" << *ptr << std::endl;\n    }\n    return 0;\n}",
      codeDiff: "--- Broken Code\n+++ Fixed Code\n- int *ptr = nullptr;\n- *ptr = 42;\n+ int value = 42;\n+ int *ptr = &value;\n+ if (ptr != nullptr) { *ptr = 100; }",
      stepByStep: [
        "Allocate memory on the stack (int value = 42) or heap (new int) before pointing to it.",
        "Always verify pointer != nullptr before dereferencing."
      ],
      explanation: "Ensuring pointers reference valid memory prevents operating system segfaults."
    },
    preventionTips: [
      "Always initialize pointers to nullptr and check before use.",
      "Use modern C++ smart pointers (std::unique_ptr) instead of raw pointers."
    ],
    tags: ["cpp", "c", "segfault", "pointers", "memory", "sigsegv"],
    helpfulVotes: 27,
    unhelpfulVotes: 1,
    timesQueried: 35,
    timesSolved: 27,
    source: "verified_seed"
  },
  {
    errorMessage: "Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.",
    rawError: "Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.\n    at renderWithHooks (react-dom.development.js:14985)\n    at updateFunctionComponent (react-dom.development.js:17356)",
    codeSnippet: "function Counter() {\n  const [count, setCount] = useState(0);\n\n  // BUG: Calling setCount directly in render without an event wrapper\n  return (\n    <button onClick={setCount(count + 1)}>\n      Count: {count}\n    </button>\n  );\n}",
    language: "javascript",
    errorType: "ReactInfiniteLoop",
    category: "React Lifecycle Infinite Loop",
    severity: "Critical",
    explanation: "You passed 'setCount(count + 1)' with parentheses to onClick. This calls setCount immediately while rendering, which triggers another render, creating an infinite loop.",
    causes: [
      {
        rank: 1,
        title: "Immediate function execution instead of function reference",
        likelihood: "High",
        explanation: "Writing onClick={fn()} invokes fn immediately during render. It must be onClick={() => fn()}."
      }
    ],
    suggestedFix: {
      fixedCode: "function Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    // Wrap in an arrow function so it only runs when clicked\n    <button onClick={() => setCount(prev => prev + 1)}>\n      Count: {count}\n    </button>\n  );\n}",
      codeDiff: "--- Broken Code\n+++ Fixed Code\n- <button onClick={setCount(count + 1)}>\n+ <button onClick={() => setCount(prev => prev + 1)}>",
      stepByStep: [
        "Wrap the state call inside an arrow function: onClick={() => setCount(...)}",
        "Use functional update syntax 'prev => prev + 1' to avoid stale state closures."
      ],
      explanation: "Passing an arrow function ensures React only executes setCount when the user clicks the button."
    },
    preventionTips: [
      "Remember: onClick={fn} passes the function, onClick={fn()} calls it instantly.",
      "Use ESLint rules (react-hooks/exhaustive-deps) to flag misplaced calls."
    ],
    tags: ["react", "javascript", "useeffect", "re-render", "infinite-loop", "hooks"],
    helpfulVotes: 61,
    unhelpfulVotes: 0,
    timesQueried: 94,
    timesSolved: 61,
    source: "verified_seed"
  }
];

export async function seedDatabase(force = false) {
  try {
    const count = await ErrorCase.countDocuments();
    if (count > 0 && !force) {
      console.log(`[Seed] Database already has ${count} error cases. Skipping seed.`);
      const fbCount = await Feedback.countDocuments();
      const qhCount = await QueryHistory.countDocuments();
      return { errorCases: count, feedback: fbCount, queryHistory: qhCount, seeded: false };
    }

    if (force) {
      await ErrorCase.deleteMany({});
      await Feedback.deleteMany({});
      await QueryHistory.deleteMany({});
      console.log('[Seed] Cleared existing collections for fresh seed.');
    }

    const casesWithSignatures = seedErrorCases.map(item => ({
      ...item,
      errorSignature: generateErrorSignature(item.errorMessage, item.language)
    }));

    const insertedCases = await ErrorCase.insertMany(casesWithSignatures);
    console.log(`[Seed] Successfully seeded ${insertedCases.length} verified error cases into MongoDB!`);

    // Generate realistic student feedback entries linked via ObjectId
    const sampleFeedback = [];
    const studentComments = [
      'The step-by-step breakdown resolved my bug instantly!',
      'Great explanation of the root cause. Appreciated the defensive coding tip.',
      'Saved me hours of frustration trying to debug my React re-render loop.',
      'Clear fix with exact code diff. Very helpful!',
      'Understood why off-by-one happens in Python slice indexing.',
      'The explanation of NullPointerException dereference helped me pass my Java lab.'
    ];

    insertedCases.forEach((ec, idx) => {
      // 2 feedback items per error case
      sampleFeedback.push({
        errorCaseId: ec._id,
        resolvedIssue: true,
        rating: 5,
        studentComment: studentComments[idx % studentComments.length],
        studentLevel: idx % 3 === 0 ? 'Beginner' : (idx % 3 === 1 ? 'Intermediate' : 'Advanced')
      });
      sampleFeedback.push({
        errorCaseId: ec._id,
        resolvedIssue: idx % 4 !== 0,
        rating: idx % 4 === 0 ? 3 : 4,
        studentComment: idx % 4 === 0 ? 'Fix worked after adapting variable names.' : 'Clear and concise solution.',
        studentLevel: 'Beginner'
      });
    });

    await Feedback.insertMany(sampleFeedback);
    console.log(`[Seed] Seeded ${sampleFeedback.length} verified student reviews for $lookup relational joins.`);

    // Seed realistic student QueryHistory entries
    const sampleQueries = [
      {
        queryText: "TypeError: Cannot read properties of undefined (reading 'map')",
        codeSnippet: "users.map(u => u.name)",
        language: "javascript",
        actionTaken: "used_similar_cache",
        matchedErrorCaseId: insertedCases[0]._id,
        similarityScore: 100,
        resolved: true
      },
      {
        queryText: "IndexError: list index out of range in Python loop",
        codeSnippet: "items[len(items)]",
        language: "python",
        actionTaken: "used_similar_cache",
        matchedErrorCaseId: insertedCases[1]._id,
        similarityScore: 95,
        resolved: true
      },
      {
        queryText: "java.lang.NullPointerException: Cannot invoke String.length()",
        codeSnippet: "name.length()",
        language: "java",
        actionTaken: "requested_ai_explanation",
        matchedErrorCaseId: insertedCases[3]._id,
        similarityScore: 90,
        resolved: true
      },
      {
        queryText: "Error: Too many re-renders. React limits number of renders",
        codeSnippet: "<button onClick={setCount(1)}>Click</button>",
        language: "javascript",
        actionTaken: "used_similar_cache",
        matchedErrorCaseId: insertedCases[5]._id,
        similarityScore: 100,
        resolved: true
      },
      {
        queryText: "Segmentation fault (core dumped) in pointer dereference",
        codeSnippet: "*ptr = 10;",
        language: "cpp",
        actionTaken: "browsed_knowledge_base",
        matchedErrorCaseId: insertedCases[4]._id,
        similarityScore: 88,
        resolved: true
      }
    ];

    await QueryHistory.insertMany(sampleQueries);
    console.log(`[Seed] Seeded ${sampleQueries.length} query history logs.`);

    return {
      errorCases: insertedCases.length,
      feedback: sampleFeedback.length,
      queryHistory: sampleQueries.length,
      seeded: true
    };
  } catch (err) {
    console.error('[Seed] Error seeding database:', err.message);
    throw err;
  }
}
