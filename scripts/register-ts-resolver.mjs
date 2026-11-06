// Lets node --test import the real TypeScript sources: resolves the "@/" alias
// and extensionless relative imports, which Node does not do on its own.
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC_URL = new URL("../src/", import.meta.url);

function withExtension(url) {
  const path = fileURLToPath(url);
  return existsSync(path) ? url : new URL(`${url.href}.ts`);
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = withExtension(new URL(specifier.slice(2), SRC_URL));
      return nextResolve(pathToFileURL(fileURLToPath(target)).href, context);
    }

    if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts") && !/\.[a-z]+$/.test(specifier)) {
      return nextResolve(withExtension(new URL(specifier, context.parentURL)).href, context);
    }

    return nextResolve(specifier, context);
  },
});
