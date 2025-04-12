import '@jest/globals';
import { expect } from '@jest/globals';

// Set up environment variables for testing
process.env.COSMOS_DB_CONNECTION_STRING = 'mock_connection_string';
process.env.COSMOS_DB_NAME = 'mock_database';
process.env.COSMOS_DB_CONTAINER_TEMPLATE = 'mock_container';

// Add Jest matchers
expect.extend({
  toHaveProperty(received: any, property: string, expectedValue?: any) {
    const hasProperty = Object.prototype.hasOwnProperty.call(received, property);
    const pass = expectedValue === undefined 
      ? hasProperty 
      : hasProperty && received[property] === expectedValue;

    return {
      pass,
      message: () =>
        `expected ${JSON.stringify(received)} ${pass ? 'not ' : ''}to have property ${property}${
          expectedValue !== undefined ? ` with value ${expectedValue}` : ''
        }`,
    };
  },
});