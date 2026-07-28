import { expect, test } from "@playwright/test";

test("browses a property and reviews booking rules", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Book the viewing/ })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("landing.png"), fullPage: true });
  await page.getByRole("link", { name: "Browse properties" }).click();
  await expect(page.getByRole("heading", { name: "Find a property worth visiting." })).toBeVisible();
  await page.goto("/book/");
  await expect(page.getByText("No funds move until you review and sign")).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("booking.png"), fullPage: true });
});

test("keeps wallet and navigation usable on mobile", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Connect wallet" }).click();
  await expect(page.getByRole("heading", { name: "Connect a wallet" })).toBeVisible();
  await page.getByRole("button", { name: "Close wallet dialog" }).click();
  await expect(page.getByRole("link", { name: "Browse properties" })).toBeVisible();
});
