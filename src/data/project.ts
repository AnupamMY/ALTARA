export type Scene =
  | "Home"
  | "Amenities"
  | "Apartment"
  | "Window View";
export type Time = "day" | "night";
export const project = {
  name: "ALTARA",
  subtitle: "RESIDENCES",
  direction: "Hill side",
  model: "/models/residence.glb",
};
export const floors = [9, 14] as const;
export const panoramaPath = (floor: number, time: Time, mobile = false) =>
  `/panoramas/${floor}-${time}${mobile ? "-mobile" : ""}.webp`;
export const navigation: Scene[] = [
  "Home",
  "Amenities",
  "Apartment",
  "Window View",
];
export const apartments = [
  {
    name: "1 BHK",
    area: 740,
    bedrooms: 1,
    bathrooms: 1,
    balconies: 1,
    available: 4,
  },
  {
    name: "2 BHK",
    area: 1180,
    bedrooms: 2,
    bathrooms: 2,
    balconies: 1,
    available: 7,
  },
  {
    name: "3 BHK",
    area: 1680,
    bedrooms: 3,
    bathrooms: 3,
    balconies: 2,
    available: 3,
  },
];
export const amenities = [
  {
    name: "The pool terrace",
    label: "Swimming pool",
    description:
      "Unhurried mornings and refreshing evenings. A generous pool deck designed for a quieter kind of everyday.",
    position: [-8, 0, 5],
  },
  {
    name: "Find your balance",
    label: "Fitness centre",
    description:
      "A light-filled space for movement, strength and a routine that feels entirely your own.",
    position: [7, 0, 3],
  },
  {
    name: "Room to wonder",
    label: "Children’s play area",
    description:
      "An imaginative outdoor play space where little adventures become lasting memories.",
    position: [-7, 0, -5],
  },
  {
    name: "A greener everyday",
    label: "Landscaped garden",
    description:
      "Walk beneath a canopy of green, find a quiet corner and reconnect with the outdoors.",
    position: [6, 0, -6],
  },
  {
    name: "Come together",
    label: "Clubhouse",
    description:
      "Warm, welcoming social spaces for celebrations, conversations and a sense of belonging.",
    position: [8, 0, 7],
  },
  {
    name: "Peace of mind",
    label: "Security",
    description:
      "A considered entrance and a dedicated security point for a comfortable arrival home.",
    position: [0, 0, 10],
  },
  {
    name: "Arrive with ease",
    label: "Parking",
    description:
      "Organised resident parking with a convenient connection to the main entrance.",
    position: [-9, 0, -9],
  },
];
export const cameraPresets: Record<
  Exclude<Scene, "Window View">,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  Home: { position: [24, 20, 30], target: [0, 8, 0] },
  Amenities: { position: [20, 19, 24], target: [0, 1, 0] },
  Apartment: { position: [0, 17, 14], target: [0, 0, 0] },
};
