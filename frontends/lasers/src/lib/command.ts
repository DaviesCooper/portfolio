export interface Command {
  type: 'goto' | 'on' | 'off';
  x?: number;
  y?: number;
}