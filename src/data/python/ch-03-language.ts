import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const pythonLanguage: Concept[] = [
  {
    slug: "functions-generators-decorators",
    title: "Functions, Generators and Decorators",
    subtitle: "Chapter 3 — first-class functions, closures, lazy iteration, and wrapping behaviour",
    level: "intermediate",
    minutes: 24,
    tags: ["closures", "generators", "decorators", "itertools"],
    summary:
      "Functions are objects you can pass around, return and wrap. Generators produce values lazily, which is how you process a 10 GB file or stream an LLM response without holding it all in memory. Decorators wrap behaviour — retries, timing, caching — around a function without touching its body.",
    keyPoints: [
      "Functions are first-class: pass them as arguments, return them, keep them in dicts.",
      "A closure remembers variables from the scope it was created in.",
      "Generators (yield) are lazy — each value is computed only when the consumer asks for it.",
      "A decorator takes a function and returns a wrapped one. Always use functools.wraps.",
    ],
    prerequisites: ["/python/python-basics", "/python/data-structures"],
    sections: [
      {
        heading: "Functions are values",
        code: {
          title: "A dispatch table instead of an if-chain",
          lang: "python",
          source: `from functools import partial

def summarise(text: str) -> str: return text[:60] + "..."
def translate(text: str, lang: str = "hi") -> str: return f"[{lang}] {text}"
def classify(text: str) -> str: return "billing" if "refund" in text else "general"

HANDLERS = {
    "summarise": summarise,
    "translate_hi": partial(translate, lang="hi"),   # pre-fill an argument
    "classify": classify,
}

def run(task: str, text: str) -> str:
    handler = HANDLERS.get(task)
    if handler is None:
        raise ValueError(f"unknown task {task!r}")
    return handler(text)

print(run("classify", "please refund my order"))     # billing`,
        },
        bullets: [
          "A dict of functions replaces long if/elif chains and makes adding a task a one-line change.",
          "lambda is for tiny expressions used once, like a sort key. If it needs a name or a docstring, use def.",
          "functools.partial fixes some arguments now and returns a function that takes the rest later.",
        ],
      },
      {
        heading: "Closures",
        code: [
          {
            title: "A function that remembers its environment",
            lang: "python",
            source: `def make_rate_counter(limit: int):
    used = 0
    def allow() -> bool:
        nonlocal used          # we rebind 'used', so declare it
        if used < limit:
            used += 1
            return True
        return False
    return allow

allow = make_rate_counter(2)
print(allow(), allow(), allow())   # True True False`,
          },
          {
            title: "The late-binding trap",
            lang: "python",
            source: `callbacks = [lambda: i for i in range(3)]
print([cb() for cb in callbacks])    # [2, 2, 2] -- every lambda sees the FINAL i

callbacks = [lambda i=i: i for i in range(3)]   # bind the current value as a default
print([cb() for cb in callbacks])    # [0, 1, 2]`,
          },
        ],
        callout: {
          kind: "note",
          text: "Closures capture variables, not values. The lambda looks up i when it runs, by which point the loop has finished. This surprises people in UI callbacks and in building lists of tasks for asyncio.",
        },
      },
      {
        heading: "Iterators and generators",
        lede: "Process data of any size in constant memory.",
        code: {
          title: "A lazy ingestion pipeline",
          lang: "python",
          source: `from typing import Iterable, Iterator

def read_lines(path: str) -> Iterator[str]:
    with open(path, encoding="utf-8") as f:
        for line in f:                 # the file object is itself lazy
            yield line.rstrip()

def non_empty(lines: Iterable[str]) -> Iterator[str]:
    return (line for line in lines if line)

def batched(items: Iterable[str], size: int) -> Iterator[list[str]]:
    batch: list[str] = []
    for item in items:
        batch.append(item)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch

# Memory stays at one batch no matter how large corpus.txt is.
for batch in batched(non_empty(read_lines("corpus.txt")), size=64):
    print(len(batch), "lines ready to embed")`,
        },
        table: {
          headers: ["", "List", "Generator"],
          rows: [
            ["Memory", "Holds every element", "Holds one element at a time"],
            ["Reusable", "Iterate as often as you like", "Single use — exhausted after one pass"],
            ["len() and indexing", "Yes", "No"],
            [
              "Best for",
              "Small results you revisit",
              "Streams, large files, pipelines, infinite sequences",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "Streaming an LLM response is exactly this shape: the SDK yields chunks as tokens arrive, and your code consumes them one at a time. Once generators click, streaming APIs stop feeling special.",
        },
        bullets: [
          "Generators are single-use. A second loop over an exhausted generator silently yields nothing — a confusing bug in evaluation scripts.",
          "Python 3.12 adds itertools.batched, which replaces the hand-written batched above.",
          "yield from delegates to another iterable, useful for flattening nested generators.",
        ],
        links: [
          {
            label: "YouTube search — David Beazley generator tricks for systems programmers",
            href: YT("David Beazley generator tricks for systems programmers"),
          },
        ],
      },
      {
        heading: "itertools and functools",
        code: {
          title: "The standard toolkit for iteration and caching",
          lang: "python",
          source: `from itertools import islice, chain, groupby, accumulate
from functools import lru_cache

first_five = list(islice(read_lines("corpus.txt"), 5))      # take without loading all
combined = list(chain(["a", "b"], ["c"]))                    # ['a', 'b', 'c']
running = list(accumulate([120, 80, 200]))                   # [120, 200, 400] token totals

events = sorted([("billing", 3), ("bug", 1), ("billing", 2)])   # groupby needs sorted input
for label, group in groupby(events, key=lambda e: e[0]):
    print(label, sum(n for _, n in group))

@lru_cache(maxsize=1024)
def tokenize_len(text: str) -> int:
    return len(text.split())       # pretend this is expensive
tokenize_len("hello world"); tokenize_len("hello world")
print(tokenize_len.cache_info())   # hits=1 misses=1`,
        },
        bullets: [
          "groupby only groups consecutive equal keys. Sort by the same key first, or you get repeated groups.",
          "lru_cache arguments must be hashable, and the cache lives per process — a second worker has its own empty cache.",
          "Never put lru_cache on an instance method without thinking: the cache keeps self alive, so objects are never freed.",
        ],
        links: [
          {
            label: "Python docs — itertools",
            href: "https://docs.python.org/3/library/itertools.html",
          },
        ],
      },
      {
        heading: "Decorators",
        lede: "Wrap behaviour around a function without editing it.",
        code: [
          {
            title: "A timing decorator",
            lang: "python",
            source: `import functools, time

def timed(fn):
    @functools.wraps(fn)                       # keeps fn.__name__ and docstring
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return fn(*args, **kwargs)
        finally:
            ms = (time.perf_counter() - start) * 1000
            print(f"{fn.__name__} took {ms:.1f} ms")
    return wrapper

@timed                                         # same as: embed = timed(embed)
def embed(texts: list[str]) -> list[list[float]]:
    return [[0.0] * 3 for _ in texts]`,
          },
          {
            title: "A retry decorator with exponential backoff and jitter",
            lang: "python",
            source: `import functools, random, time

def retry(times: int = 3, base_delay: float = 0.5,
          exceptions: tuple[type[Exception], ...] = (Exception,)):
    """A decorator FACTORY: calling retry(...) returns the actual decorator."""
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return fn(*args, **kwargs)
                except exceptions as exc:
                    if attempt == times:
                        raise                          # out of attempts: surface it
                    delay = base_delay * 2 ** (attempt - 1) * random.uniform(0.5, 1.5)
                    print(f"{fn.__name__}: {exc!r}, retry {attempt} in {delay:.2f}s")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(times=4, exceptions=(TimeoutError, ConnectionError))
def call_model(prompt: str) -> str:
    ...`,
          },
        ],
        bullets: [
          "Retry only transient failures — timeouts, connection resets, 429 and 5xx responses. Retrying a 400 just repeats the same mistake four times.",
          "Jitter matters: without the random factor, every client that failed together retries together, and the provider sees a synchronised thundering herd.",
          "For production code, use the tenacity library rather than hand-rolling this, and cap total retry time as well as attempts.",
        ],
        links: [
          { label: "Site: timeouts, retries and circuit breakers", href: "/hld/circuit-breaker" },
          { label: "Site: idempotency", href: "/hld/idempotency" },
          {
            label: "YouTube search — Python decorators explained with functools wraps",
            href: YT("python decorators explained functools wraps"),
          },
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "What is the difference between a list comprehension and a generator expression?",
            a: "Same syntax, different brackets and very different memory. The list comprehension builds every element immediately; the generator expression produces them one at a time as they are consumed. Use the generator when you only iterate once or feed a function like sum, and the list when you need len, indexing or several passes.",
          },
          {
            q: "Why use functools.wraps in a decorator?",
            a: "Without it, the wrapped function's name, docstring and signature are replaced by the wrapper's. Logs then say 'wrapper', debuggers and documentation tools show the wrong thing, and frameworks that inspect signatures — FastAPI is one — can break.",
          },
          {
            q: "When is lru_cache dangerous?",
            a: "With maxsize=None it grows without limit. On instance methods it holds references to every self it has seen, so objects are never garbage collected. And it caches per process, so in a multi-worker server it is inconsistent across workers and useless for sharing results between them.",
          },
        ],
      },
    ],
    related: ["/python/concurrency-asyncio", "/python/llm-apis", "/hld/circuit-breaker"],
    furtherReading: [
      {
        label: "Python docs — functools",
        href: "https://docs.python.org/3/library/functools.html",
      },
      { label: "tenacity — retrying library", href: "https://tenacity.readthedocs.io/" },
    ],
  },

  {
    slug: "oop-dataclasses",
    title: "Classes, Dataclasses and Protocols",
    subtitle:
      "Chapter 4 — objects the Pythonic way: dunder methods, dataclasses, composition and duck typing",
    level: "intermediate",
    minutes: 24,
    tags: ["oop", "dataclasses", "protocols", "dunder methods"],
    summary:
      "Python classes are lighter than Java's. There are no access modifiers, interfaces are replaced by duck typing and Protocols, and dataclasses generate the boilerplate. The real skill is knowing how little class you need — and when a plain function or a dataclass is the better answer.",
    keyPoints: [
      "Use @dataclass for classes that mostly hold data: __init__, __repr__ and __eq__ are generated.",
      "Dunder methods (__len__, __iter__, __eq__) make your objects work with built-in syntax.",
      "Prefer composition to inheritance, and Protocol for interfaces the type checker enforces.",
      "There is no private. A leading underscore is a convention that says 'not part of the API'.",
    ],
    prerequisites: ["/python/functions-generators-decorators"],
    sections: [
      {
        heading: "A class from first principles",
        code: {
          title: "Attributes, properties, classmethods and staticmethods",
          lang: "python",
          source: `class Document:
    max_chars = 50_000                          # class attribute: shared by all instances

    def __init__(self, doc_id: str, text: str, source: str = "upload"):
        self.doc_id = doc_id                    # instance attributes
        self.source = source
        self.text = text                        # goes through the property setter below

    @property
    def text(self) -> str:
        return self._text

    @text.setter
    def text(self, value: str) -> None:
        if len(value) > self.max_chars:
            raise ValueError(f"{self.doc_id}: text exceeds {self.max_chars} chars")
        self._text = value

    @classmethod
    def from_file(cls, path: str) -> "Document":   # alternative constructor
        with open(path, encoding="utf-8") as f:
            return cls(doc_id=path, text=f.read(), source="file")

    @staticmethod
    def normalise(text: str) -> str:               # no self, no cls: a namespaced function
        return " ".join(text.split())

    def __repr__(self) -> str:
        return f"Document({self.doc_id!r}, {len(self.text)} chars)"`,
        },
        table: {
          headers: ["Kind", "First argument", "Use it for"],
          rows: [
            ["Instance method", "self", "Behaviour that reads or changes one object"],
            ["@classmethod", "cls", "Alternative constructors: from_file, from_json"],
            ["@staticmethod", "none", "A helper that belongs with the class but needs neither"],
            ["@property", "self", "Computed or validated attributes that look like fields"],
          ],
        },
        callout: {
          kind: "note",
          text: "Coming from Java: do not write getters and setters by default. Start with plain attributes, and switch to @property later if you need validation — callers do not change, because obj.text works the same either way.",
        },
      },
      {
        heading: "Dunder methods: making objects feel built-in",
        code: {
          title: "A tiny vector type that supports +, ==, len and iteration",
          lang: "python",
          source: `import math

class Vector:
    def __init__(self, *values: float):
        self.values = list(values)

    def __add__(self, other: "Vector") -> "Vector":
        return Vector(*(a + b for a, b in zip(self.values, other.values, strict=True)))

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Vector) and self.values == other.values

    def __len__(self) -> int:
        return len(self.values)

    def __iter__(self):
        return iter(self.values)

    def __getitem__(self, i: int) -> float:
        return self.values[i]

    def __abs__(self) -> float:
        return math.sqrt(sum(v * v for v in self))

    def __repr__(self) -> str:
        return f"Vector{tuple(self.values)}"

v = Vector(3, 4) + Vector(0, 1)
print(v, len(v), abs(Vector(3, 4)), list(v), v[0])   # Vector(3, 5) 2 5.0 [3, 5] 3`,
        },
        table: {
          headers: ["Define", "And this works"],
          rows: [
            ["__repr__ / __str__", "print(obj), debugger output, logs"],
            ["__eq__ and __hash__", "==, and use as dict keys or set members"],
            ["__len__, __getitem__, __iter__", "len(obj), obj[i], for x in obj"],
            ["__add__, __mul__, __lt__", "+, *, < and sorted()"],
            ["__enter__ / __exit__", "with obj: (chapter 5)"],
            ["__call__", "obj(...) — objects that behave like functions"],
          ],
        },
        bullets: [
          "Defining __eq__ without __hash__ makes instances unhashable. That is deliberate: equal objects must have equal hashes.",
          "Always write a useful __repr__. It is what you see in the debugger and in logs at the worst moment.",
        ],
      },
      {
        heading: "Dataclasses",
        lede: "The right default for data-shaped classes.",
        code: {
          title: "Generated __init__, __repr__ and __eq__ — plus validation",
          lang: "python",
          source: `from dataclasses import dataclass, field, asdict

@dataclass(frozen=True, slots=True)
class Chunk:
    doc_id: str
    text: str
    position: int
    metadata: dict[str, str] = field(default_factory=dict)   # never a bare {} default

    def __post_init__(self) -> None:
        if self.position < 0:
            raise ValueError("position must be >= 0")

c = Chunk("handbook", "Refunds within 30 days.", 0, {"section": "billing"})
print(c)
# Chunk(doc_id='handbook', text='Refunds within 30 days.', position=0, metadata={'section': 'billing'})
print(c == Chunk("handbook", "Refunds within 30 days.", 0, {"section": "billing"}))   # True
# c.text = "changed"        # FrozenInstanceError
print(asdict(c))            # a plain dict, ready for json.dumps`,
        },
        table: {
          headers: ["Tool", "Validates types at runtime?", "Best for"],
          rows: [
            [
              "@dataclass",
              "No — hints are documentation for the type checker",
              "Internal data you construct yourself",
            ],
            ["typing.NamedTuple", "No", "Lightweight immutable records that must behave as tuples"],
            [
              "pydantic.BaseModel",
              "Yes — parses and coerces input",
              "Data crossing a boundary: API bodies, config, LLM JSON output",
            ],
          ],
        },
        bullets: [
          "frozen=True stops reassignment of fields, but a dict field is still mutable inside — and because it is unhashable, hash(c) raises TypeError.",
          "slots=True removes the per-instance __dict__: less memory and faster attribute access, useful when you create millions of chunks.",
          "The boundary rule: dataclasses inside your code, Pydantic at the edges where untrusted data enters. Chapter 6 covers the second half.",
        ],
        links: [
          {
            label: "Python docs — dataclasses",
            href: "https://docs.python.org/3/library/dataclasses.html",
          },
          {
            label: "YouTube search — Python dataclasses tutorial",
            href: YT("python dataclasses tutorial frozen slots field default_factory"),
          },
        ],
      },
      {
        heading: "Inheritance, composition and abstract base classes",
        diagram: {
          kind: "compare",
          caption: "Reach for composition first.",
          options: [
            {
              title: "Inheritance",
              sub: "class OpenAIRag(RagPipeline)",
              good: [
                "Reuses behaviour with little code",
                "Natural for true is-a hierarchies, like exception types",
              ],
              bad: [
                "Every provider-by-store combination becomes a subclass",
                "Changes to the base class ripple into every child",
                "Deep hierarchies are hard to follow",
              ],
              verdict: "Use for small, stable is-a relationships.",
              tone: "warn",
            },
            {
              title: "Composition",
              sub: "RagPipeline(retriever, llm)",
              good: [
                "Swap the retriever or model without new classes",
                "Each part is testable with a fake",
                "Matches how AI stacks actually vary",
              ],
              bad: ["Slightly more wiring at construction time"],
              verdict: "The default for services and pipelines.",
              tone: "ok",
            },
          ],
        },
        code: {
          title: "An abstract base class, then composition",
          lang: "python",
          source: `from abc import ABC, abstractmethod

class VectorStore(ABC):
    @abstractmethod
    def search(self, vector: list[float], k: int) -> list[str]: ...

class InMemoryStore(VectorStore):
    def __init__(self) -> None:
        self.items: list[tuple[list[float], str]] = []
    def search(self, vector: list[float], k: int) -> list[str]:
        return [text for _, text in self.items[:k]]

# VectorStore() -> TypeError: can't instantiate abstract class

class RagPipeline:
    def __init__(self, store: VectorStore, embed, generate):
        self.store, self.embed, self.generate = store, embed, generate   # has-a, not is-a

    def answer(self, question: str) -> str:
        context = self.store.search(self.embed(question), k=4)
        return self.generate(question, context)`,
        },
      },
      {
        heading: "Protocols: duck typing the type checker understands",
        code: {
          title: "Any object with the right method qualifies — no inheritance needed",
          lang: "python",
          source: `from typing import Protocol

class Embedder(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]: ...

class HostedEmbedder:                      # does NOT inherit from Embedder
    def embed(self, texts: list[str]) -> list[list[float]]:
        return call_provider_api(texts)

class LocalEmbedder:                       # neither does this
    def embed(self, texts: list[str]) -> list[list[float]]:
        return run_local_model(texts)

def index_documents(docs: list[str], embedder: Embedder) -> None:
    vectors = embedder.embed(docs)         # mypy checks both classes fit the Protocol
    ...

index_documents(["a", "b"], LocalEmbedder())`,
        },
        callout: {
          kind: "insight",
          text: "This is how production AI code swaps providers: define a small Protocol for 'embed' or 'generate', and write one adapter per provider. It is the strategy pattern without an inheritance tree, and it keeps vendor SDK types out of your business logic.",
        },
        links: [
          { label: "PEP 544 — Protocols", href: "https://peps.python.org/pep-0544/" },
          { label: "Site: strategy pattern", href: "/lld/strategy" },
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How does method resolution work with multiple inheritance?",
            a: "Python computes a method resolution order with the C3 linearisation algorithm, visible as Class.__mro__. Attribute lookup walks that list left to right, and super() calls the next class in the MRO rather than simply 'the parent', which is what makes cooperative multiple inheritance work.",
          },
          {
            q: "Dataclass, NamedTuple or Pydantic — how do you choose?",
            a: "A dataclass for internal data I construct myself, because it is fast and dependency-free. NamedTuple when I need genuine tuple behaviour. Pydantic at the boundary, where input is untrusted — request bodies, configuration, and JSON from a model — because it validates and coerces at runtime instead of trusting type hints.",
          },
          {
            q: "What are __slots__ for?",
            a: "They declare a fixed set of attributes and remove the per-instance __dict__. That cuts memory substantially and speeds attribute access, which matters when you hold millions of small objects. The cost is that you cannot add new attributes dynamically.",
          },
        ],
      },
    ],
    related: ["/python/typing-pydantic", "/lld/strategy", "/lld/solid", "/java/oop"],
    furtherReading: [
      {
        label: "Python docs — classes tutorial",
        href: "https://docs.python.org/3/tutorial/classes.html",
      },
      { label: "PEP 557 — data classes", href: "https://peps.python.org/pep-0557/" },
    ],
  },

  {
    slug: "errors-context-logging",
    title: "Errors, Context Managers and Logging",
    subtitle: "Chapter 5 — failing loudly, cleaning up reliably, and leaving a trail you can debug",
    level: "intermediate",
    minutes: 20,
    tags: ["exceptions", "context managers", "logging", "debugging"],
    summary:
      "Production AI code fails constantly: rate limits, timeouts, malformed model output, missing files. Good Python handles the failures it expects narrowly, guarantees cleanup with context managers, and logs structured events instead of printing — so that when something breaks at 3 a.m. there is a trail to follow.",
    keyPoints: [
      "Catch specific exceptions. A bare except hides bugs and even swallows Ctrl-C.",
      "Define a small exception hierarchy for your domain, and chain causes with raise ... from.",
      "with guarantees cleanup: files, locks, database transactions, HTTP clients.",
      "Use logging, not print, and log structured fields you can search on.",
    ],
    prerequisites: ["/python/oop-dataclasses"],
    sections: [
      {
        heading: "try, except, else, finally",
        code: {
          title: "Parsing a model's JSON output — narrowly",
          lang: "python",
          source: `import json

class ModelOutputError(Exception):
    """The model answered, but not in the shape we asked for."""

def parse_model_json(raw: str) -> dict:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        # 'from exc' keeps the original traceback attached as the cause
        raise ModelOutputError(f"invalid JSON at char {exc.pos}") from exc
    else:
        # runs only if the try block raised nothing
        if not isinstance(data, dict):
            raise ModelOutputError(f"expected an object, got {type(data).__name__}")
        return data
    finally:
        # runs no matter what -- cleanup belongs here
        pass`,
        },
        table: {
          headers: ["Clause", "Runs when"],
          rows: [
            ["try", "Always — the code that might fail"],
            ["except SomeError", "That specific error (or a subclass) was raised"],
            ["else", "The try block finished with no exception"],
            ["finally", "Always, even after return or an unhandled exception"],
          ],
        },
        callout: {
          kind: "warn",
          text: "‘except Exception: pass’ is the most expensive line in production Python. The failure disappears, the program continues in a corrupted state, and the bug surfaces hours later somewhere unrelated. If you truly must continue, log the exception with its traceback first.",
        },
      },
      {
        heading: "Designing exceptions for your domain",
        code: {
          title: "A small hierarchy the caller can act on",
          lang: "python",
          source: `class AppError(Exception):
    """Base for everything this service raises deliberately."""
    retryable = False

class ModelError(AppError):
    pass

class RateLimitedError(ModelError):
    retryable = True
    def __init__(self, retry_after: float):
        super().__init__(f"rate limited, retry after {retry_after}s")
        self.retry_after = retry_after

class ModelTimeoutError(ModelError):
    retryable = True

class ModelOutputError(ModelError):
    retryable = False          # retrying the same prompt rarely fixes a schema violation

def answer(question: str) -> str:
    try:
        return generate(question)
    except ModelError as exc:
        if exc.retryable:
            return enqueue_for_retry(question)
        raise                  # re-raise unchanged, with the original traceback`,
        },
        bullets: [
          "Raise at the point of detection, handle at the boundary where you know what to do — the API layer, the job runner, the CLI entry point.",
          "Python favours EAFP (easier to ask forgiveness than permission): try the operation and catch the failure, rather than checking every precondition first, which can race.",
          "Put data on exceptions (retry_after, the offending field) so handlers do not have to parse error messages.",
        ],
      },
      {
        heading: "Context managers",
        lede: "Cleanup that cannot be forgotten.",
        code: [
          {
            title: "A generator-based context manager",
            lang: "python",
            source: `import time
from contextlib import contextmanager

@contextmanager
def timed(label: str):
    start = time.perf_counter()
    try:
        yield                          # the body of the with-block runs here
    finally:                           # runs even if the body raises
        print(f"{label}: {(time.perf_counter() - start) * 1000:.1f} ms")

with timed("embed batch"):
    vectors = [[0.1, 0.2] for _ in range(1000)]`,
          },
          {
            title: "A class-based one: commit or roll back",
            lang: "python",
            source: `class Transaction:
    def __init__(self, conn):
        self.conn = conn

    def __enter__(self):
        self.conn.execute("BEGIN")
        return self.conn

    def __exit__(self, exc_type, exc, tb) -> bool:
        if exc_type is None:
            self.conn.execute("COMMIT")
        else:
            self.conn.execute("ROLLBACK")     # an exception inside the block
        return False                          # False = do not swallow the exception

with Transaction(conn) as tx:
    tx.execute("INSERT INTO purchases VALUES (...)")
    tx.execute("UPDATE users SET plan = 'pro' WHERE id = ...")`,
          },
        ],
        bullets: [
          "Anything with a close() belongs in a with-block: files, sockets, database connections, httpx.Client, model sessions.",
          "contextlib.ExitStack manages a variable number of context managers, like opening a list of files.",
          "Returning True from __exit__ swallows the exception. Almost never do that.",
        ],
        links: [
          {
            label: "Python docs — contextlib",
            href: "https://docs.python.org/3/library/contextlib.html",
          },
        ],
      },
      {
        heading: "Logging that helps at 3 a.m.",
        code: {
          title: "Module loggers, levels and exceptions with tracebacks",
          lang: "python",
          source: `import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger(__name__)          # one logger per module

def answer(request_id: str, question: str) -> str:
    log.info("question received", extra={"request_id": request_id, "chars": len(question)})
    try:
        reply, usage = generate(question)
    except ModelError:
        log.exception("generation failed", extra={"request_id": request_id})   # includes traceback
        raise
    log.info(
        "question answered",
        extra={"request_id": request_id, "input_tokens": usage.input, "output_tokens": usage.output},
    )
    return reply`,
        },
        table: {
          headers: ["Level", "Use it for"],
          rows: [
            ["DEBUG", "Detail you want only while diagnosing"],
            ["INFO", "Normal events worth recording: request handled, job finished"],
            ["WARNING", "Something unexpected that the code recovered from"],
            ["ERROR", "An operation failed"],
            ["CRITICAL", "The service cannot continue"],
          ],
        },
        bullets: [
          "In production emit JSON logs (structlog, or a JSON formatter) so fields like request_id and output_tokens are queryable rather than buried in text.",
          "Never log API keys, auth headers, or full user prompts that may contain personal data. Log sizes, ids and hashes instead.",
          "For every model call, log latency, input and output token counts and the model name. That single habit makes cost and latency problems diagnosable.",
        ],
        links: [
          { label: "Python logging HOWTO", href: "https://docs.python.org/3/howto/logging.html" },
          { label: "Site: observability", href: "/hld/observability" },
        ],
      },
      {
        heading: "Debugging",
        bullets: [
          "Read tracebacks bottom-up: the last line is the error, the frame just above it is where it happened, and further up is how you got there.",
          "breakpoint() drops into pdb at that line. The essential commands are n (next), s (step in), c (continue), p expr (print) and l (list source).",
          "python -X dev enables extra runtime checks and warnings that catch resource leaks and misuse early.",
          "py-spy dump --pid PID shows what a running, stuck Python process is doing, without restarting it.",
        ],
        links: [
          {
            label: "YouTube search — Python pdb debugging tutorial",
            href: YT("python pdb breakpoint debugging tutorial"),
          },
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "What is the difference between ‘raise’ and ‘raise ... from’?",
            a: "A bare raise inside an except block re-raises the current exception unchanged. ‘raise NewError(...) from exc’ raises a different exception and records the original as its __cause__, so the traceback shows both — the low-level JSONDecodeError and the domain-level ModelOutputError. Using ‘from None’ deliberately hides the cause.",
          },
          {
            q: "EAFP or LBYL?",
            a: "Python style prefers EAFP — attempt the operation and handle the exception — partly because checks can race: a file can disappear between os.path.exists and open. LBYL is still right when the check is cheap and the failure is common, or when an exception would be expensive inside a hot loop.",
          },
          {
            q: "Why not just use print in a service?",
            a: "print has no levels, no timestamps, no module name, no structured fields and no way to route output. logging can be filtered by level, formatted as JSON, sent to a collector and tagged with request ids — and it can be turned up to DEBUG for one module without a redeploy.",
          },
        ],
      },
    ],
    related: [
      "/python/testing",
      "/python/llm-apis",
      "/hld/observability",
      "/java/exception-handling",
    ],
    furtherReading: [
      {
        label: "Python docs — errors and exceptions",
        href: "https://docs.python.org/3/tutorial/errors.html",
      },
      { label: "structlog", href: "https://www.structlog.org/" },
    ],
  },
];
