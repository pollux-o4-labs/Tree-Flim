import { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { Pointer } from 'lucide-react';

const IDLE_DELAY_MS = 1200;

/** One demonstration per visible entry. Never consumes a hidden dialog's idle time. */
export default function GestureHint({ kind, dismissed }: { kind:'concept'|'package'; dismissed:boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const opacity = useMotionValue(0);
  const x = useMotionValue(0);
  const scale = useMotionValue(1);
  useEffect(() => {
    if (dismissed || reduced) return;
    const dialog = root.current?.closest('dialog');
    let timer: ReturnType<typeof setTimeout> | undefined;
    let animations: Array<{stop:()=>void}> = [];
    const stop = () => {
      clearTimeout(timer);
      animations.forEach(animation => animation.stop());
      opacity.set(0);
    };
    const schedule = () => {
      stop();
      if (dialog && !dialog.open) return;
      timer = setTimeout(() => {
        animations = [
          animate(opacity,[0,1,1,.4,1,0],{duration:2.8,ease:'easeInOut'}),
          animate(x,kind === 'concept' ? [28,28,-28,-28,28] : [0,0],{duration:2.4,ease:'easeInOut'}),
          animate(scale,[1,.7,1.4,.7,1.4],{duration:2.4,ease:'easeInOut'}),
        ];
      },IDLE_DELAY_MS);
    };
    const observer = new MutationObserver(schedule);
    if (dialog) observer.observe(dialog,{attributes:true,attributeFilter:['open']});
    schedule();
    return () => { observer.disconnect(); stop(); };
  },[dismissed,reduced,kind,opacity,x,scale]);
  return <motion.div ref={root} className="scene-gesture-hint" data-gesture={kind === 'concept' ? 'drag':'tap'} style={{opacity}} aria-hidden="true">
    {kind === 'concept' && <span className="gesture-trail" />}
    <motion.span className="gesture-hand" style={{x}}><motion.span className="gesture-ring" style={{scale}} /><Pointer size={34} strokeWidth={1.7} /></motion.span>
  </motion.div>;
}
