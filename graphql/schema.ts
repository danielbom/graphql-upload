import { makeExecutableSchema } from '@graphql-tools/schema'
import { loadSchemaSync } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import resolvers from './resolvers'
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schema = makeExecutableSchema({
  typeDefs: loadSchemaSync(`${__dirname}/**/*.graphql`, {
    loaders: [new GraphQLFileLoader()],
  }),
  resolvers,
})

export default schema