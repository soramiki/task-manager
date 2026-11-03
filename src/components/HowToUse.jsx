// 設定の中の「使い方」。項目をタップすると開く
export function HowToUse() {
  return (
    <section className="settings-section" aria-labelledby="howto-heading">
      <h3 id="howto-heading" className="settings-section__heading">
        使い方
      </h3>

      <details className="import-help__item">
        <summary>画面の切り替え</summary>
        <ul>
          <li><strong>ホーム</strong>：今日やること（期限切れ・今日締切・今日始める）</li>
          <li><strong>一覧</strong>：全部の課題。検索・絞り込み（未完了／完了／未達成）・並び替え</li>
          <li><strong>タイムライン</strong>：この先の締切を科目ごとに見渡す</li>
          <li><strong>取り込み</strong>：LETUSの課題をまとめて入れる</li>
        </ul>
      </details>

      <details className="import-help__item">
        <summary>課題を追加する</summary>
        <ul>
          <li>右上の「＋ 追加」から、科目・課題名・締切を入れます。締切が空欄なら「締切未定」になります。</li>
          <li>口頭で毎週出る課題は「<strong>毎週くり返す</strong>」にチェックすると、何週分かまとめて登録できます。「第〇回」も自動で付けられます。</li>
          <li>課題をタップすると、編集・削除ができます。くり返しの課題は「この回以降をまとめて削除」もできます。</li>
        </ul>
      </details>

      <details className="import-help__item">
        <summary>LETUSから取り込む</summary>
        <ol>
          <li>LETUSにログインして、書き出しページ（https://letus.ed.tus.ac.jp/calendar/export.php）を開く</li>
          <li>「すべてのイベント」と、期間「最近および次の60日間」を選ぶ</li>
          <li>「<strong>カレンダーURLを取得</strong>」を押して、出てきたURLをコピー</li>
          <li>「取り込み」タブに貼り付けて「保存して取り込む」</li>
        </ol>
        <p>次からは、<strong>アプリを開いたときに1日1回、自動で取り込みます</strong>。新しい課題が届くと、ホームの上にお知らせが出ます（締切を過ぎていた課題は「完了」にして入れます）。自分で確かめながら取り込みたいときは、「取り込み」タブの「LETUSから最新の課題を取り込む」を押してください。自動取り込みは、設定でオフにできます。</p>
      </details>

      <details className="import-help__item">
        <summary>期限切れの課題と「⚠」の丸いボタン</summary>
        <ul>
          <li>ホームの「期限切れ」の課題は、「<strong>提出できた</strong>」か「<strong>できなかった</strong>」を選んで片付けます。</li>
          <li>提出したら、LETUSから届く「提出を送信しました」のメール（Outlook）の本文をコピーして、ホームの「<strong>📧 提出メールから完了にする</strong>」で読み取ると、その課題が「完了」になります。</li>
          <li>「できなかった」課題は、科目ごとに回数を数えます。ホームの右下の <strong>⚠ の丸いボタン</strong>で見られます。回数が多いほど、黄 → オレンジ → 赤になります。</li>
          <li>押し間違えたときは、一覧の「未達成」から取り消せます。</li>
        </ul>
      </details>

      <details className="import-help__item">
        <summary>タイムラインの見方</summary>
        <ul>
          <li>丸が締切です。丸の中の数字は「第〇回」などの番号です。</li>
          <li>帯は開始〜締切（LETUSの受験可能期間など）です。</li>
          <li>赤い縦線が今です。丸をタップすると課題名を確認できます。</li>
        </ul>
      </details>

      <details className="import-help__item">
        <summary>毎朝の通知・ホーム画面に追加</summary>
        <ul>
          <li>iPhoneは、Safariの共有ボタン →「ホーム画面に追加」で、アプリのように使えます。</li>
          <li>ホーム画面のアプリから開いて、この設定の「毎朝の通知」をオンにすると、毎朝7時ごろに今日の課題をお知らせします。</li>
          <li>右上の ↻ で、アプリを新しい版に入れ替えて読み込み直せます。</li>
        </ul>
      </details>

      <details className="import-help__item">
        <summary>データについて</summary>
        <ul>
          <li>課題はこの端末のブラウザの中にだけ保存されます。PCとスマホでは別々です。</li>
          <li>機種変更やブラウザのデータを消したときのために、この設定の「<strong>バックアップを保存</strong>」でときどき保存しておきましょう。新しい端末では「バックアップから戻す」で戻せます（PCとスマホの間で課題を移すのにも使えます）。</li>
          <li>このアプリは個人で作った非公式のツールで、東京理科大学およびLETUSとは関係ありません。</li>
        </ul>
      </details>
    </section>
  )
}
