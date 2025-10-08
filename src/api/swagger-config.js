// src/api/swagger-config.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const yaml = require('js-yaml');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movies & Users API',
      version: '1.0.0',
      description: 'REST API для керування користувачами та фільмами',
      contact: {
        name: 'API Support',
        email: 'team@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

function saveGeneratedSpec() {
  const yamlStr = yaml.dump(swaggerSpec);
  fs.mkdirSync('../../docs/api', { recursive: true });
  fs.writeFileSync('../../docs/api/openapi-generated.yaml', yamlStr);
  // fs.writeFileSync('../../docs/api/openapi-generated.json', JSON.stringify(swaggerSpec, null, 2));
  console.log('OpenAPI spec generated from code annotations!');
}

module.exports = { swaggerSpec, swaggerUi, saveGeneratedSpec };
