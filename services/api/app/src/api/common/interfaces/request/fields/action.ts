import { DetailParam } from './etc';

export interface Action {
  id: string;
  name: string;
  params: Record<string, string>; // Simple key-value pairs
  detailParams: Record<string, DetailParam>;
  clientExtra?: Record<string, any>; // Optional additional information
}
