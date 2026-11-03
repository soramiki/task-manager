import { formatDate } from '../utils/date.js'
import { getMissedCountBySubject } from '../utils/missedStats.js'
import { AutoImportNotice } from './AutoImportNotice.jsx'
import { SubmissionSyncNotice } from './SubmissionSyncNotice.jsx'
import { ImportReminder } from './ImportReminder.jsx'
import { MissedStatsButton } from './MissedStats.jsx'
import { SubmissionMailButton } from './SubmissionMail.jsx'
import { SUMMARY_GROUPS, summarizeTasks } from '../utils/summary.js'
import { TaskList } from './TaskList.jsx'

// 「ホーム」の画面：今日やることが、開いて1秒で分かる（今日の要約＋その課題）
export function HomeView({
  tasks,
  now,
  subjectColors,
  onToggleDone,
  onEdit,
  onResult,
  onAdd,
  onShowTimeline,
  reminder, // 取り込みのお知らせ（出さないときは null）
  autoImportResult, // 自動で取り込んだ内容（なければ null）
  onDismissAutoImport,
  onCompleteTasks, // 提出メールから、まとめて完了にする
  submissionSyncCompleted, // 提出メールの自動連携で完了にした課題（なければ null）
  onDismissSubmissionSync,
}) {
  const autoNotice = (
    <>
      {submissionSyncCompleted && (
        <SubmissionSyncNotice tasks={submissionSyncCompleted} onDismiss={onDismissSubmissionSync} />
      )}
      {autoImportResult && <AutoImportNotice result={autoImportResult} onDismiss={onDismissAutoImport} />}
    </>
  )

  if (tasks.length === 0) {
    return (
      <>
        {autoNotice}
        {reminder && <ImportReminder {...reminder} />}
        <div className="empty">
        <p>
          まだ課題がありません。
          <br />
          まずは課題を1つ登録してみましょう。
        </p>
        <div className="empty__actions">
          <button type="button" className="button button--primary" onClick={onAdd}>
            ＋ 課題を追加
          </button>
        </div>
      </div>
      </>
    )
  }

  const groups = summarizeTasks(tasks, now)
  const hasTodo = SUMMARY_GROUPS.some(({ key }) => groups[key].length > 0)
  const missedCounts = getMissedCountBySubject(tasks)

  // 要約の数字をタップしたら、その課題のまとまりまでスクロールする
  function scrollToGroup(key) {
    document.getElementById(`summary-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {autoNotice}
      {reminder && <ImportReminder {...reminder} />}

      <section className="home-section" aria-labelledby="today-heading">
        <h2 id="today-heading" className="home-section__heading">
          今日 {formatDate(now)}
        </h2>

        <div className="summary">
          {SUMMARY_GROUPS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`summary__card summary__card--${key}`}
              onClick={() => scrollToGroup(key)}
              disabled={groups[key].length === 0}
            >
              <span className="summary__count">{groups[key].length}</span>
              <span className="summary__label">{label}</span>
            </button>
          ))}
        </div>

        <SubmissionMailButton tasks={tasks} onComplete={onCompleteTasks} />

        {hasTodo ? (
          SUMMARY_GROUPS.filter(({ key }) => groups[key].length > 0).map(({ key, label }) => (
            <div key={key} id={`summary-${key}`} className="summary-group">
              <h3 className={`summary-group__heading summary-group__heading--${key}`}>{label}</h3>
              <TaskList
                tasks={groups[key]}
                hasAnyTask
                now={now}
                subjectColors={subjectColors}
                // 期限切れには「提出できた／できなかった」、それ以外には未達成の多い科目の注意を出す
                missedCounts={key === 'overdue' ? undefined : missedCounts}
                onToggleDone={onToggleDone}
                onEdit={onEdit}
                onResult={key === 'overdue' ? onResult : undefined}
              />
            </div>
          ))
        ) : (
          <p className="summary-clear">今日やることはありません。</p>
        )}
      </section>

      {/* 右下の丸いボタン：押すと「提出できなかった回数」を見られる */}
      <MissedStatsButton tasks={tasks} subjectColors={subjectColors} />

      <button type="button" className="link-button home-link" onClick={onShowTimeline}>
        この先の予定をタイムラインで見る →
      </button>
    </>
  )
}
