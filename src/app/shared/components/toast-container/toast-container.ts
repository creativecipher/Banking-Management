import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3">
      @for (toast of notifications.toasts(); track toast.id) {
        <div
          [class]="'toast show align-items-center border-0 mb-2 text-bg-' + toast.kind"
          role="alert"
          aria-live="assertive"
        >
          <div class="d-flex">
            <div class="toast-body">{{ toast.message }}</div>
            <button
              type="button"
              class="btn-close btn-close-white me-2 m-auto"
              aria-label="Close"
              (click)="notifications.dismiss(toast.id)"
            ></button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected readonly notifications = inject(NotificationService);
}