import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { BrandDocument, BrandCreate, BrandUpdate, BrandNameResponse } from '../../../api/src/models/brand.model';
import { ErrorHandlerService } from './error-handler.service';
import { PaginationParams } from '../../../api/src/models/base.model';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private apiUrl = '/api/brand_management';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  getBrands(params?: PaginationParams): Observable<BrandNameResponse[]> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http.get<BrandNameResponse[]>(this.apiUrl, { params: httpParams })
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

  createBrand(brand: BrandCreate): Observable<BrandNameResponse> {
    return this.http.post<BrandNameResponse>(this.apiUrl, brand)
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
}