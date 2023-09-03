#!/usr/bin/env -S ts-node-script --esm --transpileOnly

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { parse } from "graphql";
import z from "zod";
import schemaToClient, { ScalarType } from "./client.ts";
import fetcher from "./fetcher.ts";

// TODO: Use Commander
const [, , input, output] = process.argv;

const configSchema = z.object({
  scalarTypes: z.record(
    z.union([
      z.object({
        path: z.string(),
        name: z.string().optional(),
      }),
      z.object({
        name: z.string(),
      }),
    ])
  ),
  headers: z
    .function()
    .args()
    .returns(z.promise(z.record(z.string())))
    .optional(),
});

// TODO: Handle missing config file
// TODO: Make sure args are JSON serializable
const rawConfig = (await import(path.resolve("./enodia.config.ts"))).default
  .default;

const validatedConfig = configSchema.safeParse(rawConfig);

if (!validatedConfig.success) {
  console.log("Your configuration file is not valid:");
  console.log(validatedConfig.error);
  process.exit(1);
}

const config = validatedConfig.data;

console.log("- Fetching schema");
const schema = input.startsWith("http")
  ? await fetcher(input, config.headers ? await config.headers() : {})
  : parse(await readFile(input, "utf-8"));
console.log("✓ Fetched schema");

// TODO: Verify that the file actually exist, and that they do export the specified type
const resolvedImports = Object.fromEntries(
  Object.entries((config.scalarTypes || {}) as Record<string, ScalarType>).map(
    ([gqlType, imp]) =>
      "path" in imp
        ? [
            gqlType,
            {
              // We go back one level because output points to the file output
              path: path.relative(path.resolve(output, ".."), imp.path),
              name: imp.name,
            },
          ]
        : [gqlType, imp]
  )
);

console.log("- Writing client");
await writeFile(
  output,
  schemaToClient(schema, { scalarTypes: resolvedImports })
);
console.log("✓ Wrote client");
