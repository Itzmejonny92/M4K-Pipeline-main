const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const CHECKLIST_PATH = path.join(__dirname, "mission_challenges_checklist.txt");

const metrics = {
  totalRequests: 0,
  totalResponseTimeMs: 0,
  routes: {}
};

function toFixedNumber(value) {
  return Number(value.toFixed(2));
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function readChecklistFile() {
  try {
    return fs.readFileSync(CHECKLIST_PATH, "utf8");
  } catch (error) {
    return "Checklist file not found. Add mission_challenges_checklist.txt in repo root.";
  }
}

function routeMetricName(route) {
  const normalized = route.replaceAll("/", "_").replace(/[^a-zA-Z0-9_]/g, "_");
  return normalized.length === 0 ? "root" : normalized;
}

app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const route = req.path || "unknown";

    metrics.totalRequests += 1;
    metrics.totalResponseTimeMs += durationMs;

    if (!metrics.routes[route]) {
      metrics.routes[route] = {
        requests: 0,
        totalResponseTimeMs: 0,
        lastStatusCode: 0
      };
    }

    metrics.routes[route].requests += 1;
    metrics.routes[route].totalResponseTimeMs += durationMs;
    metrics.routes[route].lastStatusCode = res.statusCode;
  });

  next();
});

app.get("/status", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "first-pipeline",
    healthy: true,
    version: APP_VERSION,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

app.get("/metrics", (req, res) => {
  const averageResponseMs =
    metrics.totalRequests === 0
      ? 0
      : toFixedNumber(metrics.totalResponseTimeMs / metrics.totalRequests);

  const routeMetrics = {};
  Object.keys(metrics.routes).forEach((route) => {
    const routeData = metrics.routes[route];
    const routeAverage =
      routeData.requests === 0
        ? 0
        : toFixedNumber(routeData.totalResponseTimeMs / routeData.requests);

    routeMetrics[route] = {
      requests: routeData.requests,
      averageResponseMs: routeAverage,
      lastStatusCode: routeData.lastStatusCode
    };
  });

  res.json({
    uptimeSeconds: Math.floor(process.uptime()),
    totalRequests: metrics.totalRequests,
    averageResponseMs,
    routeMetrics
  });
});

app.get("/metrics/prometheus", (req, res) => {
  const averageResponseMs =
    metrics.totalRequests === 0
      ? 0
      : toFixedNumber(metrics.totalResponseTimeMs / metrics.totalRequests);

  const lines = [
    "# HELP pipeline_total_requests Total HTTP requests handled by the service",
    "# TYPE pipeline_total_requests counter",
    `pipeline_total_requests ${metrics.totalRequests}`,
    "# HELP pipeline_average_response_ms Average response time in milliseconds",
    "# TYPE pipeline_average_response_ms gauge",
    `pipeline_average_response_ms ${averageResponseMs}`,
    "# HELP pipeline_uptime_seconds Service uptime in seconds",
    "# TYPE pipeline_uptime_seconds gauge",
    `pipeline_uptime_seconds ${Math.floor(process.uptime())}`
  ];

  Object.keys(metrics.routes).forEach((route) => {
    const routeData = metrics.routes[route];
    const routeAverage =
      routeData.requests === 0
        ? 0
        : toFixedNumber(routeData.totalResponseTimeMs / routeData.requests);
    const metricLabel = routeMetricName(route);

    lines.push(`# HELP pipeline_route_requests_${metricLabel} Requests for route ${route}`);
    lines.push(`# TYPE pipeline_route_requests_${metricLabel} counter`);
    lines.push(`pipeline_route_requests_${metricLabel} ${routeData.requests}`);
    lines.push(`# HELP pipeline_route_average_response_ms_${metricLabel} Average response time for route ${route}`);
    lines.push(`# TYPE pipeline_route_average_response_ms_${metricLabel} gauge`);
    lines.push(`pipeline_route_average_response_ms_${metricLabel} ${routeAverage}`);
  });

  res
    .status(200)
    .type("text/plain; version=0.0.4; charset=utf-8")
    .send(`${lines.join("\n")}\n`);
});

app.get("/secret", (req, res) => {
  res.json({
    message: "You found the secret! Here's a cookie.",
    code: "OPERATION-PIPELINE"
  });
});

app.get("/coffee", (req, res) => {
  res.type("text/plain").send(`
    ( (
     ) )
  ........
  |      |]
  \\      /
   \`----'
`);
});

app.get("/", (req, res) => {
  const now = new Date().toISOString();
  const host = req.get("host");
  const baseUrl = `${req.protocol}://${host}`;
  const repoUrl = "https://github.com/PalmChas/M4K-Pipeline";
  const actionsUrl = "https://github.com/PalmChas/M4K-Pipeline/actions/workflows/pipeline.yml";
  const deployUrl = "https://m4k-pipeline-production.up.railway.app";
  const checklistUrl = `${repoUrl}/blob/main/mission_challenges_checklist.txt`;
  const checklistText = escapeHtml(readChecklistFile());
  const teamName = "M4K Gang";
  const teamMembers = [
    "Oskar Palm",
    "Carl Persson",
    "Jonny Nguyen",
    "Julia Persson",
    "Mattej Petrovic"
  ];
  const teamMemberList = teamMembers.map((member) => `<li>${member}</li>`).join("");
  const averageResponseMs =
    metrics.totalRequests === 0
      ? 0
      : toFixedNumber(metrics.totalResponseTimeMs / metrics.totalRequests);

  res.type("html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>First Pipeline Challenge</title>
        <style>
          :root {
            color-scheme: light;
            --bg-a: #f7fbff;
            --bg-b: #eef5ff;
            --surface: #ffffff;
            --text: #0f172a;
            --muted: #334155;
            --line: #dbe7ff;
            --accent: #1d4ed8;
            --ok-bg: #dcfce7;
            --ok-text: #166534;
            --card-bg: #f8fbff;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(120deg, var(--bg-a), var(--bg-b));
            color: var(--text);
          }
          .wrap {
            max-width: 1100px;
            margin: 28px auto;
            padding: 20px;
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 16px;
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
          }
          h1 {
            margin: 0 0 10px;
            font-size: 2rem;
          }
          h2 {
            margin: 0 0 10px;
            font-size: 1.15rem;
          }
          p {
            margin-top: 0;
          }
          .ok {
            display: inline-block;
            margin-bottom: 12px;
            padding: 6px 11px;
            border-radius: 999px;
            background: var(--ok-bg);
            color: var(--ok-text);
            font-weight: 700;
          }
          .subtitle {
            color: var(--muted);
            margin-bottom: 18px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
            gap: 12px;
          }
          .card {
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 14px;
            background: var(--card-bg);
          }
          .badge {
            display: inline-block;
            font-size: 0.82rem;
            color: #1e3a8a;
            background: #dbeafe;
            border-radius: 999px;
            padding: 3px 8px;
            margin-bottom: 10px;
          }
          ul {
            margin: 0;
            padding-left: 18px;
          }
          li {
            margin: 6px 0;
          }
          a {
            color: var(--accent);
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .meta {
            color: var(--muted);
          }
          .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
            margin-top: 10px;
          }
          .stat {
            padding: 10px;
            border-radius: 10px;
            border: 1px solid var(--line);
            background: #fff;
          }
          .stat strong {
            display: block;
            font-size: 1.1rem;
          }
          .task-list {
            margin-top: 10px;
            list-style: none;
            padding-left: 0;
          }
          .task-list li {
            margin: 8px 0;
          }
          .task {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .task input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #166534;
          }
          .task.done {
            color: #166534;
          }
          pre {
            white-space: pre-wrap;
            word-break: break-word;
            background: #0b1220;
            color: #dbeafe;
            border-radius: 10px;
            padding: 12px;
            overflow-x: auto;
            margin: 0;
          }
          .section {
            margin-top: 12px;
          }
          .small {
            font-size: 0.93rem;
            color: #475569;
          }
        </style>
      </head>
      <body>
        <main class="wrap">
          <span class="ok">Pipeline app is running</span>
          <h1>First Pipeline Challenge - Mission Control</h1>
          <p class="subtitle">Everything in one place: live status, endpoints, challenge requirements and submission checklist.</p>

          <section class="grid">
            <article class="card">
              <span class="badge">Project Links</span>
              <h2>Core Links</h2>
              <ul>
                <li><a href="${repoUrl}" target="_blank" rel="noreferrer">GitHub repository</a></li>
                <li><a href="${actionsUrl}" target="_blank" rel="noreferrer">GitHub Actions pipeline</a></li>
                <li><a href="${deployUrl}" target="_blank" rel="noreferrer">Railway production URL</a></li>
                <li><a href="${checklistUrl}" target="_blank" rel="noreferrer">Full challenge checklist file</a></li>
              </ul>
            </article>

            <article class="card">
              <span class="badge">Verification</span>
              <h2>API Endpoints</h2>
              <ul>
                <li><a href="${baseUrl}/status">${baseUrl}/status</a></li>
                <li><a href="${baseUrl}/health">${baseUrl}/health</a></li>
                <li><a href="${baseUrl}/metrics">${baseUrl}/metrics</a></li>
                <li><a href="${baseUrl}/metrics/prometheus">${baseUrl}/metrics/prometheus</a></li>
                <li><a href="${baseUrl}/secret">${baseUrl}/secret</a></li>
                <li><a href="${baseUrl}/coffee">${baseUrl}/coffee</a></li>
              </ul>
            </article>

            <article class="card">
              <span class="badge">Team</span>
              <h2>${teamName}</h2>
              <ul>
                ${teamMemberList}
              </ul>
            </article>

            <article class="card">
              <span class="badge">Live Service Stats</span>
              <h2>Runtime Snapshot</h2>
              <div class="status-grid">
                <div class="stat"><strong>${Math.floor(process.uptime())}s</strong>Uptime</div>
                <div class="stat"><strong>${metrics.totalRequests}</strong>Total Requests</div>
                <div class="stat"><strong>${averageResponseMs} ms</strong>Avg Response</div>
                <div class="stat"><strong>v${APP_VERSION}</strong>App Version</div>
                <div class="stat"><strong>${now}</strong>Server Time (UTC)</div>
              </div>
            </article>
          </section>

          <section class="card section">
            <span class="badge">Challenge Progress</span>
            <h2>Implemented</h2>
            <ul class="task-list">
              <li><label class="task done"><input type="checkbox" checked disabled />GitHub Actions on push and PR</label></li>
              <li><label class="task done"><input type="checkbox" checked disabled />Automated tests in CI</label></li>
              <li><label class="task done"><input type="checkbox" checked disabled />Docker build in CI</label></li>
              <li><label class="task done"><input type="checkbox" checked disabled />Trivy scan with SARIF upload</label></li>
              <li><label class="task done"><input type="checkbox" checked disabled />Live deployment on Railway</label></li>
              <li><label class="task done"><input type="checkbox" checked disabled />Green CI badge in README</label></li>
              <li><label class="task done"><input type="checkbox" checked disabled />Health endpoint and metrics endpoint</label></li>
              <li><label class="task done"><input type="checkbox" checked disabled />Prometheus metrics export endpoint</label></li>
              <li><label class="task done"><input type="checkbox" checked disabled />Secret challenge endpoints and pipeline art</label></li>
              <li><label class="task done"><input type="checkbox" checked disabled />Slack notifications for success and failure with commit details</label></li>
              <li><label class="task done"><input type="checkbox" checked disabled />Staging and production deploy workflow</label></li>
              <li><label class="task done"><input type="checkbox" checked disabled />Chaos restart job for staging</label></li>
            </ul>
          </section>

          <section class="grid section">
            <article class="card">
              <span class="badge">Submission</span>
              <h2>Hand-in Checklist</h2>
              <ul class="task-list">
                <li><label class="task done"><input type="checkbox" checked disabled />Team name and members</label></li>
                <li><label class="task done"><input type="checkbox" checked disabled />GitHub repository URL</label></li>
                <li><label class="task done"><input type="checkbox" checked disabled />Deployed application URL</label></li>
                <li><label class="task"><input type="checkbox" disabled />Screenshot of pipeline</label></li>
                <li><label class="task"><input type="checkbox" disabled />Screenshot of deployed app</label></li>
                <li><label class="task"><input type="checkbox" disabled />Optional: Trivy screenshot and architecture diagram</label></li>
              </ul>
            </article>

            <article class="card">
              <span class="badge">Quick Commands</span>
              <h2>Final Verification</h2>
              <pre>npm test
docker build -t first-pipeline:latest .
curl ${baseUrl}/status
curl ${baseUrl}/health
curl ${baseUrl}/metrics
curl ${baseUrl}/metrics/prometheus
curl ${baseUrl}/secret</pre>
              <p class="small">For local Trivy report: <code>trivy-report.txt</code>.</p>
            </article>
          </section>

          <section class="card section">
            <span class="badge">Full Mission File</span>
            <h2>mission_challenges_checklist.txt</h2>
            <pre>${checklistText}</pre>
          </section>
        </main>
      </body>
    </html>
  `);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
