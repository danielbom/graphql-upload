import express, { Router } from 'express'
import http from 'http'
import cors from 'cors'

import { fileURLToPath } from 'url'
import { makeDirectory } from 'make-dir'
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs'

import { ApolloServer, type BaseContext } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { expressMiddleware } from '@as-integrations/express5'

import UPLOAD_DIRECTORY_URL from './graphql/config/UPLOAD_DIRECTORY_URL'
import morgan from 'morgan'
import schema from './graphql/schema'

await makeDirectory(fileURLToPath(UPLOAD_DIRECTORY_URL))

const PORT = 3000
const app = express()
const httpServer = http.createServer(app)

app.use(morgan('dev'))

{
  const apolloServer = new ApolloServer<BaseContext>({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  await apolloServer.start()

  const graphql = Router()
  graphql.use(cors<cors.CorsRequest>())
  graphql.use(express.json())
  graphql.use(
    graphqlUploadExpress({
      // Limits here should be stricter than config for surrounding infrastructure
      // such as NGINX so errors can be handled elegantly by `graphql-upload`.
      maxFileSize: 10_000_000, // 10 MB
      maxFiles: 20,
    }),
  )
  graphql.use(expressMiddleware(apolloServer))
  app.use('/graphql', graphql)
}

await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve))
console.log(`App running at http://localhost:${PORT}`)
