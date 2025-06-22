import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import type { components } from '../generated/models';
import { ErrorHandlerService } from './error-handler.service';

export type ContentGenerationTemplateDocument = components["schemas"]["ContentGenerationTemplateDocument"];
export type ContentGenerationTemplateCreate = components["schemas"]["ContentGenerationTemplateCreate"];
export type ContentGenerationTemplateUpdate = components["schemas"]["ContentGenerationTemplateUpdate"];
export type PaginationParams = components["parameters"]["pagination"];

@Injectable({
  providedIn: 'root'
})
export class ContentGenerationTemplateService {
  private apiUrl = '/api/content_generation_template_management';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  getTemplates(params?: PaginationParams): Observable<ContentGenerationTemplateDocument[]> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
      if (params.sort_by) httpParams = httpParams.set('sortBy', params.sort_by);
      if (params.sort_order) httpParams = httpParams.set('sortOrder', params.sort_order);
    }
    return this.http.get<ContentGenerationTemplateDocument[]>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }

  getTemplate(id: string): Observable<ContentGenerationTemplateDocument> {
    return this.http.get<ContentGenerationTemplateDocument>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }

  createTemplate(template: ContentGenerationTemplateCreate): Observable<ContentGenerationTemplateDocument> {
    return this.http.post<ContentGenerationTemplateDocument>(this.apiUrl, template)
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }

  updateTemplate(id: string, template: ContentGenerationTemplateUpdate): Observable<ContentGenerationTemplateDocument> {
    return this.http.put<ContentGenerationTemplateDocument>(`${this.apiUrl}/${id}`, template)
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }

  deleteTemplate(id: string): Observable<{ id: string }> {
    return this.http.delete<{ id: string }>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }
}
