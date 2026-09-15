import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const pythonEngineering: Concept[] = [
  {
    slug: "typing-pydantic",
    title: "Type Hints and Pydantic",
    subtitle:
      "Chapter 6 — static types that catch bugs early, and runtime validation at the boundaries",
    level: "intermediate",
    minutes: 26,
    tags: ["typing", "mypy", "pydantic", "validation", "structured output"],
    summary:
      "Type hints do nothing at runtime, but they let mypy and your editor catch whole classes of bugs before the code runs. Pydantic works the other way round: it validates and parses untrusted data while the program runs. AI applications need both — and turning a model's JSON into trustworthy objects is exactly where Pydantic earns its place.",
    keyPoints: [
      "Type hints are not enforced at runtime; a type checker such as mypy or pyright enforces them.",
      "Annotate function signatures first — that is where most of the value lives.",
      "Pydantic validates and coerces data at runtime: request bodies, configuration, model output.",
      "Define a schema once in Pydantic and reuse it for validation, API docs and the LLM's output format.",
    ],
    prerequisites: ["/python/oop-dataclasses"],
    sections: [
      {
        heading: "Hints and a type checker",
        code: {
          title: "What mypy catches before you run anything",
          lang: "python",
          source: `def chunk(text: str, size: int = 500) -> list[str]:
    return [text[i:i + size] for i in range(0, len(text), size)]

def first_or_none(items: list[str]) -> str | None:
    return items[0] if items else None

chunks = chunk(12345)
# mypy: error: Argument 1 to "chunk" has incompatible type "int"; expected "str"

title = first_or_none([])
print(title.upper())
# mypy: error: Item "None" of "str | None" has no attribute "upper"

# Generic function with the 3.12 type-parameter syntax
def first[T](items: list[T]) -> T:
    return items[0]

n: int = first([3, 1, 2])        # mypy infers T = int`,
        },
        bullets: [
          "The second error is the valuable kind: a None that only appears on an empty result, caught statically instead of as a crash in production.",
          "Run the checker in CI (‘mypy src’ or pyright). Hints that nothing checks decay into lies.",
          "Adopt gradually: annotate public function signatures, turn on strict mode per module, and leave throwaway scripts alone.",
        ],
        links: [
          { label: "mypy documentation", href: "https://mypy.readthedocs.io/" },
          {
            label: "YouTube search — Python type hints mypy tutorial",
            href: YT("python type hints mypy tutorial"),
          },
        ],
      },
      {
        heading: "The typing toolbox",
        table: {
          headers: ["Construct", "Means", "Example"],
          rows: [
            ["X | None", "Either X or None", "def find(id: str) -> User | None"],
            ["Literal", "One of these exact values", 'mode: Literal["fast", "accurate"]'],
            [
              "TypedDict",
              "A dict with known keys and value types",
              "class Usage(TypedDict): input: int; output: int",
            ],
            [
              "Protocol",
              "Anything with these methods (structural)",
              "class Embedder(Protocol): def embed(...)",
            ],
            ["Callable", "A function with this signature", "on_token: Callable[[str], None]"],
            ["Generics", "The same type flows through", "def first[T](xs: list[T]) -> T"],
            ["Final", "Must not be reassigned", "MAX_TOKENS: Final = 4096"],
            [
              "Annotated",
              "A type plus metadata frameworks can read",
              "Annotated[int, Field(ge=1)]",
            ],
          ],
        },
      },
      {
        heading: "Pydantic models",
        lede: "Parse, do not just check.",
        code: {
          title: "Validation, coercion and readable errors",
          lang: "python",
          source: `from pydantic import BaseModel, Field, ValidationError, field_validator

class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=50)
    filters: dict[str, str] = {}          # safe in Pydantic: defaults are copied per instance

    @field_validator("query")
    @classmethod
    def strip_query(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("query cannot be blank")
        return value

req = SearchRequest.model_validate({"query": "  refund policy ", "top_k": "8"})
print(repr(req.query), req.top_k, type(req.top_k))
# 'refund policy' 8 <class 'int'>     -- "8" was coerced to an int

try:
    SearchRequest.model_validate({"query": "", "top_k": 500})
except ValidationError as exc:
    for err in exc.errors():
        print(err["loc"], err["msg"])
# ('query',) String should have at least 1 character
# ('top_k',) Input should be less than or equal to 50

print(req.model_dump_json())      # {"query":"refund policy","top_k":8,"filters":{}}`,
        },
        bullets: [
          "Pydantic coerces by default ('8' becomes 8). Use strict mode or StrictInt where a string must be rejected rather than converted.",
          "Validation errors are structured — location, message, input — so an API can return them field by field without string parsing.",
          "Pydantic v2's core is written in Rust, so validating thousands of objects a second is realistic.",
        ],
        links: [{ label: "Pydantic documentation", href: "https://docs.pydantic.dev/latest/" }],
      },
      {
        heading: "Structured output from an LLM",
        lede: "The schema is the contract; validation is how you enforce it.",
        code: {
          title: "Define the shape once, validate every reply, retry with feedback",
          lang: "python",
          source: `from typing import Literal
from pydantic import BaseModel, Field, ValidationError

class TicketTriage(BaseModel):
    category: Literal["billing", "bug", "account", "other"]
    urgency: int = Field(ge=1, le=5)
    summary: str = Field(max_length=200)
    needs_human: bool

SCHEMA = TicketTriage.model_json_schema()       # a JSON Schema dict

def triage(ticket: str, attempts: int = 2) -> TicketTriage:
    feedback = ""
    for _ in range(attempts):
        raw = generate_json(                    # your thin wrapper around a provider SDK
            system="Classify the support ticket. Reply only with JSON matching the schema.",
            user=ticket + feedback,
            json_schema=SCHEMA,                 # most provider APIs accept a schema
        )
        try:
            return TicketTriage.model_validate_json(raw)
        except ValidationError as exc:
            # Feed the precise errors back: the model usually fixes them on the second try
            feedback = f"\\n\\nYour previous reply was invalid: {exc.errors()}. Fix it."
    raise ModelOutputError("no valid triage JSON after retries")`,
        },
        callout: {
          kind: "insight",
          text: "Validate even when the provider guarantees the schema. Schema enforcement guarantees shape, not sense: urgency 5 for 'how do I change my avatar' is valid JSON and a wrong answer. Literal and Field constraints narrow what 'valid' means, and business-rule checks after validation catch the rest.",
        },
        bullets: [
          "Keep schemas small and flat. Every optional field and nested object is another way for the model to be almost right.",
          "Put descriptions on fields with Field(description=...). They land in the JSON Schema and act as instructions to the model.",
          "Log validation failures with the raw reply. A rising failure rate is often the first sign that a prompt or model change broke something.",
        ],
        links: [
          { label: "Site: LLM API calls", href: "/python/llm-apis" },
          {
            label: "YouTube search — pydantic structured output LLM",
            href: YT("pydantic structured output LLM json schema validation"),
          },
        ],
      },
      {
        heading: "Settings and secrets",
        code: {
          title: "Typed configuration that fails fast",
          lang: "python",
          source: `from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_")

    llm_api_key: SecretStr                  # required: startup fails if missing
    llm_model: str                          # required: never hard-code a model id in code
    request_timeout_s: float = 30.0
    max_output_tokens: int = 1024

settings = Settings()                       # reads APP_LLM_API_KEY, APP_LLM_MODEL, ...
print(settings.llm_api_key)                 # ********** -- safe if it ends up in a log
api_key = settings.llm_api_key.get_secret_value()`,
        },
        bullets: [
          "Failing at startup with 'APP_LLM_API_KEY field required' beats failing on the first user request an hour later.",
          "Keep model names in configuration. Providers retire model versions, and a config change is cheaper than a deploy.",
          "Commit a .env.example listing variable names; never commit .env itself.",
        ],
        links: [
          {
            label: "Pydantic settings management",
            href: "https://docs.pydantic.dev/latest/concepts/pydantic_settings/",
          },
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "If type hints are ignored at runtime, why write them?",
            a: "Because the type checker and the editor are not ignoring them. They catch None-handling mistakes, wrong argument types and broken refactors before code runs, they document intent at every call site, and frameworks like FastAPI and Pydantic read them to generate validation and API docs.",
          },
          {
            q: "Pydantic or dataclasses?",
            a: "Dataclasses for internal data the program constructs itself — they are fast and add no dependency. Pydantic wherever data crosses a trust boundary: HTTP bodies, environment configuration, files, and model output. The rule is to parse untrusted input once at the edge and pass typed objects inward.",
          },
          {
            q: "How do you get reliable JSON out of an LLM?",
            a: "Give the model a JSON Schema generated from a Pydantic model and use the provider's structured-output mode where available. Then validate the reply with the same model, retry once with the validation errors fed back, and apply business-rule checks after that. Track the failure rate as a metric so regressions are visible.",
          },
        ],
      },
    ],
    related: [
      "/python/oop-dataclasses",
      "/python/fastapi",
      "/python/llm-apis",
      "/fde/ai-engineering",
    ],
    furtherReading: [
      { label: "Python docs — typing", href: "https://docs.python.org/3/library/typing.html" },
      { label: "Pydantic documentation", href: "https://docs.pydantic.dev/latest/" },
    ],
  },

  {
    slug: "environments-packaging",
    title: "Environments, Dependencies and Project Layout",
    subtitle:
      "Chapter 7 — virtual environments, lockfiles, pyproject.toml, and ending 'works on my machine'",
    level: "intermediate",
    minutes: 20,
    tags: ["venv", "uv", "pyproject", "dependencies", "ruff"],
    summary:
      "Most 'Python is broken' stories are environment stories: packages installed globally, versions drifting apart, a notebook that only ran on one laptop. A virtual environment per project, a pyproject.toml, and a committed lockfile make builds reproducible — and AI stacks, with heavy and fast-moving dependencies, need that discipline more than most.",
    keyPoints: [
      "One virtual environment per project. Never pip install into the system Python.",
      "Declare dependencies in pyproject.toml, and pin exact versions in a committed lockfile.",
      "Use the src layout and run every tool through the project environment.",
      "ruff for lint and format, mypy for types, pytest for tests — all enforced in CI.",
    ],
    sections: [
      {
        heading: "Why environments exist",
        table: {
          headers: ["Approach", "Isolation", "Reproducible?", "Verdict"],
          rows: [
            [
              "pip install into system Python",
              "None — every project shares one set",
              "No",
              "Breaks the OS tools and every other project",
            ],
            [
              "Virtual environment (.venv)",
              "Per project",
              "Only with a lockfile",
              "The baseline for all development",
            ],
            [
              "Container image",
              "Per service, including OS libraries",
              "Yes, when the build is pinned",
              "What you deploy (chapter 19)",
            ],
          ],
        },
        body: [
          "Two projects needing different versions of the same library cannot share one environment. A virtual environment is simply a directory with its own interpreter link and its own site-packages, so each project installs exactly what it needs.",
        ],
      },
      {
        heading: "venv and pip — the baseline",
        code: {
          title: "The standard-library way",
          lang: "bash",
          source: `python3.12 -m venv .venv
source .venv/bin/activate          # Windows: .venv\\Scripts\\activate

python -m pip install --upgrade pip
python -m pip install fastapi httpx pydantic

python -m pip freeze > requirements.txt    # snapshot of exact installed versions
deactivate`,
        },
        bullets: [
          "Always run pip as python -m pip. It guarantees you install into the interpreter you think you are using.",
          "pip freeze captures what is installed, including transitive dependencies — but not how it got there, so updating one package cleanly is awkward. Lockfile tools solve that.",
          "Add .venv/ to .gitignore. Environments are rebuilt, never committed.",
        ],
      },
      {
        heading: "uv — the modern workflow",
        code: {
          title: "Create, add, lock, sync, run",
          lang: "bash",
          source: `uv init docs-qa && cd docs-qa
uv python pin 3.12                  # writes .python-version; uv downloads it if needed

uv add fastapi httpx pydantic       # updates pyproject.toml AND uv.lock
uv add --dev pytest ruff mypy       # development-only group
uv add --optional local-models torch sentence-transformers

uv lock --upgrade-package httpx     # deliberately update one dependency
uv sync --frozen                    # CI and Docker: install exactly the lockfile, fail if stale
uv run pytest                       # run inside the environment, no activation needed`,
        },
        table: {
          headers: ["Tool", "Lockfile", "Manages Python versions", "Speed"],
          rows: [
            ["pip + venv", "No (freeze is a snapshot)", "No", "Baseline"],
            ["Poetry", "Yes", "No", "Moderate"],
            ["uv", "Yes (uv.lock)", "Yes", "Very fast — written in Rust"],
          ],
        },
        links: [
          { label: "uv — projects guide", href: "https://docs.astral.sh/uv/guides/projects/" },
          {
            label: "YouTube search — uv python project management",
            href: YT("uv python project management lockfile tutorial"),
          },
        ],
      },
      {
        heading: "pyproject.toml",
        code: {
          title: "One file for metadata, dependencies and tool config",
          lang: "toml",
          source: `[project]
name = "docs-qa"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "httpx>=0.27",
    "pydantic>=2.8",
    "numpy>=2.0",
]

[project.optional-dependencies]
local-models = ["torch>=2.4", "sentence-transformers>=3.0"]

[dependency-groups]
dev = ["pytest>=8", "ruff>=0.6", "mypy>=1.11"]

[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP"]   # pyflakes, isort, bugbear, pyupgrade

[tool.mypy]
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]
markers = ["eval: slow quality evaluations, excluded by default"]`,
        },
        bullets: [
          "Ranges in pyproject.toml say what your code supports; the lockfile says exactly what was tested. You need both.",
          "Optional dependency groups keep multi-gigabyte packages like torch out of services that only call hosted APIs.",
        ],
      },
      {
        heading: "Project layout",
        code: {
          title: "The src layout",
          lang: "text",
          source: `docs-qa/
├── pyproject.toml
├── uv.lock                  # committed: exact versions of every package
├── .env.example             # variable names only, no real values
├── src/
│   └── docs_qa/
│       ├── __init__.py
│       ├── config.py        # pydantic-settings
│       ├── ingest.py
│       ├── retrieval.py
│       ├── llm.py           # the ONLY module that imports a provider SDK
│       └── api.py           # FastAPI app
├── tests/
│   ├── test_retrieval.py
│   └── test_api.py
└── notebooks/               # exploration only; nothing imports from here`,
        },
        bullets: [
          "The src layout stops tests from accidentally importing your working directory instead of the installed package — so a missing file in packaging fails in tests, not in production.",
          "Isolating the provider SDK in one module (llm.py) means switching providers, or faking the model in tests, touches one file.",
          "Notebooks are for exploring. Once code matters, move it into src/ where it is typed, tested and importable.",
        ],
      },
      {
        heading: "Dependency hygiene for AI stacks",
        bullets: [
          "Pin PyTorch together with its CUDA variant. A GPU image and a CPU image are different builds, and mixing them is a classic 'works locally, crashes on the server' bug.",
          "Audit dependencies (pip-audit, or your platform's scanner) and let Renovate or Dependabot open update pull requests, so upgrades are small and reviewed.",
          "Check licences for models and datasets as well as code. A model's licence can restrict commercial use even when the library is MIT.",
          "Keep build caches warm in CI: installing torch from scratch on every run wastes minutes and bandwidth.",
        ],
        callout: {
          kind: "warn",
          text: "Running ‘pip install’ in a notebook cell installs into whatever interpreter the kernel happens to use — often not the project environment. Add the dependency to the project and restart the kernel against .venv instead.",
        },
      },
      {
        heading: "Lint, format and type-check in CI",
        code: {
          title: "GitHub Actions with uv",
          lang: "yaml",
          source: `name: ci
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
      - run: uv sync --frozen
      - run: uv run ruff check .
      - run: uv run ruff format --check .
      - run: uv run mypy src
      - run: uv run pytest -q -m "not eval"`,
        },
        followUps: [
          {
            q: "What is the difference between requirements.txt and a lockfile?",
            a: "requirements.txt from pip freeze is a flat snapshot of what happened to be installed. A lockfile is produced by a resolver from your declared dependencies, records the full graph with hashes, and can be regenerated deterministically — so you can upgrade one package and see exactly what else changes.",
          },
          {
            q: "Why use the src layout?",
            a: "Without it, Python can import your package straight from the working directory, so tests pass even when packaging is broken. With src/, tests import the installed package, which is what production runs.",
          },
        ],
        links: [
          {
            label: "Python Packaging User Guide",
            href: "https://packaging.python.org/en/latest/",
          },
          { label: "Ruff documentation", href: "https://docs.astral.sh/ruff/" },
        ],
      },
    ],
    related: ["/python/testing", "/python/mlops-deployment", "/java/docker"],
    furtherReading: [
      { label: "Python Packaging User Guide", href: "https://packaging.python.org/en/latest/" },
      { label: "uv documentation", href: "https://docs.astral.sh/uv/" },
    ],
  },

  {
    slug: "concurrency-asyncio",
    title: "Concurrency: Threads, Processes and asyncio",
    subtitle: "Chapter 8 — the GIL, when each model wins, and calling many LLM APIs at once safely",
    level: "advanced",
    minutes: 30,
    tags: ["asyncio", "threads", "multiprocessing", "gil", "httpx"],
    summary:
      "AI services spend most of their time waiting — on model APIs, vector databases and HTTP calls. That is I/O-bound work, where asyncio lets one process juggle thousands of concurrent requests. CPU-bound work such as tokenising or feature engineering needs separate processes instead, because the GIL lets only one thread execute Python bytecode at a time.",
    keyPoints: [
      "I/O-bound (waiting on the network): asyncio or threads. CPU-bound (computing): processes.",
      "The GIL lets one thread run Python bytecode at a time, and it is released while waiting on I/O.",
      "asyncio.gather runs coroutines concurrently; a Semaphore caps how many run at once.",
      "Never call blocking code inside async def — it freezes every other task on the event loop.",
    ],
    prerequisites: ["/python/functions-generators-decorators", "/python/errors-context-logging"],
    sections: [
      {
        heading: "I/O-bound versus CPU-bound",
        diagram: {
          kind: "compare",
          caption: "Three models, three kinds of work.",
          options: [
            {
              title: "asyncio",
              sub: "One thread, an event loop",
              good: [
                "Thousands of concurrent network calls cheaply",
                "Explicit await points — easier to reason about",
                "Native in FastAPI, httpx and modern SDKs",
              ],
              bad: ["One blocking call stalls everything", "Needs async-aware libraries"],
              verdict: "Default for API-heavy AI services.",
              tone: "ok",
            },
            {
              title: "Threads",
              sub: "concurrent.futures.ThreadPoolExecutor",
              good: [
                "Works with blocking libraries unchanged",
                "Good for I/O — the GIL is released while waiting",
              ],
              bad: ["No speed-up for CPU-bound Python", "Shared state needs locks"],
              verdict: "Wrapping a blocking SDK.",
            },
            {
              title: "Processes",
              sub: "ProcessPoolExecutor, multiprocessing",
              good: ["True parallelism across CPU cores", "Separate memory — no GIL contention"],
              bad: ["Slow start-up", "Arguments and results must be pickled", "More memory"],
              verdict: "CPU-bound Python: parsing, tokenising, feature work.",
              tone: "accent",
            },
          ],
        },
      },
      {
        heading: "The GIL, precisely",
        body: [
          "The Global Interpreter Lock is a mutex inside CPython that only one thread holds at a time while executing Python bytecode. It protects the interpreter's internal state, such as reference counts, and makes single-threaded code fast.",
          "Crucially, it is released whenever a thread waits on I/O and inside many C extensions. So threads do speed up network-heavy code, NumPy and PyTorch run in parallel under the hood, and the GIL only really hurts pure-Python CPU-bound loops.",
        ],
        bullets: [
          "Ten threads each doing time.sleep(1) finish in about one second. Ten threads each summing numbers in a Python loop take roughly as long as doing it serially.",
          "The experimental free-threaded build (python3.13t) removes the GIL, but library support is still maturing. Design for processes when you need CPU parallelism today.",
        ],
        links: [
          {
            label: "YouTube search — Python GIL explained Larry Hastings",
            href: YT("python GIL explained Larry Hastings"),
          },
        ],
      },
      {
        heading: "asyncio fundamentals",
        code: {
          title: "Ten one-second waits in one second",
          lang: "python",
          source: `import asyncio, time

async def fake_llm_call(i: int) -> str:
    await asyncio.sleep(1)            # stands in for waiting on the network
    return f"answer {i}"

async def main() -> None:
    start = time.perf_counter()
    results = await asyncio.gather(*(fake_llm_call(i) for i in range(10)))
    print(len(results), f"results in {time.perf_counter() - start:.1f}s")
    # 10 results in 1.0s -- sequentially this would take 10s

asyncio.run(main())`,
        },
        steps: [
          {
            title: "async def creates a coroutine function",
            text: "Calling it returns a coroutine object; nothing runs yet.",
          },
          {
            title: "await suspends",
            text: "At each await the coroutine hands control back to the event loop, which runs other ready tasks.",
          },
          {
            title: "The loop resumes",
            text: "When the awaited I/O completes, the loop schedules the coroutine to continue from where it paused.",
          },
        ],
      },
      {
        heading: "Many API calls, bounded and polite",
        lede: "Concurrency without tripping the provider's rate limit.",
        code: {
          title: "A semaphore, a shared client, timeouts and 429 handling",
          lang: "python",
          source: `import asyncio
import httpx

MAX_CONCURRENT = 8                 # tune to the provider's rate limit, not to your CPU

async def embed_one(client: httpx.AsyncClient, sem: asyncio.Semaphore, text: str) -> list[float]:
    async with sem:                # at most MAX_CONCURRENT requests in flight
        for attempt in range(4):
            resp = await client.post("/v1/embeddings", json={"input": text})
            if resp.status_code == 429:
                wait = float(resp.headers.get("retry-after", 2 ** attempt))
                await asyncio.sleep(wait)      # yields: other tasks keep running
                continue
            resp.raise_for_status()
            return resp.json()["embedding"]
        raise RuntimeError("still rate limited after 4 attempts")

async def embed_all(texts: list[str], api_key: str) -> list[list[float]]:
    sem = asyncio.Semaphore(MAX_CONCURRENT)
    async with httpx.AsyncClient(
        base_url="https://api.example.com",
        timeout=httpx.Timeout(30.0),
        headers={"authorization": f"Bearer {api_key}"},
    ) as client:                               # ONE client: connection pooling
        async with asyncio.TaskGroup() as tg:  # 3.11+: a failure cancels the siblings
            tasks = [tg.create_task(embed_one(client, sem, t)) for t in texts]
    return [task.result() for task in tasks]`,
        },
        bullets: [
          "Create one AsyncClient and reuse it. A new client per request throws away connection pooling and repeats the TLS handshake every time.",
          "Always set a timeout. The default of waiting forever turns one slow provider into a pile-up of stuck requests.",
          "gather(..., return_exceptions=True) keeps going when some calls fail; TaskGroup cancels the rest on the first failure. Choose deliberately.",
          "Batch where the API allows it: one request with 100 texts usually beats 100 concurrent requests of one.",
        ],
        links: [
          { label: "Site: rate limiting at scale", href: "/hld/rate-limiting" },
          { label: "httpx — async support", href: "https://www.python-httpx.org/async/" },
        ],
      },
      {
        heading: "The blocking-call trap",
        code: {
          title: "One synchronous call freezes the whole event loop",
          lang: "python",
          source: `import asyncio, time
import requests

async def bad_handler() -> str:
    time.sleep(2)                                  # BLOCKS the loop: every request waits
    return requests.get("https://example.com").text   # also blocking

async def good_handler() -> str:
    await asyncio.sleep(2)                         # yields to other tasks
    async with httpx.AsyncClient() as client:
        return (await client.get("https://example.com")).text

async def wrapping_a_blocking_sdk(prompt: str) -> str:
    # When a library has no async API, run it in a worker thread
    return await asyncio.to_thread(blocking_sdk_generate, prompt)`,
        },
        callout: {
          kind: "warn",
          text: "The symptom is a service that handles one request fine and collapses under ten: latency grows in a staircase because requests are silently serialised behind a blocking call. In FastAPI, a plain def endpoint runs in a thread pool automatically — an async def endpoint containing a blocking call does not.",
        },
      },
      {
        heading: "Threads and processes for everything else",
        code: {
          title: "Executors for blocking I/O and CPU-bound work",
          lang: "python",
          source: `from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# Blocking I/O in a thread pool
with ThreadPoolExecutor(max_workers=16) as pool:
    pages = list(pool.map(download_page, urls))

# CPU-bound Python across cores
def clean_and_chunk(doc: str) -> list[str]:
    text = " ".join(doc.split())
    return [text[i:i + 800] for i in range(0, len(text), 700)]

if __name__ == "__main__":             # required: child processes re-import this module
    with ProcessPoolExecutor() as pool:
        chunked = list(pool.map(clean_and_chunk, documents, chunksize=64))`,
        },
        bullets: [
          "chunksize matters for processes: sending 100,000 tiny tasks one by one spends more time pickling than working.",
          "Without the __main__ guard, platforms that spawn processes (macOS and Windows) re-run your top-level code in every child.",
          "Keep processes for coarse work units. Passing a 2 GB DataFrame to a worker pickles 2 GB.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "asyncio or threads for I/O-bound work?",
            a: "Both work, because the GIL is released during I/O. asyncio scales to far more concurrent operations at lower memory and makes suspension points explicit, so it is my default for new services built on async libraries. Threads are the pragmatic choice when the libraries I need are blocking and rewriting is not worth it.",
          },
          {
            q: "Our async FastAPI endpoint gets slow under load. Where do you look first?",
            a: "For a blocking call inside async def — a synchronous database driver, requests, time.sleep, or a CPU-heavy function. It serialises the whole event loop. I would confirm with a profiler or by timing concurrent requests, then switch to an async library or wrap the call with asyncio.to_thread.",
          },
          {
            q: "How do you make hundreds of LLM calls without hitting rate limits?",
            a: "Bound concurrency with a semaphore sized to the provider's limit, reuse one HTTP client, honour Retry-After on 429s with jittered backoff, batch requests where the API supports it, and set timeouts. For large offline jobs I would use the provider's batch API or a queue with workers rather than one giant gather.",
          },
        ],
      },
    ],
    related: ["/python/fastapi", "/python/llm-apis", "/hld/rate-limiting", "/java/multithreading"],
    furtherReading: [
      { label: "Python docs — asyncio", href: "https://docs.python.org/3/library/asyncio.html" },
      {
        label: "Python docs — concurrent.futures",
        href: "https://docs.python.org/3/library/concurrent.futures.html",
      },
    ],
  },

  {
    slug: "testing",
    title: "Testing Python — and Testing LLM Code",
    subtitle:
      "Chapter 9 — pytest, fixtures, fakes, and testing code whose output is not deterministic",
    level: "intermediate",
    minutes: 26,
    tags: ["pytest", "fixtures", "mocking", "evals"],
    summary:
      "pytest makes ordinary testing pleasant: plain asserts, fixtures for setup and parametrize for tables of cases. LLM code adds a twist — the model's output changes from run to run — so you split the problem. Deterministic code gets unit tests, the model boundary gets fakes, and output quality gets an evaluation suite that produces scores rather than pass or fail.",
    keyPoints: [
      "pytest: plain assert, fixtures for setup, parametrize for many cases.",
      "Unit-test everything around the model deterministically; replace the model call with a fake.",
      "Never call a paid API in unit tests. Fake it at your own boundary, not deep inside the SDK.",
      "Measure output quality with an eval set and thresholds, run separately from the fast unit tests.",
    ],
    prerequisites: ["/python/errors-context-logging", "/python/environments-packaging"],
    sections: [
      {
        heading: "pytest basics",
        code: {
          title: "Plain asserts, expected exceptions and parametrize",
          lang: "python",
          source: `# tests/test_chunking.py
import pytest
from docs_qa.ingest import chunk

def test_chunks_cover_the_whole_text():
    text = "a" * 1200
    chunks = chunk(text, size=500, overlap=0)
    assert "".join(chunks) == text
    assert [len(c) for c in chunks] == [500, 500, 200]

def test_rejects_overlap_not_smaller_than_size():
    with pytest.raises(ValueError, match="overlap"):
        chunk("hello", size=100, overlap=100)

@pytest.mark.parametrize(
    ("size", "overlap", "expected_count"),
    [(500, 0, 3), (500, 100, 3), (1200, 0, 1), (100, 50, 23)],
)
def test_chunk_counts(size, overlap, expected_count):
    assert len(chunk("a" * 1200, size=size, overlap=overlap)) == expected_count`,
        },
        bullets: [
          "A failing assert shows both sides of the comparison, including a diff for lists and dicts, so a bare assert is all you need.",
          "Name tests for the behaviour they protect. test_rejects_overlap_not_smaller_than_size explains itself in a CI log.",
          "Run a subset with pytest -k chunk, stop at the first failure with -x, and see the slowest tests with --durations=10.",
        ],
        links: [
          { label: "pytest documentation", href: "https://docs.pytest.org/" },
          {
            label: "YouTube search — pytest tutorial fixtures parametrize",
            href: YT("pytest tutorial fixtures parametrize"),
          },
        ],
      },
      {
        heading: "Fixtures",
        code: {
          title: "Shared setup, temporary files and cleanup",
          lang: "python",
          source: `# tests/conftest.py -- fixtures here are available to every test file
import pytest
from docs_qa.retrieval import InMemoryStore

@pytest.fixture
def policy_docs() -> list[str]:
    return [
        "Refunds are allowed within 30 days of purchase.",
        "Shipping to India takes 5 to 7 business days.",
        "Accounts can be deleted from the settings page.",
    ]

@pytest.fixture
def store(policy_docs) -> InMemoryStore:       # fixtures can use other fixtures
    return InMemoryStore.from_texts(policy_docs)

@pytest.fixture
def corpus_file(tmp_path):                     # tmp_path: a fresh directory per test
    path = tmp_path / "corpus.txt"
    path.write_text("line one\\n\\nline two\\n", encoding="utf-8")
    yield path                                 # code after yield runs as teardown

def test_store_finds_refund_policy(store):
    results = store.search_text("can I get my money back", k=1)
    assert "Refunds" in results[0]`,
        },
        bullets: [
          "scope='session' builds an expensive fixture once per run — a loaded model or a database container — instead of once per test.",
          "monkeypatch sets environment variables or replaces attributes for one test and restores them afterwards automatically.",
        ],
      },
      {
        heading: "Faking at the right boundary",
        diagram: {
          kind: "compare",
          caption: "Where to cut the model out of a test.",
          options: [
            {
              title: "Patch the SDK's internals",
              sub: "mock.patch('provider_sdk.resources.messages.create')",
              good: ["No change to production code"],
              bad: [
                "Breaks on every SDK upgrade",
                "Tests depend on how the vendor structures its code",
                "Easy to fake a response shape the real API never returns",
              ],
              tone: "warn",
            },
            {
              title: "Inject a fake at your boundary",
              sub: "RagPipeline(store, llm=FakeLLM(...))",
              good: [
                "Stable: your interface changes when you choose",
                "Tests read like specifications",
                "The same seam lets you swap providers",
              ],
              bad: ["Requires designing that seam (a Protocol)"],
              verdict: "Design for it from the start.",
              tone: "ok",
            },
          ],
        },
        code: {
          title: "A fake model that records what it was asked",
          lang: "python",
          source: `class FakeLLM:
    def __init__(self, reply: str):
        self.reply = reply
        self.prompts: list[str] = []

    def generate(self, prompt: str) -> str:
        self.prompts.append(prompt)
        return self.reply

def test_answer_puts_retrieved_context_in_the_prompt(store):
    llm = FakeLLM(reply="You can get a refund within 30 days.")
    pipeline = RagPipeline(store=store, llm=llm)

    answer = pipeline.answer("Can I get a refund?")

    assert answer == "You can get a refund within 30 days."
    assert "Refunds are allowed within 30 days" in llm.prompts[0]   # retrieval reached the prompt
    assert len(llm.prompts) == 1                                     # no hidden extra calls`,
        },
      },
      {
        heading: "Testing async code",
        code: {
          title: "Async tests with pytest-asyncio",
          lang: "python",
          source: `import pytest

@pytest.mark.asyncio
async def test_embed_all_preserves_order(fake_embedding_server):
    vectors = await embed_all(["a", "b", "c"], api_key="test")
    assert [v[0] for v in vectors] == [ord("a"), ord("b"), ord("c")]

# For httpx, the respx library mocks HTTP routes so no network is touched:
#   respx.post("https://api.example.com/v1/embeddings").mock(return_value=httpx.Response(429))`,
        },
      },
      {
        heading: "What to test in an LLM application",
        table: {
          headers: ["Layer", "Kind of test", "Example check", "When it runs"],
          rows: [
            [
              "Chunking, cleaning",
              "Unit",
              "No text lost; chunk sizes within bounds",
              "Every commit",
            ],
            [
              "Prompt building",
              "Unit / snapshot",
              "Context and instructions assembled correctly",
              "Every commit",
            ],
            [
              "Output parsing",
              "Unit with recorded replies",
              "Valid, malformed and truncated JSON all handled",
              "Every commit",
            ],
            [
              "Retrieval quality",
              "Evaluation",
              "recall@5 against labelled questions",
              "On retrieval or data changes",
            ],
            [
              "Answer quality",
              "Evaluation",
              "Required facts present; rubric score from a grader",
              "On prompt or model changes",
            ],
            [
              "End to end",
              "Smoke test against the real API",
              "A handful of cases actually succeed",
              "Nightly and before release",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "Record real model replies — including the broken ones — and use them as fixtures for the parser. Your parser's worst day is the model's strangest output, and you only see those in logs.",
        },
      },
      {
        heading: "A minimal evaluation harness",
        code: {
          title: "Scores with a threshold, kept out of the unit run",
          lang: "python",
          source: `# tests/test_quality.py
import json
import pytest

CASES = [json.loads(line) for line in open("evals/qa.jsonl", encoding="utf-8")]
# each line: {"question": "...", "must_mention": ["30 days", "original payment method"]}

def fact_coverage(answer: str, facts: list[str]) -> float:
    return sum(fact.lower() in answer.lower() for fact in facts) / len(facts)

@pytest.mark.eval                  # run with: pytest -m eval
def test_answer_quality_meets_threshold(pipeline):
    scored = []
    for case in CASES:
        answer = pipeline.answer(case["question"])
        scored.append((fact_coverage(answer, case["must_mention"]), case["question"]))

    mean = sum(score for score, _ in scored) / len(scored)
    worst = sorted(scored)[:3]
    print(f"fact coverage {mean:.1%} over {len(scored)} cases; worst: {worst}")
    assert mean >= 0.85, "answer quality regressed -- inspect the worst cases above"`,
        },
        bullets: [
          "Start with 30–50 real questions and the facts a correct answer must contain. A small honest set beats a large synthetic one.",
          "Keyword coverage is crude but cheap and stable. Add an LLM grader with a written rubric for tone and correctness, and spot-check the grader against human judgement.",
          "Track the score per run over time. A threshold catches cliffs; a trend line catches slow decay.",
        ],
        links: [
          { label: "Site: AI reliability and GenAIOps", href: "/fde/ai-reliability-genaiops" },
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How do you unit test a function that calls an LLM?",
            a: "I do not let it call the LLM. The model sits behind a small interface, and the test injects a fake that returns a fixed reply and records the prompt. Then I assert on what is deterministic: the prompt contains the right context, the reply is parsed correctly, errors are handled. Quality of the real model is a separate evaluation, not a unit test.",
          },
          {
            q: "What makes a good evaluation set?",
            a: "Real questions from real users or domain experts, with a clear definition of a correct answer per case, covering the common path, the edge cases and the ones that have failed before. It should be versioned, stable enough that scores are comparable across runs, and small enough to run on every prompt change.",
          },
          {
            q: "Mocks or fakes?",
            a: "I prefer fakes — small working implementations such as an in-memory store or a scripted model — because tests then check behaviour rather than which methods were called. Mocks that assert call sequences couple tests to implementation details and break under harmless refactors.",
          },
        ],
      },
    ],
    related: ["/python/errors-context-logging", "/fde/ai-reliability-genaiops", "/java/testing"],
    furtherReading: [
      { label: "pytest documentation", href: "https://docs.pytest.org/" },
      {
        label: "pytest — how to use fixtures",
        href: "https://docs.pytest.org/en/stable/how-to/fixtures.html",
      },
    ],
  },
];
