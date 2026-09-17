import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Scene } from '../data/project';

/** Keep the old scene mounted until it is covered, then reveal only a ready scene. */
export function useSceneTransition(requestedScene: Scene) {
  const root = useRef<HTMLElement>(null);
  const [scene, setScene] = useState(requestedScene);
  const [transitioning, setTransitioning] = useState(false);
  const displayed = useRef(scene);
  const requested = useRef(requestedScene);
  const ready = useRef<Scene | null>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  requested.current = requestedScene;

  const reveal = useCallback((loadedScene: Scene) => {
    ready.current = loadedScene;
    if (loadedScene !== requested.current || loadedScene !== displayed.current || !root.current) return;
    tween.current?.kill();
    tween.current = gsap.to(root.current, {
      '--scene-opacity': 1,
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : .9,
      ease: 'sine.inOut',
      onComplete: () => setTransitioning(false),
    });
  }, []);

  useEffect(() => {
    if (requestedScene === displayed.current) {
      if (ready.current === requestedScene) reveal(requestedScene);
      return;
    }
    setTransitioning(true);
    tween.current?.kill();
    tween.current = gsap.to(root.current, {
      '--scene-opacity': 0,
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : .32,
      ease: 'sine.inOut',
      onComplete: () => {
        ready.current = null;
        displayed.current = requestedScene;
        setScene(requestedScene);
      },
    });
    return () => { tween.current?.kill(); };
  }, [requestedScene, reveal]);

  useEffect(() => () => { tween.current?.kill(); }, []);
  return { root, scene, transitioning, onSceneReady: reveal };
}
