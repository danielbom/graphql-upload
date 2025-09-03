# Extracted from Postman
curl --location 'http://localhost:3000/graphql' \
    --header 'x-apollo-operation-name: multipleUpload' \
    --form 'operations={"query":"mutation ($files: [Upload!]!) { multipleUpload(files: $files) { filename mimetype encoding } }","variables":{"files":[null,null]}}' \
    --form 'map={"0":["variables.files.0"], "1":["variables.files.1"]}' \
    --form '0=@../samples/sql.png' \
    --form '1=@../samples/postgres.png'
