import type { LifecycleCommand } from '@numception/app';
import { describe, expect, it } from 'vitest';
import { databaseName } from './database-name';
import { type LifecycleDocument, type LifecycleWindow, webLifecycle } from './web-lifecycle';

/** A minimal event target with a settable visibility. */
function fakeTarget() {
  const listeners = new Map<string, Set<() => void>>();
  const target = {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: (type: string, fn: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(fn);
    },
    removeEventListener: (type: string, fn: () => void) => {
      listeners.get(type)?.delete(fn);
    },
    fire: (type: string) => {
      for (const fn of listeners.get(type) ?? []) fn();
    },
    count: () => [...listeners.values()].reduce((n, s) => n + s.size, 0),
  };
  return target;
}

describe('webLifecycle', () => {
  it('maps hidden and pagehide to Pause, visible and pageshow to Resume, and stops cleanly', () => {
    const doc = fakeTarget();
    const win = fakeTarget();
    const got: LifecycleCommand['type'][] = [];
    const stop = webLifecycle(doc as unknown as LifecycleDocument, win as unknown as LifecycleWindow).start((c) => got.push(c.type));
    expect(got).toEqual([]);
    doc.visibilityState = 'hidden';
    doc.fire('visibilitychange');
    win.fire('pagehide');
    win.fire('pageshow');
    doc.visibilityState = 'visible';
    doc.fire('visibilitychange');
    win.fire('pageshow');
    expect(got).toEqual(['Pause', 'Pause', 'Resume', 'Resume']);
    stop();
    expect(doc.count() + win.count()).toBe(0);
  });

  it('pauses at once when the page starts hidden', () => {
    const doc = fakeTarget();
    doc.visibilityState = 'hidden';
    const got: LifecycleCommand[] = [];
    webLifecycle(doc as unknown as LifecycleDocument, fakeTarget() as unknown as LifecycleWindow).start((c) => got.push(c));
    expect(got).toEqual([{ type: 'Pause', reason: 'lifecycle' }]);
  });
});

describe('databaseName', () => {
  it('namespaces the database by the flavour appId', () => {
    expect(databaseName('app.numception.dev')).not.toBe(databaseName('app.numception.playtest'));
    expect(databaseName('app.numception.playtest')).toBe('numception:app.numception.playtest');
  });
});
