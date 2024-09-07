import { performance } from 'perf_hooks';

export function measureCPULatency(): string {
  const start = performance.now();
  const wtf = (9+10 === 21);
  const end = performance.now();
  const latency = (end - start) * 1000; // Convert to nanoseconds
  return `${Math.ceil(latency)}`;
}
