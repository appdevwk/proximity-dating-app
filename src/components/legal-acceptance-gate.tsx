"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type LegalDoc = {
  key: string;
  version: string;
  effectiveDate: string;
  title: string;
  path: string;
  summary: string;
};

type GateState =
  | { status: "loading" }
  | { status: "ok" }
  | { status: "pending"; documents: LegalDoc[] }
  | { status: "error"; message: string };

export function LegalAcceptanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<GateState>({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);
  const [docsChecked, setDocsChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/legal/accept", { credentials: "include", cache: "no-store" });
      if (res.status === 401) {
        setState({ status: "ok" });
        return;
      }
      if (!res.ok) throw new Error("Failed to load legal status");
      const data = await res.json();
      if (!data.pending || data.pending.length === 0) {
        setState({ status: "ok" });
      } else {
        setState({
          status: "pending",
          documents: data.documents ?? [],
        });
      }
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }, []);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const handleAccept = async () => {
    if (!ageChecked || !docsChecked) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/legal/accept", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmAge: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Acceptance failed");
      }
      setState({ status: "ok" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        <p>Loading…</p>
      </div>
    );
  }

  if (state.status === "ok") {
    return <>{children}</>;
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400 p-6">
        <p>{state.message}</p>
      </div>
    );
  }

  const { documents } = state;

  return (
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-pink-900/50 bg-zinc-950 shadow-2xl shadow-pink-950/20 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-600 to-pink-700 px-6 py-5 text-center">
          <div className="text-white font-bold tracking-wide text-lg">♥ PROXIMITY</div>
          <h1 className="text-white text-xl font-semibold mt-1">Updated Legal Terms</h1>
          <p className="text-pink-100 text-sm mt-1">Please review and accept to continue</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-gray-300">
            We have updated our legal documents. To keep using Proximity you must confirm
            you are 18+ and accept the current versions below.
          </p>

          <ul className="space-y-3">
            {documents.map((doc) => (
              <li
                key={doc.key}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{doc.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Version {doc.version} · Effective {doc.effectiveDate}
                    </p>
                    <p className="text-sm text-gray-400 mt-1.5">{doc.summary}</p>
                  </div>
                  <Link
                    href={doc.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-pink-400 hover:text-pink-300 underline"
                  >
                    Read full
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={ageChecked}
                onChange={(e) => setAgeChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm text-gray-300 group-hover:text-gray-100">
                I confirm that I am{" "}
                <strong className="text-white">18 years of age or older</strong>.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={docsChecked}
                onChange={(e) => setDocsChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm text-gray-300 group-hover:text-gray-100">
                I have read and agree to the{" "}
                {documents.map((d, i) => (
                  <span key={d.key}>
                    {i > 0 && (i === documents.length - 1 ? " and " : ", ")}
                    <Link
                      href={d.path}
                      target="_blank"
                      className="text-pink-400 underline"
                    >
                      {d.title}
                    </Link>
                  </span>
                ))}
                .
              </span>
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={!ageChecked || !docsChecked || submitting}
            onClick={() => void handleAccept()}
            className="w-full rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 transition-colors"
          >
            {submitting ? "Saving…" : "Accept & Continue"}
          </button>

          <p className="text-xs text-center text-gray-500">
            Your acceptance is recorded with a timestamp and IP address for compliance
            purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
