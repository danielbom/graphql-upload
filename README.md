# GraphQL File Upload Test (TypeScript + Express)

This is a simple **TypeScript** project demonstrating file uploads in a **GraphQL** server using **Express**. The project includes single and multiple file upload mutations and a query to list uploaded files.

---

## Project Structure

```
.
├── index.ts # Main Express server
├── graphql/ # GraphQL implementation (schema + resolvers)
│ ├── schema.ts
│ └── resolvers.ts
├── requests/
│ ├── curl/ # Saved curl calls for testing
│ ├── http/ # HTTPyac request files
│ └── sample/ # Sample files used for testing uploads
├── notes/
│ └── chatgpt.md # Notes with Q&A from ChatGPT
├── package.json
└── tsconfig.json
```

## Testing

- **CURL** requests extracted from Postman are saved in `./requests/curl`.
- **HTTPYac** Request files are saved in `./requests/http`.
- **Example files** for testing are in `./requests/sample`.

## Usage

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Graphql code (types.ts + graphql.schema.json)
pnpm run graphql:codegen

# 3. Running
pnpm run start
```

Uses the requests in ./requests/curl or ./requests/http to access the endpoints. If you prefer, import the curl requests into Postman.

## Notes

* This project is for testing and learning purposes only.
* For production, consider storing uploaded files in cloud storage (S3, GCS) instead of the local file system.
* CSRF prevention is enabled by default in Apollo Server; use headers or disable with caution.

## References

- [Github: graphql-upload](https://github.com/jaydenseric/graphql-upload)
- [Apollo upload examples](https://github.com/jaydenseric/apollo-upload-examples)
