import { useEffect, useState } from 'react'
import {
  isLetusCalendarUrl,
  loadCalendarUrl,
  removeCalendarUrl,
  saveCalendarUrl,
} from '../utils/letusCalendar.js'
import { isAutoImportEnabled, setAutoImportEnabled } from '../utils/autoImport.js'
import { COLOR_NAMES, COLORS } from '../utils/subjectColors.js'
import { BackupSettings } from './BackupSettings.jsx'
import { HowToUse } from './HowToUse.jsx'
import { MailSyncSettings } from './MailSyncSettings.jsx'
import { NotificationSettings } from './NotificationSettings.jsx'

// 設定（右上の ⚙ から開く小窓）
// 科目の色 / 毎朝の通知 / カレンダーURL / バックアップ / 使い方
export function SettingsDialog({ tasks, onRestore, subjects, colorIndexes, onChangeColor, onClose }) {
  // Escキーで閉じる
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--tall"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <h2 id="settings-heading">設定</h2>
          <button type="button" className="button" onClick={onClose}>
            閉じる
          </button>
        </div>

        <SubjectColorSettings
          subjects={subjects}
          colorIndexes={colorIndexes}
          onChangeColor={onChangeColor}
        />
        <NotificationSettings />
        <CalendarUrlSettings />
        <MailSyncSettings />
        <BackupSettings tasks={tasks} onRestore={onRestore} />
        <HowToUse />
      </div>
    </div>
  )
}

// 科目の色：科目をタップすると色の一覧が開き、選ぶとその色になる
function SubjectColorSettings({ subjects, colorIndexes, onChangeColor }) {
  const [openSubject, setOpenSubject] = useState(null) // 色を選んでいる途中の科目

  return (
    <section className="settings-section" aria-labelledby="color-heading">
      <h3 id="color-heading" className="settings-section__heading">
        科目の色
      </h3>
      {subjects.length === 0 ? (
        <p className="page-note">課題を登録すると、ここで科目の色を選べるようになります。</p>
      ) : (
        <>
          <p className="page-note">科目をタップして、好きな色を選んでください。一覧・ホーム・タイムラインの色がそろって変わります。</p>
          <ul className="color-list">
            {subjects.map((subject) => {
              const current = colorIndexes[subject] ?? 0
              const isOpen = openSubject === subject
              return (
                <li key={subject} className="color-list__item">
                  <button
                    type="button"
                    className="color-list__subject"
                    onClick={() => setOpenSubject(isOpen ? null : subject)}
                    aria-expanded={isOpen}
                  >
                    <span className="color-swatch" style={{ background: COLORS[current] }} />
                    <span className="color-list__name">{subject}</span>
                    <span className="color-list__current">{COLOR_NAMES[current]}</span>
                  </button>
                  {isOpen && (
                    <div className="color-palette" role="group" aria-label={`${subject}の色`}>
                      {COLORS.map((color, index) => (
                        <button
                          key={color}
                          type="button"
                          className="color-palette__button"
                          style={{ background: color }}
                          aria-label={COLOR_NAMES[index]}
                          aria-pressed={index === current}
                          title={COLOR_NAMES[index]}
                          onClick={() => {
                            onChangeColor(subject, index)
                            setOpenSubject(null)
                          }}
                        >
                          {index === current && '✓'}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

// カレンダーURL：設定されているか / 変更 / 削除
function CalendarUrlSettings() {
  const [url, setUrl] = useState(loadCalendarUrl)
  const [isEditing, setIsEditing] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [autoImport, setAutoImport] = useState(isAutoImportEnabled)

  function handleChangeAuto(e) {
    setAutoImportEnabled(e.target.checked)
    setAutoImport(e.target.checked)
  }

  function handleSave(e) {
    e.preventDefault()
    const value = input.trim()
    if (!isLetusCalendarUrl(value)) {
      setError('LETUSのカレンダーURL（https://letus.ed.tus.ac.jp/calendar/export_execute.php で始まるURL）を貼り付けてください')
      return
    }
    saveCalendarUrl(value)
    setUrl(value)
    setInput('')
    setError('')
    setIsEditing(false)
  }

  function handleRemove() {
    if (!window.confirm('この端末に保存したカレンダーURLを削除しますか？')) return
    removeCalendarUrl()
    setUrl(null)
  }

  return (
    <section className="settings-section" aria-labelledby="calendar-url-heading">
      <h3 id="calendar-url-heading" className="settings-section__heading">
        カレンダーURL（LETUSからの取り込み）
      </h3>
      <p className={`notice-status ${url ? 'notice-status--on' : ''}`}>
        {url ? '設定済み（この端末にだけ保存）' : 'まだ設定されていません'}
      </p>

      {isEditing ? (
        <form onSubmit={handleSave} className="import-card__form">
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
            保存
          </button>
          <button type="button" className="button" onClick={() => setIsEditing(false)}>
            やめる
          </button>
        </form>
      ) : (
        <div className="settings-section__actions">
          <button type="button" className="button" onClick={() => setIsEditing(true)}>
            {url ? 'URLを変更' : 'URLを設定'}
          </button>
          {url && (
            <button type="button" className="button button--danger" onClick={handleRemove}>
              削除
            </button>
          )}
        </div>
      )}
      {error && <p className="form__error">{error}</p>}
      <label className="settings-toggle">
        <input type="checkbox" checked={autoImport} onChange={handleChangeAuto} />
        アプリを開いたときに自動で取り込む（1日1回）
      </label>
      <p className="page-note">URLの取り方は、「取り込み」タブか、下の「使い方」にあります。URLはパスワードと同じなので、人に送らないでください。</p>
    </section>
  )
}
