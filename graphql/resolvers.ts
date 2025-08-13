import { readdir } from 'node:fs/promises'
import UPLOAD_DIRECTORY_URL from './config/UPLOAD_DIRECTORY_URL'
import storeUpload from './lib/storeUpload'
import type { Resolvers } from './types'

const resolvers: Resolvers = {
  Mutation: {
    singleUpload: (parent, { file }, context) => {
      return storeUpload(file)
    },
    multipleUpload: async (parent, { files }, context) => {
      const storedFileNames = []

      // Ensure an error storing one upload doesn’t prevent storing the rest.
      for (const result of await Promise.allSettled(files.map(storeUpload))) {
        if ('value' in result) storedFileNames.push(result.value)
        // Realistically you would do more than just log an error.
        else console.error(`Failed to store upload: ${result.reason}`)
      }

      return storedFileNames
    },
  },
  Query: {
    uploads: () => readdir(UPLOAD_DIRECTORY_URL),
  },
}

export default resolvers
