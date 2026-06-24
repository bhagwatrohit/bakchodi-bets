import { cn } from "@/lib/utils";

/**
 * Original trophy cup (NOT the FIFA logo — trademark-safe).
 * Drawn on a blocky 24x28 grid in gold tones.
 */
export function Trophy({ className }: { className?: string }) {
  const gold = "#ffd23f";
  const goldDim = "#e0a800";
  // blocks on a 24x28 grid
  const px = (x: number, y: number, w: number, h: number, fill = gold) => (
    <rect key={`${x}-${y}-${w}-${h}`} x={x} y={y} width={w} height={h} fill={fill} />
  );
  return (
    <svg
      viewBox="0 0 24 28"
      className={cn(className)}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {/* handles */}
      {px(2, 5, 3, 2)}
      {px(2, 7, 2, 4)}
      {px(2, 11, 3, 2)}
      {px(19, 5, 3, 2)}
      {px(20, 7, 2, 4)}
      {px(19, 11, 3, 2)}
      {/* bowl */}
      {px(5, 3, 14, 3)}
      {px(6, 6, 12, 3)}
      {px(7, 9, 10, 3)}
      {px(9, 12, 6, 2)}
      {/* shine */}
      {px(7, 4, 2, 2, "#fff7d6")}
      {/* stem */}
      {px(10, 14, 4, 3)}
      {/* base */}
      {px(7, 17, 10, 2)}
      {px(5, 19, 14, 3, goldDim)}
      {/* star on cup */}
      {px(11, 6, 2, 2, "#ff2bd6")}
    </svg>
  );
}
