const bars = [
  { label: "Mon", height: 46 },
  { label: "Tue", height: 78 },
  { label: "Wed", height: 58 },
  { label: "Thu", height: 96 },
  { label: "Fri", height: 70 },
];

export default function ChartFigure() {
  return (
    <figure className="chart">
      <div className="bars" aria-hidden="true">
        {bars.map((bar) => (
          <span key={bar.label} style={{ height: bar.height }}>
            {bar.label}
          </span>
        ))}
      </div>
      <figcaption>A small chart, standing in for a heavy module.</figcaption>
    </figure>
  );
}
