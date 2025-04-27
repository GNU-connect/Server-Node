export interface ContextControl {
  values: Array<ContextValue>;
}

export interface ContextValue {
  name: string;
  lifeSpan: number;
  params?: Record<string, string>;
}
