import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const pythonFoundations: Concept[] = [
  {
    slug: "how-to-use-this-track",
    title: "How to Use This Track",
    subtitle: "Chapter 0 — the path from a first script to a deployed AI service, and what to skip",
    level: "foundational",
    minutes: 8,
    tags: ["orientation", "roadmap", "ai engineering"],
    summary:
      "Twenty chapters in five parts take you from Python syntax to shipping an AI-backed API: the language, engineering Python, data work, machine learning, and LLM applications in production. Not every chapter is equally load-bearing — this page tells you which ones to slow down on for your background.",
    keyPoints: [
      "Five parts: the language, engineering Python, data, machine learning, and LLM apps in production.",
      "Coming from Java or TypeScript? Skim chapters 1–5 and slow down at typing, asyncio and testing.",
      "Chapters 8 (asyncio), 15 (LLM APIs), 16 (RAG) and 18 (FastAPI) are load-bearing for AI work.",
      "Every chapter has runnable code. Type it and run it — reading it is not the same skill.",
    ],
    sections: [
      {
        heading: "The five parts",
        table: {
          caption: "What each part unlocks.",
          headers: ["Part", "Chapters", "After it you can"],
          rows: [
            [
              "1. The language",
              "1 Basics · 2 Data structures · 3 Functions & generators · 4 Classes · 5 Errors & logging",
              "Read and write idiomatic Python without fighting the object model",
            ],
            [
              "2. Engineering Python",
              "6 Typing & Pydantic · 7 Environments · 8 Concurrency & asyncio · 9 Testing",
              "Build a typed, tested, dependency-pinned project that calls APIs concurrently",
            ],
            [
              "3. Data",
              "10 NumPy · 11 pandas & EDA",
              "Load, clean, explore and vectorise real datasets",
            ],
            [
              "4. Machine learning",
              "12 scikit-learn · 13 PyTorch · 14 Transformers & embeddings",
              "Train and evaluate models, and understand what an embedding actually is",
            ],
            [
              "5. LLM apps in production",
              "15 LLM APIs · 16 RAG · 17 Agents · 18 FastAPI · 19 Deployment & MLOps",
              "Ship a retrieval-augmented, tool-using AI service behind an API, and run it",
            ],
          ],
        },
      },
      {
        heading: "Three paths through it",
        lede: "Pick the row that describes you.",
        table: {
          headers: ["You are", "Read closely", "Skim", "Come back later"],
          rows: [
            ["New to programming", "1–5, 7, 9", "—", "12–14 until the data chapters feel easy"],
            [
              "A backend developer (Java, Go, TypeScript)",
              "6, 8, 9, 15–19",
              "1–5 (watch for the Python-specific traps called out in each)",
              "13 unless you will train models",
            ],
            ["A data scientist moving to AI engineering", "6–9, 15–19", "10–12", "—"],
          ],
        },
        callout: {
          kind: "insight",
          text: "The gap most people underestimate is Part 2. Notebooks hide it: no types, no tests, no concurrency, no dependency pinning. Production AI work is mostly that part, with a model call in the middle.",
        },
      },
      {
        heading: "The project that runs through the track",
        lede: "A question-answering service over your own documents.",
        diagram: {
          kind: "flow",
          caption: "Each stage is built in the chapter named under it.",
          rows: [
            [
              { id: "docs", label: "Raw documents", sub: "ch 3 generators" },
              { id: "clean", label: "Clean & chunk", sub: "ch 11 pandas", tone: "accent" },
              { id: "embed", label: "Embed", sub: "ch 14 embeddings" },
              { id: "store", label: "Vector store", sub: "ch 16 RAG" },
            ],
            [
              { id: "ask", label: "Question", sub: "ch 18 FastAPI" },
              { id: "retrieve", label: "Retrieve", sub: "ch 16 RAG", tone: "accent" },
              { id: "llm", label: "LLM + tools", sub: "ch 15 & 17" },
              { id: "ship", label: "Container & monitor", sub: "ch 19", tone: "ok" },
            ],
          ],
        },
        body: [
          "Building one thing end to end teaches more than twenty disconnected snippets. By chapter 19 you will have a service that ingests documents, answers questions with citations, calls a tool when it needs live data, and runs in a container with logs and evaluation.",
        ],
      },
      {
        heading: "Set up once",
        code: {
          title: "A modern Python project with uv",
          lang: "bash",
          source: `# uv installs Python, manages the virtual environment and pins dependencies
curl -LsSf https://astral.sh/uv/install.sh | sh

uv init ai-track && cd ai-track
uv python pin 3.12                     # every teammate gets the same interpreter

uv add numpy pandas scikit-learn httpx pydantic fastapi uvicorn
uv add --dev pytest ruff mypy          # dev-only tools

uv run python -c "import numpy, pandas; print('ready')"
uv run pytest                          # runs inside the project environment`,
        },
        bullets: [
          "Use Python 3.12 or newer. Several chapters rely on modern syntax: list[str] generics, match statements and better error messages.",
          "An editor with a real language server matters: VS Code with Pylance, or PyCharm. It catches most type errors before you run anything.",
          "Jupyter is for the data and ML chapters. Everything from chapter 15 onward is plain .py files, because that is what ships.",
        ],
        links: [
          { label: "uv documentation", href: "https://docs.astral.sh/uv/" },
          { label: "The Python Tutorial (official)", href: "https://docs.python.org/3/tutorial/" },
          {
            label: "YouTube search — uv python package manager tutorial",
            href: YT("uv python package manager tutorial"),
          },
        ],
      },
    ],
    related: ["/python/python-basics", "/fde/ai-ml-fundamentals", "/java/how-to-use-this-guide"],
    furtherReading: [
      { label: "The Python Tutorial", href: "https://docs.python.org/3/tutorial/" },
      { label: "roadmap.sh — Python", href: "https://roadmap.sh/python" },
    ],
  },

  {
    slug: "python-basics",
    title: "Python Basics",
    subtitle: "Chapter 1 — values, names, control flow, and how CPython actually runs your code",
    level: "foundational",
    minutes: 22,
    tags: ["syntax", "types", "cpython", "basics"],
    summary:
      "Python's syntax is small; the model underneath is what trips people. Variables are names bound to objects, some objects are mutable and some are not, and indentation is part of the grammar. Learn the object model once and most of the classic beginner bugs stop happening.",
    keyPoints: [
      "Variables are names that point at objects — not boxes that hold values.",
      "Mutable (list, dict, set) versus immutable (int, str, tuple) decides whether a change shows up elsewhere.",
      "Empty containers, 0, None and '' are falsy. Test for None with ‘is None’, not truthiness.",
      "CPython compiles to bytecode and interprets it. The GIL lets one thread run Python bytecode at a time.",
    ],
    sections: [
      {
        heading: "Names point at objects",
        lede: "The single idea that explains aliasing bugs.",
        code: [
          {
            title: "Example — two names, one list",
            lang: "python",
            source: `a = [1, 2, 3]
b = a              # b is ANOTHER NAME for the same list object
b.append(4)
print(a)           # [1, 2, 3, 4]  -- a changed too
print(a is b)      # True: the same object

c = a.copy()       # a NEW list containing the same elements
c.append(5)
print(a)           # [1, 2, 3, 4]  -- unaffected

x = 10
y = x
y += 1             # ints are immutable: += REBINDS y to a new int
print(x, y)        # 10 11`,
          },
          {
            title: "The mutable default argument trap",
            lang: "python",
            source: `def add_tag(tag, tags=[]):       # BUG: the [] is created ONCE, when def runs
    tags.append(tag)
    return tags

add_tag("a")    # ['a']
add_tag("b")    # ['a', 'b']   <- the same list is shared between calls

def add_tag(tag, tags=None):     # FIX: None as the sentinel
    if tags is None:
        tags = []
    tags.append(tag)
    return tags`,
          },
        ],
        table: {
          caption: "Mutability decides whether sharing is safe.",
          headers: ["Type", "Mutable?", "Typical use"],
          rows: [
            ["int, float, bool", "No", "Counts, measurements, flags"],
            ["str", "No", "Text — every 'change' creates a new string"],
            ["tuple", "No", "Fixed records, dict keys, returning several values"],
            ["list", "Yes", "Ordered sequences you append to"],
            ["dict", "Yes", "Mappings, JSON-shaped data"],
            ["set", "Yes", "Uniqueness and fast membership"],
          ],
        },
        callout: {
          kind: "warn",
          text: "Python is neither pass-by-value nor pass-by-reference. Arguments are passed by object reference: a function that mutates a list you gave it changes your list, but rebinding the parameter inside the function does not touch your variable.",
        },
        links: [
          {
            label: "Python docs — data model: objects, values and types",
            href: "https://docs.python.org/3/reference/datamodel.html",
          },
          {
            label: "YouTube search — Ned Batchelder facts and myths about Python names and values",
            href: YT("Ned Batchelder facts and myths about python names and values"),
          },
        ],
      },
      {
        heading: "Core types and operations",
        code: {
          title: "Numbers, strings and None",
          lang: "python",
          source: `print(2 ** 100)              # ints never overflow -- exact result
print(0.1 + 0.2)             # 0.30000000000000004 (IEEE-754 double)
print(7 // 2, 7 % 2)         # 3 1   floor division and remainder
print(-7 // 2)               # -4    floors toward negative infinity, not toward zero

from decimal import Decimal
print(Decimal("0.1") + Decimal("0.2"))    # 0.3 -- use Decimal for money

name, score = "Asha", 0.91234
print(f"{name} scored {score:.1%}")        # Asha scored 91.2%

s = "retrieval-augmented"
print(s[:9], s[-9:])         # retrieval augmented
print(s.split("-"), s.upper(), "aug" in s, len(s))

result = None                # "no value yet"
if result is None:           # identity test, not truthiness
    print("still computing")`,
        },
        bullets: [
          "Floats are for measurements. Money is Decimal or integer minor units — the same rule as the digital wallet design.",
          "Strings are immutable. Building one in a loop with += copies each time; collect parts in a list and ''.join(parts) once.",
          "‘==’ compares values, ‘is’ compares identity. Use ‘is’ only for None, True, False and sentinels.",
          "f-strings are the modern way to format. Format specs like :.2f, :,, :>10 and :.1% cover nearly everything.",
        ],
        links: [
          {
            label: "Python docs — built-in types",
            href: "https://docs.python.org/3/library/stdtypes.html",
          },
          { label: "Site: money in minor units", href: "/examples/digital-wallet" },
        ],
      },
      {
        heading: "Control flow",
        code: {
          title: "Loops, for-else and pattern matching",
          lang: "python",
          source: `scores = {"asha": 91, "ravi": 78, "meera": 64}

ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
for rank, (name, score) in enumerate(ranked, start=1):
    if score >= 90:
        grade = "A"
    elif score >= 75:
        grade = "B"
    else:
        grade = "C"
    print(rank, name, grade)

# for-else: the else runs only when the loop did NOT break
for name, score in scores.items():
    if score < 50:
        print("someone failed:", name)
        break
else:
    print("everyone passed")

# Structural pattern matching (3.10+) -- ideal for routing model events
def handle(event: dict) -> str:
    match event:
        case {"type": "text", "text": str(text)}:
            return f"show: {text}"
        case {"type": "tool_call", "name": name, "args": dict(args)}:
            return f"run {name} with {args}"
        case _:
            return "ignore"

print(handle({"type": "tool_call", "name": "search", "args": {"q": "refunds"}}))`,
        },
        bullets: [
          "Iterate over the collection itself. ‘for i in range(len(items))’ is almost always a sign you wanted enumerate or zip.",
          "zip(a, b) walks two sequences together and stops at the shorter; pass strict=True (3.10+) to raise if lengths differ.",
          "match is not a switch on values only — it destructures dicts, lists and classes, which makes it natural for parsing JSON events.",
        ],
        links: [
          {
            label: "Python docs — match statement tutorial (PEP 636)",
            href: "https://peps.python.org/pep-0636/",
          },
        ],
      },
      {
        heading: "Functions and arguments",
        code: {
          title: "Defaults, keyword-only arguments, *args and **kwargs",
          lang: "python",
          source: `def chunk(text: str, size: int = 500, *, overlap: int = 50) -> list[str]:
    """Split text into overlapping windows. Everything after * is keyword-only."""
    step = size - overlap
    return [text[i:i + size] for i in range(0, len(text), step)]

chunk("lorem " * 400)
chunk("lorem " * 400, 300, overlap=30)
# chunk("lorem", 300, 30)      # TypeError -- overlap must be passed by name

def log(message, *args, **kwargs):
    print(message, args, kwargs)

log("start", 1, 2, level="info")   # start (1, 2) {'level': 'info'}

def stats(values: list[float]) -> tuple[float, float, float]:
    return min(values), max(values), sum(values) / len(values)

low, high, mean = stats([3, 9, 4])  # tuple unpacking`,
        },
        bullets: [
          "Keyword-only parameters stop call sites like chunk(text, 300, 30, True), where nobody can tell what 30 and True mean.",
          "Name lookup follows LEGB: Local, Enclosing function, Global module, Built-ins. Assigning to a name makes it local to that function.",
          "Write a docstring on anything public. Editors show it on hover, and it is the first thing a teammate reads.",
        ],
      },
      {
        heading: "How CPython runs your code",
        steps: [
          {
            title: "Parse",
            text: "Source is tokenised and parsed into an abstract syntax tree.",
          },
          {
            title: "Compile to bytecode",
            text: "The AST becomes bytecode, cached as .pyc files in __pycache__ so the next run skips this step.",
          },
          {
            title: "Interpret",
            text: "The evaluation loop executes bytecode instructions one at a time.",
            detail:
              "Recent versions (3.11+) specialise hot instructions adaptively, which is where most of the recent speed-ups came from.",
          },
          {
            title: "Manage memory",
            text: "Objects are reference-counted and freed when the count hits zero; a cyclic garbage collector cleans up reference cycles.",
          },
        ],
        code: {
          title: "Look at the bytecode yourself",
          lang: "python",
          source: `import dis

def add(a, b):
    return a + b

dis.dis(add)
# Roughly: LOAD_FAST a · LOAD_FAST b · BINARY_OP (+) · RETURN_VALUE
# Each line is one trip through the interpreter loop -- which is why
# a pure-Python loop over a million numbers is slow.`,
        },
        table: {
          headers: ["Implementation", "What it is", "When you meet it"],
          rows: [
            [
              "CPython",
              "The reference interpreter, written in C",
              "Almost always — it is what python runs",
            ],
            [
              "PyPy",
              "An alternative interpreter with a JIT",
              "Speeding up pure-Python loops; C-extension support varies",
            ],
            [
              "Free-threaded CPython (3.13t)",
              "An experimental build without the GIL (PEP 703)",
              "CPU-bound threading experiments; not yet the default",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "Python is slow at loops and fast at calling C. NumPy, pandas and PyTorch do their heavy work in compiled code that releases the GIL, which is why Python dominates numerical and AI work despite a slow interpreter. The trick is keeping the loop out of Python.",
        },
        links: [
          {
            label: "YouTube search — how CPython works bytecode interpreter GIL explained",
            href: YT("how cpython works bytecode interpreter GIL explained"),
          },
          { label: "PEP 703 — making the GIL optional", href: "https://peps.python.org/pep-0703/" },
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "What is the difference between ‘is’ and ‘==’?",
            a: "‘==’ asks whether two objects have equal values and calls __eq__; ‘is’ asks whether they are the same object in memory. Use ‘is’ for None and other singletons. Small integers and some strings happen to be cached, so ‘is’ may appear to work on them, but that is an implementation detail you must not rely on.",
          },
          {
            q: "Why does a list default argument keep values between calls?",
            a: "Default values are evaluated once, when the def statement runs, and stored on the function object. Every call that omits the argument receives that same list. The fix is a None default and creating the list inside the body.",
          },
          {
            q: "Is Python pass-by-reference or pass-by-value?",
            a: "Neither exactly — it passes references to objects, sometimes called call by sharing. If the function mutates the object, the caller sees the change. If the function rebinds its parameter to a new object, the caller's variable is unaffected.",
          },
        ],
      },
    ],
    related: ["/python/data-structures", "/python/functions-generators-decorators", "/java/basics"],
    furtherReading: [
      {
        label: "Python docs — the data model",
        href: "https://docs.python.org/3/reference/datamodel.html",
      },
      {
        label: "Fluent Python, 2nd edition (Luciano Ramalho)",
        href: "https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/",
      },
    ],
  },

  {
    slug: "data-structures",
    title: "Data Structures and Complexity",
    subtitle: "Chapter 2 — lists, dicts, sets, tuples, comprehensions, and the costs behind them",
    level: "foundational",
    minutes: 22,
    tags: ["list", "dict", "set", "complexity", "collections"],
    summary:
      "Choosing the right built-in container is most of everyday Python performance. A membership test on a list scans every element; the same test on a set is a single hash lookup. Knowing the cost of each operation is the difference between a script that takes a second and one that takes an hour.",
    keyPoints: [
      "list: ordered, O(1) append, O(n) membership test and insert at the front.",
      "dict and set are hash tables — O(1) average lookup, and keys must be hashable.",
      "Comprehensions are the idiomatic way to build containers: clearer and faster than append loops.",
      "collections gives you Counter, defaultdict and deque for the shapes that keep recurring.",
    ],
    prerequisites: ["/python/python-basics"],
    sections: [
      {
        heading: "Choosing the container",
        table: {
          headers: ["Container", "Ordered", "Mutable", "Lookup cost", "Use it for"],
          rows: [
            [
              "list",
              "Yes",
              "Yes",
              "index O(1), search O(n)",
              "Sequences you append to and iterate",
            ],
            [
              "tuple",
              "Yes",
              "No",
              "index O(1)",
              "Fixed records, dict keys, multiple return values",
            ],
            [
              "dict",
              "Insertion order (3.7+)",
              "Yes",
              "by key O(1) average",
              "Mapping ids to objects; JSON-shaped data",
            ],
            ["set", "No", "Yes", "membership O(1) average", "Deduplication; 'have I seen this?'"],
            ["deque", "Yes", "Yes", "O(1) at both ends", "Queues and sliding windows"],
          ],
        },
        code: {
          title: "Why it matters — the same question, a million times faster",
          lang: "python",
          source: `import time

ids = list(range(1_000_000))
id_set = set(ids)

t = time.perf_counter(); 999_999 in ids
print(f"list: {time.perf_counter() - t:.4f}s")      # ~0.01s  -- scans a million items

t = time.perf_counter(); 999_999 in id_set
print(f"set:  {time.perf_counter() - t:.6f}s")      # ~0.000001s -- one hash lookup`,
        },
        callout: {
          kind: "warn",
          text: "‘if x in big_list’ inside a loop is quadratic. It is the most common accidental slowdown in data-processing scripts — convert the list to a set once, before the loop.",
        },
      },
      {
        heading: "Lists and slicing",
        code: {
          title: "Sorting, slicing, and the nested-list trap",
          lang: "python",
          source: `grid = [[0] * 3] * 3            # BUG: three references to the SAME inner list
grid[0][0] = 1
print(grid)                     # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]

grid = [[0] * 3 for _ in range(3)]   # FIX: a fresh inner list per row

docs = [{"title": "b", "score": 0.7}, {"title": "a", "score": 0.9}]
top = sorted(docs, key=lambda d: d["score"], reverse=True)   # returns a NEW list
docs.sort(key=lambda d: d["title"])                           # sorts in place, returns None

first_two = top[:2]              # slicing makes a shallow copy
every_other = list(range(10))[::2]   # [0, 2, 4, 6, 8]`,
        },
        bullets: [
          "sorted() works on any iterable and returns a new list; list.sort() mutates and returns None. Writing x = x.sort() is a classic bug.",
          "Python's sort is stable: sort by a secondary key first, then by the primary key, and ties keep their earlier order.",
          "A slice copies the outer list but not the objects inside it. For nested data, use copy.deepcopy — deliberately, because it is slow.",
        ],
      },
      {
        heading: "Dicts: the workhorse",
        code: {
          title: "Safe access, merging, and hashable keys",
          lang: "python",
          source: `user = {"id": 42, "name": "Asha", "roles": ["admin"]}
print(user.get("email", "unknown"))        # no KeyError
user |= {"email": "asha@example.com"}      # merge in place (3.9+)

for key, value in user.items():
    print(key, "->", value)

code_to_name = {"IN": "India", "US": "United States"}
name_to_code = {name: code for code, name in code_to_name.items()}   # invert

# Keys must be hashable: str, int, frozenset, tuples of hashables -- not list or dict
cache: dict[tuple[str, float], str] = {}
cache[("summarise", 0.2)] = "cached answer"     # tuple key works
# cache[["summarise"]] = "x"                    # TypeError: unhashable type: 'list'`,
        },
        bullets: [
          "Dicts keep insertion order, so they double as ordered records — but do not rely on order for equality; {'a': 1, 'b': 2} == {'b': 2, 'a': 1} is True.",
          "Mutating a dict while iterating over it raises RuntimeError. Iterate over list(d.items()) if you must delete as you go.",
          "Average O(1) assumes a decent hash. Mutable objects are unhashable precisely because their hash would change after insertion.",
        ],
        links: [
          {
            label: "YouTube search — Raymond Hettinger modern Python dictionaries",
            href: YT(
              "Raymond Hettinger modern python dictionaries confluence of a dozen great ideas",
            ),
          },
        ],
      },
      {
        heading: "Sets — and retrieval metrics for free",
        code: {
          title: "Precision and recall are set arithmetic",
          lang: "python",
          source: `retrieved = {"d1", "d4", "d7", "d9"}   # what your search returned
relevant  = {"d1", "d2", "d7"}         # what a human marked correct

hits = retrieved & relevant             # intersection -> {'d1', 'd7'}
precision = len(hits) / len(retrieved)  # 0.50  of what we returned, how much was right
recall    = len(hits) / len(relevant)   # 0.67  of what was right, how much we found
missed    = relevant - retrieved        # difference -> {'d2'}

print(f"precision={precision:.2f} recall={recall:.2f} missed={sorted(missed)}")`,
        },
        body: [
          "This is not a toy: evaluating a RAG retriever in chapter 16 is exactly this computation run over a few hundred labelled questions.",
        ],
        links: [{ label: "Site: evaluating retrieval", href: "/python/rag" }],
      },
      {
        heading: "Comprehensions and generator expressions",
        code: {
          title: "Build containers declaratively",
          lang: "python",
          source: `texts = ["  Refund policy ", "", "Shipping times", "   "]

cleaned = [t.strip() for t in texts if t.strip()]         # list
lengths = {t: len(t) for t in cleaned}                     # dict
first_letters = {t[0].lower() for t in cleaned}            # set

# Generator expression: same syntax in (), but lazy -- no list is built
total_chars = sum(len(line) for line in open("corpus.txt", encoding="utf-8"))

# Nested: flatten a list of chunk lists
chunks_per_doc = [["a1", "a2"], ["b1"]]
all_chunks = [c for doc in chunks_per_doc for c in doc]    # ['a1', 'a2', 'b1']`,
        },
        bullets: [
          "Rule of thumb: if a comprehension does not fit on one or two lines, write a normal loop. Clever nested comprehensions are hard to debug.",
          "Pass a generator expression straight into sum, max, any, all or ''.join to avoid building an intermediate list.",
          "Comprehensions have their own scope, so the loop variable does not leak into the surrounding function.",
        ],
      },
      {
        heading: "The collections module",
        code: {
          title: "Counter, defaultdict and deque",
          lang: "python",
          source: `from collections import Counter, defaultdict, deque

words = "the cat and the hat and the bat".split()
print(Counter(words).most_common(2))        # [('the', 3), ('and', 2)]

tickets = [("refund please", "billing"), ("app crashes", "bug"), ("charged twice", "billing")]
by_label: defaultdict[str, list[str]] = defaultdict(list)
for text, label in tickets:
    by_label[label].append(text)            # no "if label not in dict" boilerplate
print(dict(by_label))

history = deque(maxlen=4)                   # keeps only the last 4 chat turns
for turn in ["hi", "hello", "q1", "a1", "q2"]:
    history.append(turn)
print(list(history))                        # ['hello', 'q1', 'a1', 'q2']
history.popleft()                           # O(1) -- list.pop(0) would be O(n)`,
        },
        bullets: [
          "deque(maxlen=n) is the simplest correct implementation of short-term chat memory: old turns fall off automatically.",
          "heapq gives you a priority queue on a plain list — push and pop in O(log n), and heapq.nlargest for top-k results.",
          "For records, prefer a dataclass (chapter 4) over namedtuple unless you specifically need tuple behaviour.",
        ],
        links: [
          {
            label: "Python docs — collections",
            href: "https://docs.python.org/3/library/collections.html",
          },
          { label: "Site: LRU cache design", href: "/lld/lru-cache" },
        ],
      },
      {
        heading: "Big-O cheat sheet",
        table: {
          caption: "Average costs in CPython.",
          headers: ["Operation", "Cost", "Note"],
          rows: [
            ["list.append(x)", "O(1) amortised", "Occasional resize copies, averaged out"],
            ["list.insert(0, x) / list.pop(0)", "O(n)", "Shifts every element — use deque"],
            ["x in list", "O(n)", "Linear scan"],
            ["list[i]", "O(1)", ""],
            [
              "dict[k], k in dict, dict[k] = v",
              "O(1) average",
              "O(n) worst case with pathological hashes",
            ],
            ["x in set, set.add(x)", "O(1) average", ""],
            ["sorted(xs)", "O(n log n)", "Timsort — very fast on partly sorted data"],
            ["heapq.heappush / heappop", "O(log n)", ""],
            ["deque.appendleft / popleft", "O(1)", ""],
          ],
        },
        followUps: [
          {
            q: "Why is dict lookup O(1) on average?",
            a: "A dict is a hash table. The key's hash picks a slot directly, so lookup does not depend on how many items exist. Collisions are resolved by probing nearby slots, and the table resizes to keep it sparse. It degrades toward O(n) only if many keys collide, which good hash functions make unlikely.",
          },
          {
            q: "When would you use a tuple instead of a list?",
            a: "When the collection is a fixed record rather than a growing sequence — a coordinate, a database row, a function returning two values. Tuples are immutable, so they are hashable when their contents are, which lets them be dict keys and set members, and they signal intent: this shape does not change.",
          },
        ],
        links: [
          {
            label: "Python wiki — time complexity of built-in operations",
            href: "https://wiki.python.org/moin/TimeComplexity",
          },
        ],
      },
    ],
    related: ["/python/numpy", "/python/rag", "/lld/lru-cache"],
    furtherReading: [
      {
        label: "Python docs — data structures tutorial",
        href: "https://docs.python.org/3/tutorial/datastructures.html",
      },
      {
        label: "Python wiki — TimeComplexity",
        href: "https://wiki.python.org/moin/TimeComplexity",
      },
    ],
  },
];
