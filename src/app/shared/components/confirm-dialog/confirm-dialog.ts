import { Component, input, output } from '@angular/core';

/**
 * Bootstrap-styled modal driven entirely by Angular (no Bootstrap JS).
 * The parent decides when it exists, using @if.
 */
@Component({
  selector: 'app-confirm-dialog',
  host: { '(document:keydown.escape)': 'cancelled.emit()' },
  template: `
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5" id="confirm-title">{{ title() }}</h2>
          </div>
          <div class="modal-body">{{ message() }}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" [disabled]="busy()" (click)="cancelled.emit()">
              Cancel
            </button>
            <button type="button" [class]="'btn ' + confirmClass()" [disabled]="busy()" (click)="confirmed.emit()">
              @if (busy()) {
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              }
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly confirmClass = input('btn-primary');
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}