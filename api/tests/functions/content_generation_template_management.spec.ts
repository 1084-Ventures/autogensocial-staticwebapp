import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import '../mocks/cosmos.mock';
import { HttpRequest } from '@azure/functions';
import { contentGenerationTemplateManagement } from '../../src/functions/content_generation_template_management';
import { ContentGenerationTemplate, ContentType, DayOfWeek } from '../../src/models/content_generation_template.model';
import { mockItemRead, mockItemReplace, mockItemsCreate, mockItemsQuery } from '../mocks/cosmos.mock';

// Mock Headers implementation
class MockHeaders implements Headers {
  private headers: { [key: string]: string } = {};

  append(name: string, value: string): void {
    this.headers[name] = value;
  }

  delete(name: string): void {
    delete this.headers[name];
  }

  get(name: string): string | null {
    return this.headers[name] || null;
  }

  getSetCookie(): string[] {
    const cookies = this.headers['set-cookie'];
    return cookies ? [cookies] : [];
  }

  has(name: string): boolean {
    return name in this.headers;
  }

  set(name: string, value: string): void {
    this.headers[name] = value;
  }

  forEach(callbackfn: (value: string, key: string, parent: Headers) => void): void {
    Object.entries(this.headers).forEach(([key, value]) => {
      callbackfn(value, key, this as Headers);
    });
  }

  *entries(): IterableIterator<[string, string]> {
    yield* Object.entries(this.headers);
  }

  *keys(): IterableIterator<string> {
    yield* Object.keys(this.headers);
  }

  *values(): IterableIterator<string> {
    yield* Object.values(this.headers);
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }
}

// Define base mock request properties
const baseMockRequestProps: Partial<HttpRequest> = {
  method: undefined,
  url: '',
  headers: new MockHeaders(),
  query: new URLSearchParams(),
  params: {},
  user: {
    type: undefined as any, // workaround for HttpRequestUserType type error in test
    id: 'test-user',
    username: 'test-user',
    identityProvider: 'test',
    claimsPrincipalData: {}
  },
  body: undefined,
  bodyUsed: false,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve(new Blob() as any),
  formData: () => Promise.resolve(new FormData() as any),
  json: () => Promise.resolve({}),
  text: () => Promise.resolve('')
};

// Helper function to create mock headers
function createMockHeaders(headers: { [key: string]: string }): Headers {
  const mockHeaders = new MockHeaders();
  Object.entries(headers).forEach(([key, value]) => mockHeaders.set(key, value));
  return mockHeaders;
}

// Define custom types for mocking
type MockRequest = Partial<HttpRequest>;

type CosmosQueryResponse<T> = {
  resources: T[];
};

describe('content_generation_template_management', () => {
  const mockContext = {
    log: jest.fn(),
    executionContext: { functionName: 'testFunction' }
  };

  const validTemplate = {
    templateInfo: {
      name: 'Test Template',
      description: 'Test Description',
      brandId: '12345678-1234-4123-9abc-123456789abc',
      contentType: ContentType.TEXT
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
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful template read
    mockItemRead.mockReset().mockImplementation(() => Promise.resolve({ 
      resource: {
        id: 'test-id',
        templateInfo: { 
          name: 'Test Template',
          brandId: 'test-brand'
        },
        metadata: { version: 1 }
      }
    }));
    
    // Mock successful brand ownership verification by default
    mockItemRead.mockImplementationOnce(() => Promise.resolve({
      resource: {
        brandInfo: { userId: 'test-user' }
      }
    }));
    
    mockItemReplace.mockImplementation((template: ContentGenerationTemplate) => 
      Promise.resolve({ resource: template }));
    
    mockItemsCreate.mockImplementation((template: ContentGenerationTemplate) => 
      Promise.resolve({ resource: template }));
    
    // Fix type inference for fetchAll with proper return type
    mockItemsQuery.mockReturnValue({
      fetchAll: () => Promise.resolve({ resources: [] }) as Promise<{ resources: ContentGenerationTemplate[] }>
    });
  });

  describe('POST /content_generation_template_management', () => {
    it('should create a new template with valid data', async () => {
      const mockRequest = {
        ...baseMockRequestProps,
        method: 'POST',
        url: 'http://localhost/api/content_generation_template_management',
        headers: createMockHeaders({
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        }),
        json: () => Promise.resolve(validTemplate)
      } as MockRequest;

      const response = await contentGenerationTemplateManagement(mockRequest as unknown as HttpRequest, mockContext as any);
      
      expect(response.status).toBe(201);
      const body = JSON.parse(response.body as string);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('name', validTemplate.templateInfo.name);
      expect(body).toHaveProperty('templateInfo');
      expect(body).toHaveProperty('metadata');
      expect(body.metadata).toHaveProperty('version', 1);
      expect(body.metadata).toHaveProperty('createdAt');
      expect(body.metadata).toHaveProperty('updatedAt');
      expect(body.metadata).toHaveProperty('isActive', true);
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
        headers: createMockHeaders({
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        }),
        json: () => Promise.resolve(invalidTemplate)
      } as MockRequest;

      const response = await contentGenerationTemplateManagement(mockRequest as unknown as HttpRequest, mockContext as any);
      
      expect(response.status).toBe(422);
      const body = JSON.parse(response.body as string);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toBeDefined();
    });
  });

  describe('GET /content_generation_template_management', () => {
    it('should return templates for a given brand ID', async () => {
      const mockTemplates = [
        {
          id: 'test-id-1',
          templateInfo: { name: 'Template 1', brandId: 'test-brand' }
        },
        {
          id: 'test-id-2',
          templateInfo: { name: 'Template 2', brandId: 'test-brand' }
        }
      ];

      mockItemsQuery.mockReturnValue({
        fetchAll: () => Promise.resolve({ resources: mockTemplates })
      });

      const mockRequest = {
        ...baseMockRequestProps,
        method: 'GET',
        url: 'http://localhost/api/content_generation_template_management?brandId=test-brand',
        headers: createMockHeaders({
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        }),
        query: new URLSearchParams({ brandId: 'test-brand' }),
        params: {}
      } as MockRequest;

      const response = await contentGenerationTemplateManagement(mockRequest as unknown as HttpRequest, mockContext as any);
      
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
        headers: createMockHeaders({
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        }),
        params: { id: 'test-id' }
      } as MockRequest;

      const response = await contentGenerationTemplateManagement(mockRequest as unknown as HttpRequest, mockContext as any);
      
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
        headers: createMockHeaders({
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        }),
        params: { id: 'non-existent' }
      } as MockRequest;

      const response = await contentGenerationTemplateManagement(mockRequest as unknown as HttpRequest, mockContext as any);
      
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

      mockItemReplace.mockResolvedValueOnce({
        resource: {
          id: 'test-id',
          templateInfo: { 
            name: 'Updated Template Name',
            brandId: 'test-brand'
          },
          metadata: {
            version: 2,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            isActive: true
          }
        }
      });

      const mockRequest = {
        ...baseMockRequestProps,
        method: 'PUT',
        url: 'http://localhost/api/content_generation_template_management/test-id',
        headers: createMockHeaders({
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        }),
        params: { id: 'test-id' },
        json: () => Promise.resolve(updateData)
      } as MockRequest;

      const response = await contentGenerationTemplateManagement(mockRequest as unknown as HttpRequest, mockContext as any);
      
      expect(response.status).toBe(200);
      const body = JSON.parse(response.body as string);
      expect(body).toHaveProperty('id', 'test-id');
      expect(body.templateInfo).toHaveProperty('name', 'Updated Template Name');
      expect(body.metadata).toHaveProperty('version', 2);
      expect(body.metadata).toHaveProperty('updatedAt');
      expect(body.metadata).toHaveProperty('isActive', true);
    });

    it('should return 404 when updating non-existent template', async () => {
      mockItemRead.mockRejectedValue(new Error('Not found'));

      const mockRequest = {
        ...baseMockRequestProps,
        method: 'PUT',
        url: 'http://localhost/api/content_generation_template_management/non-existent',
        headers: createMockHeaders({
          'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
        }),
        params: { id: 'non-existent' },
        json: () => Promise.resolve({ templateInfo: { name: 'New Name' } })
      } as MockRequest;

      const response = await contentGenerationTemplateManagement(mockRequest as unknown as HttpRequest, mockContext as any);

      expect(response.status).toBe(404);
      const body = JSON.parse(response.body as string);
      expect(body.error).toBe('Template not found');
    });
  });

  describe('Brand Ownership Verification', () => {
    beforeEach(() => {
        // Mock brand container read for ownership verification
        mockItemRead
            .mockImplementationOnce(() => Promise.resolve({
                resource: {
                    brandInfo: { userId: 'test-user' }
                }
            }));
    });

    it('should deny template creation for unauthorized brand', async () => {
        // Mock brand not owned by user
        mockItemRead
            .mockImplementationOnce(() => Promise.resolve({
                resource: {
                    brandInfo: { userId: 'other-user' }
                }
            }));

        const mockRequest = {
            ...baseMockRequestProps,
            method: 'POST',
            url: 'http://localhost/api/content_generation_template_management',
            headers: createMockHeaders({
                'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
            }),
            json: () => Promise.resolve(validTemplate)
        } as MockRequest;

        const response = await contentGenerationTemplateManagement(mockRequest as unknown as HttpRequest, mockContext as any);
        
        expect(response.status).toBe(403);
        const body = JSON.parse(response.body as string);
        expect(body.error).toBe('Not authorized to create templates for this brand');
        expect(body.code).toBe('UNAUTHORIZED_BRAND_ACCESS');
    });

    it('should deny template update for unauthorized brand', async () => {
        // Mock existing template
        mockItemRead
            .mockImplementationOnce(() => Promise.resolve({
                resource: {
                    id: 'test-id',
                    templateInfo: { 
                        brandId: 'test-brand',
                        name: 'Test Template'
                    }
                }
            }))
            // Mock brand not owned by user
            .mockImplementationOnce(() => Promise.resolve({
                resource: {
                    brandInfo: { userId: 'other-user' }
                }
            }));

        const mockRequest = {
            ...baseMockRequestProps,
            method: 'PUT',
            url: 'http://localhost/api/content_generation_template_management/test-id',
            headers: createMockHeaders({
                'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
            }),
            params: { id: 'test-id' },
            json: () => Promise.resolve({ templateInfo: { name: 'Updated Name' } })
        } as MockRequest;

        const response = await contentGenerationTemplateManagement(mockRequest as unknown as HttpRequest, mockContext as any);
        
        expect(response.status).toBe(403);
        const body = JSON.parse(response.body as string);
        expect(body.error).toBe('Not authorized to modify templates for this brand');
        expect(body.code).toBe('UNAUTHORIZED_BRAND_ACCESS');
    });

    it('should deny template move to unauthorized brand', async () => {
        // Mock existing template with authorized brand
        mockItemRead
            .mockImplementationOnce(() => Promise.resolve({
                resource: {
                    id: 'test-id',
                    templateInfo: { 
                        brandId: 'current-brand',
                        name: 'Test Template'
                    }
                }
            }))
            // Mock current brand owned by user
            .mockImplementationOnce(() => Promise.resolve({
                resource: {
                    brandInfo: { userId: 'test-user' }
                }
            }))
            // Mock target brand not owned by user
            .mockImplementationOnce(() => Promise.resolve({
                resource: {
                    brandInfo: { userId: 'other-user' }
                }
            }));

        const mockRequest = {
            ...baseMockRequestProps,
            method: 'PUT',
            url: 'http://localhost/api/content_generation_template_management/test-id',
            headers: createMockHeaders({
                'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
            }),
            params: { id: 'test-id' },
            json: () => Promise.resolve({ 
                templateInfo: { 
                    brandId: 'new-brand',
                    name: 'Updated Name' 
                } 
            })
        } as MockRequest;

        const response = await contentGenerationTemplateManagement(mockRequest as unknown as HttpRequest, mockContext as any);
        
        expect(response.status).toBe(403);
        const body = JSON.parse(response.body as string);
        expect(body.error).toBe('Not authorized to move template to specified brand');
        expect(body.code).toBe('UNAUTHORIZED_BRAND_ACCESS');
    });

    it('should deny template listing for unauthorized brand', async () => {
        // Mock brand not owned by user
        mockItemRead
            .mockImplementationOnce(() => Promise.resolve({
                resource: {
                    brandInfo: { userId: 'other-user' }
                }
            }));

        const mockRequest = {
            ...baseMockRequestProps,
            method: 'GET',
            url: 'http://localhost/api/content_generation_template_management?brandId=test-brand',
            headers: createMockHeaders({
                'x-ms-client-principal': Buffer.from(JSON.stringify({ userId: 'test-user' })).toString('base64')
            }),
            query: new URLSearchParams({ brandId: 'test-brand' })
        } as MockRequest;

        const response = await contentGenerationTemplateManagement(mockRequest as unknown as HttpRequest, mockContext as any);
        
        expect(response.status).toBe(403);
        const body = JSON.parse(response.body as string);
        expect(body.error).toBe('Not authorized to view templates for this brand');
        expect(body.code).toBe('UNAUTHORIZED_BRAND_ACCESS');
    });
  });
});