import { expect } from '@jest/globals';

/// <reference types="jest" />

// Set up environment variables for testing
process.env['COSMOS_DB_CONNECTION_STRING'] = 'mock_connection_string';
process.env['COSMOS_DB_NAME'] = 'mock_database';
process.env['COSMOS_DB_CONTAINER_TEMPLATE'] = 'mock_container';
process.env['COSMOS_DB_CONTAINER_BRAND'] = 'mock_brand_container';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveProperty(property: string, expectedValue?: any): R;
    }
  }
}

const toHaveProperty = (received: any, property: string, expectedValue?: any) => {
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
};

expect.extend({ toHaveProperty });