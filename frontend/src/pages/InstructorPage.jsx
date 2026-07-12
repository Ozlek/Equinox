import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import { useConfirmDialog } from "../components/ConfirmDialog";

const ITEMS_PER_PAGE = 10;

export default function InstructorPage() {
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [activeTab, setActiveTab] = useState("questions"); // 'questions' | 'lessons' | 'my-requests' | 'my-lesson-requests'
  const [myRequests, setMyRequests] = useState([]);
  const [myLessonRequests, setMyLessonRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [instructorProfile, setInstructorProfile] = useState(null);
  const { showToast, ToastContainer } = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

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
      const res = await api.get("/accounts/instructor/questions/", { params });
      setQuestions(res.data);
      setQuestionsPage(1);
    } catch (err) {
      console.error("Failed to load questions", err);
    }
  }, [selectedTopicId, selectedGrade]);

  const fetchMyRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await api.get("/accounts/instructor/my-change-requests/");
      setMyRequests(res.data);
    } catch (err) {
      console.error("Failed to load change requests", err);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const fetchLessons = useCallback(async () => {
    try {
      const params = {};
      if (selectedTopicId) params.topic_id = selectedTopicId;
      if (selectedGrade) params.grade_level = selectedGrade;
      const res = await api.get("/accounts/instructor/lessons/", { params });
      setLessons(res.data);
    } catch (err) {
      console.error("Failed to load lessons", err);
    }
  }, [selectedTopicId, selectedGrade]);

  const fetchMyLessonRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await api.get("/accounts/instructor/my-lesson-change-requests/");
      setMyLessonRequests(res.data);
    } catch (err) {
      console.error("Failed to load lesson change requests", err);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const fetchInstructorProfile = useCallback(async () => {
    try {
      const res = await api.get("/accounts/instructor/profile/");
      setInstructorProfile(res.data);
    } catch (err) {
      console.error("Failed to load instructor profile", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTopics(), fetchInstructorProfile()]).finally(() => setLoading(false));
  }, [fetchTopics, fetchInstructorProfile]);

  useEffect(() => {
    if (selectedTopicId) fetchQuestions();
  }, [selectedTopicId, selectedGrade, fetchQuestions]);

  useEffect(() => {
    if (activeTab === "my-requests") fetchMyRequests();
  }, [activeTab, fetchMyRequests]);

  useEffect(() => {
    if (activeTab === "lessons") fetchLessons();
  }, [activeTab, fetchLessons, selectedTopicId, selectedGrade]);

  useEffect(() => {
    if (activeTab === "my-lesson-requests") fetchMyLessonRequests();
  }, [activeTab, fetchMyLessonRequests]);

  const handleDeleteQuestion = async (id) => {
    const ok = await confirm("Are you sure you want to submit a deletion request for this question? An admin will review it before it is removed.", {
      title: "Delete Question",
      confirmText: "Submit Request",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/accounts/instructor/questions/${id}/`);
      showToast(res.data.message || "Deletion request submitted!", "info");
      fetchQuestions();
    } catch (err) {
      console.error("Delete failed", err);
      showToast("Failed to submit deletion request", "error");
    }
  };

  const handleSaveQuestion = async (data) => {
    try {
      let res;
      if (data.id) {
        res = await api.put(`/accounts/instructor/questions/${data.id}/`, data);
      } else {
        res = await api.post("/accounts/instructor/questions/", data);
      }
      showToast(res.data.message || "Change request submitted for admin review!", "success");
      setEditModal(null);
      fetchQuestions();
    } catch (err) {
      console.error("Save failed", err);
      showToast("Failed to submit change request", "error");
    }
  };

  const handleToggleVerify = async (id, currentVerified) => {
    try {
      const res = await api.post(`/accounts/instructor/questions/${id}/toggle-verify/`);
      showToast(res.data.message || `Verification toggled`, "success");
      fetchQuestions();
    } catch (err) {
      console.error("Toggle verify failed", err);
      showToast("Failed to toggle verification", "error");
    }
  };

  const handleDeleteLesson = async (id) => {
    const ok = await confirm("Are you sure you want to submit a deletion request for this lesson? An admin will review it before it is removed.", {
      title: "Delete Lesson",
      confirmText: "Submit Request",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/accounts/instructor/lessons/${id}/`);
      showToast(res.data.message || "Deletion request submitted!", "info");
      fetchLessons();
    } catch (err) {
      console.error("Delete failed", err);
      showToast("Failed to submit deletion request", "error");
    }
  };

  const handleSaveLesson = async (data) => {
    try {
      let res;
      if (data.id) {
        res = await api.put(`/accounts/instructor/lessons/${data.id}/`, data);
      } else {
        res = await api.post("/accounts/instructor/lessons/", data);
      }
      showToast(res.data.message || "Change request submitted for admin review!", "success");
      setEditModal(null);
      fetchLessons();
    } catch (err) {
      console.error("Save failed", err);
      showToast("Failed to submit change request", "error");
    }
  };

  const PaginationControls = ({ currentPage, totalPages, onPageChange, label }) => {
    if (totalPages <= 1) return null;
    return (
      <div style={styles.pagination}>
        <button
          style={{ ...styles.paginationBtn, opacity: currentPage <= 1 ? 0.4 : 1, cursor: currentPage <= 1 ? "not-allowed" : "pointer" }}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >◀ Previous</button>
        <span style={styles.paginationText}>{label} Page {currentPage} of {totalPages}</span>
        <button
          style={{ ...styles.paginationBtn, opacity: currentPage >= totalPages ? 0.4 : 1, cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >Next ▶</button>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: "#fef3c7", color: "#92400e" },
      approved: { bg: "#d1fae5", color: "#065f46" },
      rejected: { bg: "#fee2e2", color: "#991b1b" },
    };
    const c = colors[status] || colors.pending;
    return (
      <span style={{ ...styles.statusBadge, backgroundColor: c.bg, color: c.color }}>
        {status}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <style>{`@keyframes diagonalSlide { 0% { background-position: 0 0, 0 0, 0 0; } 100% { background-position: -400px 400px, 0 0, 0 0; } }`}</style>
      <ToastContainer />
      <ConfirmDialogComponent />
      <div style={styles.notebookCover}>
        <div style={styles.spiralBinding}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={styles.spiralHole}><div style={styles.spiralRing} /></div>
          ))}
        </div>
        <div style={styles.coverContent}>
          <div style={styles.marbleAccent} />
          <div style={styles.titleLabel}>
            <h1 style={styles.coverTitle}>📝 Instructor Portal</h1>
            <p style={styles.coverSubtitle}>Manage Questions & Learning Content</p>
          </div>
          <div style={styles.ruledPage}>
            <div style={styles.redMargin} />
            <div style={styles.pageInner}>
              {/* Instructor scope notice */}
              {instructorProfile && (
                <div style={{
                  padding: '0.5rem 0.7rem',
                  backgroundColor: 'rgba(99, 102, 241, 0.06)',
                  border: '1px solid #c7d2fe',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  color: '#4338ca',
                  lineHeight: '1.4',
                }}>
                  <strong>Your Assigned Scope:</strong>{' '}
                  Grades {instructorProfile.grade_level_min || '?'}–{instructorProfile.grade_level_max || '?'}
                  {instructorProfile.assigned_topics && instructorProfile.assigned_topics.length > 0 && (
                    <> · Topics: {instructorProfile.assigned_topics.map(t => t.name).join(', ')}</>
                  )}
                  {instructorProfile.instructional_scope && (
                    <> · Scope: {instructorProfile.instructional_scope}</>
                  )}
                </div>
              )}

              {/* Tab bar */}
              <div style={styles.tabBar}>
                <button
                  style={{ ...styles.tabBtn, backgroundColor: activeTab === "questions" ? "#6366f1" : "#e2e8f0", color: activeTab === "questions" ? "#fff" : "#475569" }}
                  onClick={() => setActiveTab("questions")}
                >📋 Questions</button>
                <button
                  style={{ ...styles.tabBtn, backgroundColor: activeTab === "lessons" ? "#6366f1" : "#e2e8f0", color: activeTab === "lessons" ? "#fff" : "#475569" }}
                  onClick={() => setActiveTab("lessons")}
                >📖 Lessons</button>
                <button
                  style={{ ...styles.tabBtn, backgroundColor: activeTab === "my-requests" ? "#6366f1" : "#e2e8f0", color: activeTab === "my-requests" ? "#fff" : "#475569" }}
                  onClick={() => setActiveTab("my-requests")}
                >📬 My Change Requests</button>
                <button
                  style={{ ...styles.tabBtn, backgroundColor: activeTab === "my-lesson-requests" ? "#6366f1" : "#e2e8f0", color: activeTab === "my-lesson-requests" ? "#fff" : "#475569" }}
                  onClick={() => setActiveTab("my-lesson-requests")}
                >📒 My Lesson Requests</button>
              </div>

              {activeTab === "questions" ? (
                <>
                  {loading ? (
                    <p style={styles.message}>Loading learning content...</p>
                  ) : (
                    <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
                      {topics.map((topic) => (
                        <div key={topic.id} style={styles.topicCard}>
                          <div style={styles.topicCardHeader}>
                            <div style={{ flex: 1 }}>
                              <strong style={{ color: "#1e293b", fontSize: "1rem" }}>{topic.name}</strong>
                              <span style={styles.topicMeta}>Grades {topic.grade_level_min}–{topic.grade_level_max} · {topic.total_questions} questions</span>
                            </div>
                            <button style={styles.addQBtn} onClick={() => { setSelectedTopicId(topic.id); setEditModal({ type: "question", mode: "add", data: { topic_id: topic.id, grade_level: topic.grade_level_min } }); }}>+ Add Question</button>
                          </div>
                          {selectedTopicId === topic.id && (
                            <div style={styles.gradeSection}>
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                                {Array.from({ length: topic.grade_level_max - topic.grade_level_min + 1 }, (_, i) => topic.grade_level_min + i).map((g) => (
                                  <button key={g} style={{ ...styles.gradeChip, backgroundColor: selectedGrade === g ? "#6366f1" : "#e2e8f0", color: selectedGrade === g ? "#fff" : "#475569" }} onClick={() => { setSelectedGrade(selectedGrade === g ? null : g); setQuestionsPage(1); }}>Grade {g}</button>
                                ))}
                              </div>
                              {(() => {
                                const filteredQuestions = questions.filter((q) => q.topic_id === topic.id && (!selectedGrade || q.grade_level === selectedGrade));
                                const totalQPages = Math.max(1, Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE));
                                const safeQPage = Math.min(questionsPage, totalQPages);
                                const paginatedQuestions = filteredQuestions.slice((safeQPage - 1) * ITEMS_PER_PAGE, safeQPage * ITEMS_PER_PAGE);
                                return (
                                  <>
                                    {paginatedQuestions.map((q) => (
                                      <div key={q.id} style={styles.questionRow}>
                                        <div style={{ flex: 1 }}>
                                          <p style={styles.qText}>
                                            {q.is_verified ? "✅ " : "⬜ "}{q.question_text}
                                          </p>
                                          <p style={styles.qMeta}>G{q.grade_level} · Diff: {q.difficulty} · WP: {q.is_word_problem ? "Yes" : "No"} · {q.is_verified ? "Verified" : "Unverified"}</p>
                                          {q.question_solution && <p style={styles.qSolution}>Solution: {q.question_solution}</p>}
                                          <p style={styles.qAnswer}>Answer: {q.correct_answer}</p>
                                          {q.choice_a && <p style={styles.qChoices}>A: {q.choice_a} · B: {q.choice_b} · C: {q.choice_c} · D: {q.choice_d}</p>}
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                                          <button
                                            style={{
                                              ...styles.verifyBtn,
                                              backgroundColor: q.is_verified ? "#059669" : "#6b7280",
                                            }}
                                            onClick={() => handleToggleVerify(q.id, q.is_verified)}
                                            title={q.is_verified ? "Mark as Unverified" : "Mark as Verified"}
                                          >
                                            {q.is_verified ? "✅ Verified" : "⬜ Verify"}
                                          </button>
                                          <div style={{ display: "flex", gap: "4px" }}>
                                            <button style={styles.editBtn} onClick={() => setEditModal({ type: "question", mode: "edit", data: q })}>✏️</button>
                                            <button style={styles.deleteBtn} onClick={() => handleDeleteQuestion(q.id)}>🗑️</button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    <PaginationControls currentPage={safeQPage} totalPages={totalQPages} onPageChange={(p) => setQuestionsPage(Math.min(p, totalQPages))} label="Questions" />
                                  </>
                                );
                              })()}
                              <button style={styles.addQuestionBtn} onClick={() => setEditModal({ type: "question", mode: "add", data: { topic_id: topic.id, grade_level: selectedGrade || topic.grade_level_min } })}>+ Add Question</button>
                            </div>
                          )}
                          {selectedTopicId !== topic.id && (
                            <button style={styles.expandBtn} onClick={() => { setSelectedTopicId(topic.id); setSelectedGrade(null); setQuestionsPage(1); }}>▶ View Questions ({topic.total_questions})</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : activeTab === "lessons" ? (
                /* ── LESSONS TAB ── */
                <div>
                  <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
                    {topics.map((topic) => (
                      <div key={topic.id} style={styles.topicCard}>
                        <div style={styles.topicCardHeader}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: "#1e293b", fontSize: "1rem" }}>{topic.name}</strong>
                            <span style={styles.topicMeta}>Grades {topic.grade_level_min}–{topic.grade_level_max}</span>
                          </div>
                          <button style={styles.addQBtn} onClick={() => { setSelectedTopicId(topic.id); setEditModal({ type: "lesson", mode: "add", data: { topic_id: topic.id, grade_level: topic.grade_level_min } }); }}>+ Add Lesson</button>
                        </div>
                        {selectedTopicId === topic.id && (
                          <div style={styles.gradeSection}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                              {Array.from({ length: topic.grade_level_max - topic.grade_level_min + 1 }, (_, i) => topic.grade_level_min + i).map((g) => (
                                <button key={g} style={{ ...styles.gradeChip, backgroundColor: selectedGrade === g ? "#6366f1" : "#e2e8f0", color: selectedGrade === g ? "#fff" : "#475569" }} onClick={() => { setSelectedGrade(selectedGrade === g ? null : g); }}>Grade {g}</button>
                              ))}
                            </div>
                            {(() => {
                              const filteredLessons = lessons.filter((l) => l.topic_id === topic.id && (!selectedGrade || l.grade_level === selectedGrade));
                              return (
                                <>
                                  {filteredLessons.length === 0 ? (
                                    <p style={{ fontSize: "0.8rem", color: "#64748b", padding: "0.5rem" }}>No lessons for this grade level.</p>
                                  ) : (
                                    filteredLessons.map((l) => (
                                      <div key={l.id} style={styles.questionRow}>
                                        <div style={{ flex: 1 }}>
                                          <p style={styles.qText}><strong>{l.title}</strong></p>
                                          <p style={styles.qMeta}>Grade {l.grade_level} · Order: {l.order}</p>
                                          {l.objectives && l.objectives.length > 0 && (
                                            <p style={styles.qSolution}>Objectives: {l.objectives.slice(0, 2).join(", ")}{l.objectives.length > 2 ? "..." : ""}</p>
                                          )}
                                        </div>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                          <button style={styles.editBtn} onClick={() => setEditModal({ type: "lesson", mode: "edit", data: l })}>✏️</button>
                                          <button style={styles.deleteBtn} onClick={() => handleDeleteLesson(l.id)}>🗑️</button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </>
                              );
                            })()}
                            <button style={styles.addQuestionBtn} onClick={() => setEditModal({ type: "lesson", mode: "add", data: { topic_id: topic.id, grade_level: selectedGrade || topic.grade_level_min } })}>+ Add Lesson</button>
                          </div>
                        )}
                        {selectedTopicId !== topic.id && (
                          <button style={styles.expandBtn} onClick={() => { setSelectedTopicId(topic.id); setSelectedGrade(null); }}>▶ View Lessons</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeTab === "my-requests" ? (
                /* ── MY CHANGE REQUESTS TAB ── */
                <div>
                  {requestsLoading ? (
                    <p style={styles.message}>Loading your change requests...</p>
                  ) : myRequests.length === 0 ? (
                    <p style={styles.message}>You haven't submitted any change requests yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {myRequests.map((req) => (
                        <div key={req.id} style={styles.requestCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                            <div>
                              <strong style={{ color: "#1e293b", fontSize: "0.85rem", textTransform: "uppercase" }}>
                                {req.change_type === "add" ? "➕ Add" : req.change_type === "edit" ? "✏️ Edit" : "🗑️ Delete"} Question
                              </strong>
                              <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#64748b" }}>
                                Submitted: {new Date(req.created_at).toLocaleString()}
                              </p>
                              {req.reviewed_by && (
                                <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#64748b" }}>
                                  Reviewed by: {req.reviewed_by}
                                </p>
                              )}
                              {req.review_notes && (
                                <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#64748b", fontStyle: "italic" }}>
                                  Notes: {req.review_notes}
                                </p>
                              )}
                              {req.change_type === "add" && req.proposed_data?.question_text && (
                                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#334155" }}>
                                  Q: {req.proposed_data.question_text.substring(0, 100)}{req.proposed_data.question_text.length > 100 ? "..." : ""}
                                </p>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {getStatusBadge(req.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ── MY LESSON REQUESTS TAB ── */
                <div>
                  {requestsLoading ? (
                    <p style={styles.message}>Loading your lesson change requests...</p>
                  ) : myLessonRequests.length === 0 ? (
                    <p style={styles.message}>You haven't submitted any lesson change requests yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {myLessonRequests.map((req) => (
                        <div key={req.id} style={styles.requestCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                            <div>
                              <strong style={{ color: "#1e293b", fontSize: "0.85rem", textTransform: "uppercase" }}>
                                {req.change_type === "add" ? "➕ Add" : req.change_type === "edit" ? "✏️ Edit" : "🗑️ Delete"} Lesson
                              </strong>
                              <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#64748b" }}>
                                Submitted: {new Date(req.created_at).toLocaleString()}
                              </p>
                              {req.reviewed_by && (
                                <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#64748b" }}>
                                  Reviewed by: {req.reviewed_by}
                                </p>
                              )}
                              {req.review_notes && (
                                <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#64748b", fontStyle: "italic" }}>
                                  Notes: {req.review_notes}
                                </p>
                              )}
                              {req.change_type === "add" && req.proposed_data?.title && (
                                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#334155" }}>
                                  Title: {req.proposed_data.title}
                                </p>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {getStatusBadge(req.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {editModal && editModal.type === "lesson" && <LessonCrudModal mode={editModal.mode} initialData={editModal.data} topics={topics} onSave={handleSaveLesson} onClose={() => setEditModal(null)} />}
      {editModal && editModal.type !== "lesson" && <QuestionCrudModal mode={editModal.mode} initialData={editModal.data} topics={topics} onSave={handleSaveQuestion} onClose={() => setEditModal(null)} />}
    </div>
  );
}

function QuestionCrudModal({ mode, initialData, topics, onSave, onClose }) {
  const [form, setForm] = useState({ ...initialData });
  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };
  const inputStyle = { width: "100%", padding: "0.5rem 0.7rem", border: "1px solid #cbd5e1", borderRadius: "3px", fontSize: "0.85rem", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif", boxSizing: "border-box", outline: "none" };
  const labelStyle = { fontSize: "0.65rem", fontWeight: "bold", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" };
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0, color: "#f8fafc", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>{mode === "add" ? "Add" : "Edit"} Question</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <div style={styles.modalBody}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div><label style={labelStyle}>Topic</label><select style={inputStyle} value={form.topic_id || ""} onChange={(e) => handleChange("topic_id", parseInt(e.target.value))} required><option value="">Select topic...</option>{topics.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}</select></div>
            <div><label style={labelStyle}>Question Text</label><textarea style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} value={form.question_text || ""} onChange={(e) => handleChange("question_text", e.target.value)} required /></div>
            <div><label style={labelStyle}>Solution</label><textarea style={{ ...inputStyle, minHeight: "40px", resize: "vertical" }} value={form.question_solution || ""} onChange={(e) => handleChange("question_solution", e.target.value)} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div><label style={labelStyle}>Choice A</label><input style={inputStyle} value={form.choice_a || ""} onChange={(e) => handleChange("choice_a", e.target.value)} /></div>
              <div><label style={labelStyle}>Choice B</label><input style={inputStyle} value={form.choice_b || ""} onChange={(e) => handleChange("choice_b", e.target.value)} /></div>
              <div><label style={labelStyle}>Choice C</label><input style={inputStyle} value={form.choice_c || ""} onChange={(e) => handleChange("choice_c", e.target.value)} /></div>
              <div><label style={labelStyle}>Choice D</label><input style={inputStyle} value={form.choice_d || ""} onChange={(e) => handleChange("choice_d", e.target.value)} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div><label style={labelStyle}>Correct Answer</label><input style={inputStyle} value={form.correct_answer || ""} onChange={(e) => handleChange("correct_answer", e.target.value)} required /></div>
              <div><label style={labelStyle}>Grade Level</label><input type="number" min="1" max="10" style={inputStyle} value={form.grade_level || ""} onChange={(e) => handleChange("grade_level", parseInt(e.target.value))} required /></div>
              <div><label style={labelStyle}>Difficulty (1–4)</label><input type="number" step="0.1" min="1" max="4" style={inputStyle} value={form.difficulty || ""} onChange={(e) => handleChange("difficulty", parseFloat(e.target.value))} required /></div>
              <div><label style={labelStyle}>Is Word Problem</label><select style={inputStyle} value={form.is_word_problem ?? true} onChange={(e) => handleChange("is_word_problem", e.target.value === "true")}><option value="true">Yes</option><option value="false">No</option></select></div>
            </div>
            <p style={{ fontSize: "0.7rem", color: "#6366f1", textAlign: "center", margin: "0" }}>
              ℹ️ This will be submitted as a change request for admin review.
            </p>
  <button type="submit" style={styles.saveBtn}>📤 Submit for Review</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function LessonCrudModal({ mode, initialData, topics, onSave, onClose }) {
  const [form, setForm] = useState({ ...initialData });
  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };
  const inputStyle = { width: "100%", padding: "0.5rem 0.7rem", border: "1px solid #cbd5e1", borderRadius: "3px", fontSize: "0.85rem", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif", boxSizing: "border-box", outline: "none" };
  const labelStyle = { fontSize: "0.65rem", fontWeight: "bold", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" };
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0, color: "#f8fafc", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>{mode === "add" ? "Add" : "Edit"} Lesson</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <div style={styles.modalBody}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div><label style={labelStyle}>Topic</label><select style={inputStyle} value={form.topic_id || ""} onChange={(e) => handleChange("topic_id", parseInt(e.target.value))} required><option value="">Select topic...</option>{topics.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}</select></div>
            <div><label style={labelStyle}>Lesson Title</label><input style={inputStyle} type="text" placeholder="Enter lesson title..." value={form.title || ""} onChange={(e) => handleChange("title", e.target.value)} required /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div><label style={labelStyle}>Grade Level</label><input type="number" min="1" max="10" style={inputStyle} value={form.grade_level || ""} onChange={(e) => handleChange("grade_level", parseInt(e.target.value))} required /></div>
              <div><label style={labelStyle}>Order</label><input type="number" min="0" style={inputStyle} value={form.order || 0} onChange={(e) => handleChange("order", parseInt(e.target.value))} /></div>
            </div>
            <div><label style={labelStyle}>Learning Objectives (one per line)</label><textarea style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} value={Array.isArray(form.objectives) ? form.objectives.join("\n") : ""} onChange={(e) => handleChange("objectives", e.target.value.split("\n").filter(l => l.trim()))} placeholder="Enter one objective per line..." /></div>
            <div><label style={labelStyle}>Example Problem</label><textarea style={{ ...inputStyle, minHeight: "50px", resize: "vertical" }} value={form.example || ""} onChange={(e) => handleChange("example", e.target.value)} /></div>
            <div><label style={labelStyle}>Tip/Hint</label><textarea style={{ ...inputStyle, minHeight: "40px", resize: "vertical" }} value={form.tip || ""} onChange={(e) => handleChange("tip", e.target.value)} /></div>
            <p style={{ fontSize: "0.7rem", color: "#6366f1", textAlign: "center", margin: "0" }}>
              ℹ️ This will be submitted as a change request for admin review.
            </p>
            <button type="submit" style={styles.saveBtn}>📤 Submit for Review</button>
          </form>
        </div>
      </div>
    </div>
  );
}

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
    display: "flex", justifyContent: "center", padding: "1.5rem 1rem", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  notebookCover: { position: "relative", display: "flex", backgroundColor: "#1e293b", borderRadius: "6px", width: "100%", maxWidth: "960px", boxShadow: "0 12px 40px rgba(0,0,0,0.35)", border: "2px solid #334155", overflow: "hidden" },
  spiralBinding: { position: "absolute", left: "16px", top: "30px", bottom: "30px", display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 10 },
  spiralHole: { width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#0f172a", border: "2px solid #475569", display: "flex", alignItems: "center", justifyContent: "center" },
  spiralRing: { width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#64748b" },
  coverContent: { position: "relative", flex: 1, padding: "1.75rem 1.5rem 1.75rem 2.25rem", display: "flex", flexDirection: "column", gap: "1rem" },
  marbleAccent: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: ["radial-gradient(ellipse at 20% 30%, rgba(99,179,237,0.05) 0%, transparent 50%)", "radial-gradient(ellipse at 80% 20%, rgba(192,132,252,0.04) 0%, transparent 40%)", "radial-gradient(ellipse at 50% 80%, rgba(13,202,240,0.03) 0%, transparent 50%)"].join(", "), pointerEvents: "none" },
  titleLabel: { position: "relative", zIndex: 1, backgroundColor: "#334155", border: "1px solid #475569", borderRadius: "3px", padding: "0.65rem 1rem", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.25)" },
  coverTitle: { margin: 0, fontSize: "1.4rem", fontWeight: "bold", color: "#a78bfa", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
  coverSubtitle: { margin: "0.15rem 0 0", fontSize: "0.8rem", color: "#94a3b8", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
  ruledPage: { position: "relative", zIndex: 1, backgroundColor: "#f8f7f4", borderRadius: "3px", border: "1px solid #cbd5e1", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", display: "flex", flexDirection: "row", overflow: "hidden" },
  redMargin: { width: "3px", backgroundColor: "#ef4444", opacity: 0.4, flexShrink: 0 },
  pageInner: { flex: 1, padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: "400px" },
  tabBar: { display: "flex", gap: "8px" },
  tabBtn: { flex: 1, padding: "0.5rem", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif", transition: "all 0.15s ease" },
  topicCard: { border: "1px solid #e2e8f0", borderRadius: "6px", backgroundColor: "#fffefb", overflow: "hidden" },
  topicCardHeader: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" },
  topicMeta: { display: "block", fontSize: "0.7rem", color: "#64748b" },
  expandBtn: { width: "100%", padding: "0.4rem", border: "none", background: "none", cursor: "pointer", color: "#6366f1", fontSize: "0.75rem", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
  gradeSection: { padding: "0.5rem 0.75rem", backgroundColor: "#f8fafc" },
  gradeChip: { padding: "3px 10px", border: "none", borderRadius: "999px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
  questionRow: { display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.4rem 0.5rem", borderBottom: "1px solid #e2e8f0" },
  qText: { margin: 0, fontSize: "0.8rem", color: "#1e293b" },
  qMeta: { margin: "2px 0 0", fontSize: "0.65rem", color: "#94a3b8" },
  qSolution: { margin: "2px 0 0", fontSize: "0.7rem", color: "#64748b", fontStyle: "italic" },
  qAnswer: { margin: "2px 0 0", fontSize: "0.7rem", color: "#059669", fontWeight: "bold" },
  qChoices: { margin: "2px 0 0", fontSize: "0.65rem", color: "#475569" },
  editBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: "2px" },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: "2px" },
  verifyBtn: { border: "none", borderRadius: "4px", color: "#fff", cursor: "pointer", fontSize: "0.6rem", fontWeight: "bold", padding: "3px 6px", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif", whiteSpace: "nowrap" },
  addQBtn: { padding: "3px 8px", border: "1px solid #6366f1", borderRadius: "4px", background: "#eef2ff", color: "#4338ca", cursor: "pointer", fontSize: "0.7rem", fontWeight: "bold", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
  addQuestionBtn: { width: "100%", padding: "0.35rem", border: "1px dashed #6366f1", borderRadius: "4px", background: "none", color: "#6366f1", cursor: "pointer", marginTop: "0.5rem", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif", fontSize: "0.75rem" },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", padding: "0.75rem 0", flexWrap: "wrap" },
  paginationBtn: { backgroundColor: "#6366f1", color: "#fff", border: "none", padding: "0.4rem 0.9rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
  paginationText: { color: "#475569", fontSize: "0.8rem", fontWeight: "600", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
  requestCard: { border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.6rem 0.75rem", backgroundColor: "#fffefb" },
  statusBadge: { padding: "2px 8px", borderRadius: "999px", fontSize: "0.65rem", fontWeight: "bold", textTransform: "uppercase" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" },
  modal: { width: "100%", maxWidth: "560px", borderRadius: "6px", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" },
  modalHeader: { backgroundColor: "#1e293b", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #6366f1" },
  closeBtn: { background: "none", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer" },
  modalBody: { backgroundColor: "#fefdfb", padding: "1rem 1.25rem", maxHeight: "70vh", overflowY: "auto" },
  saveBtn: { width: "100%", padding: "0.55rem", border: "none", borderRadius: "6px", backgroundColor: "#6366f1", color: "#fff", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem", fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif", marginTop: "0.25rem" },
  message: { textAlign: "center", color: "#64748b", padding: "2rem 0", fontSize: "0.9rem" },
};