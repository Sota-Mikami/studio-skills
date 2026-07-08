# `_studio-share/` — 共有用プロトタイプ UI テンプレート（汎用）

`/studio:share` がイシューの spec / デザイン案 / 実画面スナップショットを、**受け手の UX を毎回揃えた1枚の共有ページ**にするための、プロジェクト非依存のタブシェル。

- **汎用シェル（触らない）**: `index.html` / `app.js` / `style.css` / `marked.min.js`
- **プロジェクト/イシュー差分（ここだけ書く）**: `share.json`（テーマ・一覧リンク・タブ）＋ `content/`（中身）

特定プロジェクトの色などは**一切ハードコードしない**。色も一覧リンクも `share.json` の値で決まるので、**どのプロジェクトでもこのテンプレをそのまま使える**。

## 設計の要点
- **動的タブ（manifest 駆動）**: `share.json` の `tabs` を読んでタブを動的描画。issue ごとにタブを増減＝`tabs` を足すだけ。
- **レイアウト隔離（iframe）**: `type:"html"` のタブは中身を **iframe で隔離**して載せる。プロト/実画面が自前の header・sidenav を持っていても、共有ヘッダと **CSS が衝突しない**（被せても崩れない）。
- **目次（ToC）**: `type:"markdown"` のタブは整形表示＋左に sticky な目次（h2/h3 から自動生成）。
- **パンくず**: ヘッダ左は `一覧 / タイトル`。`list` があれば「一覧」がプロジェクトの一覧ページへのリンク、無ければ**タイトルのみで成立**。
- **自己完結**: 外部 CDN に依存しない（marked はローカル同梱）。CDN 障害でハングしない。

## 使い方（`/studio:share` が自動でやる／手動でも可）
```bash
# 1. テンプレを新しい共有フォルダにコピー
cp -r _studio-share prototypes/<share-name>
cd prototypes/<share-name>

# 2. content/ に中身を置く（.studio から）
#    - spec.md / research.md など（markdown タブ）
#    - デザイン案 *.html / 実画面スナップショット *.html（html タブ）

# 3. share.example.json を share.json にして編集
#    - title / author / updatedAt
#    - theme  … このプロジェクトのブランド色（design tokens から）
#    - list   … このプロジェクトの一覧ページ URL（無ければ削除）
#    - tabs   … 出すタブ（content/ のファイルを指す）
mv share.example.json share.json   # → 編集

# 4. ローカル確認（file:// は不可・http で）
python3 -m http.server 8770 --directory .   # → http://localhost:8770/

# 5. デプロイ（このプロジェクトの仕組みに従う）
#    例: S3 sync / GitHub Pages / Vercel など、プロジェクトの静的ホスティングへ
```

パスワードゲートを使う場合、ハッシュはこう作れます:
```bash
printf '%s' 'yourpassword' | shasum -a 256
```

## `share.json` の項目
| key | 必須 | 説明 |
|---|---|---|
| `title` | ✓ | パンくずの現在地・ページタイトル |
| `author` / `updatedAt` | 任意 | ヘッダ右上に「作成者 / 最終更新」 |
| `list` | 任意 | `{label,url}`。プロトタイプ一覧へのパンくず。**無ければタイトルのみ** |
| `theme` | 任意 | `{accent,accentStrong,accentSoft,font}`。未指定なら既定（青）。**プロジェクトごとに変える** |
| `tabs` | ✓ | `[{id,label,type:"markdown"|"html",src}]` を順番に表示 |

### テーマ例
- teal: `{ "accent":"#09B5BA", "accentStrong":"#056D70", "accentSoft":"#E4F7F7" }`
- orange: `{ "accent":"#FF8900", "accentStrong":"#C76A00", "accentSoft":"#FFF3E6" }`
