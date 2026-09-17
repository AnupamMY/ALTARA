import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
  ],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  page.on("console", (m) => {
    if (m.type() === "error") console.log(m.text());
  });
  await page.goto("http://localhost:5173");
  await page.locator(".loading-screen").waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => document.querySelector("canvas")?.width > 300,
  );
  console.log(
    await page.evaluate(() => ({
      canvas: [...document.querySelectorAll("canvas")].map((c) => ({
        w: c.width,
        h: c.height,
        rect: c.getBoundingClientRect().toJSON(),
      })),
      fallback: document.querySelector(".canvas-fallback")?.textContent,
    })),
  );
  await page.addStyleTag({
    content:
      ".static-backdrop{background-image:none!important;background:magenta!important}",
  });
  await page.waitForTimeout(1000);
  const shaderState = await page.evaluate(async () => {
    const { _roots } =
      await import("/node_modules/.vite/deps/@react-three_fiber.js");
    const state = _roots.get(document.querySelector("canvas")).store.getState();
    return {
      camera: state.camera.position.toArray(),
      near: state.camera.near,
      far: state.camera.far,
      children: state.scene.children.map((o) => ({
        type: o.type,
        visible: o.visible,
        mat: o.material?.type,
        weights: o.material?.uniforms?.weights?.value.toArray(),
        texture: o.material?.uniforms?.view0?.value?.image?.width,
        side: o.material?.side,
      })),
      frames: state.gl.info.render,
    };
  });
  assert.equal(
    shaderState.children[0].texture,
    6144,
    "The GPU panorama must be loaded",
  );
  await page.screenshot({ path: "artifacts/shader-check.png" });
  for (const name of [
    "14th floor night",
    "9th floor night",
    "14th floor day",
    "9th floor day",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(230);
  }
  await page.waitForTimeout(2300);
  const weights = await page.evaluate(async () => {
    const { _roots } =
      await import("/node_modules/.vite/deps/@react-three_fiber.js");
    return _roots
      .get(document.querySelector("canvas"))
      .store.getState()
      .scene.children[0].material.uniforms.weights.value.toArray();
  });
  assert.ok(
    weights[0] > 0.99,
    "Rapid switching must settle on the final panorama",
  );
  assert.equal(
    await page
      .getByRole("button", { name: "9th floor day", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  for (const [width, height] of [
    [1024, 768],
    [390, 844],
    [375, 667],
  ]) {
    await page.setViewportSize({ width, height });
    const panel = await page.locator(".perspective-panel").boundingBox();
    const footer = await page.locator(".bottom-bar").boundingBox();
    assert.ok(
      panel.y + panel.height < footer.y,
      `Panel overlaps footer at ${width}`,
    );
    await page.screenshot({ path: `artifacts/layout-${width}.png` });
  }
  console.log("Rapid switching and panel spacing checks passed.");
} finally {
  await browser.close();
}
