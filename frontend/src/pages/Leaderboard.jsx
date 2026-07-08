import { useEffect, useState } from "react";
import api from "../api/axios";

const ITEMS_PER_PAGE = 10;

export default function Leaderboard({ topicId, topicName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!topicId) return;

    api.get(`/progress/leaderboard/${topicId}/`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Error loading leaderboard for topic ID ${topicId}:`, err);
        setError("Failed to load leaderboard.");
        setLoading(false);
      });
  }, [topicId]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Notebook Cover Header */}
        <div style={styles.notebookHeader}>
          <div style={styles.punchedHoles}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={styles.hole} />
            ))}
          </div>
          <div style={styles.headerContent}>
            <div style={styles.headerRow}>
              <h2 style={styles.title}>🏆 Leaderboard</h2>
              <button onClick={onClose} style={styles.closeBtn}>✕</button>
            </div>
            <p style={styles.subtitle}>{topicName}</p>
          </div>
        </div>

        {/* Ruled notebook body */}
        <div style={styles.ruledContent}>
          <div style={styles.redMargin} />
          <div style={styles.bodyInner}>
            {loading ? (
              <p style={styles.message}>Loading standings...</p>
            ) : error ? (
              <p style={{ ...styles.message, color: "#dc2626" }}>⚠️ {error}</p>
            ) : (
              <>
                {/* Current user rank badge */}
                <div style={styles.myRankBadge}>
                  Your current rank: <strong>#{data?.current_user_rank ?? 'N/A'}</strong>
                </div>

                <div style={styles.pagination}>
                  <button style={{...styles.paginationBtn, opacity: currentPage <= 1 ? 0.4 : 1}} disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>◀ Previous</button>
                  <span style={styles.paginationText}>Page {currentPage} of {Math.max(1, Math.ceil((data?.leaderboard?.length || 0) / ITEMS_PER_PAGE))}</span>
                  <button style={{...styles.paginationBtn, opacity: currentPage >= Math.ceil((data?.leaderboard?.length || 0) / ITEMS_PER_PAGE) ? 0.4 : 1}} disabled={currentPage >= Math.ceil((data?.leaderboard?.length || 0) / ITEMS_PER_PAGE)} onClick={() => setCurrentPage(p => p + 1)}>Next ▶</button>
                </div>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>RANK</th>
                        <th style={{ ...styles.th, textAlign: "left" }}>USER</th>
                        <th style={styles.th}>BEST SCORE</th>
                        <th style={styles.th}>ACCURACY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.leaderboard?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((entry, idx) => {
                        const isMe = entry.is_current_user;
                        return (
                          <tr
                            key={entry.user_id}
                            style={{
                              ...styles.tr,
                              backgroundColor: isMe ? "rgba(59, 130, 246, 0.08)" : "transparent",
                            }}
                          >
                            <td style={styles.td}>
                              {idx < 3 ? ["🥇", "🥈", "🥉"][idx] : `#${idx + 1}`}
                            </td>
                            <td style={{ ...styles.td, textAlign: "left", fontWeight: isMe ? "bold" : "normal" }}>
                              {entry.username} {isMe && <span style={styles.youBadge}>YOU</span>}
                            </td>
                            <td style={{ ...styles.td, color: "#d97706", fontWeight: "bold" }}>
                              {entry.gamified_score?.toLocaleString() ?? '-'}
                            </td>
                            <td style={styles.td}>
                              {entry.best_score ?? '-'} / {entry.total_questions ?? '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {(!data?.leaderboard || data.leaderboard.length === 0) && (
                  <p style={styles.message}>No leaderboard data available yet.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    width: "100%",
    maxWidth: "520px",
    borderRadius: "4px",
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
  },

  // ── Notebook Header ──
  notebookHeader: {
    position: "relative",
    backgroundColor: "#1e293b",
    padding: "1rem 1.5rem 0.75rem",
    borderBottom: "3px solid #3b82f6",
  },
  punchedHoles: {
    position: "absolute",
    left: "16px",
    top: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    padding: "8px 0",
    zIndex: 2,
  },
  hole: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#fefdfb",
    border: "2px solid #475569",
  },
  headerContent: {
    marginLeft: "24px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#f8fafc",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  subtitle: {
    margin: "0.25rem 0 0 0",
    color: "#94a3b8",
    fontSize: "0.9rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "1.3rem",
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
  },

  // ── Ruled Body ──
  ruledContent: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#fefdfb",
    backgroundImage:
      "repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(203,213,225,0.3) 31px, rgba(203,213,225,0.3) 32px)",
    position: "relative",
  },
  redMargin: {
    width: "3px",
    backgroundColor: "#ef4444",
    opacity: 0.4,
    flexShrink: 0,
    marginLeft: "1.5rem",
    alignSelf: "stretch",
  },
  bodyInner: {
    flex: 1,
    padding: "1rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },

  // ── Rank Badge ──
  myRankBadge: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    padding: "0.6rem 0.8rem",
    borderRadius: "6px",
    textAlign: "center",
    color: "#1e40af",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: "0.95rem",
  },

  // ── Table ──
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 6px",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  th: {
    color: "#64748b",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    padding: "0.4rem 0.5rem",
    letterSpacing: "0.05em",
    textAlign: "center",
    borderBottom: "2px solid #e2e8f0",
  },
  tr: {
    borderRadius: "6px",
    transition: "background-color 0.15s ease",
  },
  td: {
    padding: "0.6rem 0.5rem",
    textAlign: "center",
    borderTop: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "0.9rem",
  },
  youBadge: {
    marginLeft: "6px",
    fontSize: "0.6rem",
    backgroundColor: "#3b82f6",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "white",
    fontWeight: "bold",
    letterSpacing: "0.03em",
  },

  // ── Pagination ──
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    padding: "0.75rem 0",
    flexWrap: "wrap",
  },
  paginationBtn: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "0.4rem 0.9rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    transition: "all 0.15s ease",
  },
  paginationText: {
    color: "#475569",
    fontSize: "0.8rem",
    fontWeight: "600",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Message ──
  message: {
    textAlign: "center",
    color: "#64748b",
    padding: "2rem 0",
    fontSize: "1rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
};