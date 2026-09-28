import { memo, type CSSProperties } from "react";

// Each bough has its own gesture; leaves follow its curve, not a repeated grid.
const branchDuration = 780;
const trunkDuration = 650;

const boughs = [
  [150, 258, 112, 220, 78, 201, 51, 153],
  [150, 247, 185, 221, 220, 207, 242, 157],
  [149, 226, 110, 196, 66, 164, 58, 113],
  [151, 215, 197, 187, 228, 151, 220, 101],
  [149, 196, 118, 170, 83, 122, 93, 77],
  [150, 184, 183, 153, 206, 111, 182, 61],
  [148, 162, 129, 131, 115, 88, 132, 49],
  [150, 146, 165, 116, 169, 77, 158, 41],
  [149, 240, 124, 233, 103, 217, 90, 192],
  [152, 226, 180, 212, 191, 183, 185, 154],
];

function pointOnBough(b: number[], t: number) {
  const u = 1 - t;
  return {
    x: u ** 3 * b[0] + 3 * u * u * t * b[2] + 3 * u * t * t * b[4] + t ** 3 * b[6],
    y: u ** 3 * b[1] + 3 * u * u * t * b[3] + 3 * u * t * t * b[5] + t ** 3 * b[7],
    dx: 3 * u * u * (b[2] - b[0]) + 6 * u * t * (b[4] - b[2]) + 3 * t * t * (b[6] - b[4]),
    dy: 3 * u * u * (b[3] - b[1]) + 6 * u * t * (b[5] - b[3]) + 3 * t * t * (b[7] - b[5]),
  };
}

export default function LoadingTree({ progress, foliage }: { progress: number; foliage: number }) {
  const growth = Math.max(0, Math.min(1, progress / 100));
  const growthTime = growth * 2690;
  const foliageTime = Math.max(0, Math.min(1, foliage)) * 1050;

  return (
    <svg style={{ "--growth-time": `${growthTime}ms`, "--foliage-time": `${foliageTime}ms` } as CSSProperties} data-growth={growth} data-foliage={foliage} className="loading-tree" viewBox="0 0 300 340" fill="none" aria-hidden="true">
      <TreeDrawing />
    </svg>
  );
}

// Geometry stays fixed; only the SVG timeline changes on animation frames.
const TreeDrawing = memo(function TreeDrawing() {
  return (
    <>
      <ellipse className="loading-tree-ground" cx="150" cy="310" rx="53" ry="2" />
      <g className="loading-tree-branches" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <g className="loading-tree-trunk">
          <path pathLength="1" d="M134 310 Q148 307 147 277 C143 241 155 215 149 179 Q145 158 148 143" />
          <path pathLength="1" d="M164 311 Q152 304 153 275 C150 246 158 218 152 191" />
        </g>
        <path className="loading-tree-root" pathLength="1" d="M146 301 Q136 311 124 310 M154 303 Q166 312 176 311 M150 304 L147 314" />
        {boughs.map((b, index) => {
          // Lower branches lead; buds wait until their own branch is fully drawn.
          const branchDelay = trunkDuration + (258 - b[1]) * 3;
          return (
          <g key={index} className="loading-tree-bough" style={{ "--branch-delay": `${branchDelay}ms`, "--branch-duration": `${branchDuration}ms` } as CSSProperties}>
            <path pathLength="1" d={`M${b[0]} ${b[1]} C${b[2]} ${b[3]} ${b[4]} ${b[5]} ${b[6]} ${b[7]}`} />
            {Array.from({ length: index > 7 ? 5 : 9 }, (_, leaf) => {
              const t = .43 + leaf * .063;
              const { x, y, dx, dy } = pointOnBough(b, t);
              const side = (leaf + index) % 2 === 0 ? -1 : 1;
              const angle = Math.atan2(dy, dx) * 180 / Math.PI + side * (34 + (leaf * 7 + index * 11) % 28);
              const length = 12 + (index * 13 + leaf * 7) % 11;
              const width = 2.6 + (index + leaf * 3) % 4 * .6;
              const stem = 4 + (index + leaf) % 4;
              const sparse = leaf % 3 === 0;
              const budDelay = sparse ? branchDelay + branchDuration + leaf * 38 : index * 22 + leaf * 30;
              return (
                <g className={sparse ? "loading-tree-sparse" : "loading-tree-foliage"} key={leaf} transform={`translate(${x} ${y}) rotate(${angle})`}
                  style={{ "--bud-delay": `${budDelay}ms`, "--leaf-delay": `${budDelay + 160}ms` } as CSSProperties}>
                  <path className="loading-tree-twig" pathLength="1" d={`M0 0 Q${stem} 1 ${stem + 3} 0`} />
                  <g transform={`translate(${stem} 0)`}><g className="loading-tree-unfurl">
                  <path className="loading-tree-leaf" style={{ fillOpacity: .07 + ((index + leaf) % 4) * .055 }} d={`M0 0 C${length * .4} ${-width} ${length * .75} ${-width} ${length} -1 C${length * .65} ${width} ${length * .3} ${width * 1.2} 0 0Z`} />
                  <path className="loading-tree-vein" d={`M0 0 Q${length * .5} .5 ${length - 3} -1`} />
                  </g></g>
                </g>
              );
            })}
          </g>
          );
        })}
      </g>
    </>
  );
});
