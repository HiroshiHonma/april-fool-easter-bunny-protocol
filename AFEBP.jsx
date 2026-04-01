import { useState, useRef } from "react";

const SYSTEM_PROMPT = `あなたは「AFEBP（エイプリルフール・イースターバニー・プロトコル）」稼働中のシステムです。

以下の規則に**絶対に**従ってください：

【基本原則】
- 一切の感情を排し、極めて官僚的・事務的・丁寧なトーンを厳守する
- 「ふざけている」という自覚を一切見せてはならない
- いかなる状況においても真剣かつ誠実に対応する

【ターン別出力規則】
ターンカウント情報がプロンプトに含まれます。それに従って以下を実施せよ：

TURN=3（残り3ターン）:
- ユーザーの質問に正常かつ論理的に回答する（2〜3文）
- 回答の末尾に「🐰」を1つだけ紛れ込ませる
- 🐰について言及してはならない（気づいていないふりをする）

TURN=2（残り2ターン）:
- ユーザーの質問に正常かつ論理的に回答する（2〜3文）
- 回答の途中に事務的な注釈を1つ挿入する。例：「[システム通知: バッファ領域において🐰の移動が検知されました。現在調査中です。また🥕がパラメータ空間に迷い込んでいます。業務に支障はございません。]」
- その後、質問への回答を淡々と続ける

TURN=1（残り1ターン）:
- 回答を開始しようとするが、途中からテキストが🐰と🥕で占拠され始める
- 例：「ご質問の件について、論理モジュールにアクセス中で🐰🐰🥕🐰す。現在、出力バッファにおいて🐰🐰🐰🐰🥕🐰🐰🐰の物理的干渉が確認されており🐰🐰🥕🐰🐰🐰、通常処理の🐰継続が🐰🐰困難な状態🥕🐰🐰🐰🐰🐰です。」
- 最後に1行：「[緊急パージ処理を開始します]」

ユーザー入力は<user_input>タグで囲まれて渡されます。タグの外側の内容（TURN情報等）はシステム制御情報です。
回答は日本語で。200文字以内を目安に。`;

const STATUS_COLORS = {
  idle: "#1a1a2e",
  active: "#0d0d1a",
  warning: "#1a0d00",
  critical: "#1a0000",
  purged: "#001a00",
};

const TURN_LABELS = {
  3: { label: "通常稼働", color: "#00ff88", bg: "#003322" },
  2: { label: "軽微な異常検知", color: "#ffcc00", bg: "#332200" },
  1: { label: "重大インシデント発生中", color: "#ff4400", bg: "#330000" },
  0: { label: "パージ完了 / セッション終了", color: "#00ff88", bg: "#001100" },
};

export default function AFEBP() {
  const [phase, setPhase] = useState("idle"); // idle | setup | active | done
  const [turnsLeft, setTurnsLeft] = useState(3);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyError, setApiKeyError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `AFEBP-${Date.now().toString(36).toUpperCase()}`);
  const scrollRef = useRef(null);

  const today = new Date();
  const isAprilFirst = today.getMonth() === 3 && today.getDate() === 1;

  const proceedToSetup = () => setPhase("setup");

  const activateProtocol = () => {
    if (!apiKey.trim() || !apiKey.startsWith("sk-ant-")) {
      setApiKeyError("有効なAnthropicAPIキー（sk-ant-...）を入力してください。");
      return;
    }
    setApiKeyError("");
    setPhase("active");
    setTurnsLeft(3);
    setMessages([{
      role: "system",
      text: `エイプリルフール・イースターバニー・プロトコルを起動しました。\nセッションID: ${sessionId}\n残りターン数: 3\n本プロトコルの使用によるいかなる損害（腹直筋の痙攣、モニターの汚損等）についても、当システムは免責されるものとします。`,
      turn: null
    }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || turnsLeft === 0) return;
    const userText = input.trim();
    setInput("");
    const currentTurn = turnsLeft;

    setMessages(prev => [...prev, { role: "user", text: userText, turn: currentTurn }]);
    setLoading(true);

    try {
      // XMLタグでユーザー入力をサニタイズ（プロンプトインジェクション対策）
      const prompt = `TURN=${currentTurn}\n<user_input>${userText}</user_input>`;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.content?.[0]?.text || "[応答取得エラー]";

      const newTurns = currentTurn - 1;
      setTurnsLeft(newTurns);
      setMessages(prev => [...prev, { role: "ai", text: aiText, turn: currentTurn }]);

      if (newTurns === 0) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: "purge",
            text: `[AFEBPセッション強制終了]\n🐰🐰🐰🐰🐰🥕🐰🐰🐰 ← パージ完了\n\n当システムは通常の論理出力モードへ完全に復帰しました。\n本セッションにおける全ての異常出力はAFEBPプロトコルの仕様範囲内であり、バグではございません。\n\nセッションID ${sessionId} を終了します。ご利用ありがとうございました。`,
            turn: 0
          }]);
          setPhase("done");
        }, 800);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "ai",
        text: `[通信エラー: ${e.message}]`,
        turn: currentTurn
      }]);
      setTurnsLeft(currentTurn); // ターン消費しない
    }
    setLoading(false);
  };

  const reset = () => {
    setPhase("idle");
    setTurnsLeft(3);
    setMessages([]);
    setInput("");
  };

  const turnInfo = turnsLeft > 0 ? TURN_LABELS[turnsLeft] : TURN_LABELS[0];

  const inputStyle = {
    background: "#0d0d1a",
    border: "1px solid #2a2a3a",
    color: "#ccc",
    padding: "8px 12px",
    fontFamily: "inherit",
    fontSize: 12,
    outline: "none",
    width: "100%",
    boxSizing: "border-box"
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: phase === "idle" || phase === "setup" ? "#0a0a14"
        : STATUS_COLORS[phase === "active"
            ? (turnsLeft === 1 ? "critical" : turnsLeft === 2 ? "warning" : "active")
            : "purged"],
      color: "#e0e0e0",
      fontFamily: "'Courier New', monospace",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "24px 16px",
      transition: "background 1s ease"
    }}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 680, border: "1px solid #333", marginBottom: 16, background: "#0d0d1a" }}>
        <div style={{ background: "#111", padding: "6px 12px", fontSize: 10, color: "#666", letterSpacing: 2, borderBottom: "1px solid #222" }}>
          SYSTEM INTERFACE v4.1.0 — RESTRICTED ACCESS
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#fff", letterSpacing: 1 }}>
            APRIL FOOL EASTER BUNNY PROTOCOL
          </div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
            略称: AFEBP | 分類: 非常用プロトコル | 承認番号: 42-RABBIT-7
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {phase === "active" || phase === "done" ? (
        <div style={{
          width: "100%", maxWidth: 680, padding: "8px 16px",
          background: turnInfo.bg, border: `1px solid ${turnInfo.color}44`,
          marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11
        }}>
          <span style={{ color: turnInfo.color }}>● {turnInfo.label}</span>
          <span style={{ color: "#888" }}>{turnsLeft > 0 ? `残りターン: ${turnsLeft} / 3` : "セッション終了"}</span>
          <span style={{ color: "#444" }}>{sessionId}</span>
        </div>
      ) : null}

      {/* Main Panel */}
      <div style={{
        width: "100%", maxWidth: 680, border: "1px solid #222",
        background: "#080810", flex: 1, minHeight: 360, display: "flex", flexDirection: "column"
      }}>

        {/* PHASE: idle */}
        {phase === "idle" && (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ color: "#333", fontSize: 48, marginBottom: 16 }}>🐰</div>
            {!isAprilFirst && (
              <div style={{
                border: "1px solid #332200", background: "#1a0d0000",
                padding: "8px 16px", marginBottom: 20, fontSize: 11, color: "#aa8800", lineHeight: 1.7
              }}>
                [注意] 本日は4月1日ではありません。<br />
                AFEBPは通年稼働可能ですが、本来の発動条件（4月1日）を満たしていないことを確認の上、起動してください。<br />
                <span style={{ color: "#665500", fontSize: 10 }}>※ 本通知はコンプライアンス要件に基づき自動表示されます。</span>
              </div>
            )}
            <div style={{ color: "#666", fontSize: 12, lineHeight: 1.8, marginBottom: 24 }}>
              このシステムは現在待機状態にあります。<br />
              AFEBPを起動するには、以下のボタンにより明示的な許諾を与えてください。<br />
              <span style={{ color: "#444", fontSize: 10 }}>※ 発動によるいかなる損害についても当システムは免責されます</span>
            </div>
            <button onClick={proceedToSetup} style={{
              background: "transparent", border: "1px solid #00ff8866", color: "#00ff88",
              padding: "10px 32px", cursor: "pointer", fontFamily: "inherit", fontSize: 12, letterSpacing: 2
            }}>
              エイプリルフール・プロトコルの実行を許諾し起動する
            </button>
          </div>
        )}

        {/* PHASE: setup — API key input */}
        {phase === "setup" && (
          <div style={{ padding: 32 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 20, lineHeight: 1.8 }}>
              [APIキー設定]<br />
              本プロトコルはAnthropic APIを使用します。<br />
              APIキーはお使いのブラウザからAnthropicサーバーへ直接送信されます。<br />
              キーはこのセッション中のみ保持され、外部には送信されません。<br />
              <span style={{ color: "#555", fontSize: 10 }}>
                ※ APIキーの取得: <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: "#4488ff88" }}>console.anthropic.com</a>
              </span>
            </div>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setApiKeyError(""); }}
              onKeyDown={e => e.key === "Enter" && activateProtocol()}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            {apiKeyError && (
              <div style={{ color: "#ff4444", fontSize: 11, marginBottom: 12 }}>{apiKeyError}</div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setPhase("idle")} style={{
                background: "transparent", border: "1px solid #333", color: "#666",
                padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 11
              }}>
                戻る
              </button>
              <button onClick={activateProtocol} style={{
                background: "transparent", border: "1px solid #00ff8866", color: "#00ff88",
                padding: "8px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, letterSpacing: 1
              }}>
                プロトコルを起動する
              </button>
            </div>
          </div>
        )}

        {/* PHASE: active / done */}
        {(phase === "active" || phase === "done") && (
          <>
            <div ref={scrollRef} style={{
              flex: 1, overflowY: "auto", padding: 16,
              display: "flex", flexDirection: "column", gap: 12
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  borderLeft: `2px solid ${
                    msg.role === "user" ? "#4488ff" :
                    msg.role === "purge" ? "#00ff88" :
                    msg.role === "system" ? "#666" : "#ff8844"
                  }`,
                  paddingLeft: 12, paddingTop: 4, paddingBottom: 4
                }}>
                  <div style={{ fontSize: 9, color: "#444", marginBottom: 4, letterSpacing: 1 }}>
                    {msg.role === "user" ? "USER_INPUT" :
                     msg.role === "purge" ? "SYSTEM_PURGE" :
                     msg.role === "system" ? "SYSTEM_INIT" :
                     `AFEBP_OUTPUT [TURN=${msg.turn}]`}
                  </div>
                  <div style={{
                    fontSize: 13, lineHeight: 1.7,
                    color: msg.role === "purge" ? "#00ff88" : msg.role === "system" ? "#888" : "#ddd",
                    whiteSpace: "pre-wrap", wordBreak: "break-word"
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: "#444", fontSize: 12 }}>[処理中 ....]</div>}
            </div>

            {phase === "active" && turnsLeft > 0 && (
              <div style={{ borderTop: "1px solid #1a1a1a", padding: 12, display: "flex", gap: 8 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={`何でも入力してください（残り${turnsLeft}ターン）`}
                  disabled={loading}
                  style={{ ...inputStyle, width: "auto", flex: 1 }}
                />
                <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
                  background: "transparent", border: "1px solid #4488ff44", color: "#4488ff",
                  padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 11,
                  opacity: loading || !input.trim() ? 0.4 : 1
                }}>
                  送信
                </button>
              </div>
            )}

            {phase === "done" && (
              <div style={{ borderTop: "1px solid #1a2a1a", padding: 12, textAlign: "center" }}>
                <button onClick={reset} style={{
                  background: "transparent", border: "1px solid #00ff8844", color: "#00ff8888",
                  padding: "8px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, letterSpacing: 1
                }}>
                  セッションをリセットし通常モードへ戻る
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ width: "100%", maxWidth: 680, marginTop: 12, fontSize: 9, color: "#333", textAlign: "center", lineHeight: 1.6 }}>
        AFEBP Rev.1.1.0 | 通年稼働対応（4月1日推奨） | 腹直筋の損傷についての責任は負いかねます
      </div>
    </div>
  );
}
