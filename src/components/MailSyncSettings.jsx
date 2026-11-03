import { useState } from 'react'
import { loadMailKey, loadPending, removeMailKey, saveMailKey } from '../utils/mailSync.js'

// 設定の中の「提出メールの自動連携」：連携キーを入れる・消す
export function MailSyncSettings() {
  const [key, setKey] = useState(loadMailKey)
  const [isEditing, setIsEditing] = useState(false)
  const [input, setInput] = useState('')
  const pendingCount = loadPending().length

  function handleSave(e) {
    e.preventDefault()
    const value = input.trim()
    if (!value) return
    saveMailKey(value)
    setKey(value)
    setInput('')
    setIsEditing(false)
  }

  function handleRemove() {
    if (!window.confirm('この端末に保存した連携キーを削除しますか？（提出メールの自動連携が止まります）')) return
    removeMailKey()
    setKey(null)
  }

  return (
    <section className="settings-section" aria-labelledby="mail-sync-heading">
      <h3 id="mail-sync-heading" className="settings-section__heading">
        提出メールの自動連携
      </h3>
      <p className="page-note">
        Outlookに届くLETUSの提出メールを転送しておくと、アプリを開いたときに、提出した課題が自動で「完了」になります。
        科目名と課題名だけがアプリのサーバーを通ります（受け取ったらすぐ消します）。
      </p>
      <p className={`notice-status ${key ? 'notice-status--on' : ''}`}>
        {key ? '連携中（連携キーはこの端末にだけ保存）' : '連携していません'}
      </p>
      {key && pendingCount > 0 && (
        <p className="page-note">アプリにまだない課題の提出が {pendingCount}件 あります。課題が取り込まれたら完了にします。</p>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="import-card__form">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="連携キーを貼り付け"
            aria-label="連携キー"
            autoComplete="off"
          />
          <button type="submit" className="button button--primary">
            保存
          </button>
          <button type="button" className="button" onClick={() => setIsEditing(false)}>
            やめる
          </button>
        </form>
      ) : (
        <div className="settings-section__actions">
          <button type="button" className="button" onClick={() => setIsEditing(true)}>
            {key ? '連携キーを変更' : '連携キーを入れる'}
          </button>
          {key && (
            <button type="button" className="button button--danger" onClick={handleRemove}>
              連携をやめる
            </button>
          )}
        </div>
      )}
    </section>
  )
}
