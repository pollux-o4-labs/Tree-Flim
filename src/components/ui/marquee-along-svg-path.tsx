import React, { useEffect, useMemo, useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useSpring,
} from "motion/react";
import { cn } from "../../lib/utils";

const wrap = (min: number, max: number, value: number) => {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};

export interface MarqueeAlongSvgPathProps {
  children: React.ReactNode;
  className?: string;
  path: string;
  pathId?: string;
  viewBox?: string;
  width?: string | number;
  height?: string | number;
  showPath?: boolean;
  baseVelocity?: number;
  direction?: "normal" | "reverse";
  repeat?: number;
  slowdownOnHover?: boolean;
  slowDownFactor?: number;
  draggable?: boolean;
  dragSensitivity?: number;
  grabCursor?: boolean;
  responsive?: boolean;
}

function PathItem({
  child,
  index,
  count,
  offset,
  path,
}: {
  child: React.ReactNode;
  index: number;
  count: number;
  offset: ReturnType<typeof useMotionValue<number>>;
  path: string;
}) {
  const distance = useMotionValue(0);
  const itemOffset = useMotionValue("0%");
  const springOffset = useSpring(itemOffset, { damping: 50, stiffness: 400 });

  useEffect(() => {
    return offset.on("change", (value) => {
      const position = (index * 100) / count;
      const next = wrap(0, 100, value + position);
      itemOffset.set(`${next}%`);
      distance.set(next);
    });
  }, [count, distance, index, itemOffset, offset]);

  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{
        offsetPath: `path('${path}')`,
        offsetDistance: springOffset,
        zIndex: 1 + Math.floor(distance.get() / 10),
        willChange: "offset-distance",
      }}
    >
      {child}
    </motion.div>
  );
}

export default function MarqueeAlongSvgPath({
  children,
  className,
  path,
  pathId = "marquee-path",
  viewBox = "0 0 1000 330",
  width = "100%",
  height = "100%",
  showPath = false,
  baseVelocity = 5,
  direction = "normal",
  repeat = 3,
  slowdownOnHover = false,
  slowDownFactor = 0.3,
  draggable = false,
  dragSensitivity = 0.2,
  grabCursor = false,
}: MarqueeAlongSvgPathProps) {
  const container = useRef<HTMLDivElement>(null);
  const offset = useMotionValue(0);
  const hover = useMotionValue(1);
  const smoothHover = useSpring(hover, { damping: 50, stiffness: 400 });
  const dragging = useRef(false);
  const dragVelocity = useRef(0);
  const lastX = useRef(0);
  const items = useMemo(() => {
    const childrenArray = React.Children.toArray(children);
    return Array.from({ length: repeat }, (_, repeatIndex) =>
      childrenArray.map((child, childIndex) => ({
        child,
        key: `${repeatIndex}-${childIndex}`,
      })),
    ).flat();
  }, [children, repeat]);

  useAnimationFrame((_, delta) => {
    if (dragging.current && draggable) {
      offset.set(offset.get() + dragVelocity.current);
      dragVelocity.current *= 0.9;
      return;
    }
    hover.set(slowdownOnHover && hover.get() < 1 ? slowDownFactor : 1);
    const sign = direction === "normal" ? 1 : -1;
    offset.set(
      offset.get() +
        sign * baseVelocity * (delta / 1000) * smoothHover.get() +
        dragVelocity.current,
    );
    dragVelocity.current *= 0.96;
  });

  return (
    <div
      ref={container}
      className={cn(
        "relative overflow-hidden",
        grabCursor && draggable && "cursor-grab",
        className,
      )}
      onPointerDown={(event) => {
        if (!draggable) return;
        dragging.current = true;
        lastX.current = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (draggable && dragging.current) {
          dragVelocity.current =
            (event.clientX - lastX.current) * dragSensitivity;
          lastX.current = event.clientX;
        }
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        if (draggable)
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onMouseEnter={() => slowdownOnHover && hover.set(slowDownFactor)}
      onMouseLeave={() => hover.set(1)}
    >
      <svg
        width={width}
        height={height}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
      >
        <path
          id={pathId}
          d={path}
          stroke={showPath ? "currentColor" : "none"}
          fill="none"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0">
        {items.map(({ child, key }, index) => (
          <PathItem
            key={key}
            child={child}
            index={index}
            count={items.length}
            offset={offset}
            path={path}
          />
        ))}
      </div>
    </div>
  );
}
