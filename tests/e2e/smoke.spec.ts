import { expect, test } from "@playwright/test";

test("public reading surfaces load from seeded data", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-write"]);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Read the world in Spanish at your level." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How LingoLens Works" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Latest Adapted Articles" })).toBeVisible();

  await page.goto("/articles");
  await expect(page.getByRole("heading", { name: "Articles" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Día de Muertos/i }).first()).toBeVisible();

  await page.goto("/read/es-419/beginner/tradiciones-de-dia-de-muertos");
  await expect(page.getByRole("heading", { name: /Día de Muertos/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Beginner", exact: true })).toHaveAttribute("aria-current", "page");

  await page.goto("/feeds");
  await expect(page.getByRole("heading", { name: "Subscribe by reading level." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open Feed/i }).first()).toBeVisible();
  await page.getByRole("button", { name: "Copy URL" }).first().click();
  await expect(page.getByRole("button", { name: "Copied" }).first()).toBeVisible();
});

test("admin login supports keyboard focus and invalid credential feedback", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();

  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".form-error")).toContainText("Admin credentials were not accepted.");
});

test("admin dashboard search navigates to the content query after login", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Content Management" })).toBeVisible();
  await page.getByLabel("Search titles").fill("Muertos");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page).toHaveURL(/\/admin\/content\?q=Muertos/);
});
