// CloudMailin（メールを受け取るサービス）から、転送されてきた提出メールを受け取る窓口
//
// ・アドレスに合言葉（?key=…）が付いていないと受け付けない
// ・本文から「科目名・課題名」を読み取って、それだけを保存する（本文そのものは保存しない）
// ・提出メールでなかったときも、受け取ったことにする（受け取りに失敗すると、CloudMailin が何度も送り直してくるため）

import { parseSubmissionMail } from '../src/utils/submissionMail.js'
import { readJsonBody, send } from './_lib/http.js'
import { addSubmissions, isValidMailKey } from './_lib/mailStore.js'

// HTML のメールしかないときのために、タグを取って文字だけにする
function htmlToText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
}

// CloudMailin から届いた中身を読む。JSON と multipart（フォームの形）のどちらでも読めるようにする
// 戻り値：{ plain, html }
async function readMail(req) {
  const type = req.headers['content-type'] ?? ''
  if (!type.includes('multipart/form-data')) return readJsonBody(req)

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const form = await new Response(Buffer.concat(chunks), { headers: { 'content-type': type } }).formData()
  return { plain: form.get('plain') ?? '', html: form.get('html') ?? '' }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST で送ってください' })

  const key = new URL(req.url, 'http://localhost').searchParams.get('key')
  if (!isValidMailKey(key)) return send(res, 401, { error: '合言葉が違います' })

  try {
    const mail = await readMail(req)
    // plain：文字だけの本文 / html：HTMLの本文
    const text = mail.plain || (mail.html ? htmlToText(mail.html) : '')
    const receivedAt = new Date().toISOString()
    const found = parseSubmissionMail(text).map((s) => ({ ...s, receivedAt }))
    await addSubmissions(found)
    // うまく読み取れなかったときに原因を調べるための記録（本文そのものは残さない）
    console.log(
      `mail-inbound: found=${found.length} plain=${(mail.plain ?? '').length} html=${(mail.html ?? '').length}` +
        ` 提出文=${text.includes('への提出を送信')} 課題行=${/->\s*課題/.test(text)}`,
    )
    return send(res, 200, { found: found.length })
  } catch (error) {
    return send(res, 500, { error: error.message })
  }
}
