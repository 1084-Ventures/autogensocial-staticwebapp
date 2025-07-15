import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { components } from '../../generated/models';

export type MediaDocument = components["schemas"]["MediaDocument"];
export type MediaUpdate = Partial<components["schemas"]["MediaDocument"]>;
export type MediaAnalyze = components["schemas"]["MediaAnalyze"];

@Injectable({ providedIn: 'root' })
export class MediaService {
  private apiUrl = '/api/media';

  constructor(private http: HttpClient) {}

  getMediaByBrand(brandId: string): Observable<MediaDocument[]> {
    return this.http.get<MediaDocument[]>(`${this.apiUrl}?brandId=${brandId}`);
  }

  getMediaById(id: string): Observable<MediaDocument> {
    return this.http.get<MediaDocument>(`${this.apiUrl}/${id}`);
  }

  updateMedia(id: string, update: MediaUpdate): Observable<MediaDocument> {
    return this.http.put<MediaDocument>(`${this.apiUrl}/${id}`, update);
  }

  deleteMedia(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  uploadMedia(formData: FormData): Observable<MediaDocument> {
    return this.http.post<MediaDocument>(this.apiUrl, formData);
  }

  analyzeMedia(imageBase64: string): Observable<MediaAnalyze> {
    return this.http.post<MediaAnalyze>(
      '/api/analyze-media',
      { imageBase64 }
    );
  }
}
