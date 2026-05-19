import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, CheckCircle2, Circle, ChevronDown, ChevronUp, ExternalLink, RotateCcw, Copy, Check, Loader2, Terminal, BookOpen, FlaskConical, ChevronRight, Code2, Trophy, ChevronLeft, Undo2, Redo2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { problemApi, compileApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Example {
  input: string;
  output: string;
  explanation: string;
}
interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}
interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  frequency: number;
  description: string;
  examples: Example[];
  testCases: TestCase[];
  starterCode: { python: string; javascript: string; cpp: string; java: string };
  topicTag: string;
  leetcodeUrl: string;
  companies?: string[];
  solutionArticle?: string;
  hiddenTestCaseCount?: number;
  totalTestCaseCount?: number;
  userStatus: "solved" | "attempted" | null;
}

// ─── Language config ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: "python", label: "Python", ext: "py" },
  { id: "javascript", label: "JavaScript", ext: "js" },
  { id: "cpp", label: "C++", ext: "cpp" },
  { id: "java", label: "Java", ext: "java" },
  { id: "sql", label: "SQL", ext: "sql" },
] as const;
type LangId = (typeof LANGUAGES)[number]["id"];

// ─── Rich Autocomplete snippets ───────────────────────────────────────────────
const CODE_SNIPPETS: Record<LangId, Array<{ trigger: string; snippet: string; label: string }>> = {
  python: [
    // Loops
    { trigger: "for", label: "for i in range(n)", snippet: "for i in range(n):\n    " },
    { trigger: "fori", label: "for i in range(n) →", snippet: "for i in range(n):\n    " },
    { trigger: "fore", label: "for item in iterable", snippet: "for item in iterable:\n    " },
    { trigger: "while", label: "while condition:", snippet: "while condition:\n    " },
    // Conditionals
    { trigger: "if", label: "if condition:", snippet: "if condition:\n    " },
    { trigger: "ife", label: "if/else block", snippet: "if condition:\n    pass\nelse:\n    " },
    { trigger: "elif", label: "elif condition:", snippet: "elif condition:\n    " },
    // Functions / Classes
    { trigger: "def", label: "def function(args):", snippet: "def function(args):\n    " },
    { trigger: "class", label: "class ClassName:", snippet: "class ClassName:\n    def __init__(self):\n        " },
    { trigger: "lambda", label: "lambda x: expr", snippet: "lambda x: " },
    // List / Dict Comprehensions
    { trigger: "lc", label: "[x for x in lst]", snippet: "[x for x in lst]" },
    { trigger: "dc", label: "{k: v for k, v in}", snippet: "{k: v for k, v in items}" },
    // Common patterns
    { trigger: "sort", label: "lst.sort(key=lambda…)", snippet: "lst.sort(key=lambda x: x)" },
    { trigger: "sorted", label: "sorted(lst, key=…)", snippet: "sorted(lst, key=lambda x: x)" },
    { trigger: "enumerate", label: "for i, v in enumerate(lst)", snippet: "for i, v in enumerate(lst):\n    " },
    { trigger: "zip", label: "for a, b in zip(x, y):", snippet: "for a, b in zip(x, y):\n    " },
    { trigger: "range", label: "range(start, stop, step)", snippet: "range(start, stop, step)" },
    { trigger: "print", label: "print(…)", snippet: "print()" },
    { trigger: "input", label: "input(prompt)", snippet: 'input("")' },
    { trigger: "int", label: "int(input())", snippet: "int(input())" },
    { trigger: "map", label: "map(int, input().split())", snippet: "map(int, input().split())" },
    { trigger: "list", label: "list(map(int, …))", snippet: "list(map(int, input().split()))" },
    { trigger: "defaultdict", label: "defaultdict(list)", snippet: "from collections import defaultdict\nd = defaultdict(list)" },
    { trigger: "Counter", label: "Counter(lst)", snippet: "from collections import Counter\ncnt = Counter(lst)" },
    { trigger: "deque", label: "deque()", snippet: "from collections import deque\ndq = deque()" },
    { trigger: "heapq", label: "import heapq", snippet: "import heapq\nheap = []\nheapq.heappush(heap, val)" },
    { trigger: "bisect", label: "bisect.bisect_left", snippet: "import bisect\nbisect.bisect_left(arr, target)" },
    { trigger: "try", label: "try/except block", snippet: "try:\n    \nexcept Exception as e:\n    " },
    { trigger: "with", label: "with open(file) as f:", snippet: "with open(file) as f:\n    " },
    { trigger: "return", label: "return value", snippet: "return " },
    { trigger: "pass", label: "pass", snippet: "pass" },
    { trigger: "break", label: "break", snippet: "break" },
    { trigger: "continue", label: "continue", snippet: "continue" },
    { trigger: "None", label: "None", snippet: "None" },
    { trigger: "True", label: "True", snippet: "True" },
    { trigger: "False", label: "False", snippet: "False" },
    { trigger: "len", label: "len(obj)", snippet: "len()" },
    { trigger: "max", label: "max(iterable)", snippet: "max()" },
    { trigger: "min", label: "min(iterable)", snippet: "min()" },
    { trigger: "sum", label: "sum(iterable)", snippet: "sum()" },
    { trigger: "abs", label: "abs(x)", snippet: "abs()" },
    { trigger: "inf", label: "float('inf')", snippet: "float('inf')" },
  ],
  javascript: [
    // Loops
    { trigger: "for", label: "for (let i = 0; i < n; i++)", snippet: "for (let i = 0; i < n; i++) {\n    " },
    { trigger: "forin", label: "for...in object", snippet: "for (const key in obj) {\n    " },
    { trigger: "forof", label: "for...of iterable", snippet: "for (const item of arr) {\n    " },
    { trigger: "foreach", label: "arr.forEach(…)", snippet: "arr.forEach((item, i) => {\n    " },
    { trigger: "while", label: "while (condition) {", snippet: "while (condition) {\n    " },
    // Conditionals
    { trigger: "if", label: "if (condition) {", snippet: "if (condition) {\n    " },
    { trigger: "ife", label: "if/else block", snippet: "if (condition) {\n    \n} else {\n    " },
    { trigger: "tern", label: "ternary ? : ", snippet: "condition ? trueVal : falseVal" },
    { trigger: "switch", label: "switch (val) {", snippet: "switch (val) {\n    case 1:\n        break;\n    default:\n        break;\n}" },
    // Functions
    { trigger: "fun", label: "function name(args) {", snippet: "function name(args) {\n    " },
    { trigger: "arrow", label: "const fn = (args) => {", snippet: "const fn = (args) => {\n    " },
    { trigger: "async", label: "async function name() {", snippet: "async function name() {\n    " },
    { trigger: "await", label: "await promise", snippet: "await " },
    // Arrays
    { trigger: "map", label: "arr.map(x => …)", snippet: "arr.map(x => )" },
    { trigger: "filter", label: "arr.filter(x => …)", snippet: "arr.filter(x => )" },
    { trigger: "reduce", label: "arr.reduce((acc, x) => …, 0)", snippet: "arr.reduce((acc, x) => acc + x, 0)" },
    { trigger: "find", label: "arr.find(x => …)", snippet: "arr.find(x => )" },
    { trigger: "some", label: "arr.some(x => …)", snippet: "arr.some(x => )" },
    { trigger: "every", label: "arr.every(x => …)", snippet: "arr.every(x => )" },
    { trigger: "sort", label: "arr.sort((a, b) => a - b)", snippet: "arr.sort((a, b) => a - b)" },
    { trigger: "flat", label: "arr.flat(depth)", snippet: "arr.flat(1)" },
    // Common
    { trigger: "const", label: "const name = value", snippet: "const " },
    { trigger: "let", label: "let name = value", snippet: "let " },
    { trigger: "var", label: "var name = value", snippet: "var " },
    { trigger: "console", label: "console.log(…)", snippet: "console.log()" },
    { trigger: "return", label: "return value", snippet: "return " },
    { trigger: "class", label: "class Name {", snippet: "class Name {\n    constructor() {\n        \n    }\n}" },
    { trigger: "try", label: "try/catch block", snippet: "try {\n    \n} catch (err) {\n    console.error(err);\n}" },
    { trigger: "import", label: "import { } from ''", snippet: "import {  } from ''" },
    { trigger: "export", label: "export default ", snippet: "export default " },
    { trigger: "new", label: "new ClassName()", snippet: "new " },
    { trigger: "typeof", label: "typeof value", snippet: "typeof " },
    { trigger: "JSON", label: "JSON.stringify/parse", snippet: "JSON.stringify(obj)" },
    { trigger: "Math", label: "Math.max/min/floor/ceil", snippet: "Math.max(a, b)" },
    { trigger: "Set", label: "new Set(arr)", snippet: "new Set(arr)" },
    { trigger: "Map", label: "new Map()", snippet: "new Map()" },
    { trigger: "Infinity", label: "Infinity", snippet: "Infinity" },
    { trigger: "parseInt", label: "parseInt(str, radix)", snippet: "parseInt(str, 10)" },
  ],
  cpp: [
    // Includes & namespaces
    { trigger: "#include", label: "#include <bits/stdc++.h>", snippet: "#include <bits/stdc++.h>\nusing namespace std;\n\n" },
    { trigger: "bits", label: "#include bits/stdc++.h", snippet: "#include <bits/stdc++.h>\nusing namespace std;\n\n" },
    { trigger: "main", label: "int main() {", snippet: "int main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    return 0;\n}" },
    // Loops
    { trigger: "for", label: "for (int i = 0; i < n; i++)", snippet: "for (int i = 0; i < n; i++) {\n    " },
    { trigger: "forar", label: "for (auto& x : arr)", snippet: "for (auto& x : arr) {\n    " },
    { trigger: "while", label: "while (condition) {", snippet: "while (condition) {\n    " },
    { trigger: "do", label: "do { } while (cond)", snippet: "do {\n    \n} while (condition);" },
    // Conditionals
    { trigger: "if", label: "if (condition) {", snippet: "if (condition) {\n    " },
    { trigger: "ife", label: "if/else block", snippet: "if (condition) {\n    \n} else {\n    " },
    { trigger: "switch", label: "switch (val) {", snippet: "switch (val) {\n    case 1:\n        break;\n    default:\n        break;\n}" },
    // Functions
    { trigger: "void", label: "void function(args) {", snippet: "void function(args) {\n    " },
    { trigger: "int", label: "int function(args) {", snippet: "int function(args) {\n    " },
    // Data structures
    { trigger: "vector", label: "vector<int> v", snippet: "vector<int> v;" },
    { trigger: "map", label: "map<K, V>", snippet: "map<int, int> mp;" },
    { trigger: "unordered", label: "unordered_map<K, V>", snippet: "unordered_map<int, int> mp;" },
    { trigger: "set", label: "set<int>", snippet: "set<int> s;" },
    { trigger: "queue", label: "queue<int>", snippet: "queue<int> q;" },
    { trigger: "pq", label: "priority_queue (max-heap)", snippet: "priority_queue<int> pq;" },
    { trigger: "stack", label: "stack<int>", snippet: "stack<int> st;" },
    { trigger: "pair", label: "pair<int, int>", snippet: "pair<int, int> p = {a, b};" },
    // Algorithms
    { trigger: "sort", label: "sort(v.begin(), v.end())", snippet: "sort(v.begin(), v.end());" },
    { trigger: "sortd", label: "sort descending", snippet: "sort(v.begin(), v.end(), greater<int>());" },
    { trigger: "binary", label: "binary_search", snippet: "binary_search(v.begin(), v.end(), target)" },
    { trigger: "lower", label: "lower_bound", snippet: "lower_bound(v.begin(), v.end(), val)" },
    { trigger: "upper", label: "upper_bound", snippet: "upper_bound(v.begin(), v.end(), val)" },
    { trigger: "max", label: "max(a, b)", snippet: "max(a, b)" },
    { trigger: "min", label: "min(a, b)", snippet: "min(a, b)" },
    // I/O
    { trigger: "cin", label: "cin >> var", snippet: "cin >> " },
    { trigger: "cout", label: "cout << val << endl", snippet: 'cout << "" << endl;' },
    { trigger: "auto", label: "auto type deduction", snippet: "auto " },
    { trigger: "return", label: "return value", snippet: "return " },
    { trigger: "INF", label: "INT_MAX / LLONG_MAX", snippet: "INT_MAX" },
    { trigger: "MOD", label: "const int MOD = 1e9+7", snippet: "const int MOD = 1e9 + 7;" },
    { trigger: "ll", label: "typedef long long ll", snippet: "typedef long long ll;" },
    { trigger: "endl", label: 'endl / "\\n"', snippet: "endl" },
  ],
  java: [
    { trigger: "main", label: "public static void main(…)", snippet: "public static void main(String[] args) {\n    " },
    { trigger: "class", label: "public class Name {", snippet: "public class Solution {\n    " },
    // Loops
    { trigger: "for", label: "for (int i = 0; i < n; i++)", snippet: "for (int i = 0; i < n; i++) {\n    " },
    { trigger: "forea", label: "for (Type item : arr)", snippet: "for (int item : arr) {\n    " },
    { trigger: "while", label: "while (condition) {", snippet: "while (condition) {\n    " },
    // Conditionals
    { trigger: "if", label: "if (condition) {", snippet: "if (condition) {\n    " },
    { trigger: "ife", label: "if/else block", snippet: "if (condition) {\n    \n} else {\n    " },
    { trigger: "switch", label: "switch (val) {", snippet: "switch (val) {\n    case 1:\n        break;\n    default:\n        break;\n}" },
    // Data structures
    { trigger: "ArrayList", label: "ArrayList<T>", snippet: "ArrayList<Integer> list = new ArrayList<>();" },
    { trigger: "HashMap", label: "HashMap<K, V>", snippet: "HashMap<Integer, Integer> map = new HashMap<>();" },
    { trigger: "HashSet", label: "HashSet<T>", snippet: "HashSet<Integer> set = new HashSet<>();" },
    { trigger: "LinkedList", label: "LinkedList<T>", snippet: "LinkedList<Integer> ll = new LinkedList<>();" },
    { trigger: "Queue", label: "Queue<T> (LinkedList)", snippet: "Queue<Integer> q = new LinkedList<>();" },
    { trigger: "PriorityQueue", label: "PriorityQueue<T>", snippet: "PriorityQueue<Integer> pq = new PriorityQueue<>();" },
    { trigger: "Stack", label: "Stack<T>", snippet: "Stack<Integer> st = new Stack<>();" },
    { trigger: "Arrays", label: "Arrays.sort(arr)", snippet: "Arrays.sort(arr);" },
    { trigger: "Collections", label: "Collections.sort(list)", snippet: "Collections.sort(list);" },
    // I/O
    { trigger: "Scanner", label: "Scanner sc = new Scanner…", snippet: "Scanner sc = new Scanner(System.in);\nint n = sc.nextInt();" },
    { trigger: "System", label: "System.out.println(…)", snippet: "System.out.println(" },
    { trigger: "sout", label: "System.out.println shortcut", snippet: "System.out.println();" },
    { trigger: "StringBuilder", label: "StringBuilder sb", snippet: "StringBuilder sb = new StringBuilder();" },
    { trigger: "Integer", label: "Integer.MAX_VALUE", snippet: "Integer.MAX_VALUE" },
    { trigger: "Math", label: "Math.max / min / abs", snippet: "Math.max(a, b)" },
    { trigger: "try", label: "try/catch block", snippet: "try {\n    \n} catch (Exception e) {\n    e.printStackTrace();\n}" },
    { trigger: "return", label: "return value", snippet: "return " },
    { trigger: "new", label: "new Object()", snippet: "new " },
    { trigger: "int[]", label: "int[] arr = new int[n]", snippet: "int[] arr = new int[n];" },
    { trigger: "String", label: "String methods", snippet: 'String s = "";' },
    { trigger: "char", label: "char ch", snippet: "char ch = " },
    { trigger: "boolean", label: "boolean flag = false", snippet: "boolean flag = false;" },
  ],
  sql: [
    { trigger: "sel", label: "SELECT * FROM table", snippet: "SELECT * FROM " },
    { trigger: "whe", label: "WHERE condition", snippet: "WHERE " },
    { trigger: "ord", label: "ORDER BY column", snippet: "ORDER BY " },
    { trigger: "gro", label: "GROUP BY column", snippet: "GROUP BY " },
    { trigger: "hav", label: "HAVING condition", snippet: "HAVING " },
    { trigger: "joi", label: "JOIN table ON condition", snippet: "JOIN  ON " },
    { trigger: "lim", label: "LIMIT n", snippet: "LIMIT " },
    { trigger: "dis", label: "SELECT DISTINCT", snippet: "SELECT DISTINCT " },
    { trigger: "cou", label: "COUNT(*)", snippet: "COUNT(*)" },
    { trigger: "avg", label: "AVG(column)", snippet: "AVG()" },
    { trigger: "sum", label: "SUM(column)", snippet: "SUM()" },
    { trigger: "max", label: "MAX(column)", snippet: "MAX()" },
    { trigger: "min", label: "MIN(column)", snippet: "MIN()" },
  ],
};

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "bg-green-100  text-green-700  border-green-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hard: "bg-red-100    text-red-700    border-red-200",
};

// ─── Markdown renderer ────────────────────────────────────────────────────────
function renderDescription(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="px-1.5 py-0.5 bg-slate-100 text-blue-700 rounded text-[0.85em] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    return part.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </span>
    ));
  });
}

// ─── Submission result types ──────────────────────────────────────────────────
interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  stderr: string;
}
interface SubmissionResult {
  status: string;
  passedCount: number;
  totalCount: number;
  testResults: TestResult[];
  message: string;
}

// ─── Problem Solver ───────────────────────────────────────────────────────────
export default function ProblemSolver() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "solution" | "testcases">("description");

  const [language, setLanguage] = useState<LangId>("python");
  const [code, setCode] = useState<Record<LangId, string>>({
    python: "# Write your solution here\npass",
    javascript: "// Write your solution here",
    cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}",
    java: "public class Solution {\n    public static void main(String[] args) {\n        // your code here\n    }\n}",
    sql: "-- Write your SQL query here\nSELECT * FROM table_name;",
  });
  const [customInput, setCustomInput] = useState("");
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ stdout: string; stderr: string; exitCode: number; status?: string; time?: string; memory?: number } | null>(null);
  const [outputTab, setOutputTab] = useState<"output" | "input" | "results">("output");
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"solved" | "attempted" | null>(null);
  const [marking, setMarking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [outputHeight, setOutputHeight] = useState(36); // 36 = collapsed (tab bar only)
  const [sqlSetup, setSqlSetup] = useState(""); // read-only table setup block for SQL problems

  // Refs
  const dragRef = useRef<{ active: boolean; startY: number; startH: number }>({ active: false, startY: 0, startH: 0 });
  const gutterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const delta = dragRef.current.startY - e.clientY;
      setOutputHeight(Math.max(36, Math.min(520, dragRef.current.startH + delta)));
    };
    const onUp = () => {
      dragRef.current.active = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);
  const startOutputDrag = (e: React.MouseEvent) => {
    dragRef.current = { active: true, startY: e.clientY, startH: outputHeight };
    e.preventDefault();
  };

  // Autocomplete
  const [suggestions, setSuggestions] = useState<Array<{ label: string; snippet: string }>>([]);
  const [suggestionPrefix, setSuggestionPrefix] = useState("");
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Load problem ──────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!slug) return;
    setLoading(true);
    problemApi
      .getBySlug(slug)
      .then((data: any) => {
        setProblem(data);
        setStatus(data.userStatus);

        // Split SQL starter code into read-only setup + editable solution
        const SQL_MARKER = "-- Write your solution below";
        const sqlFull = data.starterCode?.sql || "-- Write your SQL query here\nSELECT * FROM table_name;";
        const markerIdx = sqlFull.indexOf(SQL_MARKER);
        let sqlSetupPart = "";
        let sqlSolutionPart = sqlFull;
        if (markerIdx !== -1) {
          sqlSetupPart = sqlFull.slice(0, markerIdx + SQL_MARKER.length);
          sqlSolutionPart = sqlFull.slice(markerIdx + SQL_MARKER.length).replace(/^\n/, "") || "-- Your query here";
        }
        setSqlSetup(sqlSetupPart);

        setCode({
          python: data.starterCode?.python || "# Write your solution here\npass",
          javascript: data.starterCode?.javascript || "// Write your solution here",
          cpp: data.starterCode?.cpp || "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}",
          java: data.starterCode?.java || "public class Solution {\n    public static void main(String[] args) {}\n}",
          sql: sqlSolutionPart,
        });
        // Auto-select SQL tab for SQL-type problems
        if (data.type === "sql") setLanguage("sql");
      })
      .catch((err: any) => {
        setLoadError(err?.message || "Problem not found");
      })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  // Auto-expand output panel when results arrive
  useEffect(() => {
    if (output !== null) setOutputHeight((h) => (h < 200 ? 260 : h));
  }, [output]);
  useEffect(() => {
    if (submissionResult !== null) setOutputHeight((h) => (h < 200 ? 260 : h));
  }, [submissionResult]);

  // ── Autocomplete logic ────────────────────────────────────────────────────
  const getCurrentWord = (value: string, cursor: number): string => {
    const lineStart = value.lastIndexOf("\n", cursor - 1) + 1;
    const segment = value.slice(lineStart, cursor);
    return segment.match(/[\w#]+$/)?.[0] || "";
  };

  const updateSuggestions = (value: string, cursor: number) => {
    const word = getCurrentWord(value, cursor);
    if (!word || word.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const matches = CODE_SNIPPETS[language].filter((s) => s.trigger.startsWith(word.toLowerCase()) && s.trigger !== word.toLowerCase());
    setSuggestionPrefix(word);
    setSuggestions(matches.slice(0, 8));
    setActiveSuggestionIdx(0);
    setShowSuggestions(matches.length > 0);
  };

  const applySnippet = (snippet: string, cursor: number) => {
    const current = code[language];
    const start = cursor - suggestionPrefix.length;
    const newCode = current.slice(0, start) + snippet + current.slice(cursor);
    setCode((prev) => ({ ...prev, [language]: newCode }));
    setSuggestions([]);
    setShowSuggestions(false);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const pos = start + snippet.length;
      el.selectionStart = el.selectionEnd = pos;
      el.focus();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    // Suggestion navigation
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIdx((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Tab" || e.key === "Enter") {
        if (e.key === "Enter" && !showSuggestions) {
          // fall through to auto-indent
        } else {
          e.preventDefault();
          applySnippet(suggestions[activeSuggestionIdx].snippet, start);
          return;
        }
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
    }

    // Tab → 4 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const newVal = el.value.slice(0, start) + "    " + el.value.slice(end);
      setCode((prev) => ({ ...prev, [language]: newVal }));
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4;
      });
      return;
    }

    // Enter → auto-indent
    if (e.key === "Enter") {
      e.preventDefault();
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      const lineStart = before.lastIndexOf("\n") + 1;
      const indent = before.slice(lineStart).match(/^\s*/)?.[0] || "";
      // Extra indent after { : (
      const lastChar = before.trimEnd().slice(-1);
      const extraIndent = lastChar === "{" || lastChar === ":" || lastChar === "(" ? "    " : "";
      const newVal = before + "\n" + indent + extraIndent + after;
      setCode((prev) => ({ ...prev, [language]: newVal }));
      requestAnimationFrame(() => {
        const pos = start + 1 + indent.length + extraIndent.length;
        el.selectionStart = el.selectionEnd = pos;
        updateSuggestions(newVal, pos);
      });
      return;
    }

    // Auto-close brackets
    const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'" };
    if (pairs[e.key] && start === end) {
      e.preventDefault();
      const newVal = el.value.slice(0, start) + e.key + pairs[e.key] + el.value.slice(end);
      setCode((prev) => ({ ...prev, [language]: newVal }));
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 1;
      });
      return;
    }
  };

  // ── Full code helper (prepends SQL setup for SQL problems) ───────────────
  const getFullCode = (lang: LangId = language): string => {
    if (lang === "sql" && sqlSetup) return sqlSetup + "\n" + code[lang];
    return code[lang];
  };

  // ── Run code ──────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!problem) return;
    setRunning(true);
    setOutput(null);
    setOutputTab("output");
    setSubmissionResult(null);
    try {
      const result = await compileApi.run({ language, code: getFullCode(), stdin: useCustomInput ? customInput : "" });
      setOutput(result as any);
    } catch (err: any) {
      setOutput({ stdout: "", stderr: err.message || "Failed to run code.", exitCode: 1 });
    } finally {
      setRunning(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!problem) return;
    setSubmitting(true);
    setOutput(null);
    setSubmissionResult(null);
    setOutputTab("results");
    try {
      const result = await problemApi.submit(problem.slug, { language, code: getFullCode() });
      setSubmissionResult(result);
      if (result.status === "accepted") setStatus("solved");
      else setStatus((prev) => (prev === "solved" ? prev : "attempted"));
    } catch (err: any) {
      setSubmissionResult({
        status: "error",
        passedCount: 0,
        totalCount: 0,
        testResults: [],
        message: err.message || "Submission failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkSolved = async () => {
    if (!problem) return;
    setMarking(true);
    try {
      await problemApi.updateStatus(problem.slug, { status: "solved", language, code: code[language] });
      setStatus("solved");
    } catch {}
    setMarking(false);
  };

  const handleReset = () => {
    if (!problem) return;
    if (language === "sql" && sqlSetup) {
      const SQL_MARKER = "-- Write your solution below";
      const sqlFull = problem.starterCode?.sql || "";
      const markerIdx = sqlFull.indexOf(SQL_MARKER);
      const solutionPart = markerIdx !== -1 ? sqlFull.slice(markerIdx + SQL_MARKER.length).replace(/^\n/, "") || "-- Your query here" : sqlFull;
      setCode((prev) => ({ ...prev, sql: solutionPart }));
    } else {
      setCode((prev) => ({ ...prev, [language]: problem.starterCode?.[language as keyof typeof problem.starterCode] || "" }));
    }
    setOutput(null);
    setSuggestions([]);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getFullCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleUndo = () => {
    textareaRef.current?.focus();
    document.execCommand("undo");
  };
  const handleRedo = () => {
    textareaRef.current?.focus();
    document.execCommand("redo");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading problem...</p>
        </div>
      </div>
    );
  }
  if (loadError || !problem) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300 text-lg font-semibold mb-2">{loadError || "Problem not found"}</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentCode = code[language];
  const hasOutput = output !== null;
  const isError = hasOutput && (output.exitCode !== 0 || !!output.stderr);
  const submissionAccepted = submissionResult?.status === "accepted";

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-4 w-px bg-slate-600" />
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">B</span>
            </div>
            <span className="text-slate-200 font-bold text-sm hidden sm:block">BeyondBasic</span>
          </Link>
          <div className="h-4 w-px bg-slate-600" />
          <span className="text-slate-300 font-semibold text-sm truncate max-w-[200px]">{problem.title}</span>
          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${DIFFICULTY_STYLES[problem.difficulty]}`}>{problem.difficulty}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === "solved" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/40 border border-green-700 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-bold">Solved</span>
            </div>
          ) : (
            <Button size="sm" onClick={handleMarkSolved} disabled={marking} className="bg-green-600 hover:bg-green-500 text-white text-xs h-8 px-3 gap-1.5">
              {marking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trophy className="w-3 h-3" />}Mark Solved
            </Button>
          )}
          <Button onClick={handleRun} disabled={running || submitting} className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 px-4 gap-1.5">
            {running ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Run
              </>
            )}
          </Button>
          <Button onClick={handleSubmit} disabled={running || submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-4 gap-1.5">
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Submit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* ── LEFT: Problem Description ── */}
        <div className="w-full h-[45%] md:h-full md:w-[45%] md:min-w-[320px] bg-slate-50 flex flex-col border-b md:border-b-0 md:border-r border-slate-700 overflow-hidden">
          <div className="flex items-center gap-0 border-b border-slate-200 bg-white shrink-0">
            {[
              { id: "description", icon: BookOpen, label: "Description" },
              { id: "solution", icon: Code2, label: "Solution" },
              { id: "testcases", icon: FlaskConical, label: `Tests (${problem.testCases.filter((t) => !t.isHidden).length})` },
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setActiveTab(id as any)} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === id ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
            {problem.leetcodeUrl && (
              <a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="ml-auto mr-3 flex items-center gap-1 text-orange-500 hover:text-orange-600 text-xs font-bold">
                LC <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "description" && (
              <div className="p-5">
                <div className="mb-5">
                  <h1 className="text-xl font-black text-slate-900 mb-2">{problem.title}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${DIFFICULTY_STYLES[problem.difficulty]}`}>{problem.difficulty}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">{problem.topicTag}</span>
                    {problem.companies?.slice(0, 3).map((c) => (
                      <span key={c} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-md">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">{renderDescription(problem.description)}</div>
                {problem.examples.length > 0 && (
                  <div className="space-y-4">
                    {problem.examples.map((ex, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-500">Example {i + 1}</span>
                        </div>
                        <div className="p-4 space-y-2 bg-white">
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Input</span>
                            <pre className="mt-1 text-sm font-mono bg-slate-50 rounded-lg p-3 text-slate-800 whitespace-pre-wrap border border-slate-100">{ex.input}</pre>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Output</span>
                            <pre className="mt-1 text-sm font-mono bg-slate-50 rounded-lg p-3 text-slate-800 whitespace-pre-wrap border border-slate-100">{ex.output}</pre>
                          </div>
                          {ex.explanation && (
                            <div>
                              <span className="text-xs font-bold text-slate-400 uppercase">Explanation</span>
                              <p className="mt-1 text-sm text-slate-600">{ex.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "solution" && (
              <div className="p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-2">Solution</h2>
                {problem.solutionArticle ? <div className="prose prose-slate max-w-none text-sm leading-7" dangerouslySetInnerHTML={{ __html: problem.solutionArticle }} /> : <p className="text-sm text-slate-400">No solution article available yet.</p>}
              </div>
            )}
            {activeTab === "testcases" && (
              <div className="p-5">
                <p className="text-xs text-slate-400 mb-4 font-medium">Visible test cases — verify your output before submitting.</p>
                {problem.testCases.filter((t) => !t.isHidden).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No visible test cases</p>
                ) : (
                  <div className="space-y-3">
                    {problem.testCases
                      .filter((t) => !t.isHidden)
                      .map((tc, i) => (
                        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-500">Case {i + 1}</span>
                            <button
                              onClick={() => {
                                setCustomInput(tc.input);
                                setUseCustomInput(true);
                                setOutputTab("input");
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              Use as input
                            </button>
                          </div>
                          <div className="p-4 grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Input</p>
                              <pre className="text-xs font-mono bg-slate-50 rounded-lg p-2.5 text-slate-700 whitespace-pre-wrap border border-slate-100 min-h-[2.5rem]">{tc.input}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Expected</p>
                              <pre className="text-xs font-mono bg-green-50 rounded-lg p-2.5 text-green-800 whitespace-pre-wrap border border-green-100 min-h-[2.5rem]">{tc.expectedOutput}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Editor + Output ── */}
        <div className="w-full h-[55%] md:h-full md:flex-1 flex flex-col overflow-hidden bg-slate-900">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setLanguage(lang.id);
                    setSuggestions([]);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${language === lang.id ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handleUndo} title="Undo (Ctrl+Z)" className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                <Undo2 className="w-3 h-3" />
              </button>
              <button onClick={handleRedo} title="Redo (Ctrl+Y)" className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                <Redo2 className="w-3 h-3" />
              </button>
              <div className="w-px h-4 bg-slate-600" />
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {/* ── Code editor — fills all space between toolbar and output ── */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* SQL read-only setup section */}
            {language === "sql" && sqlSetup && (
              <div className="shrink-0 max-h-52 overflow-y-auto bg-slate-800/60 border-b border-slate-700">
                <div className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 sticky top-0 bg-slate-800 z-10">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400">Read-only</span>
                  <span className="text-slate-500">· Table Setup (auto-run before your query)</span>
                </div>
                <pre className="font-mono text-sm text-slate-400 px-4 py-3 leading-6 whitespace-pre" style={{ fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',Consolas,'Courier New',monospace" }}>
                  {sqlSetup}
                </pre>
              </div>
            )}

            {/* Editor with line numbers */}
            <div className="flex-1 min-h-0 flex overflow-hidden relative">
              {/* Line number gutter */}
              <div ref={gutterRef} className="shrink-0 w-11 bg-slate-800 text-slate-500 font-mono text-sm leading-6 text-right select-none overflow-hidden pt-4 pr-2" style={{ fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',Consolas,'Courier New',monospace" }}>
                {currentCode.split("\n").map((_, i) => (
                  <div key={i} className="leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={currentCode}
                onChange={(e) => {
                  const value = e.target.value;
                  const cursor = e.target.selectionStart;
                  setCode((prev) => ({ ...prev, [language]: value }));
                  updateSuggestions(value, cursor);
                }}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onScroll={(e) => {
                  if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
                }}
                spellCheck={false}
                className="flex-1 min-w-0 bg-slate-900 text-slate-100 font-mono text-sm p-4 pl-3 resize-none outline-none leading-6 selection:bg-blue-700/50 overflow-y-auto"
                style={{ fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',Consolas,'Courier New',monospace", tabSize: 4 }}
                placeholder="Write your solution here..."
              />

              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-14 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 w-80 max-h-52 overflow-y-auto" style={{ top: "auto", bottom: "8px" }}>
                  <div className="px-3 py-1.5 border-b border-slate-700 flex items-center gap-2">
                    <Code2 className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Completions for "{suggestionPrefix}"</span>
                    <span className="ml-auto text-[9px] text-slate-600">Tab/↵ to insert · Esc to close</span>
                  </div>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applySnippet(s.snippet, textareaRef.current?.selectionStart || 0);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${i === activeSuggestionIdx ? "bg-blue-600/30 border-l-2 border-blue-500" : "hover:bg-slate-700/50"}`}
                    >
                      <span className="text-[10px] font-mono font-bold text-blue-400 w-16 shrink-0 truncate">{s.trigger}</span>
                      <span className="text-xs text-slate-300 truncate flex-1">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Output Panel — draggable / collapsible strip at the bottom ── */}
          <div className="shrink-0 flex flex-col overflow-hidden bg-slate-950 border-t border-slate-700" style={{ height: `${outputHeight}px` }}>
            {/* Drag Handle */}
            <div onMouseDown={startOutputDrag} className="h-1.5 bg-slate-800 hover:bg-blue-600 cursor-ns-resize flex items-center justify-center group shrink-0 transition-colors" title="Drag to resize output panel">
              <div className="w-8 h-0.5 rounded-full bg-slate-600 group-hover:bg-white transition-colors" />
            </div>

            {/* Tab bar — always visible, 36px tall */}
            <div className="flex items-center justify-between px-4 border-b border-slate-800 h-9 shrink-0">
              <div className="flex items-center gap-0">
                {[
                  { id: "output", icon: Terminal, label: "Output" },
                  { id: "results", icon: CheckCircle2, label: "Results" },
                  { id: "input", icon: Code2, label: "Custom Input" },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setOutputTab(id as any);
                      setOutputHeight((h) => (h < 200 ? 260 : h));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${outputTab === id ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                    {id === "output" && hasOutput && <span className={`w-1.5 h-1.5 rounded-full ml-1 ${isError ? "bg-red-500" : "bg-green-500"}`} />}
                    {id === "results" && submissionResult && <span className={`w-1.5 h-1.5 rounded-full ml-1 ${submissionAccepted ? "bg-green-500" : "bg-red-500"}`} />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {hasOutput && output?.time && (
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span>⏱ {output.time}s</span>
                    {output.memory && <span>📦 {Math.round(output.memory / 1024)}KB</span>}
                    <span className={isError ? "text-red-400 font-bold" : "text-green-400 font-bold"}>{output.status || (isError ? "Error" : "Accepted")}</span>
                  </div>
                )}
                <button onClick={() => setOutputHeight((h) => (h <= 36 ? 260 : 36))} className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors" title={outputHeight > 36 ? "Collapse output" : "Expand output"}>
                  {outputHeight > 36 ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Scrollable output content — grows to fill remaining output panel height */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {outputTab === "output" && (
                <div className="p-4">
                  {running ? (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-sm">Executing your code...</span>
                    </div>
                  ) : !hasOutput ? (
                    <p className="text-slate-500 text-sm">
                      Click <span className="text-blue-400 font-semibold">Run</span> to execute and see output here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {/* Status badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${output.exitCode === 0 ? "bg-green-900/50 text-green-400 border border-green-700" : "bg-red-900/50 text-red-400 border border-red-700"}`}>{output.status || (output.exitCode === 0 ? "✓ Success" : "✗ Error")}</span>
                        {output.time && <span className="text-[10px] text-slate-500">ran in {output.time}s</span>}
                      </div>
                      {output.stdout && <pre className="text-sm font-mono text-green-300 whitespace-pre-wrap leading-5">{output.stdout}</pre>}
                      {output.stderr && (
                        <div className="mt-2">
                          <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Error</p>
                          <pre className="text-xs font-mono text-red-300 whitespace-pre-wrap leading-5 bg-red-950/30 rounded p-2 border border-red-900/50">{output.stderr}</pre>
                        </div>
                      )}
                      {!output.stdout && !output.stderr && <p className="text-slate-400 text-sm italic">No output</p>}
                    </div>
                  )}
                </div>
              )}

              {outputTab === "results" && (
                <div className="p-4">
                  {submitting ? (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span className="text-sm">Judging your solution...</span>
                    </div>
                  ) : !submissionResult ? (
                    <p className="text-slate-500 text-sm">
                      Click <span className="text-emerald-400 font-semibold">Submit</span> to run all test cases.
                    </p>
                  ) : (
                    <div>
                      {/* Verdict banner */}
                      <div className={`flex items-center justify-between p-3 rounded-lg mb-3 ${submissionAccepted ? "bg-green-900/40 border border-green-700" : submissionResult.status === "compile_error" ? "bg-yellow-900/40 border border-yellow-700" : "bg-red-900/40 border border-red-700"}`}>
                        <div className="flex items-center gap-2">
                          {submissionAccepted ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Circle className="w-4 h-4 text-red-400" />}
                          <span className={`font-black text-sm ${submissionAccepted ? "text-green-400" : submissionResult.status === "compile_error" ? "text-yellow-400" : "text-red-400"}`}>{submissionAccepted ? "Accepted" : submissionResult.status === "compile_error" ? "Compilation Error" : submissionResult.status === "runtime_error" ? "Runtime Error" : submissionResult.status === "wrong_answer" ? "Wrong Answer" : "Error"}</span>
                        </div>
                        {submissionResult.totalCount > 0 && (
                          <span className="text-xs font-bold text-slate-400">
                            {submissionResult.passedCount}/{submissionResult.totalCount} tests passed
                          </span>
                        )}
                      </div>

                      {/* Per-test breakdown */}
                      {submissionResult.testResults?.length > 0 && (
                        <div className="space-y-2">
                          {submissionResult.testResults.map((tr, i) => (
                            <div key={i} className={`rounded-lg border text-xs overflow-hidden ${tr.passed ? "border-green-800/50 bg-green-950/20" : "border-red-800/50 bg-red-950/20"}`}>
                              <div className={`flex items-center gap-2 px-3 py-1.5 ${tr.passed ? "bg-green-900/30" : "bg-red-900/30"}`}>
                                {tr.passed ? <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" /> : <Circle className="w-3 h-3 text-red-400 shrink-0" />}
                                <span className={`font-bold ${tr.passed ? "text-green-400" : "text-red-400"}`}>
                                  Test {i + 1} — {tr.passed ? "Passed" : "Failed"}
                                </span>
                              </div>
                              {!tr.passed && (
                                <div className="px-3 py-2 grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">Input</p>
                                    <pre className="font-mono text-slate-300 whitespace-pre-wrap text-[10px] bg-slate-900/50 rounded p-1.5">{tr.input || "(hidden)"}</pre>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-green-600 uppercase mb-0.5">Expected</p>
                                    <pre className="font-mono text-green-300 whitespace-pre-wrap text-[10px] bg-green-950/30 rounded p-1.5">{tr.expectedOutput}</pre>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-red-500 uppercase mb-0.5">Your Output</p>
                                    <pre className="font-mono text-red-300 whitespace-pre-wrap text-[10px] bg-red-950/30 rounded p-1.5">{tr.actualOutput || "(no output)"}</pre>
                                  </div>
                                  {tr.stderr && (
                                    <div>
                                      <p className="text-[9px] font-bold text-yellow-500 uppercase mb-0.5">Stderr</p>
                                      <pre className="font-mono text-yellow-300 whitespace-pre-wrap text-[10px] bg-yellow-950/30 rounded p-1.5">{tr.stderr}</pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message */}
                      {submissionResult.message && <p className="mt-2 text-xs text-slate-400">{submissionResult.message}</p>}
                    </div>
                  )}
                </div>
              )}

              {outputTab === "input" && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={useCustomInput} onChange={(e) => setUseCustomInput(e.target.checked)} className="rounded" />
                      Use custom stdin when running
                    </label>
                  </div>
                  <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Enter custom input here (stdin)..." className="w-full h-28 bg-slate-800 text-slate-200 font-mono text-xs p-3 rounded-lg border border-slate-700 resize-none outline-none focus:border-blue-500 placeholder-slate-600" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
