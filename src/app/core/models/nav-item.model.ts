export interface NavItem {
  readonly label: string;
  readonly path: string;
  /** Bootstrap Icons class, e.g. 'bi-people' */
  readonly icon: string;
}

export interface NavSection {
  readonly heading: string;
  readonly items: readonly NavItem[];
}
