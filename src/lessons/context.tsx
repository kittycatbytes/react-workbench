import { createContext, memo, useContext, useMemo, useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { RenderMark } from "../workbench/bits.tsx";

type Desk = { artist: string };

const DeskContext = createContext<Desk>({ artist: "no provider" });

const Middle = memo(function Middle() {
  return (
    <div className="nest">
      <p className="nest-label">Middle</p>
      <RenderMark name="middle" />
      <Deep />
    </div>
  );
});

function Deep() {
  const desk = useContext(DeskContext);
  return (
    <div className="nest">
      <p className="nest-label">Deep</p>
      <RenderMark name="deep" />
      <p className="readout">
        Artist <strong data-testid="artist">{desk.artist}</strong>
      </p>
    </div>
  );
}

function ProviderFrame({
  artist,
  tick,
  onArtist,
  onTick,
  value,
}: {
  artist: string;
  tick: number;
  onArtist: () => void;
  onTick: () => void;
  value: Desk;
}) {
  return (
    <div className="widget stack">
      <div className="row">
        <RenderMark name="provider" />
        <span className="hint">Parent ticks {tick}</span>
      </div>
      <div className="row">
        <button type="button" onClick={onArtist}>
          Swap artist ({artist})
        </button>
        <button type="button" className="ghost" onClick={onTick}>
          Tick parent
        </button>
      </div>
      <DeskContext.Provider value={value}>
        <Middle />
      </DeskContext.Provider>
    </div>
  );
}

function StableContext() {
  const [artist, setArtist] = useState("Ada");
  const [tick, setTick] = useState(0);
  const value = useMemo(() => ({ artist }), [artist]);
  return (
    <ProviderFrame
      artist={artist}
      tick={tick}
      value={value}
      onArtist={() => setArtist((current) => (current === "Ada" ? "Grace" : "Ada"))}
      onTick={() => setTick((current) => current + 1)}
    />
  );
}

function UnstableContext({ repaired }: { repaired: boolean }) {
  const [artist, setArtist] = useState("Ada");
  const [tick, setTick] = useState(0);
  const stable = useMemo(() => ({ artist }), [artist]);
  return (
    <ProviderFrame
      artist={artist}
      tick={tick}
      value={repaired ? stable : { artist }}
      onArtist={() => setArtist((current) => (current === "Ada" ? "Grace" : "Ada"))}
      onTick={() => setTick((current) => current + 1)}
    />
  );
}

function NoProvider() {
  return (
    <div className="widget stack">
      <RenderMark name="provider" />
      <p className="hint">Nothing above Deep provides a desk.</p>
      <Middle />
    </div>
  );
}

const DrillMiddle = memo(function DrillMiddle({ artist }: { artist: string }) {
  return (
    <div className="nest">
      <p className="nest-label">Middle</p>
      <RenderMark name="middle" />
      <DrillDeep artist={artist} />
    </div>
  );
});

function DrillDeep({ artist }: { artist: string }) {
  return (
    <div className="nest">
      <p className="nest-label">Deep</p>
      <RenderMark name="deep" />
      <p className="readout">
        Artist <strong data-testid="artist">{artist}</strong>
      </p>
    </div>
  );
}

function Drill() {
  const [artist, setArtist] = useState("Ada");
  const [tick, setTick] = useState(0);
  return (
    <div className="widget stack">
      <div className="row">
        <RenderMark name="provider" />
        <span className="hint">Parent ticks {tick}</span>
      </div>
      <div className="row">
        <button type="button" onClick={() => setArtist((current) => (current === "Ada" ? "Grace" : "Ada"))}>
          Swap artist ({artist})
        </button>
        <button type="button" className="ghost" onClick={() => setTick((current) => current + 1)}>
          Tick parent
        </button>
      </div>
      <DrillMiddle artist={artist} />
    </div>
  );
}

const stableCode = sample`
  const DeskContext = createContext({ artist: "no provider" });

  const Middle = memo(function Middle() {
    return <Deep />;
  });

  function Deep() {
    const desk = useContext(DeskContext); /*focus*/
    return <p>{desk.artist}</p>;
  }

  function StableContext() {
    const [artist, setArtist] = useState("Ada");
    const value = useMemo(() => ({ artist }), [artist]); /*focus*/
    return (
      <DeskContext.Provider value={value}>
        <Middle />
      </DeskContext.Provider>
    );
  }
`;

const unstableCode = sample`
  function UnstableContext() {
    const [artist, setArtist] = useState("Ada");
    const [tick, setTick] = useState(0);
    return (
      <DeskContext.Provider value={{ artist }}> /*focus*/
        <Middle />
        <button onClick={() => setTick((value) => value + 1)}>{tick}</button>
      </DeskContext.Provider>
    );
  }
`;

const noneCode = sample`
  const DeskContext = createContext({ artist: "no provider" }); /*focus*/

  function NoProvider() {
    return (
      <Middle />
    );
  }
`;

const drillCode = sample`
  const Middle = memo(function Middle({ artist }) {
    return <Deep artist={artist} />; /*focus*/
  });

  function Drill() {
    const [artist, setArtist] = useState("Ada");
    return <Middle artist={artist} />; /*focus*/
  }
`;

export function ContextDemo({ scenarioId, repaired }: DemoProps) {
  if (scenarioId === "unstable") return <UnstableContext repaired={repaired} />;
  if (scenarioId === "none") return <NoProvider />;
  if (scenarioId === "drill") return <Drill />;
  return <StableContext />;
}

export const contextLesson: Lesson = {
  id: "context",
  kicker: "useContext",
  title: "State without prop drilling",
  blurb: "Context lets a deep child read state the middle components never see.",
  Demo: ContextDemo,
  scenarios: [
    {
      id: "stable",
      label: "Stable provider value",
      tease: "Deep updates when the artist changes. Middle can skip that render.",
      tryThis: "Swap the artist, then tick the parent.",
      code: stableCode.text,
      focus: stableCode.focus,
      explanation: (
        <>
          <p>
            The provider value is <code>{"{ artist }"}</code> stored with{" "}
            <code>useMemo</code>, so the object changes only when <code>artist</code>{" "}
            changes. Deep calls <code>useContext</code>. Middle does not, and it is
            wrapped in <code>memo</code> with no changing props.
          </p>
          <p>
            Swap the artist. The provider renders, Middle's mark stays, and Deep's
            mark climbs. A context update still reaches the consumer when a parent in
            between bails out.
          </p>
          <p>
            Tick the parent. <code>artist</code> is unchanged, the memoized value is
            the same object, and Deep skips too.
          </p>
        </>
      ),
    },
    {
      id: "unstable",
      label: "New object every render",
      tease: "A fresh value object looks like a context change.",
      tryThis: "Tick the parent without swapping the artist.",
      code: unstableCode.text,
      focus: unstableCode.focus,
      explanation: (
        <>
          <p>
            <code>{"value={{ artist }}"}</code> creates a new object on every render of
            the provider. Tick the parent. The artist string is the same, and the
            object is not, so Deep renders again. Middle still skips, because it does
            not read context and its props did not change.
          </p>
          <p>
            An object literal in <code>value</code> makes every provider render look
            like a context change to every consumer.
          </p>
        </>
      ),
      repair: {
        code: stableCode.text,
        focus: stableCode.focus,
        tryThis: "Tick the parent without swapping the artist.",
        explanation: (
          <>
            <p>
              <code>useMemo</code> keeps the same value object while{" "}
              <code>artist</code> stays the same. Tick the parent. Deep does not
              render, because context did not change. Swap the artist and Deep does
              render, because the memoized object is new.
            </p>
            <p>
              The broken version passed <code>{"{{ artist }}"}</code>, a new object
              on every provider render. Memoizing that object is the fix.
            </p>
          </>
        ),
      },
    },
    {
      id: "none",
      label: "No provider",
      tease: "Deep reads the default value from createContext.",
      tryThis: "Read the name Deep paints with no provider above it.",
      code: noneCode.text,
      focus: noneCode.focus,
      explanation: (
        <>
          <p>
            <code>createContext</code> took <code>{"{ artist: \"no provider\" }"}</code>.
            Deep reads that default when no provider sits above it. The default is a
            real value, easy to ship by accident, and it will not update when some
            other part of the tree renders a provider this component is not under.
          </p>
        </>
      ),
    },
    {
      id: "drill",
      label: "Pass a prop instead",
      tease: "Middle has to render when the artist prop changes.",
      tryThis: "Swap the artist and watch Middle's render mark.",
      code: drillCode.text,
      focus: drillCode.focus,
      explanation: (
        <>
          <p>
            Middle receives <code>artist</code> and passes it to Deep. Swap the artist
            and Middle's mark climbs, because the prop changed. Tick the parent with
            the same artist and Middle skips. The prop is stable, so <code>memo</code>{" "}
            holds.
          </p>
          <p>
            Prop drilling is how a value moves when the middle components are supposed
            to know about it. Context is how you let them stay out of it. The stable
            scenario lets Middle skip the artist change. This one cannot.
          </p>
        </>
      ),
    },
  ],
};
