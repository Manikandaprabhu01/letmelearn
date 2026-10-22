import type { Concept } from "@/data/types";

export const javaJdkMigration: Concept = {
  slug: "jdk-migration",
  title: "Choosing & Migrating JDKs",
  subtitle:
    "Chapter 48 — the release train, which LTS to target, compiling for an older runtime, and a migration order that keeps the build green",
  level: "intermediate",
  minutes: 22,
  tags: ["migration", "lts", "toolchains", "jlink", "compatibility", "upgrade"],
  summary:
    "A JDK upgrade is mostly a dependency upgrade. The language rarely breaks you; removed modules, encapsulated internals and libraries that manipulate bytecode do. Separating the runtime you run on from the language level you compile to lets you take the performance wins immediately and adopt syntax later, one decision at a time.",
  keyPoints: [
    "Two releases a year; LTS every two years — 17, 21 and 25 are the ones teams stand on.",
    "Run on the newest LTS, compile with --release set to whatever the team has agreed: they are separate choices.",
    "--release checks against that version's API; -source/-target do not, and let newer APIs slip through.",
    "Upgrade libraries that touch bytecode or JDK internals first; they cause most failures.",
    "Each --add-opens flag is a deferred library upgrade, not a solution.",
  ],
  prerequisites: ["/java/java-9-to-17"],
  sections: [
    {
      heading: "The release train, and what to target",
      table: {
        caption: "Long-term support releases and what each one bought.",
        headers: ["LTS", "Released", "Headline gains"],
        rows: [
          ["8", "2014", "Lambdas, streams, java.time — still the floor for old estates"],
          ["11", "2018", "HttpClient, var, modern strings; Java EE modules removed"],
          [
            "17",
            "2021",
            "Records, sealed types, switch expressions, text blocks; internals encapsulated",
          ],
          [
            "21",
            "2023",
            "Virtual threads, pattern matching for switch, sequenced collections, generational ZGC",
          ],
          [
            "25",
            "2025",
            "Scoped values, AOT startup cache, compact object headers, generational Shenandoah",
          ],
        ],
      },
      bullets: [
        "Non-LTS releases are production-quality but supported only until the next one six months later. They are a good fit for services you deploy continuously and a poor fit for anything with a long support tail.",
        "Vendor matters for support windows and licensing: Temurin, Corretto, Zulu, Liberica and Oracle differ in how long each LTS is patched. Pick one per organisation and pin the image digest in CI.",
        "The pragmatic default in 2026: run on 25, compile with --release 21 until every environment is on 25, then raise it.",
      ],
    },
    {
      heading: "Runtime version versus language level",
      code: {
        title: "Example — compiling for an older runtime, the correct way",
        lang: "bash",
        source: `# WRONG: -source/-target compile old syntax but link against the NEW JDK's API, so
# code using a method added in 21 compiles and then fails on a Java 17 runtime with
# NoSuchMethodError.
javac -source 17 -target 17 Order.java

# RIGHT: --release also restricts the API to that version's signatures.
javac --release 17 Order.java

# Maven
# <maven.compiler.release>21</maven.compiler.release>

# Gradle — toolchains download and pin the JDK, so every machine and CI agent agrees
# java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }
# and per-task: options.release = 21

# Test on more than one runtime — the cheapest insurance there is:
# a CI matrix of [21, 25] catches behaviour differences before your users do.`,
      },
    },
    {
      heading: "A migration order that keeps the build green",
      steps: [
        {
          title: "Inventory before touching anything",
          text: "Run jdeps --jdk-internals on every jar you ship and depend on. It lists exactly which libraries reach into the JDK.",
          detail: "jdeps --jdk-internals --multi-release 25 build/libs/app.jar",
        },
        {
          title: "Upgrade the bytecode-touching libraries first",
          text: "Lombok, Mockito, ByteBuddy, ASM, Hibernate, Jackson, the agent your APM uses. These break on new class-file versions, and they are usually the whole problem.",
        },
        {
          title: "Run tests on the new runtime, still compiling to the old level",
          text: "Change the runtime only. Most failures appear here, where the diff is one line and the cause is obvious.",
        },
        {
          title: "Fix removed and encapsulated APIs",
          text: "Add explicit dependencies for the old Java EE modules, replace sun.* usages, and note every --add-opens you need as a follow-up task.",
        },
        {
          title: "Deploy on the new runtime",
          text: "Take the GC, startup and footprint improvements now. Nothing in the source has changed yet, so a rollback is trivial.",
          detail: "This is the step that delivers most of the value.",
        },
        {
          title: "Raise the language level",
          text: "Bump --release, enable the new syntax, and let the IDE's inspections modernise gradually. Records, sealed types and pattern matching are worth a focused pass on the domain model.",
        },
        {
          title: "Retire the flags",
          text: "Remove --add-opens one at a time as libraries catch up. Each removal is a small, verifiable change.",
        },
      ],
      callout: {
        kind: "warn",
        title: "The failures to expect, by step",
        text: "8 → 11: missing javax.* modules. 11 → 17: InaccessibleObjectException from strong encapsulation. 17 → 21: bytecode tools and agents. 21 → 25: the 32-bit port is gone, the Security Manager is disabled, and anything mutating final fields reflectively is on borrowed time.",
      },
    },
    {
      heading: "Shipping a runtime with the app",
      bullets: [
        "jlink builds a runtime image containing only the modules you use — a smaller container and a smaller attack surface. jdeps --print-module-deps gives you the module list to feed it.",
        "jpackage wraps that image into a platform installer, for desktop tools and CLIs.",
        "In containers the JVM is container-aware by default: it reads cgroup limits. Set -XX:MaxRAMPercentage rather than a fixed -Xmx so the same image behaves correctly at different memory limits (chapter 19).",
        "For startup-sensitive workloads, prefer the AOT cache (chapter 47) before reaching for a native image: it needs no code changes and keeps the JIT's peak throughput.",
      ],
      code: {
        title: "Example — a minimal runtime image",
        lang: "bash",
        source: `# Which modules does the application actually need?
jdeps --print-module-deps --ignore-missing-deps --multi-release 25 \
      --class-path 'libs/*' build/libs/app.jar
#   java.base,java.logging,java.naming,java.sql,jdk.crypto.ec

# Build a runtime with exactly those:
jlink --add-modules java.base,java.logging,java.naming,java.sql,jdk.crypto.ec \
      --strip-debug --no-man-pages --no-header-files --compress=zip-6 \
      --output runtime

# In a Dockerfile, this is the classic two-stage build: jlink in the builder stage,
# COPY --from=builder /runtime into a distroless base (chapter 19).`,
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What is the difference between --release and -source/-target?",
          a: "--release compiles the syntax and links against that version's API, so using a newer method is a compile error. -source/-target only set syntax levels while linking against the current JDK's classes, which lets code compile and then fail at runtime on the older JVM.",
        },
        {
          q: "How would you plan an upgrade from Java 8 to 21?",
          a: "Inventory JDK-internal usage with jdeps, upgrade bytecode-manipulating libraries, run the existing build on the new runtime while still compiling to 8, fix removed modules and encapsulation errors, deploy on the new runtime to take the performance wins, then raise the language level and retire the --add-opens flags.",
        },
        {
          q: "Should every service run the newest release?",
          a: "Run the newest LTS for support and predictability; use non-LTS releases only where you deploy continuously and can move every six months. Either way, separate the runtime decision from the language-level decision so the two can move independently.",
        },
        {
          q: "Why do --add-opens flags appear during a migration?",
          a: "Since Java 17 the JDK's internal packages are strongly encapsulated, so reflection into them fails. The flag reopens a package as a bridge; the real fix is upgrading the library that needs it, and each flag should be tracked as debt.",
        },
      ],
      takeaways: [
        "Move the runtime first, the language level second.",
        "--release, toolchains, and a CI matrix over two versions.",
        "Every --add-opens is a library upgrade you have not done yet.",
      ],
    },
  ],
  related: [
    "/java/java-22-to-26",
    "/java/java-9-to-17",
    "/java/docker",
    "/java/cloud-computing",
    "/java/spring-boot-startup",
  ],
  furtherReading: [
    { label: "OpenJDK — JDK release cadence", href: "https://openjdk.org/projects/jdk/" },
    {
      label: "Oracle — Java SE support roadmap",
      href: "https://www.oracle.com/java/technologies/java-se-support-roadmap.html",
    },
    {
      label: "jdeps documentation",
      href: "https://docs.oracle.com/en/java/javase/25/docs/specs/man/jdeps.html",
    },
  ],
};
