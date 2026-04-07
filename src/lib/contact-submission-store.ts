import type { ContactPayload } from './contact-schema'

export interface ContactSubmissionReceipt {
  submissionId: string
  receivedAt: string
  status: 'queued'
}

const CREATE_CONTACT_SUBMISSIONS_TABLE_SQL =
  'CREATE TABLE IF NOT EXISTS contact_submissions (submission_id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL, received_at TEXT NOT NULL)'

const INSERT_CONTACT_SUBMISSION_SQL = `
  INSERT INTO contact_submissions (
    submission_id,
    name,
    email,
    message,
    status,
    received_at
  ) VALUES (?, ?, ?, ?, ?, ?)
`

export async function storeContactSubmission(
  database: D1Database,
  payload: ContactPayload,
): Promise<ContactSubmissionReceipt> {
  const receipt: ContactSubmissionReceipt = {
    submissionId: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    status: 'queued',
  }

  await database.exec(CREATE_CONTACT_SUBMISSIONS_TABLE_SQL)
  await database
    .prepare(INSERT_CONTACT_SUBMISSION_SQL)
    .bind(
      receipt.submissionId,
      payload.name,
      payload.email,
      payload.message,
      receipt.status,
      receipt.receivedAt,
    )
    .run()

  return receipt
}
