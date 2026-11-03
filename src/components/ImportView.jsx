import { useState } from 'react'
import { formatDateTime } from '../utils/date.js'
import { SubmissionMailButton } from './SubmissionMail.jsx'
import { parseIcs } from '../utils/ics.js'
import { importEvents } from '../utils/importEvents.js'
import {
  fetchLetusIcs,
  isLetusCalendarUrl,
  loadCalendarUrl,
  removeCalendarUrl,
  saveCalendarUrl,
} from '../utils/letusCalendar.js'

const LETUS_EXPORT_URL = 'https://letus.ed.tus.ac.jp/calendar/export.php'

// 「取り込み」の画面：LETUS の課題を、手で入力せずに入れる
// 1. カレンダーURLから受け取る → 2. 何が変わるかを確認 → 3. 取り込む
export function ImportView({ tasks, lastImport, now, onImport, onCompleteTasks }) {
  const [preview, setPreview] = useState(null) // 確認中の内容
  const [error, setError] = useState('')
  const [message, setMessage] = useState('') // 取り込み後のお知らせ
  // 締切を過ぎた新しい課題を「完了」にして取り込むか（最初はオン）
  const [markPastAsDone, setMarkPastAsDone] = useState(true)
  // 保存してあるカレンダーURL（なければ null）と、LETUS から受け取っている最中か
  const [calendarUrl, setCalendarUrl] = useState(loadCalendarUrl)
  const [isLoading, setIsLoading] = useState(false)

  // .ics の中身を読んで、取り込んだら何が変わるかを計算する（まだ反映はしない）
  function prepare(text, fileName) {
    setMessage('')
    const { events, skipped } = parseIcs(text)
    if (events.length === 0) {
      setPreview(null)
      setError(
        'LETUSの課題が見つかりませんでした。LETUSから書き出した .ics ファイルか確認してください。',
      )
      return
    }
    setError('')
    setPreview({ fileName, events, skipped })
  }

  // 確認画面に出す結果。チェックを切り替えたらすぐ数が変わるように、表示のたびに計算する
  let previewResult = null
  if (preview) {
    let n = 0
    previewResult = importEvents(tasks, preview.events, () => `preview-${n++}`, {
      markPastAsDone,
      now,
    })
  }

  // カレンダーURLを使って、LETUS から最新の .ics を受け取る
  async function fetchFromLetus(url = calendarUrl) {
    setIsLoading(true)
    setError('')
    setMessage('')
    try {
      prepare(await fetchLetusIcs(url), 'LETUS（カレンダーURL）')
    } catch (e) {
      setPreview(null)
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  // URL を保存したら、そのまま1回受け取ってみる
  function handleSaveUrl(url) {
    saveCalendarUrl(url)
    setCalendarUrl(url)
    fetchFromLetus(url)
  }

  function handleRemoveUrl() {
    if (!window.confirm('この端末に保存したカレンダーURLを削除しますか？')) return
    removeCalendarUrl()
    setCalendarUrl(null)
  }

  function confirmImport() {
    const { events } = preview
    const result = previewResult
    onImport(events, { markPastAsDone })
    setMessage(
      `取り込みました（追加 ${result.added.length}件・更新 ${result.updated.length}件・変更なし ${result.unchangedCount}件）`,
    )
    setPreview(null)
  }

  return (
    <section aria-labelledby="import-heading">
      <h2 id="import-heading" className="page-heading">
        LETUSから取り込み
      </h2>
      <p className="page-note">
        前回の取り込み：
        {lastImport ? formatDateTime(lastImport) : 'まだ取り込んだことがありません'}
      </p>

      {error && <p className="form__error">{error}</p>}
      {message && <p className="import-message">{message}</p>}

      {!preview && (
        <>
          {calendarUrl ? (
            <div className="import-card">
              <p className="import-card__status">カレンダーURL：設定済み（この端末にだけ保存）</p>
              <button
                type="button"
                className="button button--primary import-card__main"
                onClick={() => fetchFromLetus()}
                disabled={isLoading}
              >
                {isLoading ? 'LETUSから受け取っています…' : 'LETUSから最新の課題を取り込む'}
              </button>
              <div className="import-card__links">
                <button type="button" className="link-button" onClick={handleRemoveUrl}>
                  カレンダーURLを削除
                </button>
              </div>
            </div>
          ) : (
            <CalendarUrlSetup onSave={handleSaveUrl} />
          )}
        </>
      )}

      {preview && (
        <ImportPreview
          preview={preview}
          result={previewResult}
          markPastAsDone={markPastAsDone}
          onChangeMarkPastAsDone={setMarkPastAsDone}
          onConfirm={confirmImport}
          onCancel={() => setPreview(null)}
        />
      )}

      <div className="import-card">
        <h3 className="import-card__heading">提出したことを記録する</h3>
        <p className="page-note">LETUSから届く「提出を送信しました」のメール（Outlook）の文を読み取って、その課題を「完了」にします。</p>
        <SubmissionMailButton tasks={tasks} onComplete={onCompleteTasks} />
      </div>

      <div className="import-help">
        <h3 className="import-help__heading">説明</h3>

        <details className="import-help__item">
          <summary>カレンダーURLのしくみ</summary>
          <ul>
            <li>LETUSの「カレンダーURL」は、ログインしなくても自分の予定を読めるURLです。一度このアプリに保存すれば、次からはボタン1つで最新の課題を取り込めます。</li>
            <li>アプリから直接LETUSを読むことはブラウザの決まりでできないため、このアプリのサーバー側の処理（中継役）を通して受け取ります。中継役はURLを保存しません。</li>
            <li>URLはパスワードと同じように大切に扱ってください。人に送ったり、SNSやチャットに貼ったりしないでください。</li>
          </ul>
        </details>

        <details className="import-help__item">
          <summary>取り込みのルール</summary>
          <ul>
            <li>「〇〇の提出期限」と「〇〇の受験可能期間の終了」は締切、「〇〇の受験可能期間の開始」は開始日時として取り込みます。</li>
            <li>開始と終了は、科目名と課題名が同じなら1件にまとめます。</li>
            <li>前に取り込んだ課題は、科目と日付だけを新しくします（締切の延長に対応）。</li>
            <li>同じ科目名・課題名で自分が登録した課題があれば、空いている日付を埋めます。</li>
            <li>完了チェックは変えません。</li>
          </ul>
        </details>

      </div>
    </section>
  )
}

// 取り込む前の確認：何件追加・更新されるか
function ImportPreview({
  preview,
  result,
  markPastAsDone,
  onChangeMarkPastAsDone,
  onConfirm,
  onCancel,
}) {
  const { fileName, skipped } = preview
  // 追加する課題のうち、締切を過ぎているもの（チェックのオン・オフに関係なく数える）
  const { pastCount } = result
  const hasChanges = result.added.length > 0 || result.updated.length > 0

  return (
    <div className="import-preview">
      <p className="import-preview__file">{fileName}</p>
      <div className="import-preview__counts">
        <span>
          追加 <strong>{result.added.length}</strong>件
        </span>
        <span>
          更新 <strong>{result.updated.length}</strong>件
        </span>
        <span>
          変更なし <strong>{result.unchangedCount}</strong>件
        </span>
      </div>
      {skipped > 0 && (
        <p className="import-preview__note">課題ではない予定 {skipped}件は取り込みません。</p>
      )}

      {pastCount > 0 && (
        <label className="import-preview__option">
          <input
            type="checkbox"
            checked={markPastAsDone}
            onChange={(e) => onChangeMarkPastAsDone(e.target.checked)}
          />
          <span>
            締切を過ぎた課題（{pastCount}件）は「完了」にして取り込む
            <small>LETUSには提出したかどうかの情報がないため、提出済みとみなします。出し忘れがあれば一覧の「完了」から戻せます。</small>
          </span>
        </label>
      )}

      {hasChanges ? (
        <ul className="import-preview__list">
          {[...result.added.map((t) => ['追加', t]), ...result.updated.map((t) => ['更新', t])].map(
            ([label, task]) => (
              <li key={task.id}>
                <span className={`import-preview__tag import-preview__tag--${label === '追加' ? 'add' : 'update'}`}>
                  {label}
                </span>
                {task.done && label === '追加' && (
                  <span className="import-preview__tag import-preview__tag--done">完了</span>
                )}
                <span className="import-preview__subject">{task.subject}</span>
                {task.title}
                <span className="import-preview__due">
                  {task.dueAt ? `締切 ${formatDateTime(task.dueAt)}` : '締切未定'}
                </span>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="import-preview__note">新しい課題や変更はありません。</p>
      )}

      <div className="form__actions">
        <button type="button" className="button" onClick={onCancel}>
          やめる
        </button>
        <button type="button" className="button button--primary" onClick={onConfirm}>
          取り込む
        </button>
      </div>
    </div>
  )
}

// カレンダーURLの設定（最初の1回だけ）
function CalendarUrlSetup({ onSave }) {
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const url = input.trim()
    if (!isLetusCalendarUrl(url)) {
      setInputError(
        'LETUSのカレンダーURL（https://letus.ed.tus.ac.jp/calendar/export_execute.php で始まるURL）を貼り付けてください',
      )
      return
    }
    setInputError('')
    onSave(url)
  }

  return (
    <div className="import-card">
      <h3 className="import-card__heading">最初の1回だけ：カレンダーURLを設定</h3>
      <ol className="import-card__steps">
        <li>
          LETUSにログインして{' '}
          <a href={LETUS_EXPORT_URL} target="_blank" rel="noreferrer">
            書き出しページ
          </a>{' '}
          を開く（SafariでOK）
        </li>
        <li>「すべてのイベント」と、期間「最近および次の60日間」を選ぶ</li>
        <li>
          <strong>カレンダーURLを取得</strong> を押し、出てきたURLをコピーする
        </li>
        <li>下の欄に貼り付けて「保存して取り込む」</li>
      </ol>
      <form onSubmit={handleSubmit} className="import-card__form">
        <input
          type="url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://letus.ed.tus.ac.jp/calendar/export_execute.php?…"
          aria-label="LETUSのカレンダーURL"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button type="submit" className="button button--primary">
          保存して取り込む
        </button>
      </form>
      {inputError && <p className="form__error">{inputError}</p>}
      <p className="import-card__note">
        このURLはパスワードと同じです。この端末のブラウザの中にだけ保存し、人に送ったりしないでください。
      </p>
    </div>
  )
}
