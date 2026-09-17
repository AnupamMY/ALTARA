import { Check, Moon, Sun } from 'lucide-react';
import { floors } from '../data/project';
import { useExperienceStore } from '../store/useExperienceStore';

export default function PanoramaSelector({ clearError }: { clearError: () => void }) {
  const { floor, time, set } = useExperienceStore();
  return <aside className="perspective-panel" aria-label="Choose your panorama">
    <span className="panel-label">YOUR PERSPECTIVE</span>
    <h2>Find your horizon</h2>
    <p>One view. Four different moments.</p>
    <div className="perspective-grid">
      {floors.flatMap(n => (['day', 'night'] as const).map(t => {
        const active = floor === n && time === t;
        const Icon = t === 'day' ? Sun : Moon;
        return <button key={`${n}-${t}`} className={`perspective-option ${active ? 'active' : ''}`}
          aria-label={`${n}th floor ${t}`} aria-pressed={active}
          onClick={() => { clearError(); set({ floor: n, time: t }); }}>
          <span className="perspective-top"><Icon size={17}/>{active && <Check size={14}/>}</span>
          <span className="perspective-floor">{n}<sup>TH FLOOR</sup></span>
          <span className="perspective-time">{t === 'day' ? 'Daylight' : 'After dark'}</span>
        </button>;
      }))}
    </div>
    <div className="perspective-note"><span className="status-dot"/> Actual views. Your future.</div>
  </aside>;
}
