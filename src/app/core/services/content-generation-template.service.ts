import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import type { components } from '../../generated/models';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class ContentGenerationTemplateService {
  private apiUrl = '/api/content_generation_template_management';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  getTemplates(params?: components["parameters"]["pagination"]): Observable<components["schemas"]["ContentGenerationTemplateDocument"][]> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }
    return this.http.get<components["schemas"]["ContentGenerationTemplateDocument"][]>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }

  getTemplate(id: string): Observable<components["schemas"]["ContentGenerationTemplateDocument"]> {
    return this.http.get<components["schemas"]["ContentGenerationTemplateDocument"]>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }

  createTemplate(template: components["schemas"]["ContentGenerationTemplateCreate"]): Observable<components["schemas"]["ContentGenerationTemplateDocument"]> {
    return this.http.post<components["schemas"]["ContentGenerationTemplateDocument"]>(this.apiUrl, template)
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }

  updateTemplate(id: string, template: components["schemas"]["ContentGenerationTemplateUpdate"]): Observable<components["schemas"]["ContentGenerationTemplateDocument"]> {
    return this.http.put<components["schemas"]["ContentGenerationTemplateDocument"]>(`${this.apiUrl}/${id}`, template)
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
