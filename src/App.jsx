import { useCallback, useState } from 'react'
import { HomeView } from './components/HomeView.jsx'
import { ImportView } from './components/ImportView.jsx'
import { ListView } from './components/ListView.jsx'
import { SettingsDialog } from './components/SettingsDialog.jsx'
import { TabBar } from './components/TabBar.jsx'
import { TaskForm } from './components/TaskForm.jsx'
import { TimelineView } from './components/TimelineView.jsx'
import { useAutoImport } from './hooks/useAutoImport.js'
import { useNow } from './hooks/useNow.js'
import { useSubmissionSync } from './hooks/useSubmissionSync.js'
import { useSubjectColors } from './hooks/useSubjectColors.js'
import { useTasks } from './hooks/useTasks.js'
import { DEFAULT_CONDITIONS } from './utils/filterTasks.js'
import {
  loadDismissedWeek,
  loadLastImport,
  saveDismissedWeek,
  saveLastImport,
  shouldRemind,
  startOfWeek,
} from './utils/importReminder.js'
import { reloadApp } from './utils/reloadApp.js'
import { createId } from './utils/id.js'
import { createWeeklyTasks } from './utils/repeat.js'

function App() {
  const {
    tasks,
    addTask,
    addTasks,
    updateTask,
    deleteTask,
    deleteSeriesFrom,
    replaceTasks,
    toggleDone,
    setResult,
    importLetusEvents,
  } = useTasks()
  const now = useNow()

  // 今見ている画面（'home'／'list'／'timeline'／'import'）。開いたときはホームから
  const [view, setView] = useState('home')

  // モーダルが開いているか、と、編集中の課題（追加のときは null）
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  // 設定の小窓が開いているか
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const closeSettings = useCallback(() => setIsSettingsOpen(false), [])

  // 再読み込み中か（ボタンを回して、2回押されないようにする）
  const [isReloading, setIsReloading] = useState(false)

  function handleReload() {
    setIsReloading(true)
    reloadApp()
  }

  // 一覧の検索・絞り込み・並び替えの条件（ホームとの行き来では残す。開き直すと初期値に戻る）
  const [conditions, setConditions] = useState(DEFAULT_CONDITIONS)

  // 前回の取り込み日時と、お知らせを「今週は閉じる」にした週
  const [lastImport, setLastImport] = useState(loadLastImport)
  const [dismissedWeek, setDismissedWeek] = useState(loadDismissedWeek)

  // 科目の一覧は保存せず、表示のたびに tasks から計算する
  const subjects = [...new Set(tasks.map((task) => task.subject))].sort((a, b) =>
    a.localeCompare(b, 'ja'),
  )
  // 科目の色は一度決まったら変えない（新しい科目にだけ色を割り当てる）
  const { colors: subjectColors, colorIndexes, changeColor } = useSubjectColors(subjects)

  // 条件を1つだけ変える（ほかの条件はそのまま）
  function changeCondition(name, value) {
    setConditions((prev) => ({ ...prev, [name]: value }))
  }

  function resetConditions() {
    setConditions(DEFAULT_CONDITIONS)
  }

  function changeView(nextView) {
    setView(nextView)
    window.scrollTo(0, 0)
  }

  // 取り込んで、「前回の取り込み」の日時を記録する
  function handleImport(events, { markPastAsDone }) {
    importLetusEvents(events, { markPastAsDone })
    recordImport()
  }

  // 提出メールから読み取った課題を、まとめて「完了」にする
  function completeTasks(ids) {
    ids.forEach((id) => setResult(id, 'done'))
  }

  // 提出メールの自動連携：届いた提出の課題を、開いたときに自動で「完了」にする
  const submissionSync = useSubmissionSync({ tasks, completeTasks })

  // 取り込んだ日時を記録する（週初めのお知らせを出すかどうかに使う）
  function recordImport() {
    const at = new Date().toISOString()
    saveLastImport(at)
    setLastImport(at)
  }

  // 開いたときに、1日1回 LETUS から自動で取り込む（届いたらホームにお知らせ）
  const autoImport = useAutoImport({ tasks, importLetusEvents, onImported: recordImport })

  function dismissReminder() {
    const week = startOfWeek(now).toISOString()
    saveDismissedWeek(week)
    setDismissedWeek(week)
  }

  const reminder = shouldRemind(lastImport, dismissedWeek, now)
    ? { lastImport, onGoImport: () => changeView('import'), onDismiss: dismissReminder }
    : null

  function openAddForm() {
    setEditingTask(null)
    setIsFormOpen(true)
  }

  function openEditForm(task) {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  // TaskForm の useEffect が毎回やり直しにならないよう、同じ関数を使い回す
  const closeForm = useCallback(() => setIsFormOpen(false), [])

  // repeat：毎週くり返すときだけ { count, startNumber }（それ以外は null）
  function handleSave(fields, repeat) {
    if (editingTask) {
      updateTask(editingTask.id, fields)
    } else if (repeat) {
      addTasks(createWeeklyTasks(fields, { ...repeat, seriesId: createId() }))
    } else {
      addTask(fields)
    }
    closeForm()
  }

  // following：くり返しの課題を、この回以降まとめて削除するか
  function handleDelete(task, { following }) {
    if (following) deleteSeriesFrom(task)
    else deleteTask(task.id)
    closeForm()
  }

  return (
    // タイムラインのページだけ、PCで横幅いっぱいまで広げる
    <div className={`app ${view === 'timeline' ? 'app--wide' : ''}`}>
      <header className="app-header">
        <h1>課題管理</h1>
        <div className="app-header__actions">
          <button
            type="button"
            className="button icon-button"
            onClick={handleReload}
            disabled={isReloading}
            aria-label="再読み込み"
            title="再読み込み"
          >
            <span className={isReloading ? 'spin' : undefined} aria-hidden="true">
              ↻
            </span>
          </button>
          <button
            type="button"
            className="button icon-button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="設定"
            title="設定（科目の色・通知・カレンダーURL・使い方）"
          >
            ⚙
          </button>
          <button type="button" className="button button--primary" onClick={openAddForm}>
            ＋ 追加
          </button>
        </div>
      </header>

      <main className="app-main">
        {view === 'home' && (
          <HomeView
            tasks={tasks}
            now={now}
            subjectColors={subjectColors}
            onToggleDone={toggleDone}
            onEdit={openEditForm}
            onResult={setResult}
            onAdd={openAddForm}
            onShowTimeline={() => changeView('timeline')}
            reminder={reminder}
            onCompleteTasks={completeTasks}
            submissionSyncCompleted={submissionSync.completed}
            onDismissSubmissionSync={submissionSync.dismiss}
            autoImportResult={autoImport.result}
            onDismissAutoImport={autoImport.dismiss}
          />
        )}
        {view === 'list' && (
          <ListView
            tasks={tasks}
            subjects={subjects}
            subjectColors={subjectColors}
            conditions={conditions}
            now={now}
            onChangeCondition={changeCondition}
            onResetConditions={resetConditions}
            onToggleDone={toggleDone}
            onEdit={openEditForm}
            onResult={setResult}
          />
        )}
        {view === 'timeline' && (
          <TimelineView
            tasks={tasks}
            subjects={subjects}
            subjectColors={subjectColors}
            now={now}
            onEdit={openEditForm}
          />
        )}
        {view === 'import' && (
          <ImportView
            tasks={tasks}
            lastImport={lastImport}
            now={now}
            onImport={handleImport}
            onCompleteTasks={completeTasks}
          />
        )}
      </main>

      <footer className="app-footer">
        個人で作った非公式のツールです。東京理科大学およびLETUSとは関係ありません。
      </footer>

      <TabBar view={view} onChange={changeView} />

      {isSettingsOpen && (
        <SettingsDialog
          tasks={tasks}
          onRestore={replaceTasks}
          subjects={subjects}
          colorIndexes={colorIndexes}
          onChangeColor={changeColor}
          onClose={closeSettings}
        />
      )}

      {isFormOpen && (
        <TaskForm
          task={editingTask}
          subjects={subjects}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeForm}
        />
      )}
    </div>
  )
}

export default App
