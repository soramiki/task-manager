import { useEffect, useRef, useState } from 'react'
import { fetchSubmissions, loadMailKey, loadPending, savePending } from '../utils/mailSync.js'
import { matchSubmissions } from '../utils/submissionMail.js'

// 提出メールの自動連携：アプリを開いたとき（裏から戻ったときも）に、届いた提出を受け取って、
// その課題を自動で「完了」にする
// ・アプリにまだない課題の提出は覚えておき、課題が取り込まれたら完了にする
// ・失敗したときは何も出さず、次に開いたときにもう一度
//
// 戻り値：{ completed：完了にした課題（お知らせ用。なければ null）, dismiss }
export function useSubmissionSync({ tasks, completeTasks }) {
  const [completed, setCompleted] = useState(null)
  const latest = useRef({ tasks, completeTasks })
  useEffect(() => {
    latest.current = { tasks, completeTasks }
  })
  const isRunning = useRef(false)

  // 覚えている提出を、今の課題と結びつけて完了にする
  function applyPending() {
    const pending = loadPending()
    if (pending.length === 0) return
    const { tasks, completeTasks } = latest.current
    const matches = matchSubmissions(tasks, pending)
    const toComplete = matches.filter((m) => m.task && !m.task.done).map((m) => m.task)
    // 結びつけられたものは覚えておく必要がないので外す（もう完了だったものも）
    savePending(matches.filter((m) => !m.task).map(({ task: _task, ...rest }) => rest))
    if (toComplete.length === 0) return
    completeTasks(toComplete.map((task) => task.id))
    setCompleted((prev) => [...(prev ?? []), ...toComplete])
  }

  // サーバーから受け取る
  useEffect(() => {
    async function check() {
      const key = loadMailKey()
      if (!key || isRunning.current) return
      isRunning.current = true
      try {
        const received = await fetchSubmissions(key)
        if (received.length > 0) savePending([...loadPending(), ...received])
        applyPending()
      } catch {
        // 電波がないときなど。次に開いたときにもう一度
      } finally {
        isRunning.current = false
      }
    }
    check()
    function handleVisible() {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
    // applyPending は最新の値を latest から読むので、最初の1回だけ登録すればよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 課題が増えたとき（取り込んだときなど）に、覚えている提出をもう一度結びつける
  const taskCount = tasks.length
  useEffect(() => {
    applyPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskCount])

  return { completed, dismiss: () => setCompleted(null) }
}
