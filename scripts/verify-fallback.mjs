import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--disable-webgl"],
});
try {
  const page = await browser.newPage();
  await page.goto("http://localhost:5173");
  await page.locator(".canvas-fallback").waitFor();
  await page.locator(".loading-screen").waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "14th floor night", exact: true })
    .click();
  assert.ok(
    (await page.locator(".static-backdrop").getAttribute("style")).includes(
      "14-night-mobile.webp",
    ),
  );
  console.log(
    "PASS: WebGL-unavailable fallback opens automatically and selects the correct static panorama.",
  );
} finally {
  await browser.close();
}
