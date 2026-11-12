import { createContext, memo, useContext, useMemo, useRef, useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { CountStepper, RenderMark } from "../workbench/bits.tsx";

type Desk = { artist: string };

const DeskContext = createContext<Desk>({ artist: "no provider" });

const Middle = memo(function Middle() {
  return (
    <div className="nest">
      <p className="nest-label">Middle</p>
      <RenderMark name="middle" />
      <p className="hint">This layer does not see the artist.</p>
      <Deep />
    </div>
  );
});

function Deep() {
  const desk = useContext(DeskContext);
  const seen = useRef<string | null>(null);
  const reread = seen.current === desk.artist;
  seen.current = desk.artist;
  return (
    <div className="nest">
      <p className="nest-label">Deep</p>
      <RenderMark name="deep" />
      <p className="readout">
        Artist <strong data-testid="artist">{desk.artist}</strong>
      </p>
      {reread ? <p className="toll">Read again. The artist did not change.</p> : null}
    </div>
  );
}

function ProviderFrame({
  artist,
  booked,
  onArtist,
  onBooked,
  value,
}: {
  artist: string;
  booked: number;
  onArtist: () => void;
  onBooked: (next: number) => void;
  value: Desk;
}) {
  return (
    <div className="widget stack">
      <div className="row">
        <RenderMark name="provider" />
        <button type="button" onClick={onArtist}>
          Swap artist ({artist})
        </button>
        <CountStepper label="Appointments booked" value={booked} onChange={onBooked} />
      </div>
      <DeskContext.Provider value={value}>
        <Middle />
      </DeskContext.Provider>
    </div>
  );
}

function StableContext({ repaired }: { repaired: boolean }) {
  const [artist, setArtist] = useState("Ada");
  const [booked, setBooked] = useState(1);
  const stable = useMemo(() => ({ artist }), [artist]);
  return (
    <ProviderFrame
      artist={artist}
      booked={booked}
      value={repaired ? stable : { artist }}
      onArtist={() => setArtist((current) => (current === "Ada" ? "Grace" : "Ada"))}
      onBooked={setBooked}
    />
  );
}

function NoProvider() {
  const [artist, setArtist] = useState("Ada");
  const [booked, setBooked] = useState(1);
  return (
    <div className="widget stack">
      <div className="row">
        <RenderMark name="parent" />
        <button type="button" onClick={() => setArtist((current) => (current === "Ada" ? "Grace" : "Ada"))}>
          Swap artist ({artist})
        </button>
        <CountStepper label="Appointments booked" value={booked} onChange={setBooked} />
      </div>
      <p className="toll">Deep reads the default. Swap artist does not change it.</p>
      <Middle />
    </div>
  );
}

const DrillMiddle = memo(function DrillMiddle({ artist }: { artist: string }) {
  const passes = useRef(0);
  passes.current += 1;
  return (
    <div className="nest">
      <p className="nest-label">Middle</p>
      <RenderMark name="middle" />
      {passes.current > 1 ? (
        <p className="toll">Passing {artist} through this layer.</p>
      ) : null}
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
  const [booked, setBooked] = useState(1);
  return (
    <div className="widget stack">
      <div className="row">
        <RenderMark name="provider" />
        <button type="button" onClick={() => setArtist((current) => (current === "Ada" ? "Grace" : "Ada"))}>
          Swap artist ({artist})
        </button>
        <CountStepper label="Appointments booked" value={booked} onChange={setBooked} />
      </div>
      <DrillMiddle artist={artist} />
    </div>
  );
}

const stableCode = sample`
  const DeskContext = createContext({ artist: "no provider" });

  const Middle = memo(function Middle() {
    return (
      <>
        <p>Middle</p>
        <p>This layer does not see the artist.</p>
        <Deep />
      </>
    );
  });

  function Deep() {
    const desk = useContext(DeskContext); /*focus*/
    return (
      <>
        <p>Deep</p>
        <p>Artist {desk.artist}</p>
      </>
    );
  }

  function StableContext() {
    const [artist, setArtist] = useState("Ada");
    const [booked, setBooked] = useState(1);
    const value = useMemo(() => ({ artist }), [artist]); /*focus*/
    return (
      <DeskContext.Provider value={value}>
        <button onClick={() => setArtist((current) => (current === "Ada" ? "Grace" : "Ada"))}>
          Swap artist ({artist})
        </button>
        <p>Appointments booked {booked}</p>
        <button onClick={() => setBooked((value) => Math.max(1, value - 1))}>-</button>
        <button onClick={() => setBooked((value) => value + 1)}>+</button>
        <Middle /> // no props. Component defined on line 3
      </DeskContext.Provider>
    );
  }
`;

const unstableCode = sample`
  const DeskContext = createContext({ artist: "no provider" });

  const Middle = memo(function Middle() {
    return (
      <>
        <p>Middle</p>
        <p>This layer does not see the artist.</p>
        <Deep />
      </>
    );
  });

  function Deep() {
    const desk = useContext(DeskContext);
    return (
      <>
        <p>Deep</p>
        <p>Artist {desk.artist}</p>
        <p>Read again. The artist did not change.</p>
      </>
    );
  }

  function StableContext() {
    const [artist, setArtist] = useState("Ada");
    const [booked, setBooked] = useState(1);
    return (
      <DeskContext.Provider value={{ artist }}> /*focus*/
        <button onClick={() => setArtist((current) => (current === "Ada" ? "Grace" : "Ada"))}>
          Swap artist ({artist})
        </button>
        <p>Appointments booked {booked}</p>
        <button onClick={() => setBooked((value) => Math.max(1, value - 1))}>-</button>
        <button onClick={() => setBooked((value) => value + 1)}>+</button>
        <Middle /> // no props. Component defined on line 3
      </DeskContext.Provider>
    );
  }
`;

const noneCode = sample`
  const DeskContext = createContext({ artist: "no provider" }); /*focus*/

  const Middle = memo(function Middle() {
    return (
      <>
        <p>Middle</p>
        <p>This layer does not see the artist.</p>
        <Deep />
      </>
    );
  });

  function Deep() {
    const desk = useContext(DeskContext);
    return (
      <>
        <p>Deep</p>
        <p>Artist {desk.artist}</p>
      </>
    );
  }

  function NoProvider() {
    const [artist, setArtist] = useState("Ada");
    const [booked, setBooked] = useState(1);
    return (
      <>
        <button onClick={() => setArtist((current) => (current === "Ada" ? "Grace" : "Ada"))}>
          Swap artist ({artist})
        </button>
        <p>Appointments booked {booked}</p>
        <button onClick={() => setBooked((value) => Math.max(1, value - 1))}>-</button>
        <button onClick={() => setBooked((value) => value + 1)}>+</button>
        <p>Deep reads the default. Swap artist does not change it.</p>
        <Middle /> // no props. Component defined on line 3
      </>
    );
  }
`;

const drillCode = sample`
  const Middle = memo(function Middle({ artist }) {
    return <Deep artist={artist} />; //Deep defined off-screen /*focus*/
  });

  function Drill() {
    const [artist, setArtist] = useState("Ada");
    const [booked, setBooked] = useState(1);
    return (
      <>
        <button onClick={() => setArtist((current) => (current === "Ada" ? "Grace" : "Ada"))}>
          Swap artist ({artist})
        </button>
        <p>Appointments booked {booked}</p>
        <button onClick={() => setBooked((value) => Math.max(1, value - 1))}>-</button>
        <button onClick={() => setBooked((value) => value + 1)}>+</button>
        <p>Middle</p>
        <p>Deep</p>
        <p>Artist {artist}</p>
        <p>Passing {artist} through this layer.</p>
        <Middle artist={artist} /> // artist is a prop, so this layer has to receive it. /*focus*/
      </>
    );
  }
`;

export function ContextDemo({ scenarioId, repaired }: DemoProps) {
  if (scenarioId === "none") return <NoProvider />;
  if (scenarioId === "drill") return <Drill />;
  return <StableContext repaired={repaired} />;
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
      tease: "Deep updates when the artist changes. A new value object makes Deep read again.",
      fixedFirst: true,
      tryThis: "Change appointments booked. Deep says it read the artist again.",
      code: unstableCode.text,
      focus: unstableCode.focus,
      explanation: (
        <>
          <p>
            Deep still calls <code>useContext</code>. Middle is the same component,
            with no props. The only change is the provider value.{" "}
            <code>{"value={{ artist }}"}</code> creates a new object on every render.
            Change appointments booked. The artist string is the same, and the object
            is not, so Deep renders again and prints that it read the artist again.
            Middle still skips, because it does not read context and its props did not
            change.
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
        tryThis: "Swap the artist, then change appointments booked.",
        explanation: (
          <>
            <p>
              The provider value is <code>{"{ artist }"}</code> stored with{" "}
              <code>useMemo</code>, so the object changes only when <code>artist</code>{" "}
              changes. Deep calls <code>useContext</code>. Middle does not, and it is
              wrapped in <code>memo</code> with no changing props.{" "}
              <code>{"<Middle />"}</code> is written on one line because the parent
              passes nothing into it. The function above that tag is the body: the
              Middle label, the line that this layer does not see the artist, and Deep.
            </p>
            <p>
              Swap the artist. The provider renders, Middle's mark stays, and Deep's
              mark climbs. A context update still reaches the consumer when a parent in
              between bails out.
            </p>
            <p>
              Change appointments booked. <code>artist</code> is unchanged, the memoized
              value is the same object, and Deep skips too. The red line stays off.
              The broken version passed <code>{"{{ artist }}"}</code>, a new object on
              every provider render.
            </p>
          </>
        ),
      },
    },
    {
      id: "none",
      label: "No provider",
      tease: "The same buttons are here. No provider sits above Deep, so the name stays the default.",
      tryThis: "Swap the artist. The button changes. Deep's name stays on the default.",
      code: noneCode.text,
      focus: noneCode.focus,
      explanation: (
        <>
          <p>
            This is the same tree as the first scenario, without{" "}
            <code>{"<DeskContext.Provider>"}</code>. The buttons still update parent
            state. Deep still calls <code>useContext</code>, and that read returns the
            default passed to <code>createContext</code>, <code>{"{ artist: \"no provider\" }"}</code>.
            Swap the artist. The button name changes and the parent render mark climbs.
            Deep keeps painting "no provider", and its mark stays, because no provider
            is above it to pass the new name.
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
            and Middle's mark climbs, because the prop changed. The layer prints that
            it is passing the artist through. Change appointments booked with the same artist and
            Middle skips, so that line does not appear. The prop is stable, so{" "}
            <code>memo</code> holds.
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
