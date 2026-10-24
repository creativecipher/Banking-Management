import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-placeholder',
  template: `
    <div class="text-center text-muted py-5">
      <i class="bi bi-tools fs-1"></i>
      <h1 class="h4 mt-3">{{ heading() }}</h1>
      <p class="mb-0">This screen will be built in Phase {{ phase() }}.</p>
    </div>
  `,
})
export class PagePlaceholder {
  readonly heading = input('Coming soon');
  readonly phase = input<number>();
}