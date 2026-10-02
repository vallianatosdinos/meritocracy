import { describe, expect, it } from 'vitest'
import { tenDigits as path } from '../content'
import type { RunResult } from '../engine'
import {
  activeHead,
  continuation,
  exploredKeys,
  fromHeads,
  initialExploration,
  press,
} from './explore'
import { buildGraph, canonOf } from './graph'

describe('pressing answers', () => {
  it('answering where a life stands moves that life on, for free', () => {
    const r = press(initialExploration(), '', 1)
    expect(r.kind).toBe('played')
    if (r.kind !== 'played') return
    expect(r.next.heads).toEqual(['1'])
  })

  it('pressing the other answer behind a life starts a new one, for free', () => {
    let e = initialExploration()
    for (const arm of [1, 1, 0] as const) {
      const r = press(e, activeHead(e), arm)
      if (r.kind === 'played') e = r.next
    }
    const r = press(e, '1', 0)
    expect(r.kind).toBe('played')
    if (r.kind !== 'played') return
    expect(activeHead(r.next)).toBe('10')
    // the life left behind is still there
    expect(r.next.heads).toContain('110')
  })

  it('goes back any distance, as often as the player likes', () => {
    let e = initialExploration()
    for (const arm of [1, 1, 1, 1] as const) e = press(e, activeHead(e), arm).next
    for (const key of ['', '1', '11']) {
      const r = press(e, key, 0)
      expect(r.kind).toBe('played')
      e = r.next
    }
    expect(activeHead(e)).toBe('110')
    expect(e.heads).toEqual(['1111', '0', '10', '110'])
  })

  it('pressing an answer somebody already pressed steps into that life, free', () => {
    let e = initialExploration()
    const a = press(e, '', 1)
    if (a.kind === 'played') e = a.next
    const b = press(e, '', 0)
    if (b.kind === 'played') e = b.next
    expect(activeHead(e)).toBe('0')
    const back = press(e, '', 1)
    expect(back.kind).toBe('switched')
    if (back.kind !== 'switched') return
    expect(activeHead(back.next)).toBe('1')
  })

  it('there is exactly one active path, and continuation follows it', () => {
    const e = fromHeads(['110', '0111'])
    expect(activeHead(e)).toBe('0111')
    expect(continuation(e, '')).toBe('0111')
    expect(continuation(e, '1')).toBe('110')
    expect(exploredKeys(e).has('011')).toBe(true)
    expect(exploredKeys(e).has('10')).toBe(false)
  })
})

describe('joined branches', () => {
  // A root whose non-tendency answer is never in reach: pressing it changes
  // nothing about her, so it must lead where the tendency leads.
  const blockedRoot = (): { seed: number; tendency: 0 | 1 } => {
    for (let seed = 0; seed < 200; seed++) {
      const g = buildGraph(path, seed, initialExploration(), new Map())
      const a = g.nodes.get('')?.appraisal
      if (!a) continue
      const other = a.tendencyIndex === 0 ? 1 : 0
      if (a.options[other].feasibility === 'never-in-reach') return { seed, tendency: a.tendencyIndex }
    }
    throw new Error('no birth with a blocked first fork')
  }

  it('a press that changes nothing joins the answer she did instead', () => {
    const { seed, tendency } = blockedRoot()
    const blocked = tendency === 0 ? 1 : 0
    const cache = new Map<string, RunResult>()
    const canon = canonOf(path, seed, cache)
    let e = press(initialExploration(), '', blocked, canon).next
    expect(activeHead(e)).toBe(String(tendency))
    e = press(e, '', tendency, canon).next
    // one life, not two, and both presses remembered
    expect(e.heads).toEqual([String(tendency)])
    expect(e.presses).toEqual([String(blocked), String(tendency)])
    const g = buildGraph(path, seed, e, cache)
    const arms = g.nodes.get('')?.arms
    expect(arms?.[blocked].played && arms?.[blocked].joined).toBe(true)
    expect(arms?.[blocked].record?.confabulated).toBe(true)
    expect(arms?.[tendency].joined).toBe(false)
    expect(g.rows.find((r) => r.depth === 1)?.keys).toEqual([String(tendency)])
  })

  it('an answer she actually managed keeps its own branch', () => {
    for (let seed = 0; seed < 200; seed++) {
      const cache = new Map<string, RunResult>()
      const a = buildGraph(path, seed, initialExploration(), cache).nodes.get('')?.appraisal
      if (!a) continue
      const other = a.tendencyIndex === 0 ? 1 : 0
      if (a.options[other].feasibility !== 'affordable') continue
      expect(canonOf(path, seed, cache)('', other)).toBe(String(other))
      return
    }
    throw new Error('no birth with an affordable first fork')
  })
})

describe('the graph', () => {
  it('lights what differs between forks exactly when the press changed what happened', () => {
    let lit = 0
    let same = 0
    for (let seed = 0; seed < 40; seed++) {
      const g = buildGraph(path, seed, fromHeads(['0', '1']), new Map<string, RunResult>())
      const row = g.rows.find((r) => r.depth === 1)
      expect(row?.keys).toHaveLength(2)
      const a = g.nodes.get('0')?.arrival
      const b = g.nodes.get('1')?.arrival
      const sameAct = a?.resolvedIndex === b?.resolvedIndex && a?.energySpent === b?.energySpent
      if (sameAct) {
        expect(row?.differs.size).toBe(0)
        same++
      } else {
        expect(row?.differs.size).toBeGreaterThan(0)
        lit++
      }
    }
    // both cases actually occur across births
    expect(lit).toBeGreaterThan(0)
    expect(same).toBeGreaterThan(0)
  })

  it('prints each question once per row however many forks the row holds', () => {
    const g = buildGraph(path, 3, fromHeads(['00', '01', '10', '11']), new Map())
    expect(g.rows.map((r) => r.keys.length)).toEqual([1, 2, 4])
  })
})
