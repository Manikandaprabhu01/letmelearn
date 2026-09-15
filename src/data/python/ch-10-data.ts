import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const pythonData: Concept[] = [
  {
    slug: "numpy",
    title: "NumPy: Arrays, Vectorisation and Embedding Maths",
    subtitle:
      "Chapter 10 — ndarrays, broadcasting, and the linear algebra behind similarity search",
    level: "intermediate",
    minutes: 26,
    tags: ["numpy", "vectorization", "broadcasting", "linear algebra", "embeddings"],
    summary:
      "NumPy is the foundation every data and machine-learning library builds on. An ndarray is a typed, contiguous block of memory, and operations on it run in compiled code — so replacing a Python loop with a single vectorised expression is often a hundredfold speed-up. Cosine similarity over a matrix of embeddings is where you will feel it first.",
    keyPoints: [
      "An ndarray has one dtype and a shape; operations run in C across the whole array.",
      "Vectorise: express the computation over arrays instead of looping in Python.",
      "Broadcasting stretches smaller arrays across larger ones without copying data.",
      "Cosine similarity between normalised vectors is a single matrix multiplication.",
    ],
    prerequisites: ["/python/data-structures"],
    sections: [
      {
        heading: "Arrays: shape, dtype and axis",
        code: {
          title: "Creating, reshaping and aggregating",
          lang: "python",
          source: `import numpy as np

x = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.float32)
print(x.shape, x.dtype, x.ndim)      # (2, 3) float32 2

print(x.sum())            # 21.0   everything
print(x.sum(axis=0))      # [5. 7. 9.]   collapse rows -> one value per column
print(x.sum(axis=1))      # [ 6. 15.]    collapse columns -> one value per row

flat = x.reshape(-1)      # (6,)   -1 means "work it out"
col = x[:, 1]             # second column -> [2. 5.]
big = x[x > 2]            # boolean mask -> [3. 4. 5. 6.]

zeros = np.zeros((3, 384), dtype=np.float32)    # a batch of three 384-dim vectors
ids = np.arange(0, 10, 2)                       # [0 2 4 6 8]`,
        },
        table: {
          headers: ["Term", "Meaning"],
          rows: [
            ["shape", "Size of each dimension: (rows, columns) for a matrix"],
            ["dtype", "One element type for the whole array: float32, int64, bool"],
            ["axis=0", "Operate down the rows — the result has one entry per column"],
            ["axis=1", "Operate across columns — the result has one entry per row"],
            ["view", "A new array object sharing the same memory (slicing returns views)"],
          ],
        },
        callout: {
          kind: "warn",
          text: "Basic slicing returns a view, not a copy. Modifying col above would modify x. Call .copy() when you need an independent array — this surprises everyone coming from Python lists, where slicing copies.",
        },
        links: [
          {
            label: "NumPy — the absolute basics for beginners",
            href: "https://numpy.org/doc/stable/user/absolute_beginners.html",
          },
        ],
      },
      {
        heading: "Vectorisation",
        code: {
          title: "The same computation, a hundred times faster",
          lang: "python",
          source: `import time
import numpy as np

a = np.random.default_rng(0).random(1_000_000)
b = np.random.default_rng(1).random(1_000_000)

start = time.perf_counter()
total = 0.0
for i in range(len(a)):                    # a million trips through the interpreter
    total += (a[i] - b[i]) ** 2
print(f"loop:       {time.perf_counter() - start:.3f}s")   # ~0.3s

start = time.perf_counter()
total = np.sum((a - b) ** 2)               # one call into compiled code
print(f"vectorised: {time.perf_counter() - start:.4f}s")   # ~0.003s`,
        },
        bullets: [
          "The loop pays interpreter overhead per element and boxes every number into a Python float. The vectorised version runs a tight C loop over raw memory, often using SIMD instructions.",
          "If you find yourself writing for i in range(len(arr)) over a NumPy array, there is almost always a vectorised form.",
          "np.where(condition, a, b) replaces if/else inside a loop; np.cumsum, np.diff and np.clip replace most running calculations.",
        ],
      },
      {
        heading: "Broadcasting",
        code: {
          title: "Combining arrays of different shapes without copies",
          lang: "python",
          source: `import numpy as np

X = np.array([[1.0, 200.0], [2.0, 300.0], [3.0, 400.0]])   # (3, 2): 3 samples, 2 features

# Standardise each column: (3, 2) minus (2,) broadcasts across rows
X_std = (X - X.mean(axis=0)) / X.std(axis=0)

# Normalise each ROW to unit length: (3, 2) divided by (3, 1)
norms = np.linalg.norm(X, axis=1, keepdims=True)   # keepdims keeps shape (3, 1), not (3,)
X_unit = X / norms
print(np.linalg.norm(X_unit, axis=1))              # [1. 1. 1.]`,
        },
        table: {
          caption:
            "Shapes are compared from the rightmost dimension; each pair must be equal or one of them 1.",
          headers: ["Left shape", "Right shape", "Result", "Works?"],
          rows: [
            ["(3, 2)", "(2,)", "(3, 2)", "Yes — the row is repeated for every sample"],
            ["(3, 2)", "(3, 1)", "(3, 2)", "Yes — the column is repeated for every feature"],
            ["(3, 2)", "(3,)", "—", "No — 2 and 3 do not match"],
            ["(10000, 384)", "(384,)", "(10000, 384)", "Yes — one query against every document"],
          ],
        },
        callout: {
          kind: "note",
          text: "The (3,) versus (3, 1) difference is the most common silent bug: some operations broadcast into a shape you did not intend and produce a wrong answer instead of an error. keepdims=True and asserting shapes prevent it.",
        },
      },
      {
        heading: "Embedding maths: similarity search from scratch",
        lede: "What a vector database does, in ten lines.",
        code: {
          title: "Cosine similarity and top-k over 10,000 documents",
          lang: "python",
          source: `import numpy as np

rng = np.random.default_rng(0)
doc_vecs = rng.normal(size=(10_000, 384)).astype(np.float32)   # 10k docs x 384 dims
query = rng.normal(size=384).astype(np.float32)

def normalise(x: np.ndarray) -> np.ndarray:
    return x / np.linalg.norm(x, axis=-1, keepdims=True)

docs_n = normalise(doc_vecs)          # (10000, 384), each row has length 1
q_n = normalise(query)                # (384,)

scores = docs_n @ q_n                 # (10000,) -- cosine similarity via one matrix-vector product

k = 5
top = np.argpartition(-scores, k)[:k]       # the k best in O(n), unordered
top = top[np.argsort(-scores[top])]         # order only those k
print(top, scores[top])`,
        },
        body: [
          "For unit-length vectors, cosine similarity equals the dot product, so the whole comparison is one matrix multiplication handled by an optimised BLAS library. argpartition finds the top k without fully sorting ten thousand scores.",
        ],
        math: [
          {
            label: "Memory, 10k documents",
            expr: "10,000 × 384 × 4 bytes",
            result: "≈ 15 MB",
            note: "float32",
          },
          {
            label: "Memory, 1M documents",
            expr: "1,000,000 × 384 × 4 bytes",
            result: "≈ 1.5 GB",
            note: "why float16 or int8 quantisation matters",
          },
          {
            label: "Work per query, 1M documents",
            expr: "1,000,000 × 384 multiply-adds",
            result: "≈ 384 million",
            note: "fine for a batch job; approximate indexes avoid scanning everything per request",
          },
        ],
        callout: {
          kind: "insight",
          text: "Brute-force search is exact and genuinely fast up to around a million vectors. Beyond that, or under high query volume, approximate nearest-neighbour indexes (HNSW, IVF) trade a little recall for orders of magnitude less work — chapter 16 covers when to switch.",
        },
        links: [
          { label: "Site: RAG pipelines", href: "/python/rag" },
          {
            label: "YouTube search — cosine similarity embeddings numpy explained",
            href: YT("cosine similarity embeddings numpy explained"),
          },
        ],
      },
      {
        heading: "Randomness and reproducibility",
        code: {
          title: "Seeded generators and a reproducible split",
          lang: "python",
          source: `import numpy as np

rng = np.random.default_rng(seed=42)     # the modern API -- avoid np.random.seed
indices = rng.permutation(1_000)          # shuffled 0..999, identical on every run

split = int(0.8 * len(indices))
train_idx, test_idx = indices[:split], indices[split:]
print(len(train_idx), len(test_idx))      # 800 200`,
        },
        bullets: [
          "Pass a Generator object into functions instead of relying on global random state. Tests and experiments become reproducible, and parallel workers can each get their own stream.",
          "Record the seed alongside any experiment result. An unreproducible metric is an anecdote.",
        ],
      },
      {
        heading: "Pitfalls and interview follow-ups",
        bullets: [
          "Integer overflow is real in NumPy: int32 arrays wrap around silently, unlike Python ints.",
          "Arrays default to float64. Embeddings rarely need that precision — float32 halves the memory.",
          "Never compare floats with ==. Use np.isclose or np.allclose with a tolerance.",
        ],
        followUps: [
          {
            q: "Why is NumPy so much faster than Python lists?",
            a: "A list holds pointers to separately allocated Python objects, and every operation goes through the interpreter and type checks. An ndarray is one contiguous block of same-typed numbers, so operations run as compiled loops over raw memory with cache-friendly access and SIMD instructions — no per-element interpreter overhead.",
          },
          {
            q: "What is broadcasting?",
            a: "The rule that lets NumPy combine arrays of different shapes by virtually repeating dimensions of size one, without copying. Shapes are aligned from the right, and each dimension must match or be 1. It is how you subtract a per-column mean from a whole matrix in one expression.",
          },
          {
            q: "How would you find the top 10 most similar vectors among a million?",
            a: "Normalise vectors once at write time so cosine similarity is a dot product, compute scores with one matrix multiplication, and use argpartition for top-k in linear time. That is exact and fine for batch work. For low-latency serving at that scale I would use an approximate index such as HNSW, measuring recall against the exact result.",
          },
        ],
      },
    ],
    related: ["/python/pandas-eda", "/python/transformers-embeddings", "/python/rag"],
    furtherReading: [
      { label: "NumPy user guide", href: "https://numpy.org/doc/stable/user/" },
      {
        label: "From Python to NumPy (Nicolas Rougier)",
        href: "https://www.labri.fr/perso/nrougier/from-python-to-numpy/",
      },
    ],
  },

  {
    slug: "pandas-eda",
    title: "pandas and Exploratory Data Analysis",
    subtitle:
      "Chapter 11 — loading, cleaning, joining and understanding a dataset before you model it",
    level: "intermediate",
    minutes: 28,
    tags: ["pandas", "data cleaning", "eda", "parquet", "visualization"],
    summary:
      "Most model failures are data failures discovered too late. pandas turns a CSV into a DataFrame you can filter, clean, join and aggregate in a few lines, and a disciplined exploratory pass — shape, types, missing values, distributions, leakage — tells you whether the data can support the model at all.",
    keyPoints: [
      "A DataFrame is a set of typed columns sharing an index. Think in columns, not rows.",
      "Check shape, dtypes, missing values and duplicates before anything else.",
      "groupby-aggregate and merge cover most analysis. Avoid iterrows.",
      "Store intermediate data as Parquet rather than CSV: typed, compressed and fast.",
    ],
    prerequisites: ["/python/numpy"],
    sections: [
      {
        heading: "Load and inspect",
        code: {
          title: "A support-ticket dataset, first contact",
          lang: "python",
          source: `import pandas as pd

tickets = pd.read_csv(
    "tickets.csv",
    parse_dates=["created_at"],
    dtype={"ticket_id": "string", "channel": "category"},
)

print(tickets.shape)                 # (48210, 7)
print(tickets.dtypes)                # confirm numbers are numbers, dates are dates
print(tickets.head(3))
tickets.info()                       # non-null counts and memory usage
print(tickets.describe())            # count, mean, quartiles for numeric columns

print(tickets.isna().sum().sort_values(ascending=False))   # missing values per column
print(tickets.duplicated(subset=["ticket_id"]).sum())       # duplicate ids`,
        },
        bullets: [
          "Declare dtypes and date columns when loading. Letting pandas guess turns ids like 00123 into the number 123 and dates into plain strings.",
          "describe() is the fastest way to spot impossible values: negative resolution times, a satisfaction score of 11, a timestamp in 1970.",
          "Duplicated primary keys usually mean an upstream join or export went wrong — find out why before deleting them.",
        ],
        links: [
          {
            label: "pandas — 10 minutes to pandas",
            href: "https://pandas.pydata.org/docs/user_guide/10min.html",
          },
        ],
      },
      {
        heading: "Select, filter and create columns",
        code: {
          title: "loc, boolean masks and the accessors",
          lang: "python",
          source: `import numpy as np

billing = tickets.loc[tickets["category"] == "billing", ["ticket_id", "text", "csat"]]

recent_slow = tickets.query("created_at >= '2026-01-01' and resolution_hours > 48")

tickets = tickets.assign(
    text_len=tickets["text"].str.len(),
    weekday=tickets["created_at"].dt.day_name(),
    is_escalated=np.where(tickets["resolution_hours"] > 72, True, False),
)

# Setting values on a filtered frame: use .loc on the ORIGINAL to avoid SettingWithCopy
tickets.loc[tickets["channel"] == "e-mail", "channel"] = "email"`,
        },
        callout: {
          kind: "warn",
          text: "Chained assignment such as tickets[tickets.x > 1]['y'] = 0 may modify a temporary copy and change nothing. Always select rows and the column in a single .loc call when writing.",
        },
      },
      {
        heading: "Cleaning",
        code: {
          title: "Normalise, fill, deduplicate, and prepare text",
          lang: "python",
          source: `tickets["category"] = (
    tickets["category"].str.strip().str.lower().replace({"bill": "billing", "bugs": "bug"})
)

# Missing values: decide per column, and record what you did
tickets["csat"] = tickets["csat"].fillna(tickets["csat"].median())
tickets = tickets.dropna(subset=["text"])            # a ticket without text is unusable

tickets = tickets.drop_duplicates(subset=["ticket_id"], keep="last")

tickets["resolution_hours"] = tickets["resolution_hours"].clip(lower=0, upper=24 * 30)

# Collapse runs of whitespace without writing a regex
tickets["text"] = tickets["text"].str.split().str.join(" ")
tickets = tickets[tickets["text"].str.len() >= 20]   # drop near-empty messages

tickets["category"] = tickets["category"].astype("category")   # far less memory`,
        },
        bullets: [
          "There is no universally correct way to fill missing values. Median for skewed numbers, an explicit 'unknown' for categories, and sometimes a separate 'was_missing' flag, because missingness itself can be predictive.",
          "Keep cleaning in a function or script, not scattered notebook cells. You will need to rerun it on next month's data.",
        ],
      },
      {
        heading: "groupby, merge and pivot",
        code: {
          title: "The three operations behind most analysis",
          lang: "python",
          source: `summary = (
    tickets.groupby("category", observed=True)
    .agg(
        tickets=("ticket_id", "count"),
        median_hours=("resolution_hours", "median"),
        csat=("csat", "mean"),
    )
    .sort_values("tickets", ascending=False)
)

customers = pd.read_parquet("customers.parquet")      # customer_id, plan, country
enriched = tickets.merge(
    customers,
    on="customer_id",
    how="left",
    validate="many_to_one",      # raises if customers has duplicate ids
    indicator=True,               # adds _merge: both / left_only
)
print(enriched["_merge"].value_counts())              # how many tickets lack a customer

by_plan = enriched.pivot_table(
    index="plan", columns="category", values="resolution_hours", aggfunc="median", observed=True
)`,
        },
        bullets: [
          "validate= on merge turns a silent row explosion — joining on a key that is unexpectedly duplicated — into an immediate error.",
          "Check the row count before and after every merge. A left join that grows the table is almost always a bug.",
          "Named aggregations (tickets=('ticket_id', 'count')) produce readable column names directly.",
        ],
      },
      {
        heading: "Exploratory data analysis, step by step",
        steps: [
          {
            title: "Shape and types",
            text: "Row and column counts, dtypes, and memory — does the data look like what you were told it is?",
          },
          {
            title: "Missingness",
            text: "Which columns are missing, how much, and is it random or concentrated in one channel or time period?",
          },
          {
            title: "Distributions",
            text: "Histograms for numbers, value counts for categories. Look for skew, outliers and suspicious spikes.",
          },
          {
            title: "Relationships",
            text: "How does the target vary by segment? Group-bys and correlations, sanity-checked against domain knowledge.",
          },
          {
            title: "Time and leakage",
            text: "Does anything change abruptly over time? Is any column only known after the outcome?",
            detail:
              "Leakage is the most expensive mistake in this list: a feature that encodes the answer makes offline accuracy look excellent and collapses in production.",
          },
          {
            title: "Write it down",
            text: "Record findings and decisions — dropped rows, fills, exclusions — next to the code.",
          },
        ],
        code: {
          title: "Two charts that answer most first questions",
          lang: "python",
          source: `import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(11, 4))
tickets["resolution_hours"].clip(upper=200).plot.hist(bins=40, ax=axes[0], title="Resolution hours")
tickets["category"].value_counts().plot.bar(ax=axes[1], title="Tickets by category")
fig.tight_layout()
fig.savefig("eda_overview.png", dpi=150)`,
        },
        callout: {
          kind: "warn",
          text: "Leakage example: predicting a ticket's category at intake using resolution_hours or assigned_team. Both only exist after the ticket has been handled, so the model scores brilliantly on historical data and has nothing to go on for a new ticket.",
        },
      },
      {
        heading: "Performance and scale",
        code: {
          title: "Memory and storage wins",
          lang: "python",
          source: `print(tickets.memory_usage(deep=True).sum() / 1e6, "MB")

tickets["channel"] = tickets["channel"].astype("category")   # strings -> small integer codes
tickets.to_parquet("tickets_clean.parquet", index=False)      # typed, compressed, columnar

subset = pd.read_parquet("tickets_clean.parquet", columns=["ticket_id", "text"])   # read only what you need`,
        },
        table: {
          headers: ["Approach", "Speed", "Use when"],
          rows: [
            ["Vectorised column operations", "Fast", "Always the first choice"],
            [
              ".apply(func) per row",
              "Slow — a Python call per row",
              "No vectorised form exists and data is modest",
            ],
            ["iterrows()", "Very slow", "Almost never"],
            ["Parquet + column selection", "Fast I/O", "Any dataset you load more than once"],
            [
              "Polars or DuckDB",
              "Very fast, larger than memory",
              "Tens of millions of rows or more",
            ],
          ],
        },
        links: [
          {
            label: "YouTube search — pandas data cleaning tutorial real dataset",
            href: YT("pandas data cleaning exploratory data analysis tutorial real dataset"),
          },
        ],
      },
      {
        heading: "From DataFrame to a RAG corpus",
        code: {
          title: "Records ready for embedding, with metadata for filtering",
          lang: "python",
          source: `corpus = (
    tickets.loc[tickets["csat"] >= 4, ["ticket_id", "category", "created_at", "resolution_text"]]
    .dropna(subset=["resolution_text"])
    .drop_duplicates(subset=["resolution_text"])
)

records = [
    {
        "id": f"ticket-{row.ticket_id}",
        "text": row.resolution_text,
        "metadata": {"category": str(row.category), "year": row.created_at.year},
    }
    for row in corpus.itertuples(index=False)      # itertuples is far faster than iterrows
]
print(len(records), records[0]["metadata"])`,
        },
        body: [
          "Filtering to well-rated resolutions and deduplicating before embedding is a data decision with a direct quality effect: the retriever can only return what you indexed, and duplicates crowd better answers out of the top results.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How do you handle missing values?",
            a: "First I find out why they are missing, because that decides the treatment. Then per column: drop rows when the field is essential and missingness is rare, impute a median or mode for skewed data, use an explicit unknown category, and often add a missing-indicator feature. Imputation statistics are computed on the training split only, to avoid leaking test information.",
          },
          {
            q: "What is data leakage?",
            a: "When information that would not be available at prediction time gets into training — a feature recorded after the outcome, target statistics computed across the whole dataset, or random splits on data with a time component. It produces excellent offline metrics and a model that fails in production, which is why I check how and when each feature is created.",
          },
          {
            q: "Why avoid apply and iterrows?",
            a: "Both call Python once per row, so they lose the compiled, columnar speed pandas is built on. Vectorised column operations can be a hundred times faster. When a truly row-wise computation is unavoidable I use itertuples or push it into NumPy.",
          },
        ],
      },
    ],
    related: ["/python/numpy", "/python/scikit-learn", "/python/rag"],
    furtherReading: [
      { label: "pandas user guide", href: "https://pandas.pydata.org/docs/user_guide/" },
      {
        label: "Python for Data Analysis, 3rd edition (Wes McKinney)",
        href: "https://wesmckinney.com/book/",
      },
    ],
  },
];
