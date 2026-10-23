export type PythonBlueprint = {
  title: string;
  subtitle: string;
  badge: string;
  diagram: string;
  explanation: string;
  keyComponents: { name: string; role: string; productionAdvice: string }[];
};

export type PythonTopicQA = {
  id: string;
  category: string;
  question: string;
  difficulty: "M" | "H";
  summary: string;
  fullAnswer: string;
  codeSnippet?: { lang: string; snippet: string };
  followUps: { q: string; a: string }[];
};

export type PythonCompanyTrack = {
  id: string;
  company: string;
  companySlug: string;
  roleTitle: string;
  focusArea: string;
  roundsSummary: string;
  barRaiserTenet: string;
  questions: {
    id: string;
    title: string;
    difficulty: "M" | "H";
    scenario: string;
    whatInterviewerIsTesting: string;
    architectureBlueprint: string;
    codeSnippet?: { lang: string; code: string };
    tradeoffs: string[];
    followUps: { q: string; a: string }[];
  }[];
};

export const PYTHON_BLUEPRINTS: PythonBlueprint[] = [
  {
    title: "CPython Memory Layout & Free-Threaded GIL Architecture",
    subtitle: "PyObject reference counting, generational cyclic GC, and PEP 703 Free-Threaded Python 3.13+",
    badge: "CPython Internals",
    explanation:
      "CPython manages memory primarily through reference counting (instant deallocation when ob_refcnt reaches 0), supplemented by a generational cyclic garbage collector for circular references. Python 3.13 introduces PEP 703 free-threading, replacing the global interpreter lock with per-object biased reference counting and mimalloc thread arenas.",
    diagram: `┌────────────────────────────────────────────────────────────────────────┐
│                        CPYTHON PROCESS RUNTIME                         │
├────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                  PyObject Memory Header (16 bytes)                 │ │
│ │  ├── ob_refcnt (uint64): Reference Counter                         │ │
│ │  └── ob_type   (*PyTypeObject): Pointer to Type descriptor         │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │               Generational Cyclic Garbage Collector                │ │
│ │  ├── Gen 0: Young objects (Scanned frequently on allocation budget)│ │
│ │  ├── Gen 1: Intermediate survivors                                 │ │
│ │  └── Gen 2: Long-lived objects (Scanned rarely)                    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │            PEP 703: Free-Threaded Multi-Core Architecture          │ │
│ │  ├── Thread 1 (Core 1) ──► Mimalloc Thread Arena (Lock-Free)       │ │
│ │  ├── Thread 2 (Core 2) ──► Mimalloc Thread Arena (Lock-Free)       │ │
│ │  └── Biased Reference Counting (Single-writer fast path)           │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘`,
    keyComponents: [
      {
        name: "Reference Counting",
        role: "Maintains ob_refcnt on every Python object; frees memory instantly upon zeroing",
        productionAdvice: "Zero GC pause overhead for non-circular objects",
      },
      {
        name: "Cyclic Garbage Collector",
        role: "Detects unreachable reference cycles (e.g. A points to B, B points to A)",
        productionAdvice: "Disable gc.disable() temporarily in high-throughput batch loops if objects are non-cyclic",
      },
      {
        name: "Free-Threaded Mode (PEP 703)",
        role: "Enables true parallel Python bytecode execution across CPU cores without the GIL",
        productionAdvice: "Requires building with CPython 3.13t and updating native C-extensions",
      },
    ],
  },
  {
    title: "PyTorch Tensor Computation Graph & Autograd Engine",
    subtitle: "CUDA stream memory management, dynamic DAG generation, forward pass tape, and backward autograd",
    badge: "PyTorch & AI",
    explanation:
      "PyTorch constructs a dynamic Directed Acyclic Graph (DAG) during the forward pass. Leaf nodes represent parameters (weights), non-leaf nodes represent operations (Add, Matmul, Softmax). Calling .backward() traverses the graph in reverse topological order, applying the chain rule to accumulate gradients into .grad buffers.",
    diagram: `[ Input Tensor X ] ──► [ Weight W1 ] ──► [ MatMul Operation ]
                                                    │
                                                    ▼
                                            [ Activation ReLU ]
                                                    │ (Forward Pass: Records Graph)
                                                    ▼
                                            [ Loss Function L ]
                                                    │
  ┌─────────────────────────────────────────────────┴─────────────────────────────────┐
  │                                                                                   │
  ▼                                                                                   ▼
[ Backward Pass: autograd.backward() ]                                [ Optimizer Step ]
  ├── 1. Compute dL/dActivation via Chain Rule                          ├── W1 -= lr * W1.grad
  ├── 2. Compute dL/dWeight and accumulate into W1.grad                 └── W1.grad.zero_()
  └── 3. Free intermediate activation memory if not retained`,
    keyComponents: [
      {
        name: "Dynamic Computation Graph",
        role: "Graph is defined-by-run on every forward iteration, enabling dynamic control flow (loops, if-else)",
        productionAdvice: "Use torch.no_grad() or torch.inference_mode() during evaluation to avoid graph recording overhead",
      },
      {
        name: "CUDA Memory Allocator",
        role: "Caches GPU allocations to avoid expensive cudaMalloc roundtrips to the NVIDIA driver",
        productionAdvice: "Inspect torch.cuda.memory_allocated() and call torch.cuda.empty_cache() only on OOM recovery",
      },
    ],
  },
];

export const PYTHON_TOPIC_QA_LIBRARY: PythonTopicQA[] = [
  {
    id: "python-qa-memory-leaks",
    category: "CPython Internals",
    question: "How do Memory Leaks occur in Python despite automatic Garbage Collection? Explain Circular References and Closure Scope traps.",
    difficulty: "H",
    summary:
      "Python memory leaks occur when references remain unintentionally reachable: circular references containing custom __del__ methods (in Python < 3.4), global/class-level collections (caches) without eviction, and closures holding references to large outer scopes.",
    fullAnswer: `### 1. The Closure Scope Leak
When defining an inner function or lambda, the inner function captures the entire lexical scope environment, not just the single variable it uses:
\`\`\`python
def create_worker():
    huge_dataset = load_10gb_matrix()  # 10 GB NumPy array
    status = "READY"
    
    def get_status():
        return status # Captures closure environment!
        
    return get_status # huge_dataset is retained in memory forever!
\`\`\`
**The Fix:** Explicitly delete or decouple large variables (\`del huge_dataset\`) or move the inner function outside.

### 2. Module-Level Collections (Unbounded Caches)
Using standard dictionaries or \`@lru_cache(maxsize=None)\` creates unbounded memory growth:
- Memory is never reclaimed because the root reference lives in the module global dictionary.
- **The Fix:** Always specify an explicit \`maxsize\` on \`functools.lru_cache\` or use \`weakref.WeakValueDictionary\`.

### 3. Profiling Memory with \`tracemalloc\` and \`objgraph\`
\`\`\`python
import tracemalloc

tracemalloc.start()
# Execute suspected workload
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics("lineno")

for stat in top_stats[:5]:
    print(stat) # Pinpoints exact file and line number allocating memory!
\`\`\``,
    codeSnippet: {
      lang: "python",
      snippet: `import tracemalloc

tracemalloc.start()
# Code block under analysis
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics("traceback")

for stat in top_stats[:3]:
    print(f"Memory: {stat.size / 1024 / 1024:.2f} MB")
    for line in stat.traceback.format():
        print(f"  {line}")`,
    },
    followUps: [
      {
        q: "What is the difference between shallow copy, deep copy, and zero-copy slicing in Python?",
        a: "A shallow copy (copy.copy) creates a new container object but inserts references to the original nested objects. A deep copy (copy.deepcopy) recursively copies all nested objects. Zero-copy slicing (memoryview / NumPy slicing) creates a pointer buffer that views existing bytes in memory without copying data.",
      },
    ],
  },
];

export const PYTHON_COMPANY_TRACKS: PythonCompanyTrack[] = [
  {
    id: "openai-python-systems",
    company: "OpenAI / Anthropic",
    companySlug: "openai",
    roleTitle: "Staff Software Engineer - Inference & Infrastructure",
    focusArea: "High-Throughput Async Networking & Distributed LLM Pipelines",
    roundsSummary: "AsyncIO Mechanics + Memory Profiling + API Streaming Architecture + Live Concurrency Problem",
    barRaiserTenet:
      "Deep Asynchronous Networking & Zero-Allocation Pipelines: Frontier labs evaluate whether you understand how Python handles tens of thousands of concurrent SSE streams without blocking the event loop.",
    questions: [
      {
        id: "openai-streaming-proxy",
        title: "Design a High-Throughput AsyncIO Reverse Proxy for LLM Token Streaming",
        difficulty: "H",
        whatInterviewerIsTesting:
          "Can you build an asynchronous streaming gateway that handles 20,000 concurrent Server-Sent Events (SSE) connections without event loop starvation or memory leaks?",
        scenario:
          "Design a Python reverse proxy using FastAPI and httpx that streams tokens from downstream model endpoints to clients. It must handle client disconnects cleanly, enforce sliding-window token rate limits, and consume minimal memory per stream.",
        architectureBlueprint: `### 1. The Event Loop Non-Blocking Imperative
- Never execute synchronous blocking calls (\`requests.get\`, \`time.sleep\`) inside coroutines.
- Use \`httpx.AsyncClient\` with HTTP/2 connection pooling.

### 2. Handling Client Disconnection Without Wasting Model Tokens
If a client closes their browser mid-stream, continuing to generate tokens from the upstream model burns hundreds of dollars in wasted compute:
- Detect client socket cancellation using \`request.is_disconnected()\`.
- Cancel the upstream streaming task immediately using an \`asyncio.TaskGroup\`.`,
        codeSnippet: {
          lang: "python",
          code: `from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import httpx

app = FastAPI()
client = httpx.AsyncClient(timeout=60.0)

@app.post("/v1/chat/completions")
async def stream_chat(request: Request):
    payload = await request.json()
    
    async def token_generator():
        try:
            async with client.stream("POST", "http://vllm-cluster/v1/completions", json=payload) as resp:
                async for chunk in resp.aiter_bytes():
                    # Detect if client disconnected
                    if await request.is_disconnected():
                        print("Client disconnected, halting upstream generation.")
                        break
                    yield chunk
        except Exception as e:
            yield f"data: {{\"error\": \"{str(e)}\"}}\\n\\n".encode()

    return StreamingResponse(token_generator(), media_type="text/event-stream")`,
        },
        tradeoffs: [
          "Avoid buffering chunks into a local string variable before streaming; yield raw bytes directly to ensure sub-10ms Time-To-First-Token (TTFT).",
        ],
        followUps: [
          {
            q: "How does asyncio.gather differ from asyncio.TaskGroup introduced in Python 3.11?",
            a: "asyncio.gather allows other tasks to continue running if one task fails, which can leak orphaned background tasks. asyncio.TaskGroup uses structured concurrency: if any child task raises an exception, all other active tasks in the group are immediately cancelled.",
          },
        ],
      },
    ],
  },
];
