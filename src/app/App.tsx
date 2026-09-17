import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Expand,
  Home,
  Info,
  Layers,
  MapPin,
  Minus,
  Move,
  Plus,
  RotateCcw,
  Trees,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Experience from "../three/Experience";
import { useSceneTransition } from "../hooks/useSceneTransition";
import PanoramaSelector from "../components/PanoramaSelector";
import { useExperienceStore } from "../store/useExperienceStore";
import {
  amenities,
  apartments,
  floors,
  navigation,
  panoramaPath,
} from "../data/project";
const icons = [Home, Trees, Layers, Compass];
function App() {
  const {
    scene: requestedScene,
    floor,
    time,
    apartment,
    selected,
    zoom,
    reset,
    set,
  } = useExperienceStore();
  const { root, scene, transitioning, onSceneReady } = useSceneTransition(requestedScene);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<"help" | null>(null);
  const [sound, setSound] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const modal = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const onProgress = useCallback((n: number) => {
    setProgress(n);
    if (n === 100) setReady(true);
  }, []);
  const onError = useCallback((s: string) => setError(s), []);
  useEffect(() => {
    if (dialog) {
      trigger.current = document.activeElement as HTMLElement;
      modal.current?.showModal();
    } else {
      modal.current?.close();
      trigger.current?.focus();
    }
  }, [dialog]);
  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        dialog ||
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)
      )
        return;
      if (e.key === "+") set({ zoom: Math.min(4, zoom + 1) });
      if (e.key === "-") set({ zoom: Math.max(-2, zoom - 1) });
      if (e.key === "ArrowLeft") set({ floor: 9 });
      if (e.key === "ArrowRight") set({ floor: 14 });
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [dialog, set, zoom]);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  const toggleSound = async () => {
    if (audio.current) {
      await audio.current.close();
      audio.current = null;
      setSound(false);
      return;
    }
    const ctx = new AudioContext();
    audio.current = ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.018;
    gain.connect(ctx.destination);
    [130.81, 196, 261.63].forEach((f) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = f;
      oscillator.connect(gain);
      oscillator.start();
    });
    await ctx.resume();
    setSound(true);
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setError("Fullscreen is not available in this browser.");
    }
  };
  const chooseFloor = (n: number) => {
    setError("");
    set({ floor: n });
  };
  const titles = {
    Home: [
      "A quieter kind",
      "of extraordinary.",
      "Architecture shaped around a life well lived.",
    ],
    Amenities: [
      "Space for you.",
      "Time for more.",
      "Thoughtfully curated spaces for every part of your day.",
    ],
    Apartment: [
      "Considered spaces.",
      "Endless possibilities.",
      "Find a home that feels distinctly yours.",
    ],
    "Window View": [
      "A higher",
      "perspective.",
      "Some views are worth coming home to.",
    ],
  };
  const title = titles[scene];
  const apt = apartments[apartment];
  return (
    <main
      ref={root}
      data-transitioning={transitioning}
      className={`experience ${time === "night" && scene === "Window View" ? "night" : ""}`}
    >
      <div
        className="static-backdrop"
        style={{ backgroundImage: `url(${panoramaPath(floor, time, true)})` }}
      />
      <div
        className="canvas-wrap"
        aria-label={
          scene === "Window View"
            ? `${floor}th floor, ${time}time, hill side panoramic view. Drag to look around.`
            : `Interactive ${scene.toLowerCase()} concept scene`
        }
      >
        <Experience scene={scene} onSceneReady={onSceneReady} onProgress={onProgress} onError={onError} />
      </div>
      <div className="vignette" />
      <header className="topbar">
        <button
          className="brand"
          onClick={() => set({ scene: "Home" })}
          aria-label="Altara residences home"
        >
          <span className="brand-symbol">
            Λ<span>╱</span>
          </span>
          <span>
            ALTARA<small>R E S I D E N C E S</small>
          </span>
        </button>
        <div className="top-middle">
          <span className="status-dot" /> A LIFE ABOVE THE ORDINARY
        </div>
      </header>
      <nav className="nav-panel" aria-label="Explore property">
        {navigation.map((n, i) => {
          const Icon = icons[i];
          return (
            <button
              key={n}
              className={requestedScene === n ? "selected" : ""}
              aria-current={requestedScene === n ? "page" : undefined}
              onClick={() => {
                set({ scene: n, selected: 0, zoom: 0 });
                setError("");
              }}
            >
              <Icon size={19} strokeWidth={1.5} />
              <span>{n}</span>
              {requestedScene === n && <i />}
            </button>
          );
        })}
      </nav>
      <section className="intro" key={scene}>
        <div className="eyebrow">
          <span />{" "}
          {scene === "Window View"
            ? "THE WINDOW COLLECTION"
            : scene === "Home"
              ? "WELCOME TO ALTARA"
              : `EXPLORE · ${scene.toUpperCase()}`}
        </div>
        <h1>
          {title[0]}
          <br />
          <em>{title[1]}</em>
        </h1>
        <p>{title[2]}</p>
        {scene === "Window View" ? (
          <div className="view-badge">
            <MapPin size={14} />
            <span>Hill side</span>
            <span className="badge-divider" />
            <span>Uninterrupted. Unforgettable.</span>
          </div>
        ) : (
          <span className="concept-tag">
            Illustrative concept · Sample project
          </span>
        )}
        {scene === "Home" && (
          <div className="hero-actions">
            <button
              className="gold-button"
              onClick={() => set({ scene: "Amenities" })}
            >
              Explore property <ArrowRight size={16} />
            </button>
            <button
              className="text-button"
              onClick={() => set({ scene: "Apartment" })}
            >
              View apartments ↗
            </button>
          </div>
        )}
      </section>
      {scene === "Window View" && (
        <>
          <PanoramaSelector clearError={() => setError("")} />
          <div className="scene-caption">
            <span className="caption-line" />
            <div>
              <small>THE VIEW FROM</small>
              <strong>
                {floor}
                <sup>TH</sup> FLOOR <span> / </span> HILL SIDE
              </strong>
            </div>
          </div>
          <div className="look-hint">
            <Move size={19} strokeWidth={1} />
            <span>Drag to explore the view</span>
            <span className="hint-dot" />
            360°
          </div>
        </>
      )}
      {scene === "Apartment" && (
        <aside className="detail-panel">
          <span className="panel-label">A HOME THAT FITS</span>
          <h2>Your space, reimagined.</h2>
          <div className="segmented">
            {apartments.map((a, i) => (
              <button
                key={a.name}
                className={apartment === i ? "active" : ""}
                onClick={() => set({ apartment: i, selected: 0 })}
              >
                {a.name}
              </button>
            ))}
          </div>
          <div className="area">
            {apt.area.toLocaleString()}
            <small> sq ft</small>
          </div>
          <div className="spec-grid">
            <span>{apt.bedrooms} Bedrooms</span>
            <span>{apt.bathrooms} Bathrooms</span>
            <span>{apt.balconies} Balconies</span>
            <span>{apt.available} Available*</span>
          </div>
          <label className="select-label">
            Select floor{" "}
            <select
              value={floor}
              onChange={(e) => chooseFloor(+e.target.value)}
            >
              {floors.map((f) => (
                <option key={f} value={f}>
                  {f}th floor
                </option>
              ))}
            </select>
          </label>
          <button
            className="gold-button"
            onClick={() => set({ scene: "Window View" })}
          >
            See your window view <ArrowRight size={15} />
          </button>
          <p className="fine-print">
            *Illustrative layouts and availability. Select a room to explore;
            drag to rotate.
          </p>
          <button
            className="text-button"
            onClick={() => set({ reset: reset + 1 })}
          >
            <RotateCcw size={14} /> Reset view
          </button>
        </aside>
      )}
      {scene === "Amenities" && (
        <aside className="detail-panel">
          <span className="panel-label">
            EVERYDAY, ELEVATED · {selected + 1} / 7
          </span>
          <div className={`amenity-art art-${selected}`}>
            <Trees size={56} strokeWidth={0.7} />
            <span>{amenities[selected].label}</span>
          </div>
          <h2>{amenities[selected].name}</h2>
          <p>{amenities[selected].description}</p>
          <div className="panel-navigation">
            <button
              aria-label="Previous amenity"
              onClick={() => set({ selected: (selected + 6) % 7 })}
            >
              <ArrowLeft size={18} />
            </button>
            <span>{amenities[selected].label}</span>
            <button
              aria-label="Next amenity"
              onClick={() => set({ selected: (selected + 1) % 7 })}
            >
              <ArrowRight size={18} />
            </button>
          </div>
          <button
            className="text-button"
            onClick={() => set({ scene: "Home" })}
          >
            <X size={14} /> Close amenities
          </button>
        </aside>
      )}
      <div className="right-utilities">
        <button
          onClick={() => setDialog("help")}
          aria-label="Tour instructions"
        >
          <Info size={18} />
        </button>
        <span />
        <button
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          <Expand size={18} />
        </button>
      </div>
      <footer className="bottom-bar">
        <div className="footer-brand">
          A L T A R A <span> / </span>
          <small>VIRTUAL EXPERIENCE</small>
        </div>
        <div className="utility-group">
          <button
            onClick={() => void toggleSound()}
            aria-label={sound ? "Mute ambience" : "Play ambience"}
            aria-pressed={sound}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <span />
          <button
            aria-label="Zoom out"
            disabled={zoom <= -2}
            onClick={() => set({ zoom: Math.max(-2, zoom - 1) })}
          >
            <Minus size={18} />
          </button>
          <button
            aria-label="Zoom in"
            disabled={zoom >= 4}
            onClick={() => set({ zoom: Math.min(4, zoom + 1) })}
          >
            <Plus size={18} />
          </button>
          <span />
          <button
            aria-label="Reset camera"
            onClick={() => set({ zoom: 0, reset: reset + 1 })}
          >
            <RotateCcw size={17} />
          </button>
        </div>
        <div className="footer-note">
          A little closer to the extraordinary. <span>↗</span>
        </div>
      </footer>
      <div className="sr-only" role="status" aria-live="polite">
        {scene}. {floor}th floor. {time === "day" ? "Daylight" : "After dark"}.{" "}
        {progress < 100 ? "Loading view." : "View ready."}
      </div>
      {progress < 100 && ready && scene === "Window View" && (
        <div className="loading-view">
          <span /> Preparing your view…
        </div>
      )}
      {error && (
        <div className="error-toast" role="alert">
          {error}
          <button
            onClick={() => {
              setError("");
              set({ reset: reset + 1 });
            }}
          >
            Retry
          </button>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {!ready && (
        <div className="loading-screen">
          <div className="loading-logo">ALTARA</div>
          <span>A HIGHER PERSPECTIVE</span>
          <div className="loading-track">
            <i style={{ width: `${progress}%` }} />
          </div>
          <p>{progress}% · Preparing your first view</p>
          <button onClick={() => setReady(true)}>
            Enter experience <ArrowRight size={15} />
          </button>
        </div>
      )}
      <dialog
        ref={modal}
        onCancel={() => setDialog(null)}
        onClick={(e) => {
          if (e.target === modal.current) setDialog(null);
        }}
        aria-labelledby="dialog-title"
      >
        <button
          className="dialog-close"
          onClick={() => setDialog(null)}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
        {dialog === "help" && (
          <>
            <span className="panel-label">MAKE YOURSELF AT HOME</span>
            <h2 id="dialog-title">A new point of view.</h2>
            <p>
              Drag the scene to look around. On touchscreens, swipe to explore.
              Use + and − to adjust your view.
            </p>
            <p>
              Choose any of the four floor and time buttons to go directly to
              that view. Your viewing direction stays with you.
            </p>
            <p>
              Keyboard: Tab moves between controls, Enter selects, ← / → changes
              floors, and + / − zooms. Escape closes this panel.
            </p>
            <p className="fine-print">
              Window View uses the four supplied panoramas. Other scenes are
              illustrative concepts. No sunset image was supplied, so only
              authentic day and night views are offered.
            </p>
          </>
        )}
      </dialog>
    </main>
  );
}
export default App;
