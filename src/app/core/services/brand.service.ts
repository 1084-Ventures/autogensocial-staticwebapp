import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import type { components } from '../../generated/models';
import { ErrorHandlerService } from './error-handler.service';

export type BrandDocument = components["schemas"]["BrandDocument"];
export type BrandCreate = components["schemas"]["BrandCreate"];
export type BrandUpdate = components["schemas"]["BrandUpdate"];
export type PaginationParams = components["parameters"]["pagination"];

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private apiUrl = '/api/brand_management';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  getBrands(params?: PaginationParams): Observable<BrandDocument[]> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http.get<BrandDocument[]>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }

  getBrand(id: string): Observable<BrandDocument> {
    return this.http.get<BrandDocument>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }

  createBrand(brand: BrandCreate): Observable<BrandDocument> {
    return this.http.post<BrandDocument>(this.apiUrl, brand)
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }

  updateBrand(id: string, brand: BrandUpdate): Observable<BrandDocument> {
    return this.http.put<BrandDocument>(`${this.apiUrl}/${id}`, brand)
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }

  deleteBrand(id: string): Observable<{ id: string }> {
    return this.http.delete<{ id: string }>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          throw error;
        })
      );
  }
}
