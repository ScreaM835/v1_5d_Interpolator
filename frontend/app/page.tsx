"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const INPUT_KEYS = ["input1", "input2", "input3", "input4", "input5"] as const;
const HELLO_TIMEOUT_MS = 4000;
const SUBMIT_TIMEOUT_MS = 8000;

type InputKey = (typeof INPUT_KEYS)[number];

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = SUBMIT_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
};

export default function Page() {
  const [values, setValues] = useState<Record<InputKey, string>>({
    input1: "1",
    input2: "2",
    input3: "3",
    input4: "4",
    input5: "5",
  });
  const [outputs, setOutputs] = useState<number[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hello, setHello] = useState<string>("");
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchHello = async () => {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/`, {}, HELLO_TIMEOUT_MS);
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { message?: string };
        if (!cancelled) setHello(data.message ?? "Backend online");
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Unable to reach backend";
          setHello(msg);
        }
      }
    };

    fetchHello();
    return () => {
      cancelled = true;
    };
  }, [API_BASE_URL]);

  const numericPayload = useMemo(() => {
    const parsed: Record<InputKey, number | null> = {
      input1: null,
      input2: null,
      input3: null,
      input4: null,
      input5: null,
    };
    let valid = true;

    for (const key of INPUT_KEYS) {
      const parsedValue = Number(values[key]);
      if (!Number.isFinite(parsedValue)) {
        parsed[key] = null;
        valid = false;
      } else {
        parsed[key] = parsedValue;
      }
    }

    return { parsed, valid };
  }, [values]);

  const handleChange = (key: InputKey, nextValue: string) => {
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!numericPayload.valid) {
      setError("All inputs must be numbers.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setOutputs(null);
    setLastDurationMs(null);
    const startedAt = performance.now();

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/5d_`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input1: numericPayload.parsed.input1,
          input2: numericPayload.parsed.input2,
          input3: numericPayload.parsed.input3,
          input4: numericPayload.parsed.input4,
          input5: numericPayload.parsed.input5,
        }),
      }, SUBMIT_TIMEOUT_MS);

      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { outputs?: number[] };
      setOutputs(data.outputs ?? null);
      setLastDurationMs(Math.round(performance.now() - startedAt));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Request timed out. Is the FastAPI server running on 8000?");
      } else {
        const msg = err instanceof Error ? err.message : "Request failed";
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10 text-gray-100" style={{ background: "#050810" }}>
      <section className="rounded-2xl bg-slate-900/80 p-6 shadow">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-400">5D interpolator</p>
        <h1 className="mt-2 text-3xl font-semibold">Simple frontend for the FastAPI backend</h1>
        <p className="mt-3 text-sm text-slate-300">Base URL: {API_BASE_URL}</p>
        <p className="mt-1 text-sm text-emerald-300">{hello}</p>
      </section>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900/70 p-6 shadow space-y-4">
        <p className="text-sm text-slate-300">POST /5d_ &rarr; multiplies each input by 5</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {INPUT_KEYS.map((key) => (
            <label key={key} className="text-sm">
              <span className="text-slate-200">{key.toUpperCase()}</span>
              <input
                type="number"
                step="any"
                value={values[key]}
                onChange={(event) => handleChange(key, event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-base text-white focus:border-sky-500 focus:outline-none"
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-sky-400/90 px-4 py-3 text-base font-semibold text-slate-950 disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send inputs"}
        </button>

        {error && <p className="text-sm text-rose-300" aria-live="assertive">{error}</p>}
      </form>

      <section className="rounded-2xl bg-slate-900/70 p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-100">Outputs</h2>
        {outputs ? (
          <div className="mt-3 space-y-2 text-slate-300">
            <ul className="list-disc space-y-1 pl-6">
              {outputs.map((value, index) => (
                <li key={index}>output{index + 1}: {value}</li>
              ))}
            </ul>
            {lastDurationMs !== null && (
              <p className="text-xs text-slate-500">Responded in {lastDurationMs} ms</p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            {isSubmitting ? "Waiting for backend response..." : "Submit the form to see results."}
          </p>
        )}
      </section>
    </main>
  );
}
