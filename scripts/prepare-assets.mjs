import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
await mkdir("public/panoramas", { recursive: true });
await mkdir("public/models", { recursive: true });
for (const floor of [9, 14])
  for (const time of ["day", "night"]) {
    const source = `${floor}th floor_${time === "day" ? "Day" : "Night"}_Hill side.jpg.jpeg`;
    for (const [width, suffix] of [
      [6144, ""],
      [3072, "-mobile"],
    ]) {
      await sharp(source)
        .resize(width, width / 2)
        .webp({ quality: 85 })
        .toFile(`public/panoramas/${floor}-${time}${suffix}.webp`);
    }
    console.log(`Prepared ${floor}th floor ${time}`);
  }
// Original lightweight architectural concept. Replace with the final property GLB.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString("base64")}`;
      this.onloadend?.();
    });
  }
};
const scene = new THREE.Scene();
const materials = {
  stone: new THREE.MeshStandardMaterial({ color: "#ded5bf", roughness: 0.8 }),
  glass: new THREE.MeshStandardMaterial({
    color: "#405e60",
    metalness: 0.6,
    roughness: 0.2,
  }),
  rail: new THREE.MeshStandardMaterial({
    color: "#36493d",
    metalness: 0.4,
    roughness: 0.45,
  }),
  wood: new THREE.MeshStandardMaterial({ color: "#988260", roughness: 0.8 }),
};
const geometry = new THREE.BoxGeometry(1, 1, 1);
function box(x, y, z, w, h, d, material) {
  const mesh = new THREE.Mesh(geometry, materials[material]);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}
box(0, 0.35, 0, 13, 0.7, 10, "stone");
box(0, 10, 0, 9, 20, 6, "stone");
for (let level = 0; level < 14; level++) {
  const y = 1.1 + level * 1.42;
  box(0, y, 0, 11, 0.16, 8, "stone");
  for (const z of [-3.1, 3.1]) {
    for (let x = -3.5; x <= 3.5; x += 1.75) {
      box(x, y + 0.67, z, 1.45, 1.12, 0.1, "glass");
    }
    box(0, y + 0.42, z * 1.24, 10.5, 0.04, 0.05, "rail");
    box(0, y + 0.14, z * 1.24, 10.5, 0.04, 0.05, "rail");
    for (let x = -5; x <= 5; x += 1)
      box(x, y + 0.26, z * 1.24, 0.035, 0.4, 0.04, "rail");
  }
  for (const x of [-4.6, 4.6]) box(x, y + 0.65, 0, 0.12, 1.15, 5.7, "glass");
}
box(0, 21, 0, 11, 0.35, 8, "stone");
box(0, 21.6, 0, 5, 1, 4, "wood");
box(0, 0.9, 4.5, 4, 1.8, 1.5, "glass");
const result = await new GLTFExporter().parseAsync(scene, { binary: true });
await writeFile("public/models/residence.glb", Buffer.from(result));
console.log("Exported original concept residence.glb");
