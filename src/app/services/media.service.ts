import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// Reference models directly from the API directory
import { MediaDocument, MediaUpdate } from '../../../api/src/models/media.model';

export interface AnalyzeMediaResult {
  suggestedName: string;
  description: string;
  tags: { name: string; confidence: number }[];
  categories: { name: string; confidence: number }[];
  objects: { object: string; confidence: number; rectangle: { x: number; y: number; w: number; h: number } }[];
  caption?: { text: string; confidence: number };
  denseCaptions?: { text: string; confidence: number; boundingBox: { x: number; y: number; w: number; h: number } }[];
  brands?: { name: string; confidence: number }[];
  people?: { confidence: number; rectangle: { x: number; y: number; w: number; h: number } }[];
  ocrText?: string;
  cognitiveData?: any;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  private apiUrl = '/api/media_management';

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

  analyzeMedia(imageBase64: string) {
    return this.http.post<AnalyzeMediaResult>(
      '/api/analyze-media',
      { imageBase64 }
    );
  }
}
