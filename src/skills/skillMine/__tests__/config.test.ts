import { describe, expect, it } from 'bun:test'
import {
  DEFAULT_CONFIG,
  DEFAULT_WINDOW_MS,
  formatInterval,
} from '../config.js'

describe('skillMine/config', () => {
  describe('formatInterval', () => {
    it('formats days', () => {
      expect(formatInterval(24 * 60 * 60 * 1000)).toBe('1d')
      expect(formatInterval(7 * 24 * 60 * 60 * 1000)).toBe('7d')
    })
    it('formats hours', () => {
      expect(formatInterval(60 * 60 * 1000)).toBe('1h')
      expect(formatInterval(12 * 60 * 60 * 1000)).toBe('12h')
    })
    it('formats minutes (floors to 1m minimum)', () => {
      expect(formatInterval(60 * 1000)).toBe('1m')
      expect(formatInterval(45 * 1000)).toBe('1m')
    })
  })

  describe('DEFAULT_CONFIG', () => {
    it('has 7-day default window', () => {
      expect(DEFAULT_CONFIG.windowMs).toBe(DEFAULT_WINDOW_MS)
      expect(DEFAULT_CONFIG.lastRunAt).toBe(0)
    })
  })
})
