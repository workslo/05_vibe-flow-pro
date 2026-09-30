import { describe, expect, it } from 'vitest';

import {
  NODE_DRAG_MIME,
  isNodeDrag,
  parseNodeDragPayload,
} from './useDragAndDrop';

function dataTransfer(entries: Record<string, string>) {
  return {
    types: Object.keys(entries),
    getData: (format: string) => entries[format] ?? '',
  };
}

describe('parseNodeDragPayload', () => {
  it('returns the node type for a valid internal drag', () => {
    const dt = dataTransfer({
      [NODE_DRAG_MIME]: JSON.stringify({ id: 'generate-text-node' }),
    });

    expect(parseNodeDragPayload(dt)).toBe('generate-text-node');
  });

  it('ignores a drag without the node MIME type', () => {
    const dt = dataTransfer({ 'text/plain': 'hello' });

    expect(parseNodeDragPayload(dt)).toBeNull();
  });

  it('ignores a foreign file drag', () => {
    const dt = dataTransfer({ Files: '' });

    expect(parseNodeDragPayload(dt)).toBeNull();
  });

  it('ignores an empty payload', () => {
    const dt = dataTransfer({ [NODE_DRAG_MIME]: '' });

    expect(parseNodeDragPayload(dt)).toBeNull();
  });

  it('ignores malformed JSON without throwing', () => {
    const dt = dataTransfer({ [NODE_DRAG_MIME]: '{not json' });

    expect(() => parseNodeDragPayload(dt)).not.toThrow();
    expect(parseNodeDragPayload(dt)).toBeNull();
  });

  it('ignores an unknown node type', () => {
    const dt = dataTransfer({
      [NODE_DRAG_MIME]: JSON.stringify({ id: 'rm-rf-node' }),
    });

    expect(parseNodeDragPayload(dt)).toBeNull();
  });

  it('ignores inherited object keys posing as node types', () => {
    const dt = dataTransfer({
      [NODE_DRAG_MIME]: JSON.stringify({ id: 'toString' }),
    });

    expect(parseNodeDragPayload(dt)).toBeNull();
  });

  it('ignores JSON that is not an object', () => {
    const dt = dataTransfer({ [NODE_DRAG_MIME]: 'null' });

    expect(parseNodeDragPayload(dt)).toBeNull();
  });
});

describe('isNodeDrag', () => {
  it('accepts only drags advertising the node MIME type', () => {
    expect(isNodeDrag({ types: [NODE_DRAG_MIME] })).toBe(true);
    expect(isNodeDrag({ types: ['Files'] })).toBe(false);
  });
});
