// 提出メールの自動連携（Outlook → 転送 → CloudMailin → アプリのサーバー → このスマホ）のスマホ側
// ・連携キー：サーバーから受け取るための合言葉（この端末にだけ保存）
// ・まだ結びつけられない提出（アプリにまだない課題）は、この端末に覚えておいて、あとで結びつける

const KEY_STORAGE = 'letus-app.mailKey'
const PENDING_STORAGE = 'letus-app.pendingSubmissions'
const KEEP_DAYS = 30 // 結びつけられない提出を覚えておく日数

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // 保存できない環境では、何もしない
  }
}

export function loadMailKey() {
  return read(KEY_STORAGE)
}

export function saveMailKey(key) {
  write(KEY_STORAGE, key)
}

export function removeMailKey() {
  write(KEY_STORAGE, null)
}

export function loadPending() {
  try {
    return JSON.parse(read(PENDING_STORAGE)) ?? []
  } catch {
    return []
  }
}

// 古すぎるものは捨ててから保存する
export function savePending(items, now = new Date()) {
  const limit = now.getTime() - KEEP_DAYS * 24 * 60 * 60 * 1000
  const kept = items.filter((item) => new Date(item.receivedAt).getTime() >= limit)
  write(PENDING_STORAGE, JSON.stringify(kept))
}

// サーバーから、届いた提出を受け取る（受け取ったものはサーバーから消える）
export async function fetchSubmissions(key) {
  const response = await fetch('/api/mail-submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error ?? '受け取れませんでした')
  }
  return (await response.json()).submissions ?? []
}
