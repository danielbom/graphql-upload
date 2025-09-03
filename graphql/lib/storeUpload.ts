import { createWriteStream, unlink } from 'node:fs'

import shortId from 'shortid'

import UPLOAD_DIRECTORY_URL from '../config/UPLOAD_DIRECTORY_URL'
import type { FileUpload } from 'graphql-upload/processRequest.mjs'

export interface FileArgs {
  filename: string
  mimetype: string
  encoding: string
}

/**
 * Stores a GraphQL file upload in the filesystem.
 * @returns Resolves the stored file name.
 */
export default async function storeUpload(upload: { file: FileUpload }): Promise<FileArgs> {
  const { createReadStream, filename, mimetype, encoding } = upload.file
  const stream = createReadStream()
  const storedFileName = `${shortId.generate()}-${filename}`
  const storedFileUrl = new URL(storedFileName, UPLOAD_DIRECTORY_URL)

  // Store the file in the filesystem.
  await new Promise<string>((resolve: any, reject) => {
    // Create a stream to which the upload will be written.
    const writeStream = createWriteStream(storedFileUrl)

    // When the upload is fully written, resolve the promise.
    writeStream.on('finish', resolve)

    // If there's an error writing the file, remove the partially written file
    // and reject the promise.
    writeStream.on('error', (error) => {
      unlink(storedFileUrl, () => {
        reject(error)
      })
    })

    // In Node.js <= v13, errors are not automatically propagated between piped
    // streams. If there is an error receiving the upload, destroy the write
    // stream with the corresponding error.
    stream.on('error', (error) => writeStream.destroy(error))

    // Pipe the upload into the write stream.
    stream.pipe(writeStream)
  })

  return {
    filename: storedFileName,
    mimetype,
    encoding,
  }
}
