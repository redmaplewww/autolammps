/**
 * Lazy accessor for proper-lockfile.
 *
 * proper-lockfile depends on graceful-fs, which monkey-patches every fs
 * method on first require (~8ms). Static imports of proper-lockfile pull this
 * cost into the startup path even when no locking happens (e.g. `--help`).
 *
 * Import this module instead of `proper-lockfile` directly. The underlying
 * package is only loaded the first time a lock function is actually called.
 */

import type { CheckOptions, LockOptions, UnlockOptions } from 'proper-lockfile'
import { closeSync, openSync, rmSync } from 'fs'

type RetryOptions = {
  retries?: number
  factor?: number
  minTimeout?: number
  maxTimeout?: number
}

function getLockPath(
  file: string,
  options?: LockOptions | UnlockOptions,
): string {
  return options?.lockfilePath ?? `${file}.lock`
}

function getRetryCount(retries: unknown): number {
  if (typeof retries === 'number') return retries
  if (Array.isArray(retries)) return retries.length
  if (retries && typeof retries === 'object') {
    return (retries as RetryOptions).retries ?? 0
  }
  return 0
}

function getRetryDelay(retries: unknown, attempt: number): number {
  if (!retries || typeof retries === 'number') return 0
  if (Array.isArray(retries)) {
    return retries[Math.min(attempt, retries.length - 1)] ?? 0
  }
  const retryOptions = retries as RetryOptions
  const factor = retryOptions.factor ?? 1
  const minTimeout = retryOptions.minTimeout ?? 0
  const maxTimeout = retryOptions.maxTimeout ?? minTimeout
  return Math.min(maxTimeout, minTimeout * Math.max(1, factor ** attempt))
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function acquireLockfile(lockPath: string): void {
  const fd = openSync(lockPath, 'wx')
  closeSync(fd)
}

async function acquireLockfileWithRetry(
  lockPath: string,
  options?: LockOptions,
): Promise<void> {
  const retries = getRetryCount(options?.retries)
  let attempt = 0

  while (true) {
    try {
      acquireLockfile(lockPath)
      return
    } catch (error) {
      const isLocked =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'EEXIST'
      if (!isLocked || attempt >= retries) throw error
      await sleep(getRetryDelay(options?.retries, attempt))
      attempt++
    }
  }
}

export function lock(
  file: string,
  options?: LockOptions,
): Promise<() => Promise<void>> {
  const lockPath = getLockPath(file, options)
  return acquireLockfileWithRetry(lockPath, options).then(() => {
    return async () => {
      rmSync(lockPath, { force: true })
    }
  })
}

export function lockSync(file: string, options?: LockOptions): () => void {
  const lockPath = getLockPath(file, options)
  acquireLockfile(lockPath)
  return () => {
    rmSync(lockPath, { force: true })
  }
}

export function unlock(file: string, options?: UnlockOptions): Promise<void> {
  const lockPath = getLockPath(file, options)
  rmSync(lockPath, { force: true })
  return Promise.resolve()
}

export function check(file: string, options?: CheckOptions): Promise<boolean> {
  const lockPath = getLockPath(file, options)
  try {
    const fd = openSync(lockPath, 'wx')
    closeSync(fd)
    rmSync(lockPath, { force: true })
    return Promise.resolve(false)
  } catch (error) {
    const isLocked =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'EEXIST'
    if (isLocked) return Promise.resolve(true)
    throw error
  }
}
