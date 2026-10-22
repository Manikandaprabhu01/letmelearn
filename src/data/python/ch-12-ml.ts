import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const pythonMachineLearning: Concept[] = [
  {
    slug: "scikit-learn",
    title: "Machine Learning with scikit-learn",
    subtitle:
      "Chapter 12 — the supervised learning workflow: splits, pipelines, metrics and honest evaluation",
    level: "intermediate",
    minutes: 30,
    tags: ["machine learning", "scikit-learn", "classification", "evaluation", "pipelines"],
    summary:
      "Classic machine learning is still the right tool for much of applied AI — routing tickets, scoring leads, flagging fraud — and for structured problems it is cheaper, faster and easier to explain than an LLM. scikit-learn's fit/predict API, Pipelines and cross-validation make the honest workflow the easy one.",
    keyPoints: [
      "Split before you look: training, validation, and a test set you touch exactly once.",
      "Put preprocessing inside a Pipeline so it is fitted on training data only.",
      "Choose the metric from the cost of mistakes. Accuracy lies on imbalanced data.",
      "Always beat a trivial baseline before celebrating a model.",
    ],
    prerequisites: ["/python/pandas-eda"],
    sections: [
      {
        heading: "The workflow",
        diagram: {
          kind: "flow",
          caption: "The test set is opened once, at the very end.",
          rows: [
            [
              { id: "data", label: "Clean data", sub: "chapter 11" },
              { id: "split", label: "Split", sub: "train / test", tone: "accent" },
              { id: "pipe", label: "Pipeline", sub: "preprocess + model" },
              { id: "cv", label: "Cross-validate", sub: "on train only" },
            ],
            [
              { id: "tune", label: "Tune", sub: "search hyperparameters" },
              { id: "test", label: "Final test", sub: "once", tone: "warn" },
              { id: "ship", label: "Save & serve", sub: "joblib" },
              { id: "monitor", label: "Monitor drift", tone: "ok" },
            ],
          ],
        },
      },
      {
        heading: "A baseline, then a first model",
        code: {
          title: "Classifying support tickets from their text",
          lang: "python",
          source: `from sklearn.dummy import DummyClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline

X_train, X_test, y_train, y_test = train_test_split(
    tickets["text"], tickets["category"],
    test_size=0.2, stratify=tickets["category"], random_state=42,
)

baseline = DummyClassifier(strategy="most_frequent").fit(X_train, y_train)
print("baseline accuracy:", round(baseline.score(X_test, y_test), 3))   # always predicts the biggest class

model = make_pipeline(
    TfidfVectorizer(ngram_range=(1, 2), min_df=3, sublinear_tf=True),
    LogisticRegression(max_iter=1000, class_weight="balanced"),
)
model.fit(X_train, y_train)
print(classification_report(y_test, model.predict(X_test)))`,
        },
        bullets: [
          "stratify keeps class proportions identical in train and test, so a rare category is not missing from one side by chance.",
          "The dummy baseline is not decoration. If 41% of tickets are billing, a 45% accurate model has learned almost nothing.",
          "TF-IDF plus logistic regression is a strong, fast, explainable text baseline. Try it before any neural model — or any LLM.",
        ],
        links: [
          {
            label: "scikit-learn — working with text data",
            href: "https://scikit-learn.org/stable/tutorial/text_analytics/working_with_text_data.html",
          },
        ],
      },
      {
        heading: "Pipelines and ColumnTransformer",
        lede: "The structural fix for data leakage.",
        code: {
          title: "Mixed tabular data: numbers, categories and text together",
          lang: "python",
          source: `from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.decomposition import TruncatedSVD

numeric = ["account_age_days", "tickets_last_90d"]
categorical = ["plan", "country", "channel"]

preprocess = ColumnTransformer([
    ("num", Pipeline([("impute", SimpleImputer(strategy="median")),
                      ("scale", StandardScaler())]), numeric),
    ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
    ("txt", Pipeline([("tfidf", TfidfVectorizer(min_df=3)),
                      ("svd", TruncatedSVD(n_components=100))]), "text"),
])

churn_model = Pipeline([
    ("prep", preprocess),
    ("clf", HistGradientBoostingClassifier(learning_rate=0.1, max_iter=300)),
])
churn_model.fit(X_train, y_train)       # imputer medians and vocabulary learned from TRAIN only`,
        },
        callout: {
          kind: "warn",
          text: "Calling scaler.fit(X) on the full dataset before splitting leaks the test set's statistics into training. The resulting score is optimistic in a way that is invisible until production. Pipelines make that mistake structurally impossible, because fit only ever sees the rows it is given.",
        },
        bullets: [
          "handle_unknown='ignore' stops the model crashing on a country it never saw during training — which will happen on day one in production.",
          "Gradient-boosted trees (HistGradientBoostingClassifier, XGBoost, LightGBM) are the default winners on tabular data.",
        ],
      },
      {
        heading: "Choosing the metric",
        table: {
          headers: ["Metric", "Question it answers", "Use when"],
          rows: [
            [
              "Accuracy",
              "What fraction of predictions were right?",
              "Classes are balanced and every mistake costs the same",
            ],
            [
              "Precision",
              "Of the items flagged, how many were truly positive?",
              "False alarms are expensive (blocking a real customer)",
            ],
            [
              "Recall",
              "Of the true positives, how many did we catch?",
              "Misses are expensive (fraud, safety issues)",
            ],
            [
              "F1",
              "Harmonic mean of precision and recall",
              "You need one number and both kinds of error matter",
            ],
            ["PR-AUC", "Precision–recall trade-off across all thresholds", "Rare positive class"],
            [
              "MAE / RMSE",
              "Average size of a numeric error",
              "Regression, such as predicting resolution hours",
            ],
          ],
        },
        math: [
          {
            label: "Always predict 'legitimate'",
            expr: "990 correct of 1,000 transactions",
            result: "accuracy 99.0%",
            note: "catches zero of the 10 frauds",
          },
          {
            label: "A model flags 20; 8 are fraud",
            expr: "precision = 8 / 20",
            result: "40%",
            note: "of what we flagged, how much was fraud",
          },
          { label: "Recall", expr: "8 / 10 frauds caught", result: "80%" },
          {
            label: "That model's accuracy",
            expr: "(8 true positives + 978 true negatives) / 1,000",
            result: "98.6%",
            note: "lower than the useless baseline — and far more valuable",
          },
        ],
        callout: {
          kind: "interview",
          text: "When someone reports 99% accuracy, the first question is the class balance. On rare-event problems, accuracy measures how rare the event is, not how good the model is.",
        },
      },
      {
        heading: "Cross-validation and tuning",
        code: {
          title: "Estimate honestly, tune on training data only",
          lang: "python",
          source: `from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold, cross_val_score
from scipy.stats import loguniform

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1_macro")
print(f"f1_macro {scores.mean():.3f} +/- {scores.std():.3f}")   # the spread matters as much as the mean

search = RandomizedSearchCV(
    model,
    param_distributions={
        "logisticregression__C": loguniform(1e-2, 1e2),
        "tfidfvectorizer__ngram_range": [(1, 1), (1, 2)],
    },
    n_iter=25, cv=cv, scoring="f1_macro", random_state=42, n_jobs=-1,
)
search.fit(X_train, y_train)
print(search.best_params_, round(search.best_score_, 3))

final_f1 = search.score(X_test, y_test)      # the test set, touched exactly once`,
        },
        bullets: [
          "Pipeline step names become parameter prefixes: logisticregression__C tunes C inside the logistic regression step.",
          "Randomised search usually finds good settings with far fewer fits than an exhaustive grid.",
          "For time-ordered data use TimeSeriesSplit. Shuffling lets the model train on the future and test on the past.",
        ],
      },
      {
        heading: "Overfitting and underfitting",
        table: {
          headers: ["Training score", "Validation score", "Diagnosis", "Try"],
          rows: [
            [
              "Low",
              "Low",
              "Underfitting — the model is too simple or features are weak",
              "More expressive model, better features",
            ],
            [
              "High",
              "Much lower",
              "Overfitting — memorising the training set",
              "Regularisation, more data, simpler model, fewer features",
            ],
            [
              "High",
              "Close to training",
              "A healthy fit",
              "Check against the baseline and the test set",
            ],
          ],
        },
        links: [
          {
            label: "YouTube search — StatQuest bias variance overfitting",
            href: YT("StatQuest bias and variance machine learning"),
          },
        ],
      },
      {
        heading: "Shipping a model",
        code: {
          title: "Persist the whole pipeline and choose a threshold deliberately",
          lang: "python",
          source: `import joblib

joblib.dump(search.best_estimator_, "models/ticket_router-2026-09-15.joblib")

router = joblib.load("models/ticket_router-2026-09-15.joblib")
proba = router.predict_proba(["I was charged twice this month"])[0]
label = router.classes_[proba.argmax()]

# Route to a human when the model is unsure, instead of guessing
if proba.max() < 0.6:
    label = "needs_human_review"`,
        },
        bullets: [
          "Save the entire pipeline, never just the classifier. A model without its exact preprocessing is useless.",
          "joblib and pickle files can execute code when loaded. Only load model files you produced yourself.",
          "Version models with the training data snapshot and the metrics that justified them, then monitor input drift and live accuracy after release.",
        ],
      },
      {
        heading: "Classic ML or an LLM?",
        diagram: {
          kind: "compare",
          caption: "For classifying 50,000 tickets a day.",
          options: [
            {
              title: "scikit-learn classifier",
              good: [
                "Milliseconds per prediction on a CPU",
                "Near-zero marginal cost",
                "Calibrated probabilities and clear evaluation",
              ],
              bad: ["Needs labelled training data", "New categories require retraining"],
              verdict: "High volume, stable labels, data available.",
              tone: "ok",
            },
            {
              title: "LLM with a prompt",
              good: [
                "Works with zero or few labelled examples",
                "New categories by editing a prompt",
                "Handles messy, novel phrasing",
              ],
              bad: [
                "Per-call cost and latency",
                "Harder to evaluate and less stable across model versions",
              ],
              verdict:
                "Low volume, changing labels, or bootstrapping labels to train a classifier later.",
            },
          ],
        },
        followUps: [
          {
            q: "Why put preprocessing inside a Pipeline?",
            a: "So every fitted step — imputation statistics, scaling, vocabulary — is learned only from the data passed to fit. That prevents test data leaking into training during cross-validation, and it packages preprocessing with the model so serving applies exactly the same transformations.",
          },
          {
            q: "Your model reports 99% accuracy. Are you done?",
            a: "Not until I know the class balance, the baseline, and the per-class metrics. On imbalanced data 99% can mean the model predicts the majority class every time. I would check precision and recall for the class that matters, the confusion matrix, and whether any feature leaks the label.",
          },
          {
            q: "How do you choose a decision threshold?",
            a: "From the business cost of each error, not the default 0.5. I plot precision and recall against thresholds on validation data, pick the point that matches the acceptable false-positive rate, and often add an 'unsure' band routed to humans.",
          },
        ],
      },
    ],
    related: ["/python/pandas-eda", "/python/pytorch", "/fde/ai-ml-fundamentals"],
    furtherReading: [
      { label: "scikit-learn user guide", href: "https://scikit-learn.org/stable/user_guide.html" },
      {
        label: "Hands-On Machine Learning, 3rd edition (Aurélien Géron)",
        href: "https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125967/",
      },
    ],
  },

  {
    slug: "pytorch",
    title: "Deep Learning with PyTorch",
    subtitle: "Chapter 13 — tensors, autograd, the training loop, and running on a GPU",
    level: "advanced",
    minutes: 30,
    tags: ["pytorch", "deep learning", "autograd", "gpu", "training loop"],
    summary:
      "PyTorch is NumPy with two superpowers: tensors that run on GPUs, and automatic differentiation that computes gradients for you. Every neural network, from a small classifier to a transformer, is trained with the same loop — forward, loss, backward, step. Once that loop is second nature, the rest is architecture.",
    keyPoints: [
      "Tensors are GPU-capable arrays; autograd records operations so it can compute gradients.",
      "The training loop: forward pass, loss, loss.backward(), optimizer.step(), clear the gradients.",
      "model.train() and model.eval() change layers like dropout; use torch.no_grad() for inference.",
      "Most bugs are shape mismatches, device mismatches, or gradients that were never cleared.",
    ],
    prerequisites: ["/python/numpy", "/python/scikit-learn"],
    sections: [
      {
        heading: "Tensors",
        code: {
          title: "Like ndarrays, but they can live on a GPU",
          lang: "python",
          source: `import numpy as np
import torch

device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"

x = torch.randn(32, 384)                  # a batch of 32 embeddings
print(x.shape, x.dtype, x.device)         # torch.Size([32, 384]) torch.float32 cpu

x = x.to(device)                          # move to the accelerator
w = torch.randn(384, 4, device=device)    # or create it there directly
logits = x @ w                            # (32, 4) -- same broadcasting rules as NumPy

arr = np.ones(3, dtype=np.float32)
t = torch.from_numpy(arr)                 # shares memory with the NumPy array
back = t.cpu().numpy()                    # tensors must be on the CPU to become NumPy`,
        },
        bullets: [
          "Every tensor in one operation must be on the same device. 'Expected all tensors to be on the same device' is the error you will see most in your first week.",
          "mps is the Apple Silicon GPU backend, so a MacBook can accelerate training too.",
        ],
      },
      {
        heading: "Autograd",
        lede: "Gradients computed for you.",
        code: {
          title: "Learning y = 2x + 1 with raw tensors",
          lang: "python",
          source: `import torch

w = torch.tensor(0.0, requires_grad=True)
b = torch.tensor(0.0, requires_grad=True)
x = torch.tensor([1.0, 2.0, 3.0, 4.0])
y = torch.tensor([3.0, 5.0, 7.0, 9.0])          # the true relationship is y = 2x + 1

lr = 0.05
for step in range(500):
    pred = w * x + b
    loss = ((pred - y) ** 2).mean()              # mean squared error
    loss.backward()                              # fills w.grad and b.grad
    with torch.no_grad():                        # update without recording history
        w -= lr * w.grad
        b -= lr * b.grad
    w.grad.zero_()                               # gradients ACCUMULATE unless cleared
    b.grad.zero_()

print(round(w.item(), 2), round(b.item(), 2))    # 2.0 1.0`,
        },
        body: [
          "Autograd records every operation on tensors that require gradients, building a computation graph. backward() walks that graph in reverse, applying the chain rule to get the derivative of the loss with respect to each parameter. Gradient descent then nudges each parameter against its gradient.",
        ],
        links: [
          {
            label: "YouTube search — Andrej Karpathy micrograd backpropagation",
            href: YT(
              "Andrej Karpathy spelled-out intro to neural networks and backpropagation micrograd",
            ),
          },
        ],
      },
      {
        heading: "Datasets and DataLoaders",
        code: {
          title: "Batches, shuffling and parallel loading",
          lang: "python",
          source: `import torch
from torch.utils.data import DataLoader, Dataset

class EmbeddingDataset(Dataset):
    def __init__(self, vectors: torch.Tensor, labels: torch.Tensor):
        self.vectors, self.labels = vectors, labels

    def __len__(self) -> int:
        return len(self.labels)

    def __getitem__(self, i: int):
        return self.vectors[i], self.labels[i]

train_loader = DataLoader(
    EmbeddingDataset(train_vecs, train_labels),
    batch_size=64, shuffle=True, num_workers=2, pin_memory=True,
)
val_loader = DataLoader(EmbeddingDataset(val_vecs, val_labels), batch_size=256)`,
        },
      },
      {
        heading: "Models with nn.Module",
        code: {
          title: "A classifier on top of sentence embeddings",
          lang: "python",
          source: `from torch import nn

class TicketClassifier(nn.Module):
    def __init__(self, dim_in: int = 384, hidden: int = 256, n_classes: int = 4):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim_in, hidden),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden, n_classes),      # raw scores (logits) -- no softmax here
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

model = TicketClassifier().to(device)
print(sum(p.numel() for p in model.parameters()))   # 99,588 trainable parameters`,
        },
        callout: {
          kind: "warn",
          text: "Do not apply softmax before nn.CrossEntropyLoss. It expects raw logits and applies log-softmax internally; adding your own softmax silently weakens training.",
        },
      },
      {
        heading: "The training loop",
        code: {
          title: "Train, validate, keep the best checkpoint",
          lang: "python",
          source: `import torch
from torch import nn

loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
best_val = float("inf")

for epoch in range(20):
    model.train()                                   # dropout ON
    for xb, yb in train_loader:
        xb, yb = xb.to(device), yb.to(device)
        optimizer.zero_grad()                       # 1. clear old gradients
        loss = loss_fn(model(xb), yb)               # 2. forward + loss
        loss.backward()                             # 3. backward
        optimizer.step()                            # 4. update parameters

    model.eval()                                    # dropout OFF
    val_loss, correct, n = 0.0, 0, 0
    with torch.no_grad():                           # no graph: faster, less memory
        for xb, yb in val_loader:
            xb, yb = xb.to(device), yb.to(device)
            logits = model(xb)
            val_loss += loss_fn(logits, yb).item() * len(yb)
            correct += (logits.argmax(dim=1) == yb).sum().item()
            n += len(yb)
    val_loss /= n
    print(f"epoch {epoch}: val_loss {val_loss:.4f} acc {correct / n:.3f}")

    if val_loss < best_val:
        best_val = val_loss
        torch.save(model.state_dict(), "best_classifier.pt")   # save weights, not the object`,
        },
        steps: [
          {
            title: "zero_grad",
            text: "Gradients add up across backward calls, so clear them each step.",
          },
          {
            title: "Forward and loss",
            text: "Run the batch through the model and measure how wrong it is.",
          },
          {
            title: "backward",
            text: "Autograd computes the gradient of the loss for every parameter.",
          },
          { title: "step", text: "The optimiser updates parameters using those gradients." },
        ],
      },
      {
        heading: "GPUs, memory and speed",
        table: {
          headers: ["Technique", "Effect", "Note"],
          rows: [
            [
              "Larger batch size",
              "Better GPU utilisation",
              "Limited by memory; may need a higher learning rate",
            ],
            [
              "Mixed precision (torch.autocast)",
              "Roughly half the activation memory, often faster",
              "bfloat16 on modern GPUs avoids most loss-scaling trouble",
            ],
            [
              "Gradient accumulation",
              "Simulates a large batch on a small GPU",
              "Step the optimiser every N micro-batches",
            ],
            [
              "Gradient checkpointing",
              "Much less activation memory",
              "Costs extra compute in the backward pass",
            ],
            [
              "torch.compile(model)",
              "Fuses operations for speed",
              "First run is slow while it compiles",
            ],
          ],
        },
        math: [
          {
            label: "7B-parameter model, weights in fp16",
            expr: "7 × 10⁹ × 2 bytes",
            result: "≈ 14 GB",
            note: "just to load it for inference",
          },
          {
            label: "Full fine-tuning with AdamW, mixed precision",
            expr: "7 × 10⁹ × ~16 bytes (weights, master copy, gradients, optimiser states)",
            result: "≈ 112 GB",
            note: "why LoRA and QLoRA exist",
          },
        ],
        links: [
          {
            label: "PyTorch — automatic mixed precision",
            href: "https://pytorch.org/docs/stable/amp.html",
          },
        ],
      },
      {
        heading: "Debugging and interview follow-ups",
        table: {
          headers: ["Symptom", "Likely cause", "Fix"],
          rows: [
            [
              "Loss never decreases",
              "Learning rate too high or low; gradients never cleared",
              "Try 1e-3 then 1e-4; check zero_grad",
            ],
            [
              "Loss becomes NaN",
              "Exploding gradients or fp16 overflow",
              "Gradient clipping, bfloat16, lower learning rate",
            ],
            [
              "Validation accuracy oddly low",
              "Forgot model.eval() — dropout still active",
              "Call model.eval() before evaluating",
            ],
            [
              "Can overfit one batch? No",
              "A bug in data, labels or model",
              "Overfit a single batch first as a sanity test",
            ],
            [
              "CUDA out of memory",
              "Batch or sequence too large",
              "Smaller batch, mixed precision, accumulation, checkpointing",
            ],
          ],
        },
        followUps: [
          {
            q: "Why do you zero gradients every step?",
            a: "backward() adds to the .grad attribute rather than replacing it. Without clearing, each step uses the sum of all previous gradients, and training diverges. Accumulating on purpose is a technique — gradient accumulation — but it has to be deliberate.",
          },
          {
            q: "What do model.train() and model.eval() actually do?",
            a: "They switch the behaviour of layers that act differently while training: dropout randomly zeroes activations only in train mode, and batch normalisation uses batch statistics in train mode but running averages in eval mode. They do not disable gradients — that is torch.no_grad().",
          },
          {
            q: "How would you fine-tune a large language model on a single GPU?",
            a: "Not with full fine-tuning. I would use parameter-efficient fine-tuning such as LoRA, which trains small adapter matrices while the base weights stay frozen, often on a 4-bit quantised base model (QLoRA), with mixed precision and gradient checkpointing. And first I would confirm the problem needs fine-tuning at all rather than better prompting or retrieval.",
          },
        ],
      },
    ],
    related: ["/python/scikit-learn", "/python/transformers-embeddings", "/fde/ai-ml-fundamentals"],
    furtherReading: [
      {
        label: "PyTorch — learn the basics",
        href: "https://pytorch.org/tutorials/beginner/basics/intro.html",
      },
      {
        label: "Andrej Karpathy — Neural Networks: Zero to Hero",
        href: "https://karpathy.ai/zero-to-hero.html",
      },
    ],
  },

  {
    slug: "transformers-embeddings",
    title: "Transformers, Tokens and Embeddings",
    subtitle:
      "Chapter 14 — how language models read text, what an embedding is, and using Hugging Face models",
    level: "advanced",
    minutes: 30,
    tags: ["transformers", "tokenization", "embeddings", "hugging face", "attention"],
    summary:
      "Every LLM application rests on two ideas: text becomes tokens, and tokens become vectors. Tokenisation explains pricing, context limits and some strange failures; embeddings explain semantic search. You do not need to train a transformer to build with one, but you do need an accurate picture of what happens inside it.",
    keyPoints: [
      "Models read tokens, not characters or words. Cost and context limits are counted in tokens.",
      "An embedding maps text to a vector where similar meaning ends up nearby.",
      "Self-attention lets every token weigh every other token, so its cost grows with the square of length.",
      "For retrieval, embed queries and documents with the same sentence-embedding model.",
    ],
    prerequisites: ["/python/pytorch", "/python/numpy"],
    sections: [
      {
        heading: "Tokens",
        code: {
          title: "What the model actually receives",
          lang: "python",
          source: `from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("bert-base-uncased")

text = "Refunds are processed within thirty days."
ids = tok.encode(text)
print(len(ids))                             # a small list of integer ids
print(tok.convert_ids_to_tokens(ids))       # common words map to one token each,
                                            # plus special markers like [CLS] and [SEP]

print(tok.tokenize("unbelievably tokenizable"))
# rare words split into several sub-word pieces; the exact pieces depend on the tokenizer`,
        },
        table: {
          caption: "Why tokens matter in practice.",
          headers: ["Consequence", "What it means for you"],
          rows: [
            ["Pricing", "APIs bill per input and output token, not per request"],
            ["Context window", "The limit on prompt plus output is measured in tokens"],
            [
              "Language cost",
              "Many non-English scripts use more tokens per word, so the same message can cost more",
            ],
            [
              "Odd failures",
              "Counting letters or reversing words is hard when the model never sees individual letters",
            ],
          ],
        },
        bullets: [
          "Different model families use different tokenizers. Count tokens with the tokenizer (or token-counting endpoint) of the model you actually call.",
          "For English text with GPT-style tokenizers, a rough rule is about four characters per token. Use it for estimates, never for billing.",
        ],
        links: [
          {
            label: "YouTube search — Andrej Karpathy let's build the GPT tokenizer",
            href: YT("Andrej Karpathy let's build the GPT tokenizer"),
          },
        ],
      },
      {
        heading: "From tokens to vectors",
        diagram: {
          kind: "layers",
          caption: "A transformer, top to bottom.",
          layers: [
            { title: "Text", items: ["'Refunds are processed within thirty days.'"] },
            { title: "Tokenizer", items: ["Token ids: a list of integers"] },
            {
              title: "Embedding lookup",
              items: ["Each id becomes a learned vector", "Position information added"],
            },
            {
              title: "Transformer blocks × N",
              items: [
                "Self-attention: tokens exchange information",
                "Feed-forward network per token",
                "Residual connections and normalisation",
              ],
            },
            {
              title: "Contextual vectors",
              items: ["One vector per token, now aware of the whole sentence"],
            },
            {
              title: "Head",
              items: [
                "Generation: scores for the next token",
                "Embedding model: pool into one vector for the sentence",
              ],
            },
          ],
        },
      },
      {
        heading: "Attention, intuitively",
        body: [
          "In 'The bank raised rates after the river flooded the bank', each occurrence of 'bank' needs different meaning. Self-attention lets every token look at every other token and build its representation as a weighted mix of theirs. Each token produces a query, a key and a value; query-key similarity decides the weights, and the weighted sum of values becomes the new representation.",
        ],
        code: {
          title: "Scaled dot-product attention in a few lines",
          lang: "python",
          source: `import torch
import torch.nn.functional as F

def attention(Q: torch.Tensor, K: torch.Tensor, V: torch.Tensor) -> torch.Tensor:
    d = Q.shape[-1]
    scores = Q @ K.transpose(-2, -1) / d ** 0.5     # (seq, seq): relevance of every token to every other
    weights = F.softmax(scores, dim=-1)             # each row sums to 1
    return weights @ V                              # each token becomes a weighted mix of values

seq_len, d = 6, 16
x = torch.randn(seq_len, d)
out = attention(x, x, x)          # self-attention: Q, K and V come from the same tokens
print(out.shape)                  # torch.Size([6, 16])`,
        },
        math: [
          {
            label: "Attention scores for 8,000 tokens",
            expr: "8,000 × 8,000",
            result: "64 million",
            note: "per attention head, per layer",
          },
          {
            label: "Double the context to 16,000",
            expr: "16,000 × 16,000",
            result: "256 million",
            note: "4× the work — why long prompts are slow and expensive",
          },
        ],
        links: [
          {
            label: "The Illustrated Transformer (Jay Alammar)",
            href: "https://jalammar.github.io/illustrated-transformer/",
          },
          {
            label: "YouTube search — 3Blue1Brown attention in transformers visually explained",
            href: YT("3Blue1Brown attention in transformers visually explained"),
          },
        ],
      },
      {
        heading: "Which architecture for which job",
        table: {
          headers: ["Family", "Examples", "Good at"],
          rows: [
            [
              "Encoder-only",
              "BERT and its descendants, most embedding models",
              "Classification, embeddings, extraction",
            ],
            [
              "Decoder-only",
              "Hosted chat models and open models like Llama",
              "Generation, chat, reasoning, tool use",
            ],
            [
              "Encoder-decoder",
              "T5, many translation models",
              "Translation, summarisation from a fixed input",
            ],
          ],
        },
      },
      {
        heading: "Embeddings for semantic search",
        code: {
          title: "Matching meaning with no shared keywords",
          lang: "python",
          source: `from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")   # 384-dimensional vectors

docs = [
    "Refunds are allowed within 30 days of purchase.",
    "Shipping to India takes 5 to 7 business days.",
    "You can delete your account from the settings page.",
]
doc_vecs = model.encode(docs, normalize_embeddings=True)          # (3, 384)
query_vec = model.encode("can I get my money back?", normalize_embeddings=True)

scores = doc_vecs @ query_vec                                     # cosine similarity
best = int(scores.argmax())
print(docs[best])      # the refund policy -- despite sharing no words with the query`,
        },
        bullets: [
          "Queries and documents must be embedded by the same model. Vectors from different models live in unrelated spaces.",
          "Changing the embedding model means re-embedding the entire corpus. Store the model name next to every vector.",
          "For Indian-language or mixed-language content, choose a multilingual embedding model and evaluate it on your own queries.",
          "Some models expect prefixes such as 'query:' and 'passage:'. Read the model card — skipping them quietly lowers quality.",
        ],
      },
      {
        heading: "Choosing an embedding model",
        table: {
          headers: ["Criterion", "Why it matters"],
          rows: [
            [
              "Quality on your data",
              "Public leaderboards like MTEB are a starting point; your own labelled queries decide",
            ],
            ["Dimensions", "Storage and search cost scale with vector size"],
            ["Maximum input length", "Text beyond the limit is truncated silently"],
            ["Languages", "English-only models degrade badly on other scripts"],
            ["Hosted or local", "Per-token API cost versus running your own GPU or CPU"],
            ["Licence", "Some models restrict commercial use"],
          ],
        },
      },
      {
        heading: "Prompting, RAG or fine-tuning?",
        diagram: {
          kind: "compare",
          caption: "Three ways to adapt a model — try them in this order.",
          options: [
            {
              title: "Prompting",
              good: ["Minutes to try", "No data pipeline", "Easy to change"],
              bad: ["Limited by the context window", "No private knowledge"],
              verdict: "Start here.",
              tone: "ok",
            },
            {
              title: "RAG",
              good: [
                "Uses your current documents",
                "Citations and freshness",
                "No retraining when data changes",
              ],
              bad: ["Retrieval quality becomes the bottleneck"],
              verdict: "For knowledge the model does not have.",
              tone: "accent",
            },
            {
              title: "Fine-tuning",
              good: ["Teaches style, format and narrow tasks", "Can shrink prompts and latency"],
              bad: ["Needs curated data and evaluation", "Poor way to add changing facts"],
              verdict: "For behaviour, not knowledge.",
              tone: "warn",
            },
          ],
        },
        followUps: [
          {
            q: "Why do LLMs struggle to count the letters in a word?",
            a: "Because they never see letters. The word arrives as one or a few sub-word tokens, each an opaque id mapped to a vector, so character-level structure has to be inferred indirectly. Tasks like spelling, counting characters or reversing strings are awkward for the same reason.",
          },
          {
            q: "What is an embedding?",
            a: "A fixed-length vector a model produces for a piece of text, trained so that texts with similar meaning land close together. Distances between vectors — usually cosine similarity — then act as a measure of semantic similarity, which is what powers semantic search, clustering and recommendation.",
          },
          {
            q: "Should we fine-tune a model on our company documents?",
            a: "Usually not for knowledge. Facts change, fine-tuning does not reliably make a model recall specific facts, and it cannot cite sources. RAG handles knowledge with citations and instant updates. Fine-tuning is better for teaching a consistent format, tone or a narrow task, and I would try prompting and RAG first.",
          },
        ],
      },
    ],
    related: ["/python/pytorch", "/python/rag", "/fde/ai-ml-fundamentals"],
    furtherReading: [
      { label: "Hugging Face — LLM course", href: "https://huggingface.co/learn/llm-course" },
      { label: "Sentence Transformers documentation", href: "https://sbert.net/" },
    ],
  },
];
