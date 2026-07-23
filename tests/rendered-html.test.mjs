import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function readBuildOutput(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const parts = await Promise.all(
    entries.map(async (entry) => {
      const url = new URL(entry.name, directory);
      if (entry.isDirectory()) {
        return readBuildOutput(new URL(`${entry.name}/`, directory));
      }
      if (!/\.(?:js|css)$/.test(entry.name)) return "";
      return readFile(url, "utf8");
    }),
  );
  return parts.join("\n");
}

test("build contains the CoolOps application shell and product metadata", async () => {
  const html = await readBuildOutput(
    new URL("../dist/server/", import.meta.url),
  );
  assert.match(
    html,
    /CoolOps — HVAC Operations Command Centre/i,
  );
  assert.match(html, /Opening CoolOps/);
  assert.match(html, /Reconciling jobs, inventory and field teams/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("removes starter-only assets and metadata", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /CoolOpsApp/);
  assert.match(layout, /HVAC Operations Command Centre/);
  assert.match(packageJson, /coolops-hvac-operations/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /codex-preview|SkeletonPreview/);
  await assert.rejects(
    access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)),
  );
  await assert.rejects(
    access(new URL("../app/_sites-preview/preview.css", import.meta.url)),
  );
  await access(new URL("drizzle/0000_military_unicorn.sql", templateRoot));
});
