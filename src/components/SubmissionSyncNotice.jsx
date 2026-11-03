// 提出メールの自動連携で、課題を「完了」にしたときのお知らせ（ホームの上）
export function SubmissionSyncNotice({ tasks, onDismiss }) {
  return (
    <div className="auto-import auto-import--done" role="status">
      <div className="auto-import__header">
        <p className="auto-import__title">
          提出メールが届いた課題を「完了」にしました
          <small>（{tasks.length}件）</small>
        </p>
        <button type="button" className="button" onClick={onDismiss}>
          閉じる
        </button>
      </div>
      <ul className="auto-import__list">
        {tasks.map((task) => (
          <li key={task.id}>
            <span className="auto-import__subject">{task.subject}</span> {task.title}
          </li>
        ))}
      </ul>
    </div>
  )
}
