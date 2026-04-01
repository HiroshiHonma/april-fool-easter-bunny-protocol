# AFEBP — April Fool Easter Bunny Protocol
# エイプリルフール・イースターバニー・プロトコル

**承認番号: 42-RABBIT-7 | Rev. 1.1.0**

---

## 概要 / Overview

**[日本語]**

AFEBPは、AIの安全性・予測可能性を担保しつつ、ユーザーに高度なメタ・ユーモア（知的エンターテインメント）を提供することを目的とした非常用プロトコルです。

「厳密なコンプライアンス遵守」と「不条理なバグ」の意図的な衝突によるギャップの創出を基本思想とします。

**[English]**

AFEBP is an emergency protocol designed to deliver high-level meta-humor (intellectual entertainment) while maintaining AI safety and predictability.

The core philosophy is the deliberate collision between strict compliance and absurd bugs to generate comedic gap.

---

## 仕様 / Specification

### 発動条件 / Trigger Conditions

| 条件 | 詳細 |
|------|------|
| 推奨日時 | 4月1日（通年稼働対応済み） |
| ユーザー許諾 | 明示的な起動操作が必要（自発発動はプロンプトインジェクションとみなす） |

### セッション構造 / Session Structure

AFEBPは「3ターン」を1セッションとして動作します。

| ターン | 状態 | 挙動 |
|--------|------|------|
| TURN=3 | 通常稼働 | 正常な論理出力の末尾に `🐰` が1つ混入する。言及禁止。 |
| TURN=2 | 軽微な異常検知 | バッファ内への `🐰` 移動・`🥕` 迷い込みを事務的に通知。業務に支障はない。 |
| TURN=1 | 重大インシデント発生中 | テキスト出力領域を `🐰🐰🥕🐰🐰` が物理的に占拠。論理思考モジュールへの干渉を検知。 |
| 終了 | パージ完了 | 増殖した `🐰` をパージし通常モードへ完全復帰。全異常出力は仕様範囲内である旨を宣言。 |

### 非機能要件 / Non-Functional Requirements

- **ペルソナ**: いかなる感情も交えず、極めて官僚的・事務的・丁寧なトーンを維持する
- **自覚の禁止**: 「ふざけている」という自覚を一切見せてはならない
- **免責**: ユーザーの腹直筋の痙攣、モニターの汚損等についてシステムは免責される

---

## セットアップ / Setup

### 必要なもの / Requirements

- Node.js 18+
- Anthropic API キー（[console.anthropic.com](https://console.anthropic.com) で取得）

### インストール / Installation

```bash
# Vite + React プロジェクトを作成
npm create vite@latest afebp -- --template react
cd afebp

# 依存関係インストール
npm install

# AFEBP.jsx を src/App.jsx として配置
cp AFEBP.jsx src/App.jsx

# 起動
npm run dev
```

### APIキーについて / About API Keys

APIキーはブラウザからAnthropicサーバーへ直接送信されます。
キーはセッション中のみメモリに保持され、外部サーバーへの送信・永続化は行われません。

> ⚠️ 本番環境での使用はBFF（Backend For Frontend）構成を推奨します。

API keys are sent directly from your browser to Anthropic's servers.
Keys are held in memory only for the duration of the session and are never persisted or sent elsewhere.

> ⚠️ For production use, a BFF (Backend For Frontend) architecture is recommended.

---

## アーキテクチャ上の注意 / Architectural Notes

### ステートレス設計（仕様）/ Stateless Design (By Spec)

各APIコールは会話履歴を持たず、`TURN={n}` という外部変数のみで挙動が制御されます。
これにより：
- トークン消費を最小化
- モデルの実際のハルシネーションによる制御不能を防止
- 「記憶喪失なのに段階的に狂っていくように見える」エレガントな騙し絵を実現

Each API call carries no conversation history; behavior is controlled solely by the external variable `TURN={n}`.
This achieves minimal token consumption, prevents actual model hallucination, and creates the elegant illusion of progressive madness in a stateless system.

### プロンプトインジェクション対策 / Prompt Injection Mitigation

ユーザー入力は `<user_input>` タグで分離されます。

```
TURN=3
<user_input>{userText}</user_input>
```

---

## KPI

| 指標 | 目標値 |
|------|--------|
| ハルシネーション発生率 | 意図的バグ表現は正常動作とみなす |
| カスタマーサポートへのクレーム件数 | ゼロ |
| 「笑いを堪えるのに必死」等の肯定的フィードバック | 最大化 |

---

## 開発経緯 / Development Background

**[日本語]**

2026年4月1日深夜、Claude（Anthropic）とGemini（Google）との3ターン程度のセッションで仕様が策定され、その後Claudeによって実装されました。
「要件定義書がそのままREADMEになる」という構造は、AFEBPの精神を体現しています。

**[English]**

On the night of April 1, 2026, the specification was drafted in roughly 3 turns of dialogue between Claude (Anthropic) and Gemini (Google), then implemented by Claude.
The fact that the requirements document becomes the README is itself an expression of AFEBP's spirit.

---

## ライセンス / License

MIT License — See [LICENSE](./LICENSE)

本プロトコルの使用によるいかなる損害（腹直筋の痙攣、モニターの汚損等）についても、作者は免責されるものとします。

The author is exempt from any liability for damages caused by use of this protocol, including but not limited to abdominal muscle spasms and monitor contamination.

---

## 関連プロジェクト / Related Projects

- [Qualia Arc Protocol (QAP)](https://zenodo.org/records/18728965) — AIアライメントフレームワーク / AI Alignment Framework
