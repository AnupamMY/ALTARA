import { useLayoutEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as Controls } from 'three-stdlib';
import { PerspectiveCamera, Vector3 } from 'three';
import gsap from 'gsap';
import { amenities, cameraPresets, type Scene } from '../data/project';
import { useExperienceStore } from '../store/useExperienceStore';
import { getRooms } from '../data/rooms';

export default function PropertyCamera({ scene, onReady }: {
  scene: Exclude<Scene, 'Window View'>; onReady: (scene: Scene) => void;
}) {
  const { selected, reset, zoom, apartment } = useExperienceStore();
  const { camera, invalidate } = useThree();
  const controls = useRef<Controls>(null);
  const previous = useRef<{scene: Scene; selected: number; reset: number; zoom: number} | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [moving, setMoving] = useState(true);
  const readyFrames = useRef(0);
  const pendingReady = useRef(false);

  useLayoutEffect(() => {
    const c = controls.current;
    if (!c) return;
    const before = previous.current;
    const changedScene = before?.scene !== scene;
    const preset = cameraPresets[scene];
    const position = new Vector3(...preset.position);
    const target = new Vector3(...preset.target);
    const resetChanged = before?.reset !== reset;
    if (scene === 'Amenities' && !changedScene && !resetChanged) {
      const point = amenities[selected].position;
      target.set(point[0], 1, point[2]);
      position.set(point[0] + 12, 15, point[2] + 16);
    }
    if (scene === 'Apartment' && selected > 0 && !changedScene && !resetChanged) {
      const room = getRooms(apartment)[selected - 1];
      if (room) { target.set(room.x, 0, room.z); position.set(room.x, 10, room.z + 7); }
    }
    const onlyZoom = before && !changedScene && !resetChanged && before.selected === selected;
    if (onlyZoom) {
      target.copy(c.target);
      position.copy(camera.position).sub(target).normalize()
        .multiplyScalar(Math.max(8, Math.min(60, camera.position.distanceTo(target) * Math.pow(.88, zoom - before.zoom))))
        .add(target);
    }
    if (changedScene) {
      // Scene replacement happens under the fade, never fly through the building.
      c.target.copy(target);
      camera.position.copy(position).sub(target).multiplyScalar(1.045).add(target);
      (camera as PerspectiveCamera).fov = 52;
      camera.updateProjectionMatrix();
      c.update();
      setInteracted(false);
      readyFrames.current = 0;
      pendingReady.current = true;
    }
    previous.current = { scene, selected, reset, zoom };
    const oldDamping = c.enableDamping;
    c.enabled = false;
    c.enableDamping = false;
    setMoving(true);
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : onlyZoom ? .65 : 1.15;
    const animation = gsap.timeline({
      onUpdate: () => { c.update(); invalidate(); },
      onComplete: () => { c.enabled = true; c.enableDamping = oldDamping; setMoving(false); },
    });
    animation.to(camera.position, { x: position.x, y: position.y, z: position.z, duration, ease: 'sine.inOut' }, 0)
      .to(c.target, { x: target.x, y: target.y, z: target.z, duration, ease: 'sine.inOut' }, 0);
    return () => { animation.kill(); c.enabled = true; c.enableDamping = oldDamping; };
  }, [scene, selected, reset, zoom, apartment, camera, invalidate]);

  useFrame(() => {
    if (pendingReady.current && ++readyFrames.current >= 2) {
      pendingReady.current = false;
      onReady(scene);
    }
  });

  return <OrbitControls ref={controls} makeDefault minDistance={8} maxDistance={60}
    minPolarAngle={.15} maxPolarAngle={Math.PI / 2 - .05} enablePan={false}
    enableDamping dampingFactor={.065}
    autoRotate={scene === 'Home' && !interacted && !moving && !matchMedia('(prefers-reduced-motion: reduce)').matches}
    autoRotateSpeed={.22} onStart={() => setInteracted(true)}/>;
}
