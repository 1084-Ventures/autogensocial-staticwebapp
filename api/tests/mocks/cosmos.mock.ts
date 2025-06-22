import { CosmosClient } from '@azure/cosmos';
import { jest } from '@jest/globals';


// Create mock functions
export const mockItemRead = jest.fn();
export const mockItemReplace = jest.fn();
export const mockItemsCreate = jest.fn();
export const mockItemsQuery = jest.fn();

// Mock the CosmosClient
jest.mock('@azure/cosmos', () => {
  return {
    CosmosClient: jest.fn().mockImplementation(() => ({
      database: jest.fn().mockReturnValue({
        container: jest.fn().mockReturnValue({
          item: jest.fn().mockReturnValue({
            read: mockItemRead,
            replace: mockItemReplace
          }),
          items: {
            create: mockItemsCreate,
            query: mockItemsQuery
          }
        })
      })
    }))
  };
});