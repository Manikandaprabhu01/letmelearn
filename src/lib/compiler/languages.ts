export type LanguageId = "java" | "python" | "javascript" | "typescript" | "sql";

/** browser = sandboxed iframe on this machine; server = proxied to a runner service. */
export type Runtime = "browser" | "server";

export type LanguageMeta = {
  id: LanguageId;
  label: string;
  runtime: Runtime;
  /** Shown under the toolbar so the reader knows where their code goes. */
  note: string;
  /** Chapter to read next, as an app path. */
  reading?: { label: string; path: string };
  starter: string;
};

/** Tables every SQL run starts from, so a query works on the first click. */
export const SQL_SEED = `CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  joined_on TEXT NOT NULL
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  placed_on TEXT NOT NULL,
  status TEXT NOT NULL,
  total_paise INTEGER NOT NULL
);

INSERT INTO customers (id, name, city, joined_on) VALUES
  (1, 'Asha Menon',    'Bengaluru', '2024-02-11'),
  (2, 'Rahul Nair',    'Chennai',   '2024-06-03'),
  (3, 'Divya Sharma',  'Pune',      '2025-01-19'),
  (4, 'Imran Qureshi', 'Hyderabad', '2025-03-27'),
  (5, 'Meera Iyer',    'Bengaluru', '2025-08-08');

INSERT INTO orders (id, customer_id, placed_on, status, total_paise) VALUES
  (101, 1, '2025-09-01', 'PAID',      249900),
  (102, 1, '2025-09-14', 'PAID',       89900),
  (103, 2, '2025-09-14', 'PENDING',   129900),
  (104, 3, '2025-09-15', 'PAID',      459900),
  (105, 3, '2025-09-15', 'CANCELLED',  19900),
  (106, 4, '2025-09-16', 'PAID',      329900),
  (107, 5, '2025-09-16', 'PAID',       59900),
  (108, 5, '2025-09-16', 'PENDING',   199900);
`;

export const LANGUAGES: LanguageMeta[] = [
  {
    id: "java",
    label: "Java",
    runtime: "server",
    note: "Compiled and run by a public compiler service (Compiler Explorer), so your snippet leaves this browser. One file, and the class with main() is the entry point.",
    reading: { label: "Java & Spring Boot", path: "/java" },
    starter: `import java.util.*;
import java.util.stream.*;

class Main {
    record Order(String id, String status, long totalPaise) {}

    public static void main(String[] args) {
        List<Order> orders = List.of(
            new Order("A-101", "PAID", 249900),
            new Order("A-102", "PENDING", 129900),
            new Order("A-103", "PAID", 459900),
            new Order("A-104", "CANCELLED", 19900));

        Map<String, Long> revenueByStatus = orders.stream()
            .collect(Collectors.groupingBy(Order::status,
                     TreeMap::new,
                     Collectors.summingLong(Order::totalPaise)));

        revenueByStatus.forEach((status, paise) ->
            System.out.printf("%-10s %,10.2f%n", status, paise / 100.0));

        long paid = orders.stream().filter(o -> o.status().equals("PAID")).count();
        System.out.println();
        System.out.println("Paid orders: " + paid + " of " + orders.size());
    }
}
`,
  },
  {
    id: "python",
    label: "Python",
    runtime: "browser",
    note: "Runs in your browser through Pyodide. import numpy or pandas and they are fetched on demand; there is no network access or file system.",
    reading: { label: "Python End-to-End for AI", path: "/python" },
    starter: `from dataclasses import dataclass
from collections import Counter

@dataclass(frozen=True)
class Order:
    id: str
    status: str
    total_paise: int

orders = [
    Order("A-101", "PAID", 249_900),
    Order("A-102", "PENDING", 129_900),
    Order("A-103", "PAID", 459_900),
    Order("A-104", "CANCELLED", 19_900),
]

revenue = {}
for order in orders:
    revenue[order.status] = revenue.get(order.status, 0) + order.total_paise

for status, paise in sorted(revenue.items()):
    print(f"{status:<10} {paise / 100:>10,.2f}")

print()
print("Statuses:", Counter(o.status for o in orders).most_common())
`,
  },
  {
    id: "javascript",
    label: "JavaScript",
    runtime: "browser",
    note: "Runs in a sandboxed frame in this tab. console.log prints below, and top-level await works.",
    starter: `const orders = [
  { id: "A-101", status: "PAID", totalPaise: 249900 },
  { id: "A-102", status: "PENDING", totalPaise: 129900 },
  { id: "A-103", status: "PAID", totalPaise: 459900 },
  { id: "A-104", status: "CANCELLED", totalPaise: 19900 },
];

const revenue = orders.reduce((acc, order) => {
  acc[order.status] = (acc[order.status] ?? 0) + order.totalPaise;
  return acc;
}, {});

for (const [status, paise] of Object.entries(revenue).sort()) {
  console.log(status.padEnd(10), (paise / 100).toLocaleString("en-IN"));
}

// Top-level await works too.
await new Promise((resolve) => setTimeout(resolve, 50));
console.log("\\nPaid:", orders.filter((o) => o.status === "PAID").length);
`,
  },
  {
    id: "typescript",
    label: "TypeScript",
    runtime: "browser",
    note: "Types are stripped by the TypeScript compiler in your browser, then the JavaScript runs in the same sandbox. Type errors do not stop the run.",
    starter: `type Status = "PAID" | "PENDING" | "CANCELLED";

interface Order {
  id: string;
  status: Status;
  totalPaise: number;
}

const orders: Order[] = [
  { id: "A-101", status: "PAID", totalPaise: 249900 },
  { id: "A-102", status: "PENDING", totalPaise: 129900 },
  { id: "A-103", status: "PAID", totalPaise: 459900 },
];

function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      (acc[key(item)] ||= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

const byStatus = groupBy(orders, (order) => order.status);
for (const status of Object.keys(byStatus) as Status[]) {
  const paise = byStatus[status].reduce((sum, order) => sum + order.totalPaise, 0);
  console.log(status.padEnd(10), (paise / 100).toFixed(2));
}
`,
  },
  {
    id: "sql",
    label: "SQL",
    runtime: "browser",
    note: "SQLite in your browser. Tables customers and orders are created fresh for every run — the seed data is below the editor.",
    reading: { label: "JDBC, transactions and N+1", path: "/java/jdbc" },
    starter: `-- Revenue per city, paid orders only.
SELECT c.city,
       COUNT(*)                      AS paid_orders,
       SUM(o.total_paise) / 100.0    AS revenue
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'PAID'
GROUP BY c.city
ORDER BY revenue DESC;
`,
  },
];

export function getLanguage(id: string): LanguageMeta | undefined {
  return LANGUAGES.find((language) => language.id === id);
}
