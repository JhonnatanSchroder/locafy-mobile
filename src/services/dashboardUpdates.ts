const listeners = new Set<() => void>();

export function subscribeDashboardUpdates(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyDashboardUpdate() {
  listeners.forEach(listener => listener());
}
