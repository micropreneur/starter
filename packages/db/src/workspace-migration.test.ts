import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const migrations = fileURLToPath(new URL('../migrations/', import.meta.url))

describe('workspace ownership migration', () => {
  it('backfills each user into a personal workspace and preserves operation ownership', () => {
    const database = new DatabaseSync(':memory:')
    for (const name of [
      '0000_moaning_siren.sql',
      '0001_gray_patch.sql',
      '0002_stiff_santa_claus.sql',
    ]) {
      database.exec(readFileSync(`${migrations}${name}`, 'utf8'))
    }

    database
      .prepare(
        'INSERT INTO users (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run('user-1', 'Ada', 'ada@example.com', 1, 1, 1)
    database
      .prepare(
        'INSERT INTO operation_records (id, user_id, title, summary, status, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run('record-1', 'user-1', 'Legacy record', '', 'active', 'high', 1, 1)

    database.exec(readFileSync(`${migrations}0003_freezing_sir_ram.sql`, 'utf8'))

    expect(database.prepare('SELECT id, created_by_user_id FROM workspaces').get()).toMatchObject({
      id: 'personal:user-1',
      created_by_user_id: 'user-1',
    })
    expect(
      database.prepare('SELECT workspace_id, user_id, role, status FROM workspace_members').get(),
    ).toMatchObject({
      role: 'owner',
      status: 'active',
      user_id: 'user-1',
      workspace_id: 'personal:user-1',
    })
    expect(
      database.prepare('SELECT workspace_id, title FROM operation_records').get(),
    ).toMatchObject({ title: 'Legacy record', workspace_id: 'personal:user-1' })
    expect(database.prepare("PRAGMA foreign_key_list('operation_records')").get()).toMatchObject({
      from: 'workspace_id',
      table: 'workspaces',
    })

    database.close()
  })
})
