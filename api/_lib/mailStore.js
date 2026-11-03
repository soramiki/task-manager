// 提出メールから読み取った「科目名・課題名」の置き場所（Upstash Redis）
// ・置くのは科目名・課題名・届いた日時だけ。メールの本文そのものは置かない
// ・スマホが受け取ったら消す
// ・自分のPCで試すときはメモリに置く

import { Redis } from '@upstash/redis'

const LIST_KEY = 'mail:submissions'
const MAX_ITEMS = 200 // 受け取られないまま増えすぎないように

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (url && token) return new Redis({ url, token })
  if (process.env.VERCEL) throw new Error('データベースが設定されていません')
  return null
}

const memory = []

// 合言葉（連携キー）が正しいか。キーが設定されていなければ、だれも使えない
export function isValidMailKey(key) {
  const expected = process.env.MAIL_KEY
  return Boolean(expected) && typeof key === 'string' && key === expected
}

export async function addSubmissions(items) {
  if (items.length === 0) return
  const redis = getRedis()
  if (redis) {
    await redis.rpush(LIST_KEY, ...items.map((item) => JSON.stringify(item)))
    await redis.ltrim(LIST_KEY, -MAX_ITEMS, -1)
  } else {
    memory.push(...items)
    memory.splice(0, Math.max(0, memory.length - MAX_ITEMS))
  }
}

// 置いてあるものを全部受け取って、置き場所からは消す
export async function takeSubmissions() {
  const redis = getRedis()
  if (!redis) return memory.splice(0, memory.length)
  const [items] = await redis.multi().lrange(LIST_KEY, 0, -1).del(LIST_KEY).exec()
  return (items ?? []).map((item) => (typeof item === 'string' ? JSON.parse(item) : item))
}
