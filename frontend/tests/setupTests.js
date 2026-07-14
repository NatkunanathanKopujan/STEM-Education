import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

HTMLCanvasElement.prototype.getContext = HTMLCanvasElement.prototype.getContext || (() => ({}));
