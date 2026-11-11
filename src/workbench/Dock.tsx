import { useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { PanelKey, Scenario } from "./types.ts";
import { CodeView } from "./CodeView.tsx";

type DockProps = {
  scenario: Scenario;
  scenarios: Scenario[];
  scenarioId: string;
  repaired: boolean;
  open: Record<PanelKey, boolean>;
  dockOpen: boolean;
  width: number | null;
  onWidth: (width: number | null) => void;
  onToggle: (panel: PanelKey) => void;
  onScenario: (id: string) => void;
  onRepair: (id: string, repaired: boolean) => void;
  onResetScenario: () => void;
  onReset: () => void;
  lessonId: string;
  onJump: (lessonId: string) => void;
  lessonLink: { label: string; href?: string; onClick: () => void };
};

const STAGE_MIN = 280;
const NAV_WIDTH = 232;
const PANELS = ["code", "explain", "whatif"] as const;

const PANEL_LABEL: Record<PanelKey, string> = {
  code: "Code",
  explain: "How this runs",
  whatif: "What if",
};

function dockMax(floor: number) {
  return Math.max(floor, window.innerWidth - NAV_WIDTH - STAGE_MIN);
}

function measureCollapsed(dock: HTMLElement) {
  const closed = dock.querySelector<HTMLElement>(".panel:not(.open)");
  if (closed) return closed.offsetHeight;
  const header = dock.querySelector<HTMLElement>(".panel-h");
  const panel = dock.querySelector<HTMLElement>(".panel");
  const border = panel ? Number.parseFloat(getComputedStyle(panel).borderTopWidth) || 0 : 0;
  return Math.round((header?.offsetHeight ?? 0) + border);
}

function stackPixels(dock: HTMLElement) {
  const bar = dock.querySelector<HTMLElement>(".dock-bar");
  return dock.clientHeight - (bar?.offsetHeight ?? 0);
}

function normalize(
  heights: Record<PanelKey, number>,
  open: Record<PanelKey, boolean>,
  stack: number,
  min: number,
  protect: readonly PanelKey[] = [],
) {
  const next = { ...heights };
  const keys = PANELS.filter((key) => open[key]);
  for (const key of keys) {
    next[key] = Math.max(min, Math.round(next[key]));
  }
  if (keys.length === 0) return next;
  const collapsed = PANELS.length - keys.length;
  const target = Math.max(keys.length * min, stack - collapsed * min);
  const order: PanelKey[] = ["code", "explain", "whatif"];
  let diff = target - keys.reduce((sum, key) => sum + next[key], 0);
  if (diff > 0) {
    const grow = order.find((key) => open[key]);
    if (grow) next[grow] += diff;
  } else if (diff < 0) {
    let need = -diff;
    const shrinkOrder = [
      ...order.filter((key) => open[key] && !protect.includes(key)),
      ...protect.filter((key) => open[key]),
    ];
    for (const key of shrinkOrder) {
      if (need === 0) break;
      const spare = next[key] - min;
      const take = Math.min(spare, need);
      next[key] -= take;
      need -= take;
    }
  }
  return next;
}

function moveHeight(
  start: Record<PanelKey, number>,
  above: PanelKey,
  below: PanelKey,
  delta: number,
  min: number,
) {
  const next = { ...start };
  if (delta > 0) {
    const give = Math.min(delta, Math.max(0, start[below] - min));
    next[above] = start[above] + give;
    next[below] = start[below] - give;
  } else if (delta < 0) {
    const give = Math.min(-delta, Math.max(0, start[above] - min));
    next[above] = start[above] - give;
    next[below] = start[below] + give;
  }
  return next;
}

function splitCursor(
  heights: Record<PanelKey, number> | null,
  above: PanelKey,
  below: PanelKey,
  min: number,
) {
  if (!heights || min <= 0) return "ns";
  const aboveMin = heights[above] <= min + 0.5;
  const belowMin = heights[below] <= min + 0.5;
  if (aboveMin && !belowMin) return "s";
  if (belowMin && !aboveMin) return "n";
  return "ns";
}

export function Dock({
  scenario,
  scenarios,
  scenarioId,
  repaired,
  open,
  dockOpen,
  width,
  onWidth,
  onToggle,
  onScenario,
  onRepair,
  onResetScenario,
  onReset,
  lessonId,
  onJump,
  lessonLink,
}: DockProps) {
  const [copied, setCopied] = useState(false);
  const [floor, setFloor] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dockRef = useRef<HTMLElement>(null);
  const floorRef = useRef(0);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
    floor: number;
  } | null>(null);
  const splitRef = useRef<{
    pointerId: number;
    startY: number;
    start: Record<PanelKey, number>;
    above: PanelKey;
    below: PanelKey;
    min: number;
  } | null>(null);
  const [heights, setHeights] = useState<Record<PanelKey, number> | null>(null);
  const [collapsed, setCollapsed] = useState(0);
  const [dockTick, setDockTick] = useState(0);
  const [splitDrag, setSplitDrag] = useState<PanelKey | null>(null);
  floorRef.current = floor;
  const collapsedRef = useRef(0);
  collapsedRef.current = collapsed;
  const openRef = useRef(open);
  const rememberedRef = useRef<Record<PanelKey, number>>({ code: 0, explain: 0, whatif: 0 });

  useLayoutEffect(() => {
    if (width != null) return;
    const measure = () => {
      const px = dockRef.current?.getBoundingClientRect().width ?? 0;
      if (px > 0) setFloor(px);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [width, dockOpen]);

  useLayoutEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const observer = new ResizeObserver(() => setDockTick((value) => value + 1));
    observer.observe(dock);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const min = measureCollapsed(dock);
    if (min > 0) setCollapsed(min);
    const stack = stackPixels(dock);
    const prev = openRef.current;
    const opened = PANELS.filter((key) => open[key] && !prev[key]);
    const closed = PANELS.filter((key) => !open[key] && prev[key]);
    openRef.current = open;

    setHeights((current) => {
      for (const key of closed) {
        if (current && current[key] > min) rememberedRef.current[key] = current[key];
      }
      const steady = !current && opened.length === 0 && closed.length === 0 && PANELS.every((key) => open[key]);
      if (steady) {
        for (const key of PANELS) {
          const panel = dock.querySelector<HTMLElement>(`[data-panel="${key}"]`);
          if (panel && panel.offsetHeight > min) rememberedRef.current[key] = panel.offsetHeight;
        }
      }
      if (!current && opened.length === 0) return current;

      const base = { ...(current ?? rememberedRef.current) };
      for (const key of opened) {
        const prior = rememberedRef.current[key];
        if (prior > min) base[key] = prior;
      }
      const next = normalize(base, open, stack, min, opened);
      for (const key of PANELS) {
        if (open[key] && next[key] > min) rememberedRef.current[key] = next[key];
      }
      if (current && PANELS.every((key) => next[key] === current[key])) return current;
      return next;
    });
  }, [open, dockTick]);

  useLayoutEffect(() => {
    if (width == null) return;
    const clamp = () => {
      const resting = floorRef.current;
      if (resting <= 0) return;
      const max = dockMax(resting);
      if (width > max) onWidth(Math.round(max) <= resting ? null : Math.round(max));
    };
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [width, onWidth]);

  function clearDragCursor() {
    document.body.classList.remove("is-dock-drag");
    delete document.body.dataset.dockCursor;
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    const measured = dockRef.current?.getBoundingClientRect().width ?? floorRef.current;
    const resting = floorRef.current || measured;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: measured,
      floor: resting,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add("is-dock-drag");
    document.body.dataset.dockCursor = "w";
    setDragging(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const next = drag.startWidth + (drag.startX - event.clientX);
    const max = dockMax(drag.floor);
    const clamped = Math.min(Math.max(next, drag.floor), max);
    const wide = clamped >= drag.floor + 1;
    document.body.dataset.dockCursor = wide ? "ew" : "w";
    onWidth(wide ? Math.round(clamped) : null);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.type === "lostpointercapture" && event.buttons !== 0) return;
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    clearDragCursor();
    setDragging(false);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const resting = floorRef.current || floor;
    if (resting <= 0) return;
    const current = width ?? resting;
    const max = dockMax(resting);
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const next = Math.min(max, current + 24);
      onWidth(next >= resting + 1 ? Math.round(next) : null);
    } else if (event.key === "ArrowRight" || event.key === "Home") {
      event.preventDefault();
      const next = event.key === "Home" ? resting : current - 24;
      onWidth(next >= resting + 1 ? Math.round(next) : null);
    }
  }

  function clearSplitCursor() {
    document.body.classList.remove("is-panel-drag");
    delete document.body.dataset.panelCursor;
  }

  function panelAbove(key: PanelKey) {
    const index = PANELS.indexOf(key);
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (open[PANELS[cursor]]) return PANELS[cursor];
    }
    return null;
  }

  function remember(next: Record<PanelKey, number>, min: number) {
    for (const key of PANELS) {
      if (open[key] && next[key] > min) rememberedRef.current[key] = next[key];
    }
  }

  function snapshot(dock: HTMLElement) {
    const next = { ...rememberedRef.current };
    for (const key of PANELS) {
      if (!open[key]) continue;
      const panel = dock.querySelector<HTMLElement>(`[data-panel="${key}"]`);
      if (panel && panel.offsetHeight > 0) next[key] = panel.offsetHeight;
    }
    return next;
  }

  function onSplitDown(below: PanelKey, event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const above = panelAbove(below);
    const dock = dockRef.current;
    if (!above || !dock) return;
    event.preventDefault();
    const min = measureCollapsed(dock);
    const stack = stackPixels(dock);
    const start = normalize(heights ?? snapshot(dock), open, stack, min);
    splitRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      start,
      above,
      below,
      min,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add("is-panel-drag");
    document.body.dataset.panelCursor = splitCursor(start, above, below, min);
    setSplitDrag(below);
    remember(start, min);
    setHeights(start);
  }

  function onSplitMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = splitRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const delta = event.clientY - drag.startY;
    const next = moveHeight(drag.start, drag.above, drag.below, delta, drag.min);
    document.body.dataset.panelCursor = splitCursor(next, drag.above, drag.below, drag.min);
    remember(next, drag.min);
    setHeights(next);
  }

  function endSplit(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.type === "lostpointercapture" && event.buttons !== 0) return;
    const drag = splitRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    splitRef.current = null;
    clearSplitCursor();
    setSplitDrag(null);
  }

  function onSplitKey(below: PanelKey, event: ReactKeyboardEvent<HTMLDivElement>) {
    const above = panelAbove(below);
    const dock = dockRef.current;
    if (!above || !dock) return;
    const min = collapsedRef.current || measureCollapsed(dock);
    const stack = stackPixels(dock);
    const start = normalize(heights ?? snapshot(dock), open, stack, min);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 24 : -24;
      const next = moveHeight(start, above, below, delta, min);
      remember(next, min);
      setHeights(next);
    } else if (event.key === "Home") {
      event.preventDefault();
      setHeights(null);
    }
  }

  function panelStyle(key: PanelKey) {
    if (!heights || !open[key]) return undefined;
    return { flex: `0 0 ${heights[key]}px`, minHeight: collapsed || undefined };
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(scenario.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  function renderSplit(below: PanelKey) {
    const above = panelAbove(below);
    if (!above || !open[below]) return null;
    const min = collapsed;
    const cursor = splitCursor(heights, above, below, min);
    const current = heights?.[above] ?? 0;
    const stack = dockRef.current ? stackPixels(dockRef.current) : 0;
    const openCount = PANELS.filter((key) => open[key]).length;
    const max = Math.max(min, stack - (openCount - 1) * min);
    return (
      <div
        className="panel-resize"
        role="separator"
        aria-orientation="horizontal"
        aria-label={`Resize ${PANEL_LABEL[above]}`}
        aria-valuemin={min}
        aria-valuenow={Math.round(current || min)}
        aria-valuemax={Math.round(max)}
        tabIndex={0}
        data-cursor={cursor}
        data-dragging={splitDrag === below}
        data-testid={`panel-resize-${below}`}
        onPointerDown={(event) => onSplitDown(below, event)}
        onPointerMove={onSplitMove}
        onPointerUp={endSplit}
        onPointerCancel={endSplit}
        onLostPointerCapture={endSplit}
        onKeyDown={(event) => onSplitKey(below, event)}
      />
    );
  }

  const wide = width != null;
  const valueNow = Math.round(width ?? floor);

  return (
    <aside className="dock" aria-label="Panels" ref={dockRef}>
      <div
        className="dock-resize"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        aria-valuemin={Math.round(floor)}
        aria-valuenow={valueNow}
        aria-valuemax={Math.round(floor > 0 ? dockMax(floor) : 0)}
        tabIndex={0}
        data-wide={wide}
        data-dragging={dragging}
        data-testid="dock-resize"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={onKeyDown}
      />
      <div className="dock-bar">
        <p className="nav-label">Panels</p>
        {lessonLink.href ? (
          <a className="text-btn" href={lessonLink.href} onClick={(event) => {
            event.preventDefault();
            lessonLink.onClick();
          }}>
            {lessonLink.label}
          </a>
        ) : (
          <span className="text-btn is-disabled">{lessonLink.label}</span>
        )}
      </div>
      <section className={open.code ? "panel open" : "panel"} data-panel="code" style={panelStyle("code")}>
        <div className="panel-h">
          <button
            type="button"
            className="panel-toggle"
            aria-expanded={open.code}
            aria-controls="panel-code"
            onClick={() => onToggle("code")}
          >
            <span className="chevron" data-open={open.code} />
            <span>Code</span>
          </button>
          {open.code ? (
            <button type="button" className="text-btn" onClick={() => void copyCode()}>
              {copied ? "Copied" : "Copy"}
            </button>
          ) : null}
        </div>
        <div className="panel-body" id="panel-code" hidden={!open.code}>
          <p className="panel-note">This is the code running on the stage. Marked lines are the part this scenario changes.</p>
          <CodeView
            key={`${scenario.id}:${repaired ? "fixed" : "broken"}`}
            code={scenario.code}
            focus={scenario.focus}
            lessonId={lessonId}
            onJump={onJump}
          />
        </div>
      </section>
      {renderSplit("explain")}
      <section className={open.explain ? "panel open" : "panel"} data-panel="explain" style={panelStyle("explain")}>
        <div className="panel-h">
          <button
            type="button"
            className="panel-toggle"
            aria-expanded={open.explain}
            aria-controls="panel-explain"
            onClick={() => onToggle("explain")}
          >
            <span className="chevron" data-open={open.explain} />
            <span>How this runs</span>
          </button>
        </div>
        <div className="panel-body prose" id="panel-explain" hidden={!open.explain}>
          {scenario.explanation}
        </div>
      </section>
      {renderSplit("whatif")}
      <section className={open.whatif ? "panel open" : "panel"} data-panel="whatif" style={panelStyle("whatif")}>
        <div className="panel-h">
          <button
            type="button"
            className="panel-toggle"
            aria-expanded={open.whatif}
            aria-controls="panel-whatif"
            onClick={() => onToggle("whatif")}
          >
            <span className="chevron" data-open={open.whatif} />
            <span>What if</span>
          </button>
        </div>
        <div className="panel-body" id="panel-whatif" hidden={!open.whatif}>
          <fieldset className="scenarios">
            <legend className="sr-only">Scenarios</legend>
            {scenarios.map((item) => {
              const active = item.id === scenarioId;
              const fixed = active && repaired;
              return (
                <div
                  key={item.id}
                  className={active ? "scenario active" : "scenario"}
                  data-scenario-row={item.id}
                >
                  <label>
                    <input
                      type="radio"
                      name="scenario"
                      value={item.id}
                      checked={active}
                      onChange={() => onScenario(item.id)}
                    />
                    <span>
                      <strong>{item.label}</strong>
                      <span className="tease">{item.tease}</span>
                    </span>
                  </label>
                  {item.repair ? (
                    <div className="repair" role="group" aria-label={`${item.label} version`}>
                      <button type="button" aria-pressed={!fixed} onClick={() => onRepair(item.id, false)}>
                        Broken
                      </button>
                      <button type="button" aria-pressed={fixed} onClick={() => onRepair(item.id, true)}>
                        Fixed
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </fieldset>
          <div className="resets">
            <button type="button" className="reset" onClick={onResetScenario}>
              Reset scenario
            </button>
            <button type="button" className="reset" onClick={onReset}>
              Reset stage
            </button>
          </div>
          <p className="hint">
            Reset scenario mounts the selected scenario again. Reset stage returns to the first scenario and mounts the widget again.
          </p>
        </div>
      </section>
    </aside>
  );
}
