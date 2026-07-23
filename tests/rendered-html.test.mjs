import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function readBuildOutput(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const parts = await Promise.all(
    entries.map(async (entry) => {
      const url = new URL(entry.name, directory);
      if (entry.isDirectory()) {
        return readBuildOutput(new URL(`${entry.name}/`, directory));
      }
      if (!/\.(?:html|js|css)$/.test(entry.name)) return "";
      return readFile(url, "utf8");
    }),
  );
  return parts.join("\n");
}

test("production build contains HVAC, demo disclosure and theme controls", async () => {
  const [serverBuild, clientSource, layoutSource, stylesheet] = await Promise.all([
    readBuildOutput(new URL("../.next/server/", import.meta.url)),
    readFile(new URL("../app/hvac-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(serverBuild, /HVAC Operations Command Centre/i);
  assert.match(clientSource, /Demo mode/);
  assert.match(clientSource, /All names, contacts and operations are fictional/);
  assert.match(clientSource, /Switch to.*light.*mode/);
  assert.match(stylesheet, /html\[data-theme="light"\]/);
  assert.match(layoutSource, /index:\s*false/);
  assert.doesNotMatch(serverBuild, /Opening HVAC/);
  assert.doesNotMatch(serverBuild, /codex-preview|Your site is taking shape/i);
});

test("repository contains only the Vercel demo runtime", async () => {
  const [page, packageJson, attachmentRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/api/v1/attachments/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /HVACApp/);
  assert.match(packageJson, /"build": "next build"/);
  assert.doesNotMatch(packageJson, /vinext|wrangler|drizzle|cloudflare/i);
  assert.match(attachmentRoute, /not uploaded or retained/);
  await assert.rejects(
    access(new URL("../.openai/hosting.json", import.meta.url)),
  );
  await assert.rejects(access(new URL("../lib/database.ts", import.meta.url)));
});
