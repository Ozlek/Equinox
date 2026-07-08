import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const ITEMS_PER_PAGE = 10;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("accounts"); // 'accounts' | 'topics'
  const [users, setUsers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [editModal, setEditModal] = useState(null); // { type: 'question'|'topic', mode: 'edit'|'add', data }

  // Pagination state for accounts tab
  const [accountsPage, setAccountsPage] = useState(1);

  // Pagination state for questions
  const [questionsPage, setQuestionsPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/accounts/admin/users/");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  }, []);

  const fetchTopics = useCallback(async () => {
    try {
      const res = await api.get("/accounts/admin/topics/");
      setTopics(res.data);
    } catch (err) {
      console.error("Failed to load topics", err);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      const params = {};
      if (selectedTopicId) params.topic_id = selectedTopicId;
      if (selectedGrade) params.grade_level = selectedGrade;
      const res = await api.get("/accounts/admin/questions/", { params });
      setQuestions(res.data);
      setQuestionsPage(1);
    } catch (err) {
      console.error("Failed to load questions", err);
    }
  }, [selectedTopicId, selectedGrade]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUsers(), fetchTopics()]).finally(() => setLoading(false));
  }, [fetchUsers, fetchTopics]);

  useEffect(() => {
    if (activeTab === "topics") fetchQuestions();
  }, [activeTab, fetchQuestions]);

  // Filter users by search
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort states
  const [sortField, setSortField] = useState("date_joined");
  const [sortDir, setSortDir] = useState("desc");

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let cmp = 0;
    if (sortField === "username") cmp = a.username.localeCompare(b.username);
    else if (sortField === "user_type") cmp = a.user_type.localeCompare(b.user_type);
    else if (sortField === "grade_level") cmp = (a.grade_level || 0) - (b.grade_level || 0);
    else if (sortField === "progress_count") cmp = a.progress_count - b.progress_count;
    else cmp = new Date(a.date_joined) - new Date(b.date_joined);
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Paginate users
  const totalAccountsPages = Math.max(1, Math.ceil(sortedUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = sortedUsers.slice(
    (accountsPage - 1) * ITEMS_PER_PAGE,
    accountsPage * ITEMS_PER_PAGE
  );

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
    setAccountsPage(1);
  };

  // ── CRUD handlers ──
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await api.delete(`/accounts/admin/questions/${id}/`);
      fetchQuestions();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleSaveQuestion = async (data) => {
    try {
      if (data.id) {
        await api.put(`/accounts/admin/questions/${data.id}/`, data);
      } else {
        await api.post("/accounts/admin/questions/", data);
      }
      setEditModal(null);
      fetchQuestions();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm("Delete this topic and all its questions?")) return;
    try {
      await api.delete(`/accounts/admin/topics/${id}/`);
      fetchTopics();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleSaveTopic = async (data) => {
    try {
      if (data.id) {
        await api.put(`/accounts/admin/topics/${data.id}/`, data);
      } else {
        await api.post("/accounts/admin/topics/", data);
      }
      setEditModal(null);
      fetchTopics();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  // Pagination component
  const PaginationControls = ({ currentPage, totalPages, onPageChange, label }) => {
    if (totalPages <= 1) return null;
    return (
      <div style={styles.pagination}>
        <button
          style={{
            ...styles.paginationBtn,
            opacity: currentPage <= 1 ? 0.4 : 1,
            cursor: currentPage <= 1 ? "not-allowed" : "pointer",
          }}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ◀ Previous
        </button>
        <span style={styles.paginationText}>
          {label} Page {currentPage} of {totalPages}
        </span>
        <button
          style={{
            ...styles.paginationBtn,
            opacity: currentPage >= totalPages ? 0.4 : 1,
            cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
          }}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next ▶
        </button>
      </div>
    );
  };

  // ── Render ──
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes diagonalSlide {
          0% { background-position: 0 0, 0 0, 0 0; }
          100% { background-position: -400px 400px, 0 0, 0 0; }
        }
      `}</style>
      <div style={styles.notebookCover}>
        {/* Spiral binding */}
        <div style={styles.spiralBinding}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={styles.spiralHole}>
              <div style={styles.spiralRing} />
            </div>
          ))}
        </div>

        <div style={styles.coverContent}>
          <div style={styles.marbleAccent} />

          {/* Header */}
          <div style={styles.titleLabel}>
            <h1 style={styles.coverTitle}>⚙️ Admin Panel</h1>
            <p style={styles.coverSubtitle}>Database Management Dashboard</p>
          </div>

          {/* Ruled page */}
          <div style={styles.ruledPage}>
            <div style={styles.redMargin} />
            <div style={styles.pageInner}>
              {/* Tabs */}
              <div style={styles.tabBar}>
                <button
                  style={{
                    ...styles.tabBtn,
                    backgroundColor: activeTab === "accounts" ? "#3b82f6" : "#e2e8f0",
                    color: activeTab === "accounts" ? "#fff" : "#475569",
                  }}
                  onClick={() => setActiveTab("accounts")}
                >
                  👥 Accounts
                </button>
                <button
                  style={{
                    ...styles.tabBtn,
                    backgroundColor: activeTab === "topics" ? "#3b82f6" : "#e2e8f0",
                    color: activeTab === "topics" ? "#fff" : "#475569",
                  }}
                  onClick={() => setActiveTab("topics")}
                >
                  📚 Topics & Questions
                </button>
              </div>

              {loading ? (
                <p style={styles.message}>Loading database...</p>
              ) : activeTab === "accounts" ? (
                /* ── ACCOUNTS TAB ── */
                <div>
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setAccountsPage(1); }}
                    style={styles.searchInput}
                  />
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th} onClick={() => handleSort("username")}>
                            Username {sortField === "username" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th style={styles.th}>Email</th>
                          <th style={styles.th} onClick={() => handleSort("user_type")}>
                            Type {sortField === "user_type" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th style={styles.th} onClick={() => handleSort("grade_level")}>
                            Grade {sortField === "grade_level" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th style={styles.th} onClick={() => handleSort("progress_count")}>
                            Progress {sortField === "progress_count" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                          <th style={styles.th} onClick={() => handleSort("date_joined")}>
                            Joined {sortField === "date_joined" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map((u) => (
                          <tr key={u.id} style={styles.tr}>
                            <td style={styles.td}>{u.username}</td>
                            <td style={styles.td}>{u.email || "—"}</td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.roleBadge,
                                  backgroundColor:
                                    u.user_type === "admin"
                                      ? "#fef3c7"
                                      : u.user_type === "instructor"
                                      ? "#dbeafe"
                                      : "#f0fdf4",
                                  color:
                                    u.user_type === "admin"
                                      ? "#92400e"
                                      : u.user_type === "instructor"
                                      ? "#1e40af"
                                      : "#166534",
                                }}
                              >
                                {u.user_type}
                              </span>
                            </td>
                            <td style={styles.td}>{u.grade_level ?? "—"}</td>
                            <td style={styles.td}>{u.progress_count}</td>
                            <td style={styles.td}>{new Date(u.date_joined).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    currentPage={accountsPage}
                    totalPages={totalAccountsPages}
                    onPageChange={setAccountsPage}
                    label="Accounts"
                  />
                  <p style={styles.countText}>{sortedUsers.length} user(s)</p>
                </div>
              ) : (
                /* ── TOPICS & QUESTIONS TAB ── */
                <div>
                  {/* Topic list with inline grade/question expansion */}
                  <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
                    {topics.map((topic) => (
                      <div key={topic.id} style={styles.topicCard}>
                        <div style={styles.topicCardHeader}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: "#1e293b", fontSize: "1rem" }}>{topic.name}</strong>
                            <span style={styles.topicMeta}>
                              Grades {topic.grade_level_min}–{topic.grade_level_max} · {topic.total_questions} questions
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              style={styles.editBtn}
                              onClick={() =>
                                setEditModal({ type: "topic", mode: "edit", data: topic })
                              }
                            >
                              ✏️
                            </button>
                            <button
                              style={styles.deleteBtn}
                              onClick={() => handleDeleteTopic(topic.id)}
                            >
                              🗑️
                            </button>
                            <button
                              style={styles.addQBtn}
                              onClick={() => {
                                setSelectedTopicId(topic.id);
                                setSelectedGrade(null);
                                setEditModal({
                                  type: "question",
                                  mode: "add",
                                  data: { topic_id: topic.id, topic_name: topic.name },
                                });
                              }}
                            >
                              + Add Q
                            </button>
                          </div>
                        </div>

                        {/* Grade-level question browser */}
                        {selectedTopicId === topic.id && (
                          <div style={styles.gradeSection}>
                            {/* Grade filter for this topic */}
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                              {Array.from(
                                { length: topic.grade_level_max - topic.grade_level_min + 1 },
                                (_, i) => topic.grade_level_min + i
                              ).map((g) => (
                                <button
                                  key={g}
                                  style={{
                                    ...styles.gradeChip,
                                    backgroundColor: selectedGrade === g ? "#3b82f6" : "#e2e8f0",
                                    color: selectedGrade === g ? "#fff" : "#475569",
                                  }}
                                  onClick={() => { setSelectedGrade(selectedGrade === g ? null : g); setQuestionsPage(1); }}
                                >
                                  Grade {g}
                                </button>
                              ))}
                            </div>

                            {/* Question list with pagination */}
                            {(() => {
                              const filteredQuestions = questions
                                .filter((q) => q.topic_id === topic.id && (!selectedGrade || q.grade_level === selectedGrade));
                              const totalQPages = Math.max(1, Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE));
                              const safeQPage = Math.min(questionsPage, totalQPages);
                              const paginatedQuestions = filteredQuestions.slice(
                                (safeQPage - 1) * ITEMS_PER_PAGE,
                                safeQPage * ITEMS_PER_PAGE
                              );
                              return (
                                <>
                                  {paginatedQuestions.map((q) => (
                                    <div key={q.id} style={styles.questionRow}>
                                      <div style={{ flex: 1 }}>
                                        <p style={styles.qText}>{q.question_text}</p>
                                        <p style={styles.qMeta}>
                                          G{q.grade_level} · Diff: {q.difficulty} · Source: {q.source} · WP:{" "}
                                          {q.is_word_problem ? "Yes" : "No"}
                                        </p>
                                        {q.question_solution && (
                                          <p style={styles.qSolution}>Solution: {q.question_solution}</p>
                                        )}
                                        <p style={styles.qAnswer}>Answer: {q.correct_answer}</p>
                                      </div>
                                      <div style={{ display: "flex", gap: "4px" }}>
                                        <button
                                          style={styles.editBtn}
                                          onClick={() =>
                                            setEditModal({ type: "question", mode: "edit", data: q })
                                          }
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          style={styles.deleteBtn}
                                          onClick={() => handleDeleteQuestion(q.id)}
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  <PaginationControls
                                    currentPage={safeQPage}
                                    totalPages={totalQPages}
                                    onPageChange={(p) => {
                                      const maxP = Math.max(1, Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE));
                                      setQuestionsPage(Math.min(p, maxP));
                                    }}
                                    label="Questions"
                                  />
                                </>
                              );
                            })()}

                            <button
                              style={styles.addQuestionBtn}
                              onClick={() =>
                                setEditModal({
                                  type: "question",
                                  mode: "add",
                                  data: { topic_id: topic.id, grade_level: selectedGrade || topic.grade_level_min },
                                })
                              }
                            >
                              + Add Question
                            </button>
                          </div>
                        )}

                        {selectedTopicId !== topic.id && (
                          <button
                            style={styles.expandBtn}
                            onClick={() => {
                              setSelectedTopicId(topic.id);
                              setSelectedGrade(null);
                              setQuestionsPage(1);
                            }}
                          >
                            ▶ View Questions
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    style={styles.addTopicBtn}
                    onClick={() => setEditModal({ type: "topic", mode: "add", data: {} })}
                  >
                    + Add Topic
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editModal && (
        <CrudModal
          type={editModal.type}
          mode={editModal.mode}
          initialData={editModal.data}
          topics={topics}
          onSave={
            editModal.type === "question"
              ? handleSaveQuestion
              : handleSaveTopic
          }
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
}

// ── CRUD Modal ──
function CrudModal({ type, mode, initialData, topics, onSave, onClose }) {
  const [form, setForm] = useState({ ...initialData });

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const inputStyle = {
    width: "100%",
    padding: "0.5rem 0.7rem",
    border: "1px solid #cbd5e1",
    borderRadius: "3px",
    fontSize: "0.85rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    boxSizing: "border-box",
    outline: "none",
  };
  const labelStyle = {
    fontSize: "0.65rem",
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "2px",
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0, color: "#f8fafc", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>
            {mode === "add" ? "Add" : "Edit"} {type === "question" ? "Question" : "Topic"}
          </h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <div style={styles.modalBody}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {type === "question" ? (
              <>
                <div>
                  <label style={labelStyle}>Topic</label>
                  <select
                    style={inputStyle}
                    value={form.topic_id || ""}
                    onChange={(e) => handleChange("topic_id", parseInt(e.target.value))}
                    required
                  >
                    <option value="">Select topic...</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Question Text</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
                    value={form.question_text || ""}
                    onChange={(e) => handleChange("question_text", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Solution</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: "40px", resize: "vertical" }}
                    value={form.question_solution || ""}
                    onChange={(e) => handleChange("question_solution", e.target.value)}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <label style={labelStyle}>Choice A</label>
                    <input
                      style={inputStyle}
                      value={form.choice_a || ""}
                      onChange={(e) => handleChange("choice_a", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Choice B</label>
                    <input
                      style={inputStyle}
                      value={form.choice_b || ""}
                      onChange={(e) => handleChange("choice_b", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Choice C</label>
                    <input
                      style={inputStyle}
                      value={form.choice_c || ""}
                      onChange={(e) => handleChange("choice_c", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Choice D</label>
                    <input
                      style={inputStyle}
                      value={form.choice_d || ""}
                      onChange={(e) => handleChange("choice_d", e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <label style={labelStyle}>Correct Answer</label>
                    <input
                      style={inputStyle}
                      value={form.correct_answer || ""}
                      onChange={(e) => handleChange("correct_answer", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Grade Level</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      style={inputStyle}
                      value={form.grade_level || ""}
                      onChange={(e) => handleChange("grade_level", parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Difficulty (1–4)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="4"
                      style={inputStyle}
                      value={form.difficulty || ""}
                      onChange={(e) => handleChange("difficulty", parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Is Word Problem</label>
                    <select
                      style={inputStyle}
                      value={form.is_word_problem ?? true}
                      onChange={(e) => handleChange("is_word_problem", e.target.value === "true")}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={labelStyle}>Topic Name</label>
                  <select
                    style={inputStyle}
                    value={form.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  >
                    <option value="">Select...</option>
                    {[
                      "Arithmetic",
                      "Number Sense and Place Value",
                      "Fractions, Decimals, and Percentages",
                      "Ratios and Proportional Reasoning",
                      "Algebra and Algebraic Expressions",
                      "Functions and Graphing",
                      "Geometry and Spatial Reasoning",
                      "Exponents, Powers, and Scientific Notation",
                      "Polynomials",
                      "Trigonometry",
                      "Statistics and Data Analysis",
                    ].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: "50px", resize: "vertical" }}
                    value={form.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <label style={labelStyle}>Grade Min</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      style={inputStyle}
                      value={form.grade_level_min || 1}
                      onChange={(e) => handleChange("grade_level_min", parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Grade Max</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      style={inputStyle}
                      value={form.grade_level_max || 10}
                      onChange={(e) => handleChange("grade_level_max", parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </>
            )}
            <button type="submit" style={styles.saveBtn}>
              💾 Save
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──
const styles = {
  container: {
    minHeight: "calc(100vh - 60px)",
    backgroundColor: '#f5f3f0',
    backgroundImage: [
      `url('data:image/svg+xml;utf8,<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><text x="50" y="70" font-size="48" font-weight="bold" fill="rgba(239,68,68,0.25)" text-anchor="middle">+</text><text x="200" y="120" font-size="48" font-weight="bold" fill="rgba(251,191,36,0.25)" text-anchor="middle">−</text><text x="350" y="170" font-size="48" font-weight="bold" fill="rgba(79,70,229,0.25)" text-anchor="middle">×</text><text x="100" y="220" font-size="48" font-weight="bold" fill="rgba(34,197,94,0.3)" text-anchor="middle">÷</text><text x="300" y="280" font-size="48" font-weight="bold" fill="rgba(239,68,68,0.25)" text-anchor="middle">+</text><text x="150" y="330" font-size="48" font-weight="bold" fill="rgba(251,191,36,0.25)" text-anchor="middle">−</text></svg>')`,
      'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(120,100,80,0.28) 39px, rgba(120,100,80,0.28) 42px)',
      'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(120,100,80,0.28) 39px, rgba(120,100,80,0.28) 42px)',
    ].join(', '),
    backgroundRepeat: 'repeat',
    animation: 'diagonalSlide 12s linear infinite',
    display: "flex",
    justifyContent: "center",
    padding: "1.5rem 1rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  // ... rest of styles remain the same
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
    color: "#60a5fa",
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
  tabBar: {
    display: "flex",
    gap: "8px",
  },
  tabBtn: {
    flex: 1,
    padding: "0.5rem",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    transition: "all 0.15s ease",
  },
  searchInput: {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    boxSizing: "border-box",
    outline: "none",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.8rem",
  },
  th: {
    textAlign: "left",
    padding: "0.4rem 0.5rem",
    color: "#64748b",
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "2px solid #e2e8f0",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "0.4rem 0.5rem",
    color: "#334155",
    fontSize: "0.8rem",
  },
  roleBadge: {
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "0.65rem",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  countText: {
    textAlign: "right",
    color: "#94a3b8",
    fontSize: "0.75rem",
    margin: "0.25rem 0 0",
  },
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
  topicCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#fffefb",
    overflow: "hidden",
  },
  topicCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    borderBottom: "1px solid #e2e8f0",
    flexWrap: "wrap",
  },
  topicMeta: {
    display: "block",
    fontSize: "0.7rem",
    color: "#64748b",
  },
  expandBtn: {
    width: "100%",
    padding: "0.4rem",
    border: "none",
    background: "none",
    cursor: "pointer",
    color: "#3b82f6",
    fontSize: "0.75rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  gradeSection: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#f8fafc",
  },
  gradeChip: {
    padding: "3px 10px",
    border: "none",
    borderRadius: "999px",
    fontSize: "0.7rem",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  questionRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    padding: "0.4rem 0.5rem",
    borderBottom: "1px solid #e2e8f0",
  },
  qText: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#1e293b",
  },
  qMeta: {
    margin: "2px 0 0",
    fontSize: "0.65rem",
    color: "#94a3b8",
  },
  qSolution: {
    margin: "2px 0 0",
    fontSize: "0.7rem",
    color: "#64748b",
    fontStyle: "italic",
  },
  qAnswer: {
    margin: "2px 0 0",
    fontSize: "0.7rem",
    color: "#059669",
    fontWeight: "bold",
  },
  editBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    padding: "2px",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    padding: "2px",
  },
  addQBtn: {
    padding: "3px 8px",
    border: "1px solid #3b82f6",
    borderRadius: "4px",
    background: "#eff6ff",
    color: "#3b82f6",
    cursor: "pointer",
    fontSize: "0.7rem",
    fontWeight: "bold",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  addQuestionBtn: {
    width: "100%",
    padding: "0.35rem",
    border: "1px dashed #3b82f6",
    borderRadius: "4px",
    background: "none",
    color: "#3b82f6",
    cursor: "pointer",
    marginTop: "0.5rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: "0.75rem",
  },
  addTopicBtn: {
    width: "100%",
    padding: "0.6rem",
    border: "2px dashed #3b82f6",
    borderRadius: "6px",
    background: "none",
    color: "#3b82f6",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
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
    maxWidth: "560px",
    borderRadius: "6px",
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
  },
  modalHeader: {
    backgroundColor: "#1e293b",
    padding: "0.75rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "3px solid #3b82f6",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "1.2rem",
    cursor: "pointer",
  },
  modalBody: {
    backgroundColor: "#fefdfb",
    padding: "1rem 1.25rem",
    maxHeight: "70vh",
    overflowY: "auto",
  },
  saveBtn: {
    width: "100%",
    padding: "0.55rem",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    marginTop: "0.25rem",
  },
  message: {
    textAlign: "center",
    color: "#64748b",
    padding: "2rem 0",
    fontSize: "0.9rem",
  },
};