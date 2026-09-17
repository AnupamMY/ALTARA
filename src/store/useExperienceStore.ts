import { create } from "zustand";
import type { Scene, Time } from "../data/project";
type State = {
  scene: Scene;
  floor: number;
  time: Time;
  apartment: number;
  selected: number;
  zoom: number;
  reset: number;
  set: (state: Partial<Omit<State, "set">>) => void;
};
export const useExperienceStore = create<State>((set) => ({
  scene: "Window View",
  floor: 9,
  time: "day",
  apartment: 1,
  selected: 0,
  zoom: 0,
  reset: 0,
  set,
}));
