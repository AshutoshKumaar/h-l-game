"use client";

import { ArrowDown, ArrowUp, Loader2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const BASE_URL = "https://beautyglamours-f0ec7.web.app";

const initialCard = {
  name: "Loading",
  image: "",
  metricDisplay: ""
};

function getStoredHighScore() {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem("higher-lower-high-score") || 0);
}

function GamePanel({ side, card, revealed, onGuess, disabled, resultState }) {
  const isLeft = side === "left";
  const image = card?.image || "";
  const metric = card?.metricDisplay || card?.metricValue || "";
  const name = card?.name || "Unknown";

  return (
    <section
      className={[
        "relative flex min-h-[50dvh] flex-1 items-center justify-center overflow-hidden lg:min-h-dvh",
        isLeft ? "bg-neutral-700" : "bg-[#a65a8d]"
      ].join(" ")}
    >
      {image ? (
        <img
          src={image}
          alt={`${name} portrait`}
          className={[
            "absolute inset-0 h-full w-full object-cover",
            isLeft ? "object-[45%_center]" : "object-center"
          ].join(" ")}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#777,transparent_60%)]" />
      )}

      <div
        className={[
          "absolute inset-0",
          isLeft ? "bg-black/55" : "bg-[#a65a8d]/20"
        ].join(" ")}
      />

      <div className="relative z-10 flex w-full max-w-[760px] flex-col items-center px-6 text-center">
        <div className="bg-white px-3 py-1.5 shadow-label sm:px-4 sm:py-2">
          <h2 className="max-w-[80vw] truncate text-[clamp(2.1rem,5vw,4rem)] font-black leading-none tracking-normal text-black lg:max-w-[38vw]">
            {name}
          </h2>
        </div>

        {revealed && metric ? (
          <div className="mt-6 bg-black/75 px-4 py-2 text-xl font-black text-white backdrop-blur-sm sm:text-2xl">
            {metric}
          </div>
        ) : null}

        {!isLeft && !revealed ? (
          <div className="mt-8 grid w-full max-w-xs grid-cols-2 gap-4">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onGuess("higher")}
              className="group flex h-14 items-center justify-center gap-2 bg-white text-lg font-black uppercase text-black shadow-[7px_7px_0_#000] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Guess higher"
            >
              <ArrowUp className="h-6 w-6" aria-hidden="true" />
              Higher
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onGuess("lower")}
              className="group flex h-14 items-center justify-center gap-2 bg-white text-lg font-black uppercase text-black shadow-[7px_7px_0_#000] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Guess lower"
            >
              <ArrowDown className="h-6 w-6" aria-hidden="true" />
              Lower
            </button>
          </div>
        ) : null}

        {resultState && revealed && !isLeft ? (
          <p className="mt-6 bg-white px-4 py-2 text-xl font-black text-black shadow-[6px_6px_0_#000]">
            {resultState}
          </p>
        ) : null}
      </div>

      <p
        className={[
          "absolute bottom-2 z-10 text-sm font-extrabold text-white/60 underline decoration-white/40 text-stroke-soft sm:text-base",
          isLeft ? "right-4" : "right-4"
        ].join(" ")}
      >
        Image: {name}
      </p>
    </section>
  );
}

export default function Home() {
  const [round, setRound] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [apiStatus, setApiStatus] = useState("Connecting");

  useEffect(() => {
    setHighScore(getStoredHighScore());
  }, []);

  const updateHighScore = useCallback((nextScore) => {
    setHighScore((current) => {
      const nextHighScore = Math.max(current, nextScore);
      window.localStorage.setItem("higher-lower-high-score", String(nextHighScore));
      return nextHighScore;
    });
  }, []);

  const newRound = useCallback(async () => {
    setLoading(true);
    setSubmitting(false);
    setRevealed(false);
    setMessage("");

    try {
      const response = await fetch(`${BASE_URL}/api/game/round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric: "subscribers" })
      });

      if (!response.ok) {
        throw new Error("Could not create round");
      }

      const data = await response.json();
      setRound(data);
      setApiStatus("Live");
    } catch (error) {
      setApiStatus("Offline");
      setMessage("API unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    newRound();
  }, [newRound]);

  const submitGuess = useCallback(
    async (guess) => {
      if (!round?.roundId || submitting) return;

      setSubmitting(true);
      setMessage("");

      try {
        const response = await fetch(`${BASE_URL}/api/game/guess`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundId: round.roundId, guess })
        });

        if (!response.ok) {
          throw new Error("Could not submit guess");
        }

        const result = await response.json();
        const nextScore = result.correct ? score + 1 : 0;

        setRound(result);
        setRevealed(true);
        setScore(nextScore);
        updateHighScore(nextScore);
        setMessage(result.correct ? "Correct" : "Wrong");
      } catch (error) {
        setMessage("Network error");
      } finally {
        setSubmitting(false);
      }
    },
    [round, score, submitting, updateHighScore]
  );

  const leftCard = useMemo(() => round?.left || initialCard, [round]);
  const rightCard = useMemo(() => round?.right || initialCard, [round]);
  const busy = loading || submitting;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-black font-sans">
      <div className="pointer-events-none fixed left-4 top-3 z-30 text-[clamp(1.1rem,2vw,1.55rem)] font-black text-white text-stroke-soft">
        High score: {highScore}
      </div>
      <div className="pointer-events-none fixed right-4 top-3 z-30 text-[clamp(1.1rem,2vw,1.55rem)] font-black text-white text-stroke-soft">
        Score: {score}
      </div>

      <div className="fixed left-1/2 top-1/2 z-40 flex h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[3.5rem] font-black leading-none text-black shadow-[0_8px_24px_rgba(0,0,0,0.25)] sm:h-[132px] sm:w-[132px] sm:text-[4rem] lg:h-[164px] lg:w-[164px] lg:text-[4.8rem]">
        {busy ? <Loader2 className="h-12 w-12 animate-spin" aria-label="Loading" /> : "OR"}
      </div>

      <div className="flex min-h-dvh flex-col lg:flex-row">
        <GamePanel
          side="left"
          card={leftCard}
          revealed
          disabled={busy}
          onGuess={submitGuess}
          resultState={message}
        />
        <GamePanel
          side="right"
          card={rightCard}
          revealed={revealed}
          disabled={busy || revealed}
          onGuess={submitGuess}
          resultState={message}
        />
      </div>

      <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3">
        <button
          type="button"
          onClick={newRound}
          disabled={busy}
          className="flex h-12 items-center gap-2 bg-white px-4 text-base font-black uppercase text-black shadow-[6px_6px_0_#000] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
          {revealed ? "Next" : "New"}
        </button>
        <span className="bg-black/65 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
          API {apiStatus}
        </span>
      </div>
    </main>
  );
}
