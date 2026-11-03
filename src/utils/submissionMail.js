// LETUS（Moodle）から届く「提出しました」のメールの文から、どの課題を提出したかを読み取る
//
// メールの例：
//   微分積分および演習２（２組） (9987D01) ->課題 ->第7回演習課題
//   あなたは課題「 第7回演習課題 」への提出を送信しました。
//
// ・1行目から「科目名」と「課題名」を読む（科目名の後ろの授業コードは取る）
// ・1行目がなくても、「あなたは課題「〇〇」への提出を送信しました」から課題名だけは読む
// ・何通か分をまとめて貼り付けても、全部読む

// 「科目名 (授業コード) ->課題 ->課題名」の行
const HEADER = /^(.+?)\s*\(([^()\n]+)\)\s*->\s*課題\s*->\s*(.+?)\s*$/gm
// 「あなたは課題「 〇〇 」への提出を送信しました」
const SENTENCE = /あなたは課題「\s*(.+?)\s*」への提出を送信しました/g

// 比べるときは、全角・半角や空白の違いを気にしない（「２」と「2」、「（」と「(」など）
export function normalize(text) {
  return text.normalize('NFKC').replace(/\s+/g, '')
}

// 戻り値：[{ subject: 科目名（分からなければ null）, title: 課題名 }]（同じものは1つにまとめる）
export function parseSubmissionMail(text) {
  const found = []
  const seen = new Set()
  const add = (subject, title) => {
    const key = `${subject ? normalize(subject) : ''}|${normalize(title)}`
    if (seen.has(key)) return
    seen.add(key)
    found.push({ subject, title })
  }

  // 1. 科目名つきの行
  const titlesWithSubject = new Set()
  for (const m of text.matchAll(HEADER)) {
    add(m[1].trim(), m[3].trim())
    titlesWithSubject.add(normalize(m[3]))
  }
  // 2. 科目名がない文（1で読めなかった課題だけ）
  for (const m of text.matchAll(SENTENCE)) {
    if (!titlesWithSubject.has(normalize(m[1]))) add(null, m[1].trim())
  }
  return found
}

// 読み取った提出を、アプリの課題と結びつける
// 戻り値：[{ subject, title, task：見つかった課題（なければ null） }]
export function matchSubmissions(tasks, submissions) {
  return submissions.map((submission) => {
    const title = normalize(submission.title)
    const subject = submission.subject ? normalize(submission.subject) : null
    const candidates = tasks.filter(
      (task) => normalize(task.title) === title && (!subject || normalize(task.subject) === subject),
    )
    // 同じ名前の課題が複数あるときは、まだ終わっていない課題の中で締切が早いものを選ぶ
    const sorted = [...candidates].sort((a, b) => {
      if (Boolean(a.done) !== Boolean(b.done)) return a.done ? 1 : -1
      return (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999')
    })
    return { ...submission, task: sorted[0] ?? null }
  })
}
