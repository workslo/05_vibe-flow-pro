import { describe, expect, it } from 'vitest';

import { defaultBreakId, lineageBreaks, lineageStages } from './lineage-data';

describe('lineageStages', () => {
  it('has unique stage ids', () => {
    const ids = lineageStages.map((stage) => stage.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every stage an owner, system, and at least one data field', () => {
    for (const stage of lineageStages) {
      expect(stage.owner).not.toBe('');
      expect(stage.system).not.toBe('');
      expect(stage.dataFields.length).toBeGreaterThan(0);
    }
  });
});

describe('lineageBreaks', () => {
  it('has unique break ids', () => {
    const ids = lineageBreaks.map((lineageBreak) => lineageBreak.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references only real stage ids', () => {
    const stageIds = new Set(lineageStages.map((stage) => stage.id));

    for (const lineageBreak of lineageBreaks) {
      expect(lineageBreak.impactedStageIds.length).toBeGreaterThan(0);
      for (const stageId of lineageBreak.impactedStageIds) {
        expect(stageIds).toContain(stageId);
      }
    }
  });

  it('puts each break field on every impacted stage', () => {
    const stagesById = new Map(
      lineageStages.map((stage) => [stage.id, stage]),
    );

    for (const lineageBreak of lineageBreaks) {
      for (const stageId of lineageBreak.impactedStageIds) {
        const stage = stagesById.get(stageId);

        expect(stage?.dataFields).toContain(lineageBreak.field);
      }
    }
  });

  it('points defaultBreakId at a real break', () => {
    expect(lineageBreaks.map((lineageBreak) => lineageBreak.id)).toContain(
      defaultBreakId,
    );
  });
});
