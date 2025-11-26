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
        url: 'https://team-kod-pisat-dyploit-pushit-production.up.railway.app',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {            
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [                 
      {
        bearerAuth: []
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
  console.log('OpenAPI spec generated from code annotations!');
}

module.exports = { swaggerSpec, swaggerUi, saveGeneratedSpec };
