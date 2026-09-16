/*
 * Executes a code snippet inside a sandboxed, null-origin iframe.
 *
 * The page loads this file into an iframe with sandbox="allow-scripts" only, so
 * the code running here has no access to the app's cookies, storage or session —
 * it cannot call the app's API as the signed-in user. It talks to the page over
 * postMessage, and the page kills the iframe to stop a runaway program.
 *
 * Plain JS on purpose: it is served as a static file rather than bundled, so the
 * app's own modules are never in scope here.
 */
(function () {
  var JOB_CHANNEL = "letmelearn-compiler";
  var REPLY_CHANNEL = "letmelearn-runner";

  function post(message) {
    message.channel = REPLY_CHANNEL;
    window.parent.postMessage(message, "*");
  }
  var status = function (text) {
    post({ type: "status", text: text });
  };
  var stdout = function (text) {
    post({ type: "stdout", text: text });
  };
  var stderr = function (text) {
    post({ type: "stderr", text: text });
  };

  /** Printable form of a console argument — objects as JSON, errors with stack. */
  function format(value) {
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.stack || value.name + ": " + value.message;
    try {
      return JSON.stringify(value, replacer, 2);
    } catch {
      return String(value);
    }
  }
  function replacer(key, value) {
    if (typeof value === "bigint") return value.toString() + "n";
    if (typeof value === "function") return "[Function " + (value.name || "anonymous") + "]";
    if (value === undefined) return "undefined";
    return value;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var tag = document.createElement("script");
      tag.src = src;
      tag.onload = function () {
        resolve();
      };
      tag.onerror = function () {
        reject(new Error("Could not load " + src + " — check your network connection."));
      };
      document.head.appendChild(tag);
    });
  }

  /* ---------- JavaScript and TypeScript ---------- */

  var typescriptLoaded = false;

  async function runJavaScript(job) {
    var code = job.source;
    if (job.language === "typescript") {
      if (!typescriptLoaded) {
        status("Loading the TypeScript compiler…");
        await loadScript(job.cdn.typescript);
        typescriptLoaded = true;
      }
      var compiled = window.ts.transpileModule(code, {
        compilerOptions: {
          target: window.ts.ScriptTarget.ES2022,
          module: window.ts.ModuleKind.ESNext,
        },
      });
      code = compiled.outputText;
    }

    var sandboxConsole = {
      log: function () {
        stdout(Array.prototype.map.call(arguments, format).join(" ") + "\n");
      },
      info: function () {
        stdout(Array.prototype.map.call(arguments, format).join(" ") + "\n");
      },
      debug: function () {
        stdout(Array.prototype.map.call(arguments, format).join(" ") + "\n");
      },
      warn: function () {
        stderr(Array.prototype.map.call(arguments, format).join(" ") + "\n");
      },
      error: function () {
        stderr(Array.prototype.map.call(arguments, format).join(" ") + "\n");
      },
    };
    // Library code calls the global console, so redirect that too.
    window.console.log = sandboxConsole.log;
    window.console.info = sandboxConsole.info;
    window.console.debug = sandboxConsole.debug;
    window.console.warn = sandboxConsole.warn;
    window.console.error = sandboxConsole.error;

    status("Running…");
    // Wrapped in an async IIFE so top-level await works in a snippet.
    var body = '"use strict";\nreturn (async function () {\n' + code + "\n})();";
    var runner = new Function("console", body);
    var result = await runner(sandboxConsole);
    if (result !== undefined) stdout(format(result) + "\n");
  }

  /* ---------- Python (Pyodide) ---------- */

  var pyodidePromise = null;

  function getPyodide(job) {
    if (pyodidePromise) return pyodidePromise;
    pyodidePromise = (async function () {
      status("Downloading the Python runtime (about 10 MB, cached after the first run)…");
      await loadScript(job.cdn.pyodideIndex + "pyodide.js");
      var pyodide = await window.loadPyodide({
        indexURL: job.cdn.pyodideIndex,
        stdout: function (line) {
          stdout(line + "\n");
        },
        stderr: function (line) {
          stderr(line + "\n");
        },
      });
      return pyodide;
    })();
    return pyodidePromise;
  }

  async function runPython(job) {
    var pyodide = await getPyodide(job);
    try {
      // Installs numpy, pandas and friends on demand when the snippet imports them.
      await pyodide.loadPackagesFromImports(job.source, {
        messageCallback: function (text) {
          status(text);
        },
      });
    } catch (err) {
      stderr(
        "Could not load an imported package: " + (err && err.message ? err.message : err) + "\n",
      );
    }
    status("Running…");
    await pyodide.runPythonAsync(job.source);
  }

  /* ---------- SQL (SQLite via sql.js) ---------- */

  var sqlPromise = null;

  function getSql(job) {
    if (sqlPromise) return sqlPromise;
    sqlPromise = (async function () {
      status("Loading SQLite…");
      await loadScript(job.cdn.sqlJs + "sql-wasm.js");
      return window.initSqlJs({
        locateFile: function (file) {
          return job.cdn.sqlJs + file;
        },
      });
    })();
    return sqlPromise;
  }

  async function runSql(job) {
    var SQL = await getSql(job);
    // A fresh database per run, so results never depend on an earlier run.
    var db = new SQL.Database();
    try {
      if (job.seed) db.run(job.seed);
      status("Running…");
      var results = db.exec(job.source);
      if (!results.length) {
        stdout("Statement executed. Rows changed: " + db.getRowsModified() + "\n");
        return;
      }
      results.forEach(function (result, index) {
        post({
          type: "table",
          title: results.length > 1 ? "Result " + (index + 1) : undefined,
          columns: result.columns,
          rows: result.values.map(function (row) {
            return row.map(function (cell) {
              return cell === null ? "NULL" : String(cell);
            });
          }),
        });
      });
    } finally {
      db.close();
    }
  }

  /* ---------- job loop ---------- */

  window.addEventListener("message", async function (event) {
    var job = event.data;
    if (!job || job.channel !== JOB_CHANNEL) return;
    var started = Date.now();
    try {
      if (job.language === "javascript" || job.language === "typescript") {
        await runJavaScript(job);
      } else if (job.language === "python") {
        await runPython(job);
      } else if (job.language === "sql") {
        await runSql(job);
      } else {
        throw new Error("This runtime cannot run " + job.language + ".");
      }
    } catch (err) {
      stderr(format(err) + "\n");
    }
    post({ type: "done", ms: Date.now() - started });
  });

  post({ type: "ready" });
})();
