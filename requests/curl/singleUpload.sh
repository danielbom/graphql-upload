# Extracted from Postman
curl --location 'http://localhost:3000/graphql' \
    --header 'x-apollo-operation-name: singleUpload' \
    --form 'operations="{\"query\":\"mutation (\$file: Upload\!) { singleUpload(file: \$file) { filename mimetype encoding } }\",\"variables\":{\"file\":null}}"' \
    --form 'map="{\"0\":[\"variables.file\"]}"' \
    --form '0=@"../sample/react.png"'
