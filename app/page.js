"use client";

import { ArrowDown, ArrowUp, Loader2, RotateCcw, Trophy, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BASE_URL = "https://beautyglamours-f0ec7.web.app";

const initialCard = {
  name: "Loading",
  image: "",
  metricDisplay: ""
};

const SCOREBOARD_KEY = "higher-lower-scoreboard";
const USERNAME_KEY = "higher-lower-username";

function getStoredHighScore() {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem("higher-lower-high-score") || 0);
}

function getStoredScoreboard() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(SCOREBOARD_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function getStoredUsername() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(USERNAME_KEY) || "";
}

function normalizeUsername(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 22);
}

function GamePanel({ side, card, canGuess, onGuess, disabled }) {
  const isLeft = side === "left";
  const image = card?.image || "";
  const metric = card?.metricDisplay || card?.metricValue || "";
  const name = card?.name || "Unknown";
  const guess = isLeft ? "lower" : "higher";
  const label = isLeft ? "Lower" : "Higher";
  const Icon = isLeft ? ArrowDown : ArrowUp;

  return (
    <button
      type="button"
      disabled={!canGuess || disabled}
      onClick={() => onGuess(guess)}
      className={[
        "group relative flex min-h-[50dvh] flex-1 items-center justify-center overflow-hidden text-white outline-none transition-[filter] duration-500 lg:min-h-dvh",
        canGuess ? "cursor-pointer" : "cursor-default",
        isLeft ? "bg-neutral-700" : "bg-[#a65a8d]"
      ].join(" ")}
      aria-label={`Guess ${label}`}
    >
      {image ? (
        <img
          src={image}
          alt={`${name} portrait`}
          className={[
            "absolute inset-0 h-full w-full scale-105 object-cover opacity-80 transition duration-700 ease-out group-hover:scale-100 group-hover:opacity-45 group-focus-visible:scale-100 group-focus-visible:opacity-45",
            isLeft ? "object-[45%_center]" : "object-center"
          ].join(" ")}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#777,transparent_60%)]" />
      )}

      <div
        className={[
          "absolute inset-0 transition duration-700",
          isLeft ? "bg-black/62 group-hover:bg-black/76 group-focus-visible:bg-black/76" : "bg-black/32 group-hover:bg-black/58 group-focus-visible:bg-black/58"
        ].join(" ")}
      />
      <div className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-14deg] bg-white/20 opacity-0 blur-xl transition-all duration-700 ease-out group-hover:left-full group-hover:opacity-100 group-focus-visible:left-full group-focus-visible:opacity-100" />

      <div
        className={[
          "relative z-10 flex w-full max-w-[760px] flex-col px-5 text-center transition duration-500 ease-out group-hover:-translate-y-2 group-focus-visible:-translate-y-2 sm:px-8",
          isLeft ? "items-start lg:items-center lg:pr-24" : "items-end lg:items-center lg:pl-24"
        ].join(" ")}
      >
        <div className="bg-white px-3 py-1.5 shadow-label transition duration-300 group-hover:shadow-[14px_13px_0_rgba(0,0,0,0.95)] group-focus-visible:shadow-[14px_13px_0_rgba(0,0,0,0.95)] sm:px-4 sm:py-2">
          <h2 className="font-game max-w-[min(78vw,500px)] break-words text-[clamp(1.6rem,3.5vw,2.9rem)] font-bold capitalize leading-[1.08] tracking-normal text-black lg:max-w-[32vw]">
            {name}
          </h2>
        </div>

        {metric ? (
          <div className="font-game pointer-events-none mt-7 translate-y-4 bg-black/85 px-5 py-2 text-xl text-white opacity-0 shadow-[6px_6px_0_#fff] backdrop-blur-sm transition duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 sm:text-2xl">
            {metric}
          </div>
        ) : null}

        {canGuess ? (
          <div className="font-game pointer-events-none mt-7 flex translate-y-4 items-center gap-2 bg-white px-4 py-2 text-lg uppercase text-black opacity-0 shadow-[7px_7px_0_#000] transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            <Icon className="h-6 w-6" aria-hidden="true" />
            {label}
          </div>
        ) : null}
      </div>

      <p className="absolute bottom-3 right-4 z-10 max-w-[70%] truncate text-sm font-extrabold text-white/50 underline decoration-white/30 text-stroke-soft sm:text-base">
        Image: {name}
      </p>
    </button>
  );
}

export default function Home() {
  const [round, setRound] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [scoreboard, setScoreboard] = useState({});
  const [username, setUsername] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [lastRunScore, setLastRunScore] = useState(0);
  const nextRoundTimer = useRef(null);

  useEffect(() => {
    setHighScore(getStoredHighScore());
    const storedUsername = getStoredUsername();

    setUsername(storedUsername);
    setUsernameDraft(storedUsername);
    setScoreboard(getStoredScoreboard());

    return () => {
      if (nextRoundTimer.current) {
        window.clearTimeout(nextRoundTimer.current);
      }
    };
  }, []);

  const savePlayerScore = useCallback((name, value, completedRun = false) => {
    const cleanName = normalizeUsername(name);

    if (!cleanName) return;

    setScoreboard((current) => {
      const existing = current[cleanName] || {
        name: cleanName,
        best: 0,
        last: 0,
        games: 0,
        updatedAt: ""
      };
      const next = {
        ...existing,
        name: cleanName,
        best: Math.max(existing.best || 0, value),
        last: value,
        games: (existing.games || 0) + (completedRun ? 1 : 0),
        updatedAt: new Date().toISOString()
      };
      const nextScoreboard = {
        ...current,
        [cleanName]: next
      };

      window.localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(nextScoreboard));
      return nextScoreboard;
    });
  }, []);

  const updateHighScore = useCallback((nextScore) => {
    setHighScore((current) => {
      const nextHighScore = Math.max(current, nextScore);
      window.localStorage.setItem("higher-lower-high-score", String(nextHighScore));
      return nextHighScore;
    });
  }, []);

  const newRound = useCallback(async () => {
    if (nextRoundTimer.current) {
      window.clearTimeout(nextRoundTimer.current);
    }

    setLoading(true);
    setSubmitting(false);
    setRevealed(false);
    setMessage("");
    setGameOver(false);

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
    } catch (error) {
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
        updateHighScore(nextScore);
        setMessage(result.correct ? "Correct" : "Game over");

        if (result.correct) {
          setScore(nextScore);
          savePlayerScore(username, nextScore);
          nextRoundTimer.current = window.setTimeout(() => {
            newRound();
          }, 1700);
        } else {
          setGameOver(true);
          setLastRunScore(score);
          savePlayerScore(username, score, true);
          setScore(0);
        }
      } catch (error) {
        setMessage("Network error");
      } finally {
        setSubmitting(false);
      }
    },
    [newRound, round, savePlayerScore, score, submitting, updateHighScore, username]
  );

  const openScoreboard = useCallback(() => {
    if (!username) {
      setUsernameDraft("");
      setShowUsernameModal(true);
      return;
    }

    savePlayerScore(username, score);
    setShowScoreboard(true);
  }, [savePlayerScore, score, username]);

  const submitUsername = useCallback(
    (event) => {
      event.preventDefault();

      const cleanName = normalizeUsername(usernameDraft);
      if (!cleanName) return;

      window.localStorage.setItem(USERNAME_KEY, cleanName);
      setUsername(cleanName);
      setUsernameDraft(cleanName);
      savePlayerScore(cleanName, Math.max(score, lastRunScore));
      setShowUsernameModal(false);
      setShowScoreboard(true);
    },
    [lastRunScore, savePlayerScore, score, usernameDraft]
  );

  const leftCard = useMemo(() => round?.left || initialCard, [round]);
  const rightCard = useMemo(() => round?.right || initialCard, [round]);
  const busy = loading || submitting;
  const canGuess = Boolean(round?.roundId) && !busy && !revealed && !gameOver;
  const scoreboardRows = useMemo(
    () =>
      Object.values(scoreboard)
        .sort((a, b) => (b.best || 0) - (a.best || 0) || (a.name || "").localeCompare(b.name || ""))
        .map((player, index) => ({
          ...player,
          rank: index + 1
        })),
    [scoreboard]
  );
  return (
    <main className="group/game relative min-h-dvh overflow-hidden bg-black font-sans">
      <div className="font-game pointer-events-none fixed left-4 top-3 z-30 text-[clamp(1.1rem,2vw,1.55rem)] text-white text-stroke-soft">
        High score: {highScore}
      </div>
      <div className="font-game pointer-events-none fixed right-4 top-3 z-30 text-[clamp(1.1rem,2vw,1.55rem)] text-white text-stroke-soft">
        Score: {score}
      </div>

      <div className="font-game pointer-events-none fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 select-none text-[clamp(2.3rem,5vw,4.6rem)] font-bold leading-none text-white/55 drop-shadow-[0_8px_18px_rgba(0,0,0,0.85)]">
        Vs
      </div>

      <button
        type="button"
        onClick={openScoreboard}
        className="font-game fixed bottom-5 left-1/2 z-40 flex h-11 -translate-x-1/2 translate-y-3 items-center justify-center gap-2 bg-white px-5 text-sm font-bold uppercase leading-none text-black opacity-0 shadow-[6px_6px_0_#000] transition duration-300 hover:-translate-y-0 hover:shadow-[8px_8px_0_#000] focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white group-hover/game:translate-y-0 group-hover/game:opacity-100"
      >
        <Users className="h-5 w-5" aria-hidden="true" />
        Leaderboard
      </button>

      {busy ? (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-black/45 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 animate-ping rounded-full bg-white/35" />
              <div className="absolute inset-3 grid place-items-center rounded-full bg-white text-black">
                <Loader2 className="h-9 w-9 animate-spin" aria-hidden="true" />
              </div>
            </div>
            <p className="font-game bg-white px-5 py-2 text-xl uppercase text-black shadow-[7px_7px_0_#000]">
              Loading round
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-dvh flex-col lg:flex-row">
        <GamePanel
          side="left"
          card={leftCard}
          canGuess={canGuess}
          disabled={busy}
          onGuess={submitGuess}
        />
        <GamePanel
          side="right"
          card={rightCard}
          canGuess={canGuess}
          disabled={busy || revealed || gameOver}
          onGuess={submitGuess}
        />
      </div>

      {message ? (
        <div className="pointer-events-none fixed left-1/2 top-[64%] z-40 -translate-x-1/2 -translate-y-1/2">
          <p className="font-game animate-[popIn_500ms_ease-out] bg-white px-6 py-3 text-3xl uppercase text-black shadow-[8px_8px_0_#000]">
            {message}
          </p>
        </div>
      ) : null}

      {gameOver ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/78 px-4 py-6 backdrop-blur-md">
          <div className="font-game relative flex w-full max-w-[470px] flex-col items-center border-[3px] border-white bg-[#151515] px-5 py-7 text-center shadow-[10px_10px_0_#000] sm:px-7 sm:py-8">
            <p className="bg-white px-5 py-3 text-[clamp(2rem,6vw,3.25rem)] font-bold capitalize leading-[1.05] text-black shadow-[7px_7px_0_#000]">
              Game Lost
            </p>
            <p className="mt-6 max-w-[340px] text-[0.98rem] font-bold leading-7 text-white/86 sm:text-[1.05rem]">
              The other side had the stronger number. Start again and beat your best streak.
            </p>
            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              <div className="bg-white px-3 py-4 text-black shadow-[5px_5px_0_#000]">
                <p className="text-[0.72rem] font-bold uppercase leading-none text-black/55">Last Run</p>
                <p className="mt-3 text-3xl font-bold leading-none">{lastRunScore}</p>
              </div>
              <div className="bg-white px-4 py-4 text-black shadow-[5px_5px_0_#000]">
                <p className="flex items-center justify-center gap-1 text-[0.72rem] font-bold uppercase leading-none text-black/55">
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  Best Score
                </p>
                <p className="mt-3 text-3xl font-bold leading-none">{highScore}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={newRound}
              className="mt-7 flex h-12 items-center justify-center gap-2 bg-white px-6 text-base font-bold uppercase leading-none text-black shadow-[6px_6px_0_#000] transition hover:-translate-y-1 hover:shadow-[9px_9px_0_#000] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              Play Again
            </button>
          </div>
        </div>
      ) : null}

      {showUsernameModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/74 px-4 backdrop-blur-md">
          <form
            onSubmit={submitUsername}
            className="font-game flex w-full max-w-[390px] flex-col border-[3px] border-white bg-[#151515] px-5 py-6 text-center shadow-[10px_10px_0_#000]"
          >
            <p className="bg-white px-4 py-3 text-3xl font-bold leading-none text-black shadow-[6px_6px_0_#000]">
              Your Name
            </p>
            <p className="mt-5 text-sm font-bold leading-6 text-white/78">
              Enter a username to save scores, switch player, and compare rankings.
            </p>
            <input
              value={usernameDraft}
              onChange={(event) => setUsernameDraft(event.target.value)}
              autoFocus
              maxLength={22}
              placeholder="Username"
              className="mt-5 h-12 border-2 border-white bg-white px-4 text-center text-lg font-bold text-black outline-none focus:border-[#8be9ff]"
            />
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowUsernameModal(false)}
                className="h-11 bg-white/12 px-4 text-sm font-bold uppercase text-white outline outline-2 outline-white/35 transition hover:bg-white/18"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-11 bg-white px-5 text-sm font-bold uppercase text-black shadow-[5px_5px_0_#000] transition hover:-translate-y-0.5"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showScoreboard ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/74 px-4 py-6 backdrop-blur-md">
          <section className="font-game flex w-full max-w-[520px] flex-col border-[3px] border-white bg-[#151515] px-5 py-6 text-center shadow-[10px_10px_0_#000] sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <p className="bg-white px-4 py-2 text-3xl font-bold leading-none text-black shadow-[6px_6px_0_#000]">
                Scoreboard
              </p>
              <button
                type="button"
                onClick={() => setShowScoreboard(false)}
                className="grid h-10 w-10 place-items-center bg-white text-xl font-bold leading-none text-black shadow-[4px_4px_0_#000] transition hover:-translate-y-0.5"
                aria-label="Close scoreboard"
              >
                x
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <p className="text-left text-xs font-bold uppercase text-white/60">All Player Rankings</p>
              {scoreboardRows.length ? (
                scoreboardRows.map((player) => (
                  <div
                    key={player.name}
                    className={[
                      "grid grid-cols-[42px_1fr_70px] items-center gap-3 bg-white px-3 py-3 text-left text-black shadow-[4px_4px_0_#000]",
                      player.name === username ? "outline outline-2 outline-[#8be9ff]" : ""
                    ].join(" ")}
                  >
                    <span className="text-center text-lg font-bold leading-none">#{player.rank}</span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold capitalize leading-none">{player.name}</p>
                      <p className="mt-1 text-[0.7rem] font-bold uppercase leading-none text-black/50">
                        Best {player.best || 0} / Last {player.last || 0} / {player.games || 0} runs
                      </p>
                    </div>
                    <p className="text-right text-2xl font-bold leading-none">{player.best || 0}</p>
                  </div>
                ))
              ) : (
                <p className="bg-white px-4 py-5 text-center text-sm font-bold uppercase text-black shadow-[4px_4px_0_#000]">
                  No scores yet
                </p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
