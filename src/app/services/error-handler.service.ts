import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../../../api/src/models/base.model';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(private snackBar: MatSnackBar) {}

  handleError(error: HttpErrorResponse): void {
    let message = 'An error occurred';
    let details = '';

    if (error.error) {
      const errorResponse = error.error as ErrorResponse;
      message = errorResponse.error;
      if (errorResponse.details?.length) {
        details = errorResponse.details.map(detail => `${detail.field}: ${detail.message}`).join('\n');
      }
    }

    this.snackBar.open(
      details ? `${message}\n${details}` : message,
      'Close',
      {
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: ['error-snackbar']
      }
    );
  }
}