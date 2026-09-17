import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
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
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const requests = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("response", (r) => {
  if (r.url().includes("/panoramas/"))
    requests.push({ url: r.url(), status: r.status() });
});
await page.goto("http://localhost:5173");
await page
  .locator(".loading-screen")
  .waitFor({ state: "hidden", timeout: 30000 });
await page.waitForTimeout(1600);
await page.screenshot({ path: "artifacts/desktop-day.png" });
for (const [floor, time] of [
  [14, "day"],
  [14, "night"],
  [9, "night"],
  [9, "day"],
]) {
  await page
    .getByRole("button", { name: `${floor}th floor ${time}`, exact: true })
    .click();
  await page.waitForFunction(() => !document.querySelector(".loading-view"));
  await page.waitForTimeout(2000);
  assert.equal(
    await page
      .getByRole("button", { name: `${floor}th floor ${time}`, exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.ok(
    requests.some(
      (r) => r.url.endsWith(`${floor}-${time}.webp`) && r.status === 200,
    ),
    `Missing panorama ${floor}-${time}`,
  );
  if (time === "night")
    await page.screenshot({ path: `artifacts/desktop-${floor}-night.png` });
}
for (const name of ["Home", "Amenities", "Apartment"]) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
  await page.waitForFunction(()=>document.querySelector('main').dataset.transitioning==='false');
  assert.equal(await page.locator("canvas").count(), 1);
  await page.screenshot({ path: `artifacts/${name.toLowerCase()}.png` });
}
await page.getByRole("button", { name: "3 BHK", exact: true }).click();
await page.getByText("1,680", { exact: false }).waitFor();
await page.getByRole("button", { name: "See your window view" }).click();
await page.getByRole("button", { name: "Tour instructions" }).click();
await page.getByRole("dialog").waitFor();
await page.keyboard.press("Escape");
await page.setViewportSize({ width: 390, height: 844 });
await page.reload();
await page.locator(".loading-screen").waitFor({ state: "hidden" });
await page.waitForTimeout(1500);
await page.screenshot({ path: "artifacts/mobile.png" });
assert.equal(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  true,
);
await page
  .getByRole("button", { name: "14th floor night", exact: true })
  .click();
await page.waitForFunction(() => !document.querySelector(".loading-view"));
await page.waitForTimeout(1500);
assert.ok(
  requests.some(
    (r) => r.url.endsWith("14-night-mobile.webp") && r.status === 200,
  ),
);
await page.screenshot({ path: "artifacts/mobile-night.png" });
await writeFile(
  "artifacts/verification.json",
  JSON.stringify({ errors, requests }, null, 2),
);
await browser.close();
assert.deepEqual(errors, []);
console.log(
  "PASS: all four panoramas, four scenes, apartment selection, dialogs, mobile checks; no browser errors.",
);
