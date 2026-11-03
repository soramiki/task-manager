// スマホが、届いた提出（科目名・課題名）を受け取る窓口
// 合言葉（連携キー）を POST の本文で送ってきたときだけ渡す。渡したものはサーバーから消す
import { readJsonBody, send } from './_lib/http.js'
import { isValidMailKey, takeSubmissions } from './_lib/mailStore.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST で送ってください' })
  try {
    const { key } = await readJsonBody(req)
    if (!isValidMailKey(key)) return send(res, 401, { error: '連携キーが違います' })
    return send(res, 200, { submissions: await takeSubmissions() })
  } catch (error) {
    return send(res, 500, { error: error.message })
  }
}
