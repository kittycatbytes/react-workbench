import { useEffect, useRef, useState } from "react";
import { lessons } from "./lessons/index.ts";
import { BotQuestion } from "./workbench/BotQuestion.tsx";
import { CatchBoundary } from "./workbench/bits.tsx";
import { Dock } from "./workbench/Dock.tsx";
import type { PanelKey } from "./workbench/types.ts";

function readHash() {
  const id = window.location.hash.replace(/^#/, "");
  return lessons.some((lesson) => lesson.id === id) ? id : lessons[0].id;
}

type TrailStop = { lessonId: string; scenarioId: string; repaired: boolean };

export default function App() {
  const [lessonId, setLessonId] = useState(readHash);
  const lesson = lessons.find((item) => item.id === lessonId) ?? lessons[0];
  const [scenarioId, setScenarioId] = useState(lesson.scenarios[0].id);
  const [repaired, setRepaired] = useState(Boolean(lesson.scenarios[0].fixedFirst));
  const [generation, setGeneration] = useState(0);
  const [open, setOpen] = useState<Record<PanelKey, boolean>>({
    code: true,
    explain: true,
    whatif: true,
  });
  const [trail, setTrail] = useState<TrailStop[]>([]);
  const viaLink = useRef<{ restore: { scenarioId: string; repaired: boolean } | null } | null>(null);

  const scenario =
    lesson.scenarios.find((item) => item.id === scenarioId) ?? lesson.scenarios[0];
  const repair = scenario.repair;
  const showingRepair = repaired && repair != null;
  const shown = showingRepair
    ? {
        ...scenario,
        code: repair.code,
        focus: repair.focus,
        tryThis: repair.tryThis,
        explanation: repair.explanation,
      }
    : scenario;
  const dockOpen = open.code || open.explain || open.whatif;
  const [openWidth, setOpenWidth] = useState<number | null>(null);
  const [railWidth, setRailWidth] = useState<number | null>(null);
  const dockWidth = dockOpen ? openWidth : railWidth;

  useEffect(() => {
    const sync = () => {
      const id = readHash();
      const next = lessons.find((item) => item.id === id) ?? lessons[0];
      const via = viaLink.current;
      viaLink.current = null;
      if (!via) setTrail([]);
      const restore = via?.restore;
      const scenarioStillThere =
        restore != null && next.scenarios.some((item) => item.id === restore.scenarioId);
      setLessonId(next.id);
      setScenarioId(scenarioStillThere ? restore.scenarioId : next.scenarios[0].id);
      setRepaired(
        scenarioStillThere ? restore.repaired : Boolean(next.scenarios[0].fixedFirst),
      );
      setGeneration((value) => value + 1);
    };
    window.addEventListener("hashchange", sync);
    const raw = window.location.hash.replace(/^#/, "");
    if (!lessons.some((item) => item.id === raw)) {
      history.replaceState(null, "", `#${lessons[0].id}`);
    }
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    document.title = `${lesson.title} · React Workbench`;
  }, [lesson.title]);

  function toggle(panel: PanelKey) {
    setOpen((current) => ({ ...current, [panel]: !current[panel] }));
  }

  const previous = lessons[lessons.findIndex((item) => item.id === lesson.id) - 1];
  const back = trail[trail.length - 1];

  function jumpTo(id: string) {
    if (id === lesson.id) return;
    viaLink.current = { restore: null };
    setTrail((current) => [
      ...current,
      { lessonId: lesson.id, scenarioId: scenario.id, repaired },
    ]);
    window.location.hash = id;
  }

  function goBack() {
    if (!back) return;
    viaLink.current = { restore: { scenarioId: back.scenarioId, repaired: back.repaired } };
    setTrail((current) => current.slice(0, -1));
    window.location.hash = back.lessonId;
  }

  function goPrevious() {
    if (!previous) return;
    viaLink.current = { restore: null };
    window.location.hash = previous.id;
  }

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <svg className="mark" viewBox="0 0 20 20" aria-hidden="true">
            <rect width="20" height="20" fill="#1b1916" />
            <rect x="3" y="3" width="14" height="9" fill="#f7f3ec" />
            <rect x="3" y="14" width="14" height="3" fill="#b8431f" />
          </svg>
          <div>
            <p className="wordmark">React Workbench</p>
            <p className="tag">How React updates the screen.</p>
          </div>
        </div>
        <div className="top-actions">
          <a
            className="coffee-link"
            href="https://buymeacoffee.com/kittycatbytes"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="coffee-label">Buy kittycatbytes a coffee</span>
            <span className="coffee-mark">
              <svg className="coffee-icon" viewBox="0 0 36 36" aria-hidden="true">
                <g transform="rotate(-22 17 20)">
                  <ellipse cx="15.5" cy="27.2" rx="9.2" ry="2.1" fill="#f2c14e" />
                  <path d="M6.4 12.2h14.6v8.2a4.8 4.8 0 0 1-4.8 4.8h-5a4.8 4.8 0 0 1-4.8-4.8v-8.2z" fill="#ef6f4d" />
                  <path d="M7.6 14.6h12.2" fill="none" stroke="#ffd7a8" strokeWidth="1.5" strokeLinecap="round" />
                  <path
                    d="M8.4 16.6c2.4 1 4.4.2 6.6 1 1.8.6 3.2.2 4.8-.4"
                    fill="none"
                    stroke="#7a3418"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12.4 20.2c0-.9 1.5-1.4 1.5-.2 0-1.2 1.5-.7 1.5.2 0 1.2-1.5 2.2-1.5 2.2s-1.5-1-1.5-2.2z"
                    fill="#fff6ea"
                  />
                  <path
                    d="M21 14.4h2.3a3.1 3.1 0 0 1 0 6.2H21"
                    fill="none"
                    stroke="#2aa9a1"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                  <path d="M11.2 9.4c1.1-1.3 1.1-2.1 0-3.2" fill="none" stroke="#f2c14e" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M15.8 8.8c1.1-1.3 1.1-2.1 0-3.2" fill="none" stroke="#7a5cff" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              </svg>
              <svg className="dollar-icon" viewBox="0 0 32 20" aria-hidden="true">
                <rect x="1" y="1" width="30" height="18" rx="2.2" fill="#1f8a4c" stroke="#0d5a30" strokeWidth="1.2" />
                <circle cx="16" cy="10" r="5.1" fill="none" stroke="#e7ffef" strokeWidth="1.3" />
                <path
                  d="M16 6.1v7.8M14.2 8c.4-.7 1.1-1 2-1 1.2 0 1.9.5 1.9 1.35 0 .85-.7 1.2-2 1.55-1.35.35-2.1.75-2.1 1.7 0 .9.85 1.5 2 1.5 1 0 1.7-.35 2.1-1"
                  fill="none"
                  stroke="#e7ffef"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </a>
          <p className="lesson-chip">{lesson.kicker}</p>
        </div>
      </header>
      <div
        className={dockOpen ? "bench" : "bench rail"}
        style={
          dockWidth == null
            ? undefined
            : { gridTemplateColumns: `232px minmax(0, 1fr) ${dockWidth}px` }
        }
      >
        <nav className="nav" aria-label="Lessons">
          <p className="nav-label">Lessons</p>
          {lessons.map((item) => {
            const active = item.id === lesson.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={active ? "nav-item active" : "nav-item"}
                aria-current={active ? "page" : undefined}
              >
                <span className="kicker">{item.kicker}</span>
                <span className="nav-title">{item.title}</span>
              </a>
            );
          })}
        </nav>
        <main className="stage" data-lesson={lesson.id}>
          <div className="stage-scroll">
            <header className="stage-h">
              <p className="kicker">{lesson.kicker}</p>
              <h1>{lesson.title}</h1>
              <p className="blurb">{lesson.blurb}</p>
            </header>
            <p className="tryline" aria-live="polite">
              <span>Try this</span>
              {shown.tryThis}
            </p>
            <div className="stage-frame" data-scenario={scenario.id}>
              <CatchBoundary resetKey={`${lesson.id}:${scenario.id}:${showingRepair}:${generation}`}>
                <lesson.Demo
                  key={`${lesson.id}:${scenario.id}:${showingRepair}:${generation}`}
                  scenarioId={scenario.id}
                  repaired={showingRepair}
                />
              </CatchBoundary>
            </div>
          </div>
          <BotQuestion
            lessonTitle={lesson.title}
            scenarioLabel={scenario.label}
            scenarioTease={scenario.tease}
          />
        </main>
        <Dock
          scenario={shown}
          scenarios={lesson.scenarios}
          scenarioId={scenario.id}
          repaired={showingRepair}
          open={open}
          dockOpen={dockOpen}
          width={dockWidth}
          onWidth={dockOpen ? setOpenWidth : setRailWidth}
          onToggle={toggle}
          lessonId={lesson.id}
          onJump={jumpTo}
          lessonLink={
            back
              ? { label: "← Go back", href: `#${back.lessonId}`, onClick: goBack }
              : previous
                ? { label: "← Previous Lesson", href: `#${previous.id}`, onClick: goPrevious }
                : { label: "← Previous Lesson", onClick: goPrevious }
          }
          onScenario={(id) => {
            const next = lesson.scenarios.find((item) => item.id === id);
            setScenarioId(id);
            setRepaired(Boolean(next?.fixedFirst));
            setGeneration((value) => value + 1);
          }}
          onRepair={(id, next) => {
            setScenarioId(id);
            setRepaired(next);
            setGeneration((value) => value + 1);
          }}
          onResetScenario={() => setGeneration((value) => value + 1)}
          onReset={() => {
            setScenarioId(lesson.scenarios[0].id);
            setRepaired(Boolean(lesson.scenarios[0].fixedFirst));
            setGeneration((value) => value + 1);
          }}
        />
      </div>
    </div>
  );
}
