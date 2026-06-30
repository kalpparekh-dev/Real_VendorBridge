import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VendorBridge Enterprise API',
      version: '1.0.0',
      description:
        'Enterprise procurement and vendor management SaaS API with RFQs, quotations, approvals, purchase orders, invoices, payments, analytics, audit logs and AI procurement assistant.',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Local Development Server',
      },
    ],
    tags: [
      { name: 'Authentication' },
      { name: 'Vendors' },
      { name: 'RFQs' },
      { name: 'Quotations' },
      { name: 'Purchase Orders' },
      { name: 'Invoices' },
      { name: 'Reports' },
      { name: 'Analytics' },
      { name: 'AI Assistant' },
      { name: 'Executive Report' },
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
        bearerAuth: [],
      },
    ],
    paths: {
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'admin@vendorbridge.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            400: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register user',
          responses: {
            201: { description: 'User registered' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/vendors': {
        get: {
          tags: ['Vendors'],
          summary: 'Get all vendors',
          responses: {
            200: { description: 'Vendor list returned' },
          },
        },
        post: {
          tags: ['Vendors'],
          summary: 'Create vendor',
          responses: {
            201: { description: 'Vendor created' },
          },
        },
      },
      '/rfqs': {
        get: {
          tags: ['RFQs'],
          summary: 'Get all RFQs',
          responses: {
            200: { description: 'RFQ list returned' },
          },
        },
        post: {
          tags: ['RFQs'],
          summary: 'Create RFQ',
          responses: {
            201: { description: 'RFQ created' },
          },
        },
      },
      '/quotations': {
        get: {
          tags: ['Quotations'],
          summary: 'Get quotations',
          responses: {
            200: { description: 'Quotation list returned' },
          },
        },
        post: {
          tags: ['Quotations'],
          summary: 'Submit quotation',
          responses: {
            201: { description: 'Quotation submitted' },
          },
        },
      },
      '/purchase-orders': {
        get: {
          tags: ['Purchase Orders'],
          summary: 'Get purchase orders',
          responses: {
            200: { description: 'Purchase orders returned' },
          },
        },
      },
      '/invoices': {
        get: {
          tags: ['Invoices'],
          summary: 'Get invoices',
          responses: {
            200: { description: 'Invoice list returned' },
          },
        },
      },
      '/reports/spend-by-category': {
        get: {
          tags: ['Reports'],
          summary: 'Spend by category report',
          responses: {
            200: { description: 'Spend by category returned' },
          },
        },
      },
      '/analytics/dashboard': {
        get: {
          tags: ['Analytics'],
          summary: 'Executive analytics dashboard',
          parameters: [
            { name: 'from', in: 'query', schema: { type: 'string' } },
            { name: 'to', in: 'query', schema: { type: 'string' } },
            { name: 'vendorId', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Executive dashboard analytics returned' },
          },
        },
      },
      '/ai/chat': {
        post: {
          tags: ['AI Assistant'],
          summary: 'Ask VendorBridge AI procurement assistant',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Give executive insights',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'AI answer returned' },
          },
        },
      },
      '/executive-report/pdf': {
        get: {
          tags: ['Executive Report'],
          summary: 'Download executive PDF report',
          responses: {
            200: {
              description: 'Executive report PDF downloaded',
              content: {
                'application/pdf': {},
              },
            },
          },
        },
      },
    },
  },
  apis: [],
});