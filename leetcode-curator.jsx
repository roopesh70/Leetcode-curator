import { useState, useEffect } from "react";

const DIFFICULTY_CONFIG = {
  Beginner: { color: "#00C896", bg: "#00C89618", sessions: 2, label: "2x / week" },
  Intermediate: { color: "#F5A623", bg: "#F5A62318", sessions: 3, label: "3x / week" },
  Advanced: { color: "#FF4757", bg: "#FF475718", sessions: 4, label: "4x / week" },
};

const TOPIC_ROADMAP = [
  { id: 1, topic: "Arrays & Hashing", level: "Beginner", order: 1 },
  { id: 2, topic: "Two Pointers", level: "Beginner", order: 2 },
  { id: 3, topic: "Sliding Window", level: "Beginner", order: 3 },
  { id: 4, topic: "Stack", level: "Beginner", order: 4 },
  { id: 5, topic: "Binary Search", level: "Intermediate", order: 5 },
  { id: 6, topic: "Linked List", level: "Intermediate", order: 6 },
  { id: 7, topic: "Trees", level: "Intermediate", order: 7 },
  { id: 8, topic: "Tries", level: "Intermediate", order: 8 },
  { id: 9, topic: "Heap / Priority Queue", level: "Intermediate", order: 9 },
  { id: 10, topic: "Graphs", level: "Advanced", order: 10 },
  { id: 11, topic: "Dynamic Programming", level: "Advanced", order: 11 },
  { id: 12, topic: "Backtracking", level: "Advanced", order: 12 },
];

const mockSolvedProblems = [];

export default function LeetCodeCurator() {
  const [currentTopic, setCurrentTopic] = useState(0);
  const [solvedProblems, setSolvedProblems] = useState(mockSolvedProblems);
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState(null);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [streak, setStreak] = useState(7);

  const topic = TOPIC_ROADMAP[currentTopic];
  const diff = DIFFICULTY_CONFIG[topic.level];
  const totalSolved = solvedProblems.length;
  const progressPercent = Math.round((currentTopic / TOPIC_ROADMAP.length) * 100);

  async function fetchProblems() {
    setLoading(true);
    setProblems(null);
    try {
      const alreadySolved = solvedProblems.join(", ") || "none yet";
      const prompt = `You are a LeetCode problem curator. Generate exactly 3 LeetCode problems for the topic "${topic.topic}" at ${topic.level} difficulty.

Rules:
- Problems must be real, existing LeetCode problems with accurate URLs
- Avoid these already-solved problems: ${alreadySolved}
- Order them from easier to harder within the topic
- Each problem must have a real LeetCode problem number and slug

Respond ONLY with a JSON array, no markdown, no explanation:
[
  {
    "id": 1,
    "number": 217,
    "title": "Contains Duplicate",
    "difficulty": "Easy",
    "topic": "${topic.topic}",
    "url": "https://leetcode.com/problems/contains-duplicate/",
    "why": "One sentence on why this problem is great for learning ${topic.topic}",
    "hint": "One-line approach hint without spoiling the solution"
  }
]`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setProblems(parsed);
    } catch (err) {
      setProblems([{ error: true, message: "Failed to fetch problems. Try again." }]);
    }
    setLoading(false);
  }

  async function sendEmail() {
    if (!email || !problems) return;
    setSendingEmail(true);
    setEmailStatus(null);

    try {
      const problemsText = problems
        .map(
          (p, i) =>
            `${i + 1}. [${p.difficulty}] ${p.title}\n   🔗 ${p.url}\n   💡 ${p.why}\n   🧩 Hint: ${p.hint}`
        )
        .join("\n\n");

      const emailBody = `Hey Roopesh! 👋

Your LeetCode problems for today — Topic: ${topic.topic} (${topic.level})

${problemsText}

📊 Your Progress: ${currentTopic + 1}/${TOPIC_ROADMAP.length} topics | ${totalSolved} problems solved | ${streak}-day streak 🔥

Keep going! Consistency beats intensity.

— Your LeetCode Curator 🤖`;

      const prompt = `Send an email using Gmail MCP. 

To: ${email}
Subject: 🧠 LeetCode Daily — ${topic.topic} Problems (${topic.level})
Body: ${emailBody}

Use the Gmail send tool to send this email now.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          mcp_servers: [{ type: "url", url: "https://gmailmcp.googleapis.com/mcp/v1", name: "gmail-mcp" }],
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const hasToolResult = data.content?.some((b) => b.type === "mcp_tool_result");
      const textBlocks = data.content?.filter((b) => b.type === "text").map((b) => b.text).join(" ");
      const success = hasToolResult || textBlocks?.toLowerCase().includes("sent") || textBlocks?.toLowerCase().includes("success");

      if (success) {
        setEmailStatus({ ok: true, msg: `Sent to ${email} ✓` });
      } else {
        setEmailStatus({ ok: false, msg: "Could not confirm send. Check your Gmail." });
      }
    } catch (err) {
      setEmailStatus({ ok: false, msg: "Error sending email." });
    }
    setSendingEmail(false);
  }

  function markSolved(title) {
    if (!solvedProblems.includes(title)) {
      setSolvedProblems([...solvedProblems, title]);
    }
  }

  function nextTopic() {
    if (currentTopic < TOPIC_ROADMAP.length - 1) {
      setCurrentTopic(currentTopic + 1);
      setProblems(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", color: "#F0F0F0", fontFamily: "'JetBrains Mono', 'Courier New', monospace", padding: "0" }}>
      {/* Header */}
      <div style={{ background: "#111", borderBottom: "1px solid #222", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>⚡</span>
          <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "0.05em", color: "#FFA116" }}>LEETCODE CURATOR</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {["dashboard", "roadmap", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "#FFA116" : "transparent",
                color: activeTab === tab ? "#000" : "#888",
                border: "1px solid",
                borderColor: activeTab === tab ? "#FFA116" : "#333",
                borderRadius: "6px",
                padding: "5px 12px",
                fontSize: "11px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "inherit",
                fontWeight: 600,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "24px" }}>
          {[
            { label: "Topic", value: `${currentTopic + 1}/${TOPIC_ROADMAP.length}` },
            { label: "Solved", value: totalSolved },
            { label: "Streak", value: `${streak}🔥` },
            { label: "Progress", value: `${progressPercent}%` },
          ].map((s) => (
            <div key={s.label} style={{ background: "#141414", border: "1px solid #222", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFA116" }}>{s.value}</div>
              <div style={{ fontSize: "10px", color: "#555", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ background: "#1A1A1A", borderRadius: "4px", height: "4px", marginBottom: "24px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPercent}%`, background: "linear-gradient(90deg, #FFA116, #FF6B35)", borderRadius: "4px", transition: "width 0.6s ease" }} />
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <>
            {/* Current Topic Card */}
            <div style={{ background: "#141414", border: `1px solid ${diff.color}33`, borderRadius: "14px", padding: "20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                    Topic {topic.order} of {TOPIC_ROADMAP.length}
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#F0F0F0" }}>{topic.topic}</div>
                </div>
                <span style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.color}44`, borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 600 }}>
                  {topic.level} · {diff.label}
                </span>
              </div>

              <button
                onClick={fetchProblems}
                disabled={loading}
                style={{
                  width: "100%", background: loading ? "#1E1E1E" : "#FFA116", color: loading ? "#555" : "#000",
                  border: "none", borderRadius: "8px", padding: "12px", fontSize: "13px",
                  fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                  letterSpacing: "0.05em", transition: "all 0.2s",
                }}
              >
                {loading ? "🤖 AI is curating problems..." : "⚡ Generate Problems for Today"}
              </button>
            </div>

            {/* Problems List */}
            {problems && (
              <div style={{ marginBottom: "20px" }}>
                {problems.map((p, i) =>
                  p.error ? (
                    <div key={i} style={{ background: "#1A0A0A", border: "1px solid #FF475733", borderRadius: "10px", padding: "16px", color: "#FF4757", fontSize: "13px" }}>
                      ⚠ {p.message}
                    </div>
                  ) : (
                    <div key={i} style={{ background: "#141414", border: "1px solid #222", borderRadius: "12px", padding: "18px", marginBottom: "10px", borderLeft: `3px solid ${p.difficulty === "Easy" ? "#00C896" : p.difficulty === "Medium" ? "#F5A623" : "#FF4757"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <div>
                          <span style={{ color: "#555", fontSize: "11px", marginRight: "8px" }}>#{p.number}</span>
                          <span style={{ fontWeight: 700, fontSize: "15px" }}>{p.title}</span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{
                            fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "12px",
                            background: p.difficulty === "Easy" ? "#00C89618" : p.difficulty === "Medium" ? "#F5A62318" : "#FF475718",
                            color: p.difficulty === "Easy" ? "#00C896" : p.difficulty === "Medium" ? "#F5A623" : "#FF4757",
                          }}>
                            {p.difficulty}
                          </span>
                          <button
                            onClick={() => markSolved(p.title)}
                            style={{
                              background: solvedProblems.includes(p.title) ? "#00C89622" : "transparent",
                              color: solvedProblems.includes(p.title) ? "#00C896" : "#555",
                              border: `1px solid ${solvedProblems.includes(p.title) ? "#00C896" : "#333"}`,
                              borderRadius: "6px", padding: "3px 8px", fontSize: "10px",
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            {solvedProblems.includes(p.title) ? "✓ Solved" : "Mark Solved"}
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px" }}>💡 {p.why}</div>
                      <div style={{ fontSize: "11px", color: "#555", marginBottom: "12px" }}>🧩 Hint: {p.hint}</div>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#FFA116", fontSize: "11px", textDecoration: "none", letterSpacing: "0.05em" }}
                      >
                        → Open in LeetCode ↗
                      </a>
                    </div>
                  )
                )}

                {/* Email Section */}
                <div style={{ background: "#0A1628", border: "1px solid #1A3A6A", borderRadius: "12px", padding: "18px", marginTop: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#4A9EFF", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    📧 Send to Email
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        flex: 1, background: "#111", border: "1px solid #1A3A6A", borderRadius: "8px",
                        padding: "10px 12px", color: "#F0F0F0", fontSize: "12px", fontFamily: "inherit", outline: "none",
                      }}
                    />
                    <button
                      onClick={sendEmail}
                      disabled={sendingEmail || !email}
                      style={{
                        background: sendingEmail ? "#1A1A1A" : "#4A9EFF", color: sendingEmail ? "#555" : "#000",
                        border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "12px",
                        fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                      }}
                    >
                      {sendingEmail ? "Sending..." : "Send Now"}
                    </button>
                  </div>
                  {emailStatus && (
                    <div style={{ marginTop: "10px", fontSize: "12px", color: emailStatus.ok ? "#00C896" : "#FF4757" }}>
                      {emailStatus.ok ? "✓" : "✗"} {emailStatus.msg}
                    </div>
                  )}
                </div>

                {/* Next Topic */}
                <button
                  onClick={nextTopic}
                  disabled={currentTopic >= TOPIC_ROADMAP.length - 1}
                  style={{
                    width: "100%", marginTop: "10px", background: "transparent", color: "#555",
                    border: "1px solid #2A2A2A", borderRadius: "8px", padding: "10px",
                    fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Advance to Next Topic →
                </button>
              </div>
            )}
          </>
        )}

        {/* ROADMAP TAB */}
        {activeTab === "roadmap" && (
          <div>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Beginner → Intermediate → Advanced
            </div>
            {TOPIC_ROADMAP.map((t, i) => {
              const d = DIFFICULTY_CONFIG[t.level];
              const isCurrent = i === currentTopic;
              const isPast = i < currentTopic;
              return (
                <div
                  key={t.id}
                  onClick={() => { setCurrentTopic(i); setProblems(null); setActiveTab("dashboard"); }}
                  style={{
                    background: isCurrent ? "#1A1A0D" : "#141414",
                    border: `1px solid ${isCurrent ? "#FFA116" : isPast ? "#222" : "#222"}`,
                    borderLeft: `3px solid ${isPast ? "#00C896" : isCurrent ? "#FFA116" : "#333"}`,
                    borderRadius: "10px", padding: "14px 16px", marginBottom: "8px",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
                    opacity: isPast ? 0.6 : 1, transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{isPast ? "✅" : isCurrent ? "⚡" : "○"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: isCurrent ? 700 : 500, fontSize: "13px" }}>{t.topic}</div>
                    <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>Topic {t.order}</div>
                  </div>
                  <span style={{ background: d.bg, color: d.color, borderRadius: "12px", padding: "3px 10px", fontSize: "10px", fontWeight: 600 }}>
                    {t.level}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div>
            <div style={{ background: "#141414", border: "1px solid #222", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "16px", color: "#FFA116" }}>⏰ Automation Schedule</div>
              <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.8 }}>
                <p style={{ marginBottom: "12px" }}>To get automated emails every few days, use one of these free options:</p>
                <div style={{ background: "#0D0D0D", border: "1px solid #2A2A2A", borderRadius: "8px", padding: "14px", marginBottom: "10px" }}>
                  <div style={{ color: "#00C896", fontWeight: 700, marginBottom: "6px" }}>Option 1: GitHub Actions (Free)</div>
                  <div style={{ color: "#666", fontSize: "11px" }}>
                    Schedule a workflow to call this app's logic every 3–4 days using cron. Works as long as you have a GitHub repo.
                  </div>
                </div>
                <div style={{ background: "#0D0D0D", border: "1px solid #2A2A2A", borderRadius: "8px", padding: "14px" }}>
                  <div style={{ color: "#4A9EFF", fontWeight: 700, marginBottom: "6px" }}>Option 2: n8n or Make.com</div>
                  <div style={{ color: "#666", fontSize: "11px" }}>
                    Set a scheduled trigger → HTTP call to Claude API → Gmail send. No code needed.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "#141414", border: "1px solid #222", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px", color: "#FFA116" }}>📊 Frequency by Level</div>
              {Object.entries(DIFFICULTY_CONFIG).map(([level, cfg]) => (
                <div key={level} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1A1A1A" }}>
                  <span style={{ color: cfg.color, fontSize: "12px", fontWeight: 600 }}>{level}</span>
                  <span style={{ color: "#888", fontSize: "11px" }}>{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
