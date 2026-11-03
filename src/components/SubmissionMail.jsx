import { useEffect, useState } from 'react'
import { formatDateTime } from '../utils/date.js'
import { matchSubmissions, parseSubmissionMail } from '../utils/submissionMail.js'

// 「提出メールから完了にする」ボタン。押すと小窓が開く
export function SubmissionMailButton({ tasks, onComplete }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <button type="button" className="button mail-button" onClick={() => setIsOpen(true)}>
        📧 提出メールから完了にする
      </button>
      {isOpen && (
        <SubmissionMailDialog tasks={tasks} onComplete={onComplete} onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}

// メールの文を読み取って、どの課題を完了にするか確かめる小窓
// メールの文はこの端末の中で読むだけで、どこにも送らない
function SubmissionMailDialog({ tasks, onComplete, onClose }) {
  const [text, setText] = useState('')
  const [results, setResults] = useState(null) // 読み取った結果（まだなら null）
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Escキーで閉じる
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function read(value) {
    setMessage('')
    const found = parseSubmissionMail(value)
    if (found.length === 0) {
      setResults(null)
      setError('提出のメールの文が見つかりませんでした。「あなたは課題「〇〇」への提出を送信しました」が入った本文をコピーしてください。')
      return
    }
    setError('')
    setResults(matchSubmissions(tasks, found))
  }

  // コピーした文を、ボタン1つで貼り付けて読む（使えないブラウザでは、欄に貼り付けてもらう）
  async function pasteFromClipboard() {
    try {
      const value = await navigator.clipboard.readText()
      setText(value)
      read(value)
    } catch {
      setError('貼り付けできませんでした。下の欄を長押しして「ペースト」してから、「読み取る」を押してください。')
    }
  }

  const toComplete = results?.filter((r) => r.task && !r.task.done) ?? []

  function handleComplete() {
    onComplete(toComplete.map((r) => r.task.id))
    setMessage(`${toComplete.length}件を「完了」にしました。`)
    setResults(null)
    setText('')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mail-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="mail-heading">提出メールから完了にする</h2>
        <p className="notice-text">
          Outlookで、LETUSから届いた「提出を送信しました」のメールを開き、本文をコピーしてください（何通分まとめてもOK）。
          <small>メールの文はこの端末の中で読むだけで、どこにも送りません。</small>
        </p>

        {message && <p className="import-message">{message}</p>}

        {!results && (
          <>
            {navigator.clipboard?.readText && (
              <button type="button" className="button button--primary mail-paste" onClick={pasteFromClipboard}>
                コピーした文を貼り付けて読み取る
              </button>
            )}
            <div className="field">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ここにメールの本文を貼り付けることもできます"
                rows={4}
                aria-label="提出メールの本文"
              />
            </div>
            {error && <p className="form__error">{error}</p>}
            <div className="form__actions">
              <button type="button" className="button" onClick={onClose}>
                閉じる
              </button>
              <button type="button" className="button button--primary" onClick={() => read(text)} disabled={!text.trim()}>
                読み取る
              </button>
            </div>
          </>
        )}

        {results && (
          <>
            <ul className="mail-results">
              {results.map((r, i) => (
                <li key={i} className={`mail-results__item mail-results__item--${!r.task ? 'missing' : r.task.done ? 'done' : 'ok'}`}>
                  <span className="mail-results__mark" aria-hidden="true">
                    {!r.task ? '？' : r.task.done ? '✓' : '→'}
                  </span>
                  <span className="mail-results__body">
                    <span className="mail-results__subject">{r.task?.subject ?? r.subject ?? '科目不明'}</span>
                    <span className="mail-results__title">{r.title}</span>
                    <span className="mail-results__note">
                      {!r.task
                        ? 'アプリに見つかりません（まだ取り込んでいない課題かもしれません）'
                        : r.task.done
                          ? 'もう完了になっています'
                          : `完了にします${r.task.dueAt ? `（締切 ${formatDateTime(r.task.dueAt)}）` : ''}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="form__actions">
              <button type="button" className="button" onClick={() => setResults(null)}>
                やり直す
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={handleComplete}
                disabled={toComplete.length === 0}
              >
                {toComplete.length > 0 ? `${toComplete.length}件を完了にする` : '完了にする課題はありません'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
