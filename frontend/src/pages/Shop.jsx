import { useState, useEffect } from "react";
import api from "../api/axios";

export default function Shop({ onNavigate, isSuperuser }) {
  const [items, setItems] = useState([]);
  const [stars, setStars] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [granting, setGranting] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const [shopRes, starsRes] = await Promise.all([
        api.get("/playthrough/shop/"),
        api.get("/playthrough/stars/"),
      ]);
      setItems(shopRes.data.items || []);
      setStars(starsRes.data.balance || 0);
    } catch (err) {
      console.error("Failed to load shop data", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item) => {
    if (stars < item.price) {
      setMessage({ type: "error", text: "Not enough stars!" });
      return;
    }
    if (!window.confirm(`Purchase ${item.name} for ${item.price} ⭐?`)) return;

    setPurchasing(item.id);
    try {
      const res = await api.post("/playthrough/shop/buy/", { item_id: item.id });
      setStars(res.data.balance);
      setMessage({ type: "success", text: res.data.message });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Purchase failed" });
    } finally {
      setPurchasing(null);
    }
  };

  const handleAdminGrant = async (item) => {
    if (!window.confirm(`Grant ${item.name} to yourself for free?`)) return;

    setGranting(item.id);
    try {
      const res = await api.post("/playthrough/shop/admin-grant/", { item_id: item.id });
      setStars(res.data.balance);
      setMessage({ type: "success", text: `✅ Granted ${item.name} for free!` });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Grant failed" });
    } finally {
      setGranting(null);
    }
  };

  const getModifierIcon = (slug) => {
    const icons = {
      "double-xp": "⚡",
      "score-boost": "🌟",
      "streak-shield": "🛡️",
      "dda_adjuster": "🔒",
    };
    return icons[slug] || "🎁";
  };

  const getModifierDescription = (item) => {
    if (item.type === "SCORE_BOOST") {
      return `${item.value}x score multiplier for this playthrough`;
    }
    if (item.type === "STREAK_SHIELD") {
      return "Protects your streak on one wrong answer";
    }
    return item.description;
  };

  return (
    <div style={styles.container}>
      <style>{`@keyframes diagonalSlide { 0% { background-position: 0 0, 0 0, 0 0; } 100% { background-position: -400px 400px, 0 0, 0 0; } }`}</style>
      <div style={styles.notebookCover}>
        <div style={styles.spiralBinding}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={styles.spiralHole}><div style={styles.spiralRing} /></div>
          ))}
        </div>
        <div style={styles.coverContent}>
          <div style={styles.marbleAccent} />
          <div style={styles.titleLabel}>
            <h1 style={styles.coverTitle}>⭐ Shop</h1>
            <p style={styles.coverSubtitle}>Spend your Stars on power-ups</p>
          </div>
          <div style={styles.ruledPage}>
            <div style={styles.redMargin} />
            <div style={styles.pageInner}>
              <div style={styles.starsDisplay}>
                <span style={styles.starsIcon}>⭐</span>
                <span style={styles.starsCount}>{stars.toLocaleString()}</span>
                <span style={styles.starsLabel}>Stars Available</span>
              </div>

              {isSuperuser && (
                <div style={styles.adminNotice}>
                  <span style={styles.adminBadge}>ADMIN MODE</span>
                  <span style={styles.adminText}>Free grant buttons enabled for testing</span>
                </div>
              )}

              {message && (
                <div style={{ ...styles.messageBox, backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#166534" : "#991b1b" }}>
                  {message.text}
                </div>
              )}

              {loading ? (
                <p style={styles.message}>Loading shop items...</p>
              ) : items.length === 0 ? (
                <p style={styles.message}>No items available in the shop right now.</p>
              ) : (
                <div style={styles.itemsGrid}>
                  {items.map((item) => (
                    <div key={item.id} style={styles.itemCard}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemIcon}>{getModifierIcon(item.slug)}</span>
                        <h3 style={styles.itemName}>{item.name}</h3>
                      </div>
                      <p style={styles.itemDescription}>{getModifierDescription(item)}</p>
                      <div style={styles.itemFooter}>
                        <span style={styles.itemPrice}>{item.price} ⭐</span>
                        {isSuperuser ? (
                          <button
                            style={{
                              ...styles.grantBtn,
                              opacity: granting === item.id ? 0.7 : 1,
                              cursor: granting === item.id ? "wait" : "pointer",
                            }}
                            disabled={granting === item.id}
                            onClick={() => handleAdminGrant(item)}
                          >
                            {granting === item.id ? "Granting..." : "Grant Free"}
                          </button>
                        ) : (
                          <button
                            style={{
                              ...styles.buyBtn,
                              opacity: stars < item.price ? 0.5 : 1,
                              cursor: stars < item.price ? "not-allowed" : "pointer",
                            }}
                            disabled={stars < item.price || purchasing === item.id}
                            onClick={() => handlePurchase(item)}
                          >
                            {purchasing === item.id ? "Processing..." : "Buy"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "calc(100vh - 60px)",
    backgroundColor: "#f5f3f0",
    backgroundImage: [
      `url('data:image/svg+xml;utf8,<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><text x="50" y="70" font-size="48" font-weight="bold" fill="rgba(239,68,68,0.25)" text-anchor="middle">+</text><text x="200" y="120" font-size="48" font-weight="bold" fill="rgba(251,191,36,0.25)" text-anchor="middle">−</text><text x="350" y="170" font-size="48" font-weight="bold" fill="rgba(79,70,229,0.25)" text-anchor="middle">×</text><text x="100" y="220" font-size="48" font-weight="bold" fill="rgba(34,197,94,0.3)" text-anchor="middle">÷</text><text x="300" y="280" font-size="48" font-weight="bold" fill="rgba(239,68,68,0.25)" text-anchor="middle">+</text><text x="150" y="330" font-size="48" font-weight="bold" fill="rgba(251,191,36,0.25)" text-anchor="middle">−</text></svg>')`,
      'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(120,100,80,0.28) 39px, rgba(120,100,80,0.28) 42px)',
      'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(120,100,80,0.28) 39px, rgba(120,100,80,0.28) 42px)',
    ].join(", "),
    backgroundRepeat: "repeat",
    animation: "diagonalSlide 12s linear infinite",
    display: "flex",
    justifyContent: "center",
    padding: "1.5rem 1rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  notebookCover: {
    position: "relative",
    display: "flex",
    backgroundColor: "#1e293b",
    borderRadius: "6px",
    width: "100%",
    maxWidth: "960px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
    border: "2px solid #334155",
    overflow: "hidden",
  },
  spiralBinding: {
    position: "absolute",
    left: "16px",
    top: "30px",
    bottom: "30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    zIndex: 10,
  },
  spiralHole: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#0f172a",
    border: "2px solid #475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spiralRing: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    backgroundColor: "#64748b",
  },
  coverContent: {
    position: "relative",
    flex: 1,
    padding: "1.75rem 1.5rem 1.75rem 2.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  marbleAccent: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: [
      "radial-gradient(ellipse at 20% 30%, rgba(99,179,237,0.05) 0%, transparent 50%)",
      "radial-gradient(ellipse at 80% 20%, rgba(192,132,252,0.04) 0%, transparent 40%)",
      "radial-gradient(ellipse at 50% 80%, rgba(13,202,240,0.03) 0%, transparent 50%)",
    ].join(", "),
    pointerEvents: "none",
  },
  titleLabel: {
    position: "relative",
    zIndex: 1,
    backgroundColor: "#334155",
    border: "1px solid #475569",
    borderRadius: "3px",
    padding: "0.65rem 1rem",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.25)",
  },
  coverTitle: {
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: "bold",
    color: "#fbbf24",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  coverSubtitle: {
    margin: "0.15rem 0 0",
    fontSize: "0.8rem",
    color: "#94a3b8",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  ruledPage: {
    position: "relative",
    zIndex: 1,
    backgroundColor: "#f8f7f4",
    borderRadius: "3px",
    border: "1px solid #cbd5e1",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "row",
    overflow: "hidden",
  },
  redMargin: {
    width: "3px",
    backgroundColor: "#ef4444",
    opacity: 0.4,
    flexShrink: 0,
  },
  pageInner: {
    flex: 1,
    padding: "1rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    minHeight: "400px",
  },
  starsDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0.75rem 1rem",
    backgroundColor: "#fef3c7",
    borderRadius: "8px",
    border: "1px solid #fbbf24",
    alignSelf: "flex-start",
  },
  starsIcon: {
    fontSize: "1.5rem",
  },
  starsCount: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "#92400e",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  starsLabel: {
    fontSize: "0.85rem",
    color: "#92400e",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  adminNotice: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0.5rem 0.75rem",
    backgroundColor: "#fee2e2",
    borderRadius: "6px",
    border: "1px solid #fca5a5",
    alignSelf: "flex-start",
  },
  adminBadge: {
    fontSize: "0.7rem",
    fontWeight: "bold",
    color: "#991b1b",
    backgroundColor: "#fecaca",
    padding: "2px 6px",
    borderRadius: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  adminText: {
    fontSize: "0.8rem",
    color: "#991b1b",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  messageBox: {
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "bold",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1rem",
    marginTop: "0.5rem",
  },
  itemCard: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  itemHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  itemIcon: {
    fontSize: "1.5rem",
  },
  itemName: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#1e293b",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  itemDescription: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#64748b",
    lineHeight: "1.4",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  itemFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: "0.5rem",
    borderTop: "1px solid #e2e8f0",
  },
  itemPrice: {
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: "#92400e",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  buyBtn: {
    backgroundColor: "#fbbf24",
    color: "#78350f",
    border: "none",
    padding: "0.4rem 0.9rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  grantBtn: {
    backgroundColor: "#4ade80",
    color: "#14532d",
    border: "none",
    padding: "0.4rem 0.9rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  message: {
    textAlign: "center",
    color: "#64748b",
    padding: "2rem 0",
    fontSize: "0.9rem",
  },
};