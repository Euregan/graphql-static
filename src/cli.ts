#!/usr/bin/env -S ts-node-script --esm --transpileOnly

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { gql } from "graphql-tag";
import z from "zod";
import schemaToClient, { ScalarType } from "./client.ts";

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
});

// TODO: Handle missing config file
// TODO: Make sure args are JSON serializable
const rawConfig = (await import(path.resolve("./enodia.config.ts"))).default;

const validatedConfig = configSchema.safeParse(rawConfig);

if (!validatedConfig.success) {
  console.log("Your configuration file is not valid:");
  console.log(validatedConfig.error);
  process.exit(1);
}

const config = validatedConfig.data;

console.log("- Fetching schema");
const schema = gql(
  await (input.startsWith("http")
    ? // @ts-ignore The types for node don't include fetch :(
      fetch(input).then((response) => response.text())
    : readFile(input, "utf-8"))
);
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
