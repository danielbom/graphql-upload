# Question

How to send files in a typescript project using express and graphql?

# Answer

In a TypeScript project using **Express** + **GraphQL**, sending (uploading) files requires a slightly different approach compared to traditional REST APIs, because GraphQL normally only deals with JSON.

To handle files, you need:

- A transport that can handle multipart/form-data (for uploads).
- A GraphQL schema that supports file uploads.
- A resolver that processes the uploaded file.
- TypeScript types for safety.

Here’s the typical setup:

---

## **1. Install the needed packages**

You’ll need `graphql-upload` (or `graphql-multipart-request-spec` compatible library) and the type definitions:

```bash
npm install graphql-upload
npm install --save-dev @types/graphql-upload
```

---

## **2. Setup Express + Apollo Server for file uploads**

Example with Apollo Server v4:

```ts
// server.ts
import express from 'express'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import http from 'http'
import { graphqlUploadExpress } from 'graphql-upload'
import typeDefs from './schema'
import resolvers from './resolvers'

async function startServer() {
  const app = express()
  const httpServer = http.createServer(app)

  // Upload middleware (must come before Apollo)
  app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 5 }))

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  await server.start()

  app.use('/graphql', expressMiddleware(server))

  await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve))
  console.log(`🚀 Server ready at http://localhost:4000/graphql`)
}

startServer()
```

---

## **3. Define your schema with `Upload` scalar**

`graphql-upload` provides an `Upload` scalar type that represents the uploaded file.

```ts
// schema.ts
import { gql } from 'graphql-tag'

const typeDefs = gql`
  scalar Upload

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  type Mutation {
    uploadFile(file: Upload!): File!
  }
`

export default typeDefs
```

---

## **4. Create the resolver to handle file saving**

The `Upload` type resolves to a `Promise<FileUpload>`, where `FileUpload` has `{ filename, mimetype, encoding, createReadStream }`.

```ts
// resolvers.ts
import { FileUpload } from 'graphql-upload'
import fs from 'fs'
import path from 'path'

const resolvers = {
  Upload: require('graphql-upload').GraphQLUpload, // scalar

  Mutation: {
    async uploadFile(_: unknown, { file }: { file: Promise<FileUpload> }) {
      const { filename, mimetype, encoding, createReadStream } = await file

      const uploadDir = path.join(__dirname, '../uploads')
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

      const filepath = path.join(uploadDir, filename)

      // Save file to disk
      await new Promise((resolve, reject) => {
        createReadStream().pipe(fs.createWriteStream(filepath)).on('finish', resolve).on('error', reject)
      })

      return { filename, mimetype, encoding }
    },
  },
}

export default resolvers
```

---

## **5. Sending a file from a client**

GraphQL file uploads require sending **multipart/form-data** that follows the [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec).

Example with `apollo-upload-client` (frontend):

```bash
npm install apollo-upload-client
```

```ts
// client.ts
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { createUploadLink } from 'apollo-upload-client'
import gql from 'graphql-tag'

const client = new ApolloClient({
  link: createUploadLink({ uri: 'http://localhost:4000/graphql' }),
  cache: new InMemoryCache(),
})

const UPLOAD_FILE = gql`
  mutation ($file: Upload!) {
    uploadFile(file: $file) {
      filename
      mimetype
      encoding
    }
  }
`

// Example: sending a file from a <input type="file">
async function sendFile(file: File) {
  await client.mutate({
    mutation: UPLOAD_FILE,
    variables: { file },
  })
}
```

---

## **6. Notes & Tips**

- GraphQL uploads are usually **mutations**.
- Large files should probably be uploaded via a separate REST endpoint or direct-to-storage (S3, GCS) to avoid GraphQL performance issues.
- If you’re not using Apollo Server, you still can integrate `graphql-upload` manually with other GraphQL servers (like `express-graphql`).

---

If you want, I can also show you **how to send multiple files at once** and **stream them directly to cloud storage (S3)** without saving to disk first.
That avoids temporary local storage entirely.

# Question

How to call it from postman?

# Answer

Calling a GraphQL file upload from **Postman** is a little tricky because GraphQL normally expects JSON, but file uploads follow the **GraphQL multipart request spec**, which uses `multipart/form-data`.

Here’s how to do it step-by-step:

---

## **1. The request format**

The body of the request must have three fields:

- **operations** → a JSON string describing your GraphQL mutation and variables.
- **map** → tells GraphQL which file(s) in `form-data` belong to which variables.
- **file(s)** → the actual file(s) you’re sending.

---

## **2. Example mutation**

```graphql
mutation ($file: Upload!) {
  uploadFile(file: $file) {
    filename
    mimetype
    encoding
  }
}
```

---

## **3. Postman configuration**

In Postman:

1. Set method → `POST`
2. URL → `http://localhost:4000/graphql`
3. **Headers**:

   ```
   Content-Type: multipart/form-data
   ```

4. **Body** → select **form-data**, then add these keys:

| KEY        | TYPE | VALUE                                                                                                                        |
| ---------- | ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| operations | text | `{"query":"mutation ($file: Upload!) { uploadFile(file: $file) { filename mimetype encoding } }","variables":{"file":null}}` |
| map        | text | `{"0":["variables.file"]}`                                                                                                   |
| 0          | file | _(choose the file you want to send)_                                                                                         |

---

### **Visual mapping in Postman**

```
KEY          | TYPE   | VALUE
---------------------------------------------------------------
operations   | text   | {"query":"mutation ($file: Upload!) { uploadFile(file: $file) { filename mimetype encoding } }","variables":{"file":null}}
map          | text   | {"0":["variables.file"]}
0            | file   | <select your file here>
```

---

## **4. What’s happening**

- **operations**: contains your GraphQL mutation and sets `file` variable to `null` (placeholder).
- **map**: maps the file you attach (`0`) to the variable path `variables.file`.
- **0**: the actual file being sent.

---

## **5. Multiple files example**

If your mutation accepts `[Upload!]!` (array of uploads), your Postman body changes:

```
operations:
{"query":"mutation ($files: [Upload!]!) { uploadFiles(files: $files) { filename } }","variables":{"files":[null,null]}}
map:
{"0":["variables.files.0"],"1":["variables.files.1"]}
0: <first file>
1: <second file>
```

---

If you want, I can write you a **ready-to-paste Postman "raw" body** version that sends the file exactly as your server expects without manually configuring the form-data fields.
That way you can just import it into Postman and run it.

# Question

This operation has been blocked as a potential Cross-Site Request Forgery (CSRF). Please either specify a 'content-type' header (with a type that is not one of application/x-www-form-urlencoded, multipart/form-data, text/plain) or provide a non-empty value for one of the following headers: x-apollo-operation-name, apollo-require-preflight\n

# Answer

Ah, that error isn’t about the file upload itself — it’s Apollo Server’s **CSRF prevention** feature blocking the request.
By default, Apollo Server 4+ enables `csrfPrevention` for **non-GET** requests when the `Content-Type` is one of:

- `application/x-www-form-urlencoded`
- `multipart/form-data`
- `text/plain`

Since file uploads use `multipart/form-data`, Apollo thinks it might be a CSRF attack unless you send **extra headers** or disable the prevention.

---

## **Two ways to fix it**

### **Option 1 — Add an Apollo-expected header in Postman**

Apollo will allow the request if you set **one** of these headers:

1. `x-apollo-operation-name` → the name of your GraphQL mutation
2. `apollo-require-preflight` → any non-empty value

**In Postman:**

- Go to the **Headers** tab
- Add:

  ```
  x-apollo-operation-name: uploadFile
  ```

  _(or)_

  ```
  apollo-require-preflight: true
  ```

That way, CSRF prevention passes without turning it off.

---

### **Option 2 — Disable CSRF prevention in the server (not recommended for prod)**

In your Apollo Server setup:

```ts
const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: false, // 🚫 disable CSRF prevention
})
```

This is only safe if your API is protected another way (e.g., authentication, CORS locked to trusted domains).

---

### **Extra tip**

When testing with Postman, the easiest safe route is **Option 1**:

- Keep `multipart/form-data`
- Just add:

  ```
  x-apollo-operation-name: uploadFile
  ```

---

If you want, I can show you a **full Postman screenshot setup** with both the `form-data` upload fields and this extra header so it works with your GraphQL upload resolver right away.
Would you like me to prepare that?
