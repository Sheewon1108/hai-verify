import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./bare-ts-hooks.mjs", pathToFileURL("./scripts/"));
