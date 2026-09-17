export const getRooms = (apartment: number) => [
  { name: 'Living & dining', x: -3, z: 2, w: 5, d: 5 },
  { name: 'Kitchen', x: 2, z: 3, w: 4, d: 3 },
  ...Array.from({ length: apartment + 1 }, (_, i) => ({ name: `Bedroom ${i + 1}`, x: -4 + i * 4, z: -3, w: 3.7, d: 4 })),
  { name: 'Balcony', x: 2, z: 6, w: 4, d: 1.5 },
];
