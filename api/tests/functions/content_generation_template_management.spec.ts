import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import '../mocks/cosmos.mock';
import { HttpRequest } from '@azure/functions';
import { content_generation_template_management } from '../../src/functions/content_generation_template_management';
import { ContentGenerationTemplate, ContentType, DayOfWeek } from '../../src/models/content_generation_template.model';
import { mockItemRead, mockItemReplace, mockItemsCreate, mockItemsQuery } from '../mocks/cosmos.mock';

// Define base mock request properties
const baseMockRequestProps = {
  user: {},
  body: undefined,
  bodyUsed: false,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
  text: () => Promise.resolve(''),
  rawBody: undefined
};

// Define custom types for mocking
type MockRequest = Partial<HttpRequest> & {
  headers?: { [key: string]: string };
  query?: { [key: string]: string };
  json?: () => Promise<any>;
};

type CosmosQueryResponse<T> = {
  resources: T[];
};

describe('Content Generation Template Management', () => {
  const mockContext = {
    log: jest.fn(),
    executionContext: { functionName: 'testFunction' }
  };

  const validTemplate = {
    templateInfo: {
      name: 'Test Template',
      description: 'Test Description',
      brandId: '12345678-1234-4123-9abc-123456789abc',
      contentType: ContentType.POST
    },
    schedule: {
      daysOfWeek: [DayOfWeek.MONDAY],
      timeSlots: [{
        hour: 12,
        minute: 0,
        timezone: 'America/New_York'
      }]
    },
    settings: {
      promptTemplate: {
        systemPrompt: 'Test system prompt',
        userPrompt: 'Test user prompt',
        model: 'gpt-4'
      },
      visualStyle: {
        colors: {
          primary: '#000000'
        }
      },
      contentStrategy: {
        keywords: ['test']
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockItemRead.mockResolvedValue({ 
      resource: {
        id: 'test-id',
        templateInfo: { name: 'Test Template' },
        metadata: { version: 1 }
      }
    });
    
    mockItemReplace.mockImplementation((template: ContentGenerationTemplate) => 
      Promise.resolve({ resource: template }));
    
    mockItemsCreate.mockImplementation((template: ContentGenerationTemplate) => 
      Promise.resolve({ resource: template }));
    
    const mockFetchAll = jest.fn<() => Promise<CosmosQueryResponse<ContentGenerationTemplate>>>()
      .mockResolvedValue({ resources: [] });
    
    mockItemsQuery.mockReturnValue({
      fetchAll: mockFetchAll
    });
  });

  describe('POST /content_generation_template_management', () => {
    it('should create a new template with valid data', async () => {
      const mockRequest = {
        ...baseMockRequestProps,
        method: 'POST',
        url: 'http://localhost/api/content_generation_template_management',
        headers: {
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        },
        json: () => Promise.resolve(validTemplate)
      } as MockRequest;

      const response = await content_generation_template_management(mockRequest as unknown as HttpRequest, mockContext as any);
      
      expect(response.status).toBe(201);
      const body = JSON.parse(response.body as string);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('name', validTemplate.templateInfo.name);
    });

    it('should return 422 when template data is invalid', async () => {
      const invalidTemplate = {
        ...validTemplate,
        templateInfo: {
          ...validTemplate.templateInfo,
          name: '' // Invalid: name is required
        }
      };

      const mockRequest = {
        ...baseMockRequestProps,
        method: 'POST',
        url: 'http://localhost/api/content_generation_template_management',
        headers: {
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        },
        json: () => Promise.resolve(invalidTemplate)
      } as MockRequest;

      const response = await content_generation_template_management(mockRequest as unknown as HttpRequest, mockContext as any);
      
      expect(response.status).toBe(422);
      const body = JSON.parse(response.body as string);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toBeDefined();
    });
  });

  describe('GET /content_generation_template_management', () => {
    it('should return templates for a given brand ID', async () => {
      mockItemsQuery.mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ 
          resources: [
            {
              id: 'test-id-1',
              templateInfo: { name: 'Template 1', brandId: 'test-brand' }
            },
            {
              id: 'test-id-2',
              templateInfo: { name: 'Template 2', brandId: 'test-brand' }
            }
          ]
        } as CosmosQueryResponse<ContentGenerationTemplate>)
      });

      const mockRequest = {
        ...baseMockRequestProps,
        method: 'GET',
        url: 'http://localhost/api/content_generation_template_management?brandId=test-brand',
        headers: {
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        },
        query: { brandId: 'test-brand' },
        params: {}
      } as MockRequest;

      const response = await content_generation_template_management(mockRequest as unknown as HttpRequest, mockContext as any);
      
      expect(response.status).toBe(200);
      const body = JSON.parse(response.body as string);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(2);
    });

    it('should return a specific template by ID', async () => {
      const mockRequest = {
        ...baseMockRequestProps,
        method: 'GET',
        url: 'http://localhost/api/content_generation_template_management/test-id',
        headers: {
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        },
        params: { id: 'test-id' }
      } as MockRequest;

      const response = await content_generation_template_management(mockRequest as unknown as HttpRequest, mockContext as any);
      
      expect(response.status).toBe(200);
      const body = JSON.parse(response.body as string);
      expect(body).toHaveProperty('id', 'test-id');
    });

    it('should return 404 for non-existent template ID', async () => {
      mockItemRead.mockRejectedValue(new Error('Not found'));

      const mockRequest = {
        ...baseMockRequestProps,
        method: 'GET',
        url: 'http://localhost/api/content_generation_template_management/non-existent',
        headers: {
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        },
        params: { id: 'non-existent' }
      } as MockRequest;

      const response = await content_generation_template_management(mockRequest as unknown as HttpRequest, mockContext as any);
      
      expect(response.status).toBe(404);
      const body = JSON.parse(response.body as string);
      expect(body.error).toBe('Template not found');
    });
  });

  describe('PUT /content_generation_template_management', () => {
    it('should update an existing template', async () => {
      const updateData = {
        templateInfo: {
          name: 'Updated Template Name'
        }
      };

      const mockRequest = {
        ...baseMockRequestProps,
        method: 'PUT',
        url: 'http://localhost/api/content_generation_template_management/test-id',
        headers: {
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        },
        params: { id: 'test-id' },
        json: () => Promise.resolve(updateData)
      } as MockRequest;

      const response = await content_generation_template_management(mockRequest as unknown as HttpRequest, mockContext as any);
      
      expect(response.status).toBe(200);
      const body = JSON.parse(response.body as string);
      expect(body).toHaveProperty('id', 'test-id');
    });

    it('should return 404 when updating non-existent template', async () => {
      mockItemRead.mockRejectedValue(new Error('Not found'));

      const mockRequest = {
        ...baseMockRequestProps,
        method: 'PUT',
        url: 'http://localhost/api/content_generation_template_management/non-existent',
        headers: {
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        },
        params: { id: 'non-existent' },
        json: () => Promise.resolve({ templateInfo: { name: 'New Name' } })
      } as MockRequest;

      const response = await content_generation_template_management(mockRequest as unknown as HttpRequest, mockContext as any);
      
      expect(response.status).toBe(404);
      const body = JSON.parse(response.body as string);
      expect(body.error).toBe('Template not found');
    });
  });
});