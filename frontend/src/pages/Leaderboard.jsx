import { useEffect, useState } from "react";
import api from "../api/axios"; // Integrated your environment-aware Axios client

export default function Leaderboard({ topicId, topicName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added tracking for failed data network streams

  useEffect(() => {
    if (!topicId) return;
    
    // Custom instance automatically routes to production or local address paths
    api.get(`/progress/leaderboard/${topicId}/`)
      .then((res) => {
        setData(res.data); // Payload unwrapped safely
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Error loading standings for topic ID ${topicId}:`, err);
        setError("Failed to load framework standings matrix.");
        setLoading(false);
      });
  }, [topicId]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>🏆 Leaderboard</h2>
            <p style={styles.subtitle}>{topicName}</p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {loading ? (
          <p style={styles.message}>Loading standings...</p>
        ) : error ? (
          <p style={{ ...styles.message, color: "#f56565" }}>⚠️ {error}</p>
        ) : (
          <>
            {/* The user's own status */}
            <div style={styles.myRankBadge}>
              Your current rank: <strong>#{data?.current_user_rank || 'N/A'}</strong>
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
                  {data?.leaderboard?.map((entry, idx) => {
                    const isMe = entry.is_current_user;
                    return (
                      <tr key={idx} style={{ ...styles.tr, backgroundColor: isMe ? "rgba(99, 179, 237, 0.1)" : "transparent" }}>
                        <td style={styles.td}>
                          {idx < 3 ? ["🥇", "🥈", "🥉"][idx] : `#${idx + 1}`}
                        </td>
                        <td style={{ ...styles.td, textAlign: "left", fontWeight: isMe ? "bold" : "normal" }}>
                          {entry.username} {isMe && <span style={styles.youBadge}>YOU</span>}
                        </td>
                        <td style={{ ...styles.td, color: "#f6ad55", fontWeight: "bold" }}>
                          {entry.gamified_score.toLocaleString()}
                        </td>
                        <td style={styles.td}>{entry.best_score} / {entry.total_questions}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#1a202c", borderRadius: "16px", padding: "2rem", width: "90%", maxWidth: "500px", color: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" },
  title: { margin: 0, fontSize: "1.5rem" },
  subtitle: { margin: 0, color: "#a0aec0", fontSize: "0.9rem" },
  closeBtn: { background: "transparent", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" },
  myRankBadge: { backgroundColor: "#2d3748", padding: "0.8rem", borderRadius: "8px", marginBottom: "1rem", textAlign: "center", color: "#63b3ed" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" },
  th: { color: "#718096", fontSize: "0.75rem", textTransform: "uppercase", padding: "0.5rem" },
  tr: { borderRadius: "8px" },
  td: { padding: "1rem 0.5rem", textAlign: "center", borderTop: "1px solid #2d3748", borderBottom: "1px solid #2d3748" },
  youBadge: { marginLeft: "8px", fontSize: "0.65rem", backgroundColor: "#63b3ed", padding: "2px 6px", borderRadius: "4px", color: "white" },
  message: { textAlign: "center", color: "#a0aec0", padding: "2rem", fontSize: "1rem" }
};