import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Content Management" })).toBeVisible();
}

test("public reading surfaces load from seeded data", async ({ context, page }) => {
  test.setTimeout(45_000);
  await context.grantPermissions(["clipboard-write"]);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Read the world in Spanish at your level." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How LingoLens Works" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Latest Adapted Articles" })).toBeVisible();

  await page.goto("/articles");
  await expect(page.getByRole("heading", { name: "Articles" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Articles" })
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: /Día de Muertos/i }).first()).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/read/latam/beginner/tradiciones-de-dia-de-muertos");
  await expect(page.getByRole("heading", { name: /Día de Muertos/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Beginner", exact: true })).toHaveAttribute("aria-current", "page");
  await page.locator(".reader-toggle-row").click();
  await expect(page.locator("html")).toHaveClass(/reader-comfort/);
  await expect(page.getByRole("button", { name: "Exit Comfort Mode" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/reader-comfort/);
  await expect(page.getByRole("button", { name: "Exit Comfort Mode" })).toBeVisible();
  await page.getByRole("button", { name: "Exit Comfort Mode" }).click();
  await expect(page.locator("html")).not.toHaveClass(/reader-comfort/);
  await page.getByRole("link", { name: "Intermediate", exact: true }).click();
  await expect(page).toHaveURL(/\/read\/latam\/intermediate\/tradiciones-de-dia-de-muertos/);
  await expect(page.locator("html")).not.toHaveClass(/reader-leaving/);

  await page.goto("/feeds");
  await expect(page.getByRole("heading", { name: "Subscribe by reading level." })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "RSS" })
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: /Open Feed/i }).first()).toBeVisible();
  await page.getByRole("button", { name: "Copy URL" }).first().click();
  await expect(page.getByRole("button", { name: "Copied" }).first()).toBeVisible();
});

test("reader toggles between leveled text and English check translation", async ({ page }) => {
  await page.goto("/read/es-419/beginner/tradiciones-de-dia-de-muertos");
  await expect(page).toHaveURL(/\/read\/latam\/beginner\/tradiciones-de-dia-de-muertos/);
  await expect(page.getByRole("button", { name: "Spanish" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Día de Muertos traditions" })).toBeVisible();
  await expect(page.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Spanish" }).click();
  await expect(page.getByRole("heading", { name: "Tradiciones de Día de Muertos" })).toBeVisible();
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
  await signIn(page);
  await expect(page.getByRole("navigation", { name: "Admin navigation" }).getByRole("link", { name: /Dashboard/ })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await page.getByLabel("Search titles").fill("Muertos");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page).toHaveURL(/\/admin\/content\?q=Muertos/);
  await expect(
    page.getByRole("navigation", { name: "Admin navigation" }).getByRole("link", { name: /Content List/ })
  ).toHaveAttribute("aria-current", "page");
});

test("admin content and review forms show validation recovery", async ({ page }) => {
  await signIn(page);

  await page.goto("/admin/content/new");
  await expect(page.getByRole("navigation", { name: "Admin navigation" }).getByRole("link", { name: /New Content/ })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(page.getByLabel("Source Language")).toContainText("English (United States)");
  await expect(page.getByLabel("Target Locale")).toContainText("Spanish (Latin American)");
  await expect(page.getByText("Super Beginner")).toBeVisible();
  await expect(page.getByText("Beginner", { exact: true })).toBeVisible();
  await expect(page.getByText("Intermediate")).toBeVisible();
  await expect(page.getByText("Natural", { exact: true })).toBeVisible();
  await page.getByLabel("Source Title").fill("No");
  await page.getByLabel("Source Text").fill("short");
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.locator(".form-error-banner")).toContainText("Check the source title");

  await page.goto("/admin");
  await page.getByRole("link", { name: /Review/ }).first().click();
  await expect(page.getByLabel("Article Title")).toHaveValue("Día de Muertos en familia");
  await page.getByRole("link", { name: "Intermediate", exact: true }).click();
  await expect(page.getByLabel("Article Title")).toHaveValue("Cómo las ofrendas mantienen viva la memoria");
  await expect(page.getByLabel("Article Body")).toHaveValue(/En México y en muchas comunidades mexicanas/);
  await page.getByLabel("Article Title").fill("A");
  await page.getByLabel("Article Body").fill("Short");
  await page.getByRole("button", { name: "Save Edits" }).click();
  await expect(page.locator("#review-form-error")).toContainText("Add an article title");
  await expect(page.locator("#title-error")).toContainText("Article title is required.");
  await expect(page.locator("#bodyMarkdown-error")).toContainText("Article body must be at least 20 characters.");
});
