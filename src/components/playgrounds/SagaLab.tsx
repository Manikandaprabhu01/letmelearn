import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Scenario = "happy" | "stock" | "payment" | "shipping" | "duplicate";
type Kind = "do" | "ok" | "fail" | "compensate" | "retry" | "ignore" | "done-ok" | "done-rollback";
type Service = "Orders" | "Inventory" | "Payments" | "Shipping" | "Saga";

type Entry = {
  kind: Kind;
  service: Service;
  text: string;
  /** The orchestrator's state after this entry. */
  sagaState: string;
  /** How a service's visible state changes at this entry, if at all. */
  status?: [Exclude<Service, "Saga">, string];
};

const SERVICES: Exclude<Service, "Saga">[] = ["Orders", "Inventory", "Payments", "Shipping"];

const SCENARIOS: { id: Scenario; label: string; blurb: string }[] = [
  {
    id: "happy",
    label: "Everything succeeds",
    blurb: "Each local transaction commits and triggers the next.",
  },
  {
    id: "stock",
    label: "Out of stock",
    blurb: "The second step fails, so only the first step needs compensating.",
  },
  {
    id: "payment",
    label: "Payment declined",
    blurb: "The pivot fails, so completed steps are compensated in reverse order.",
  },
  {
    id: "shipping",
    label: "Shipping down",
    blurb: "A failure after the pivot is retried until it succeeds — never compensated.",
  },
  {
    id: "duplicate",
    label: "Duplicate event",
    blurb: "A message is delivered twice; the state machine ignores the repeat.",
  },
];

const KIND_STYLE: Record<Kind, { mark: string; className: string }> = {
  do: { mark: "→", className: "text-muted" },
  ok: { mark: "✓", className: "text-ok" },
  fail: { mark: "✗", className: "text-bad" },
  compensate: { mark: "↩", className: "text-warn" },
  retry: { mark: "↻", className: "text-accent" },
  ignore: { mark: "⊘", className: "text-faint" },
  "done-ok": { mark: "●", className: "text-ok" },
  "done-rollback": { mark: "●", className: "text-warn" },
};

/** The full event sequence for a scenario, computed up front and then revealed step by step. */
function plan(scenario: Scenario): Entry[] {
  const e: Entry[] = [];
  const add = (
    kind: Kind,
    service: Service,
    text: string,
    sagaState: string,
    status?: Entry["status"],
  ) => e.push({ kind, service, text, sagaState, status });

  add("do", "Orders", "Create order ord_8812 as PENDING", "STARTED");
  add("ok", "Orders", "OrderCreated", "STARTED", ["Orders", "Pending"]);
  add("do", "Inventory", "Reserve 2 items", "STARTED");

  if (scenario === "stock") {
    add("fail", "Inventory", "StockUnavailable — one item is out of stock", "COMPENSATING", [
      "Inventory",
      "Nothing reserved",
    ]);
    add(
      "compensate",
      "Orders",
      "Compensate: mark the order REJECTED (out_of_stock)",
      "COMPENSATING",
      ["Orders", "Rejected"],
    );
    add(
      "done-rollback",
      "Saga",
      "Rolled back. Nothing was reserved and nothing was charged.",
      "REJECTED",
    );
    return e;
  }

  add("ok", "Inventory", "StockReserved", "RESERVED", ["Inventory", "Reserved"]);
  add("do", "Payments", "Charge ₹5,000 — the pivot step", "RESERVED");

  if (scenario === "payment") {
    add("fail", "Payments", "PaymentDeclined — insufficient funds", "COMPENSATING", [
      "Payments",
      "Not charged",
    ]);
    add("compensate", "Inventory", "Compensate: release the reservation", "COMPENSATING", [
      "Inventory",
      "Released",
    ]);
    add(
      "compensate",
      "Orders",
      "Compensate: mark the order REJECTED (payment_declined)",
      "COMPENSATING",
      ["Orders", "Rejected"],
    );
    add(
      "done-rollback",
      "Saga",
      "Rolled back in reverse order. Stock released, order rejected, customer not charged.",
      "REJECTED",
    );
    return e;
  }

  add("ok", "Payments", "PaymentCharged — past the pivot, the saga must now complete", "CHARGED", [
    "Payments",
    "Charged ₹5,000",
  ]);

  if (scenario === "duplicate") {
    add(
      "ignore",
      "Payments",
      "PaymentCharged delivered again (at-least-once). The saga is already CHARGED, so the duplicate is ignored.",
      "CHARGED",
    );
  }

  add("do", "Orders", "Mark the order CONFIRMED", "CHARGED");
  add("ok", "Orders", "OrderConfirmed", "CONFIRMED", ["Orders", "Confirmed"]);
  add("do", "Shipping", "Schedule the shipment", "CONFIRMED");

  if (scenario === "shipping") {
    add("fail", "Shipping", "503 — shipping service unavailable", "CONFIRMED", [
      "Shipping",
      "Retrying",
    ]);
    add(
      "retry",
      "Shipping",
      "After the pivot the saga retries instead of compensating. Retry in 2 s.",
      "CONFIRMED",
    );
    add("do", "Shipping", "Schedule the shipment (attempt 2)", "CONFIRMED");
    add("fail", "Shipping", "503 — still unavailable", "CONFIRMED");
    add("retry", "Shipping", "Backing off. Retry in 4 s.", "CONFIRMED");
    add("do", "Shipping", "Schedule the shipment (attempt 3)", "CONFIRMED");
  }

  add("ok", "Shipping", "ShipmentScheduled", "COMPLETED", ["Shipping", "Scheduled"]);
  add(
    "done-ok",
    "Saga",
    scenario === "duplicate"
      ? "Completed. The customer was charged exactly once despite the duplicate event."
      : "Completed. Order confirmed, charged once, shipment scheduled.",
    "COMPLETED",
  );
  return e;
}

export function SagaLab() {
  const [scenario, setScenario] = useState<Scenario>("payment");
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(false);

  const entries = useMemo(() => plan(scenario), [scenario]);
  const done = shown >= entries.length;

  useEffect(() => {
    if (!playing || done) return;
    const id = window.setTimeout(() => setShown((n) => n + 1), 750);
    return () => window.clearTimeout(id);
  }, [playing, done, shown]);

  const visible = entries.slice(0, shown);
  const current = visible[visible.length - 1];

  const statuses = useMemo(() => {
    const map: Record<string, string> = {
      Orders: "—",
      Inventory: "—",
      Payments: "—",
      Shipping: "—",
    };
    for (const entry of visible) if (entry.status) map[entry.status[0]] = entry.status[1];
    return map;
  }, [visible]);

  const choose = (next: Scenario) => {
    setScenario(next);
    setShown(0);
    setPlaying(false);
  };

  const blurb = SCENARIOS.find((s) => s.id === scenario)?.blurb;

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        An orchestrated order saga across four services. Each step is a local transaction; steps
        before the payment pivot have compensations, steps after it are retried until they succeed.
        Pick what goes wrong, then run it.
      </p>

      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => choose(s.id)}
            className={`rounded-md border px-3 py-2 text-sm ${
              scenario === s.id
                ? "border-accent bg-accent/15 text-fg"
                : "border-border text-muted hover:text-fg"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">{blurb}</p>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => (done ? (setShown(0), setPlaying(true)) : setPlaying((p) => !p))}>
          {done ? "Run again" : playing ? "Pause" : shown === 0 ? "Run saga" : "Resume"}
        </Button>
        <Button variant="secondary" disabled={done} onClick={() => setShown((n) => n + 1)}>
          Step
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setShown(0);
            setPlaying(false);
          }}
        >
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {SERVICES.map((service) => {
          const active = current?.service === service;
          return (
            <div
              key={service}
              className={`rounded-lg border p-3 transition-colors ${
                active ? "border-accent bg-accent/10" : "border-border bg-surface"
              }`}
            >
              <div className="text-[11px] uppercase tracking-[0.14em] text-faint">{service}</div>
              <div className="mt-1 text-sm text-fg">{statuses[service]}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-inset p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-faint">Orchestrator log</div>
          <span className="rounded-md border border-border bg-raised px-2 py-1 font-mono text-xs text-fg">
            saga: {current?.sagaState ?? "NOT STARTED"}
          </span>
        </div>
        <ol className="mt-3 space-y-1.5">
          {visible.map((entry, i) => {
            const style = KIND_STYLE[entry.kind];
            return (
              <li key={i} className="flex gap-3 text-sm leading-6">
                <span className={`w-4 shrink-0 text-center font-mono ${style.className}`}>
                  {style.mark}
                </span>
                <span className="w-20 shrink-0 text-xs leading-6 text-faint">{entry.service}</span>
                <span className={entry.kind === "do" ? "text-muted" : style.className}>
                  {entry.text}
                </span>
              </li>
            );
          })}
          {visible.length === 0 ? (
            <li className="text-sm text-muted">Press Run saga or Step.</li>
          ) : null}
        </ol>
      </div>

      <p className="max-w-prose text-sm leading-6 text-muted">
        Compare <b>Payment declined</b> with <b>Shipping down</b>: both are failures, but one
        happens before the pivot and is undone, the other after it and is pushed through. That split
        — compensatable, pivot, retriable — is the core of designing a saga.
      </p>
    </div>
  );
}
