# Enodia

Enodia is a GraphQL client generator for Typescript projects. It generates a
fully typed client file from your GraphQL API, allowing you to have both
automatic types in return of your queries and mutations, and type safety when
providing arguments and fields.

## Installation

As Enodia generates the client file, you can install it as a dev dependency:

```bash
npm install -D enodia
```

For Enodia to work, you will also need to have `ts-node` installed, either as a
dependency in your project, or globally:

```bash
npm install -D ts-node
```

Finally, you will need to setup an `enodia.config.ts` file at the root of your
project. This file should export an object with the following properties:

```typescript
export default {
  scalarTypes: {
    // This is a map of scalar types in your GraphQL schema to Typescript types.
    // For example, if your GraphQL schema has a `Date` scalar type, you can map
    // it to the `Date` type in Typescript.
    Date: { name: "Date" },
  },
};
```

More information on this file in the [configuration section](#configuration).

## Usage

### Generating the client

Once your `enodia.config.ts` file is setup, you can run Enodia with the
following command:

```bash
enodia ./path/to/schema.graphql ./path/to/client.ts
```

This will generate a client file at the given path. You should .gitignore the
generated file.

### Using the client

The generated file exports a simple `enodia` function, which takes the URL of
your API as a first parameter. The second parameter is a configuration object,
allowing you to inject a custom `fetch` function. This can be used to handle
authentication, for example. This function will return the instantiated client.
The client has two properties, `query` and `mutation` containing functions to
call every query and mutation your GraphQL API exposes.

## Configuration

### `scalarTypes`

This is a map of scalar types in your GraphQL schema to Typescript types. For
example, if your GraphQL schema has a `Date` scalar type, you can map it to the
`Date` type in Typescript.

```typescript
export default {
  scalarTypes: {
    Date: { name: "Date" },
  },
};
```

If you need to use custom types, you can also provide a `path` property, which
will be used to import the type from the generated client file.

```typescript
export default {
  scalarTypes: {
    Json: { name: "Json", path: "./types" },
  },
};
```

The `name` property is optional when providing a `path`, if the returned type is
the default export of the module.
