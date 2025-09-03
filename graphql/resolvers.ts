import { readdir } from 'node:fs/promises'
import UPLOAD_DIRECTORY_URL from './config/UPLOAD_DIRECTORY_URL'
import storeUpload, { type FileArgs } from './lib/storeUpload'
import type { Resolvers } from './types'

const resolvers: Resolvers = {
  Mutation: {
    singleUpload: async (parent, { file }, context) => {
      return storeUpload(await file)
    },
    multipleUpload: async (parent, { files: filesProfiles }, context) => {
      const storedFileNames: FileArgs[] = []

      // Ensure an error storing one upload doesn’t prevent storing the rest.
      await Promise.all(
        filesProfiles.map(async ({ promise }) => {
          try {
            const file = await promise
            storedFileNames.push(await storeUpload({ file }))
          } catch (error) {
            // Realistically you would do more than just log an error.
            console.error(`Failed to store upload: ${error}`)
          }
        }),
      )

      return storedFileNames
    },
  },
  Query: {
    uploads: () => readdir(UPLOAD_DIRECTORY_URL),
  },
}

export default resolvers
