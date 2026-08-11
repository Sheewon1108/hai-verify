#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

function parseArgs(argv) {
  const config = {
    url: "http://127.0.0.1:3000/api/hai-ic/analyze",
    count: 50,
    warmup: 5,
    timeoutMs: 10_000,
    out: "",
    input:
      "Route an invoice approval request to the correct approver before any tool action is taken, budget $50k, deadline Q3.",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--url" && next) {
      config.url = next;
      i += 1;
    } else if (arg === "--count" && next) {
      config.count = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--warmup" && next) {
      config.warmup = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--timeout-ms" && next) {
      config.timeoutMs = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--out" && next) {
      config.out = next;
      i += 1;
    } else if (arg === "--input" && next) {
      config.input = next;
      i += 1;
    }
  }

  if (!Number.isFinite(config.count) || config.count < 1) {
    throw new Error("--count must be a positive integer");
  }
  if (!Number.isFinite(config.warmup) || config.warmup < 0) {
    throw new Error("--warmup must be a non-negative integer");
  }
  if (!Number.isFinite(config.timeoutMs) || config.timeoutMs < 100) {
    throw new Error("--timeout-ms must be at least 100");
  }

  return config;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(sorted.length - 1, Math.max(0, index))];
}

async function postOnce({ url, timeoutMs, input }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input }),
      signal: controller.signal,
    });

    const elapsedMs = performance.now() - startedAt;
    const json = await response.json();

    if (!response.ok || !json?.ok) {
      throw new Error(`Request failed (${response.status}): ${JSON.stringify(json)}`);
    }

    return {
      elapsedMs,
      confidence: json.confidence,
      sincereMode: json.sincereMode,
      mode: json.mode,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const config = parseArgs(process.argv.slice(2));

  for (let i = 0; i < config.warmup; i += 1) {
    await postOnce(config);
  }

  const measurements = [];
  const benchmarkStartedAt = performance.now();

  for (let i = 0; i < config.count; i += 1) {
    measurements.push(await postOnce(config));
  }

  const benchmarkElapsedMs = performance.now() - benchmarkStartedAt;
  const latenciesMs = measurements
    .map((item) => item.elapsedMs)
    .sort((a, b) => a - b);

  const result = {
    measuredAt: new Date().toISOString(),
    url: config.url,
    sampleInput: config.input,
    warmupRequests: config.warmup,
    measuredRequests: config.count,
    processingSpeedRequestsPerSecond: Number(
      (measurements.length / (benchmarkElapsedMs / 1000)).toFixed(2),
    ),
    latencyMs: {
      min: Number(latenciesMs[0].toFixed(2)),
      p50: Number(percentile(latenciesMs, 50).toFixed(2)),
      p95: Number(percentile(latenciesMs, 95).toFixed(2)),
      max: Number(latenciesMs[latenciesMs.length - 1].toFixed(2)),
      avg: Number(
        (latenciesMs.reduce((sum, value) => sum + value, 0) / latenciesMs.length).toFixed(2),
      ),
    },
    responseShape: {
      confidence: measurements.at(-1)?.confidence ?? null,
      sincereMode: measurements.at(-1)?.sincereMode ?? null,
      mode: measurements.at(-1)?.mode ?? null,
    },
  };

  const output = `${JSON.stringify(result, null, 2)}\n`;
  process.stdout.write(output);

  if (config.out) {
    await writeFile(config.out, output, "utf8");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
