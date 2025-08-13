# Extracted from Postman
curl --location 'http://localhost:3000/graphql' \
    --header 'Content-Type: application/json' \
    --data '{"query":"query Query {\r\n    uploads\r\n}","variables":{}}'
