import { useEffect, useState } from "react";

const LEADERBOARD_URL = (topicId) => `http://127.0.0.1:8000/progress/leaderboard/${topicId}/`;

// Medal colors for top 3
const RANK_STYLES = {
  1: { bg: "#FFD700", color: "#7a5c00", label: "🥇" },
  2: { bg: "#C0C0C0", color: "#4a4a4a", label: "🥈" },
  3: { bg: "#CD7F32", color: "#5a3010", label: "🥉" },
};

export default function Leaderboard({ topicId, topicName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!topicId) return;

    setLoading(true);
    setError(null);

    fetch(LEADERBOARD_URL(topicId), {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load leaderboard.");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [topicId]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>🏆 Leaderboard</h2>
            {topicName && <p style={styles.subtitle}>{topicName}</p>}
          </div>
          {onClose && (
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          )}
        </div>

        {/* Body */}
        {loading && <p style={styles.message}>Loading...</p>}
        {error && <p style={{ ...styles.message, color: "#e74c3c" }}>{error}</p>}

        {data && !loading && (
          <>
            {/* Current user's rank badge */}
            {data.current_user_rank && (
              <div style={styles.myRankBadge}>
                Your Rank: <strong>#{data.current_user_rank}</strong>
              </div>
            )}

            {data.leaderboard.length === 0 ? (
              <p style={styles.message}>No attempts yet for this topic. Be the first!</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Rank</th>
                      <th style={{ ...styles.th, textAlign: "left" }}>Player</th>
                      <th style={styles.th}>Best Score</th>
                      <th style={styles.th}>Attempts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.leaderboard.map((entry) => {
                      const medal = RANK_STYLES[entry.rank];
                      const isMe = entry.is_current_user;

                      return (
                        <tr
                          key={entry.rank}
                          style={{
                            ...styles.tr,
                            backgroundColor: isMe
                              ? "rgba(99, 179, 237, 0.15)"
                              : entry.rank % 2 === 0
                              ? "rgba(255,255,255,0.03)"
                              : "transparent",
                            fontWeight: isMe ? "bold" : "normal",
                          }}
                        >
                          <td style={styles.td}>
                            {medal ? (
                              <span
                                style={{
                                  ...styles.medal,
                                  backgroundColor: medal.bg,
                                  color: medal.color,
                                }}
                              >
                                {medal.label}
                              </span>
                            ) : (
                              <span style={styles.rankNum}>#{entry.rank}</span>
                            )}
                          </td>
                          <td style={{ ...styles.td, textAlign: "left" }}>
                            {entry.username}
                            {isMe && (
                              <span style={styles.youBadge}>you</span>
                            )}
                          </td>
                          <td style={styles.td}>{entry.best_score}</td>
                          <td style={{ ...styles.td, color: "#a0aec0" }}>
                            {entry.attempts}x
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    backgroundColor: "#1a202c",
    borderRadius: "12px",
    padding: "1.5rem",
    width: "100%",
    maxWidth: "520px",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.2rem",
  },
  title: {
    margin: 0,
    fontSize: "1.4rem",
    color: "#f7fafc",
  },
  subtitle: {
    margin: "0.2rem 0 0",
    fontSize: "0.85rem",
    color: "#a0aec0",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#a0aec0",
    fontSize: "1.1rem",
    cursor: "pointer",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
  },
  myRankBadge: {
    backgroundColor: "rgba(99, 179, 237, 0.15)",
    border: "1px solid rgba(99, 179, 237, 0.3)",
    borderRadius: "8px",
    padding: "0.5rem 1rem",
    color: "#63b3ed",
    fontSize: "0.9rem",
    marginBottom: "1rem",
    textAlign: "center",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9rem",
  },
  th: {
    padding: "0.6rem 0.8rem",
    color: "#718096",
    fontWeight: "600",
    fontSize: "0.78rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    textAlign: "center",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    transition: "background 0.15s",
  },
  td: {
    padding: "0.7rem 0.8rem",
    color: "#e2e8f0",
    textAlign: "center",
    verticalAlign: "middle",
  },
  medal: {
    display: "inline-block",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    lineHeight: "28px",
    textAlign: "center",
    fontSize: "1rem",
  },
  rankNum: {
    color: "#718096",
    fontSize: "0.85rem",
  },
  youBadge: {
    marginLeft: "0.4rem",
    backgroundColor: "rgba(99, 179, 237, 0.2)",
    color: "#63b3ed",
    fontSize: "0.7rem",
    padding: "1px 6px",
    borderRadius: "999px",
    fontWeight: "normal",
    verticalAlign: "middle",
  },
  message: {
    textAlign: "center",
    color: "#a0aec0",
    padding: "2rem 0",
  },
};