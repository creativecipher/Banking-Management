import { Component, computed, input } from '@angular/core';
import { AccountStatus } from '../../../core/models/bank-account.model';

const BADGE_CLASS: Readonly<Record<AccountStatus, string>> = {
  ACTIVE: 'text-bg-success',
  FROZEN: 'text-bg-warning',
  INACTIVE: 'text-bg-secondary',
};

@Component({
  selector: 'app-account-status-badge',
  template: `<span [class]="'badge ' + cssClass()">{{ status() }}</span>`,
})
export class AccountStatusBadge {
  readonly status = input.required<AccountStatus>();
  protected readonly cssClass = computed(() => BADGE_CLASS[this.status()]);
}