import React, { useEffect, useMemo, useState } from "react";
import { BoardsAPI, ClassesAPI, SubjectsAPI, QuestionsAPI } from "../../api/ah";
import { toast } from "react-toastify";

// Simple enter animation helper to animate modals
const useEnterAnimation = (open) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (open) {
      setShow(false);
      const id = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(id);
    } else {
      setShow(false);
    }
  }, [open]);
  return show;
};

const AllQuestions = () => {
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [questions, setQuestions] = useState([]);

  // Filters
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");

  // Loading states
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // UI state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("newest");

  // Preview modal
  const [previewId, setPreviewId] = useState(null);
  const openPreview = (q) => setPreviewId(q._id || q.id);
  const closePreview = () => setPreviewId(null);
  const previewQuestion = useMemo(
    () => questions.find((q) => (q._id || q.id) === previewId) || null,
    [questions, previewId]
  );

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);
  const [deleteQuestion, setDeleteQuestion] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const openDelete = (q) => {
    setDeleteId(q._id || q.id);
    setDeleteQuestion(q);
  };
  const closeDelete = () => {
    setDeleteId(null);
    setDeleteQuestion(null);
  };

  // Edit modal
  const [editId, setEditId] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const openEdit = (q) => {
    setEditId(q._id || q.id);
    setEditQuestion({
      boardId: q.board?._id || q.board,
      classId: q.class?._id || q.class,
      subjectId: q.subject?._id || q.subject,
      questionText: q.questionText,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      marks: q.marks,
    });
  };
  const closeEdit = () => {
    setEditId(null);
    setEditQuestion(null);
  };
  // Load boards on mount
  useEffect(() => {
    const loadBoards = async () => {
      setLoadingBoards(true);
      try {
        const list = await BoardsAPI.list();
        setBoards(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length)
          setSelectedBoardId(list[0]._id || list[0].id);
      } catch (e) {
        setBoards([]);
      } finally {
        setLoadingBoards(false);
      }
    };
    loadBoards();
  }, []);

  // Load classes when selected board changes
  useEffect(() => {
    if (!selectedBoardId) {
      setClasses([]);
      setSelectedClassId("");
      return;
    }
    const load = async () => {
      setLoadingClasses(true);
      try {
        const list = await ClassesAPI.list({ boardId: selectedBoardId });
        setClasses(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length)
          setSelectedClassId(list[0]._id || list[0].id);
        else setSelectedClassId("");
      } catch (e) {
        setClasses([]);
        setSelectedClassId("");
      } finally {
        setLoadingClasses(false);
      }
    };
    load();
  }, [selectedBoardId]);

  // Load subjects when board or class changes
  useEffect(() => {
    if (!selectedBoardId || !selectedClassId) {
      setSubjects([]);
      setSelectedSubjectId("");
      return;
    }
    const load = async () => {
      setLoadingSubjects(true);
      try {
        const list = await SubjectsAPI.list({
          boardId: selectedBoardId,
          classId: selectedClassId,
        });
        setSubjects(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length)
          setSelectedSubjectId(list[0]._id || list[0].id);
        else setSelectedSubjectId("");
      } catch (e) {
        setSubjects([]);
        setSelectedSubjectId("");
      } finally {
        setLoadingSubjects(false);
      }
    };
    load();
  }, [selectedBoardId, selectedClassId]);

  // Delete question
  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      await QuestionsAPI.remove(deleteId);
      setQuestions((prev) => prev.filter((q) => (q._id || q.id) !== deleteId));
      toast.success("Question deleted successfully");
      closeDelete();
    } catch (error) {
      toast.error("Failed to create new question");
    } finally {
      setDeleting(false);
    }
  };

  // Save edited question (updates existing question with approved status)
  const handleSaveEdit = async () => {
    if (!editQuestion || !editId) return;

    // Validate required fields
    if (
      !editQuestion.boardId ||
      !editQuestion.classId ||
      !editQuestion.subjectId ||
      !editQuestion.questionText ||
      !editQuestion.difficulty ||
      editQuestion.marks === undefined
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      // Update existing question instead of creating new one
      const updatedQuestion = {
        ...editQuestion,
        status: 1, // Set to 1 (approved) when updating
      };

      const savedQuestion = await QuestionsAPI.update(editId, updatedQuestion);

      // Update the question in the list
      setQuestions((prev) =>
        prev.map((q) =>
          (q._id || q.id) === editId ? savedQuestion : q
        )
      );

      toast.success("Question updated successfully with approved status");
      closeEdit();
    } catch (error) {
      toast.error("Failed to update question");
    } finally {
      setSaving(false);
    }
  };

  // Load questions when filters change

  // Load questions when filters change
  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const params = {
          status: 1, // Only get approved questions
        };
        if (selectedBoardId) params.boardId = selectedBoardId;
        if (selectedClassId) params.classId = selectedClassId;
        if (selectedSubjectId) params.subjectId = selectedSubjectId;
        if (difficulty) params.difficulty = difficulty;
        if (search) params.q = search;

        const list = await QuestionsAPI.list(params);
        setQuestions(Array.isArray(list) ? list : []);
      } catch (e) {
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    const debounceTimer = setTimeout(loadQuestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [selectedBoardId, selectedClassId, selectedSubjectId, difficulty, search]);

  // Filtered and sorted questions
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);
      return a.questionText.localeCompare(b.questionText);
    });

    return filtered;
  }, [questions, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const pageItems = filteredQuestions.slice(startIndex, startIndex + pageSize);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // Animations
  const previewEnter = useEnterAnimation(!!previewId);
  const deleteEnter = useEnterAnimation(!!deleteId);
  const editEnter = useEnterAnimation(!!editId);

  // Helper to get difficulty color
  const getDifficultyColor = (diff) => {
    switch (diff) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Helper to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 1:
        return "bg-green-100 text-green-800"; // approved
      case 0:
        return "bg-yellow-100 text-yellow-800"; // pending
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Helper to render question options
  const renderOptions = (question) => {
    if (!question.options || !Array.isArray(question.options)) return null;

    // Check if this is a true/false question
    const isTrueFalse =
      question.options.length === 2 &&
      ((question.options[0].toLowerCase() === "true" &&
        question.options[1].toLowerCase() === "false") ||
        (question.options[0].toLowerCase() === "false" &&
          question.options[1].toLowerCase() === "true"));

    return (
      <div className="space-y-2 mt-3">
        {question.options.map((option, index) => {
          // Case-insensitive comparison for correct answer
          const isCorrect =
            question.correctAnswer &&
            question.correctAnswer.toLowerCase() === option.toLowerCase();

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 transition-all ${
                isCorrect
                  ? "border-green-500 bg-green-50 shadow-sm"
                  : isTrueFalse
                  ? "border-blue-200 bg-blue-50 hover:border-blue-300"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <span
                  className={`font-medium text-lg mr-3 ${
                    isCorrect
                      ? "text-green-700"
                      : isTrueFalse
                      ? "text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {String.fromCharCode(65 + index)}.
                </span>
                <span
                  className={`text-base ${
                    isCorrect
                      ? "text-green-800 font-semibold"
                      : isTrueFalse
                      ? "text-blue-800"
                      : "text-gray-800"
                  }`}
                >
                  {option}
                </span>
                {isCorrect && (
                  <span className="ml-auto">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">All Questions</h1>
        <div className="text-sm text-gray-600">
          Approved Questions:{" "}
          <span className="font-semibold text-green-600">
            {questions.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Board</label>
          <select
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
            className="rounded-md border-gray-300"
            disabled={loadingBoards}
          >
            <option value="">All Boards</option>
            {boards.map((b) => (
              <option key={b._id || b.id} value={b._id || b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="rounded-md border-gray-300"
            disabled={loadingClasses || !selectedBoardId}
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="rounded-md border-gray-300"
            disabled={loadingSubjects || !selectedClassId}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id || s.id} value={s._id || s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-md border-gray-300"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="rounded-md border-gray-300"
          />
        </div>
      </div>

      {/* Stats and controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-gray-600">
          Showing {pageItems.length} of {filteredQuestions.length} approved questions
          {selectedBoardId &&
            ` • Board: ${
              boards.find((b) => (b._id || b.id) === selectedBoardId)?.name ||
              "—"
            }`}
          {selectedClassId &&
            ` • Class: ${
              classes.find((c) => (c._id || c.id) === selectedClassId)?.name ||
              "—"
            }`}
          {selectedSubjectId &&
            ` • Subject: ${
              subjects.find((s) => (s._id || s.id) === selectedSubjectId)
                ?.name || "—"
            }`}
          {difficulty && ` • Difficulty: ${difficulty}`}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort</span>
          <select
            className="rounded-md border-gray-300"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A–Z</option>
          </select>

          <span className="text-sm text-gray-600">Page size</span>
          <select
            className="rounded-md border-gray-300"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Question
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Difficulty
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marks
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loadingQuestions ? (
              <tr>
                <td colSpan={7} className="px-4 py-16">
                  <div className="flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin" />
                  </div>
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {questions.length === 0
                    ? "No approved questions found"
                    : "No approved questions match your filters"}
                </td>
              </tr>
            ) : (
              pageItems.map((q) => (
                <tr key={q._id || q.id}>
                  <td className="px-4 py-3">
                    <div
                      className="max-w-xs truncate text-gray-900"
                      title={q.questionText}
                    >
                      {q.questionText}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {q.subject?.name || "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(
                        q.difficulty
                      )}`}
                    >
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{q.marks}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                        q.status
                      )}`}
                    >
                      {q.status === 1
                        ? "Approved"
                        : q.status === 0
                        ? "Pending"
                        : "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openPreview(q)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 text-gray-700"
                        >
                          <path d="M12 5c-7.633 0-11 6.5-11 7s3.367 7 11 7 11-6.5 11-7-3.367-7-11-7zm0 12c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z" />
                        </svg>
                        Preview
                      </button>
                      <button
                        onClick={() => openEdit(q)}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-300 px-2 py-1 text-sm text-blue-700 hover:bg-blue-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => openDelete(q)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0015 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={page === 1}
            className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <button
            onClick={goNext}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Question Modal */}
      {editId && editQuestion && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
              editEnter ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeEdit}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${
                editEnter
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-2"
              }`}
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Question
                </h3>
                <button
                  onClick={closeEdit}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="px-5 py-5 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Note
                      </p>
                      <p className="text-sm text-blue-700">
                        This will update the existing question and set its status to "approved".
                      </p>
                    </div>
                  </div>
                </div>

                {/* Board Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Board <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editQuestion.boardId}
                      onChange={(e) => {
                        const newBoardId = e.target.value;
                        setEditQuestion((prev) => ({
                          ...prev,
                          boardId: newBoardId,
                          classId: "", // Reset class when board changes
                          subjectId: "", // Reset subject when board changes
                        }));
                      }}
                      className="rounded-md border-gray-300"
                      required
                    >
                      <option value="">Select Board</option>
                      {boards.map((b) => (
                        <option key={b._id || b.id} value={b._id || b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editQuestion.classId}
                      onChange={(e) => {
                        const newClassId = e.target.value;
                        setEditQuestion((prev) => ({
                          ...prev,
                          classId: newClassId,
                          subjectId: "", // Reset subject when class changes
                        }));
                      }}
                      className="rounded-md border-gray-300"
                      disabled={!editQuestion.boardId}
                      required
                    >
                      <option value="">
                        {!editQuestion.boardId
                          ? "Select board first"
                          : "Select Class"}
                      </option>
                      {classes
                        .filter(
                          (c) =>
                            editQuestion.boardId &&
                            (c.boardId === editQuestion.boardId ||
                              c.board?._id === editQuestion.boardId ||
                              c.board === editQuestion.boardId)
                        )
                        .map((c) => (
                          <option key={c._id || c.id} value={c._id || c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editQuestion.subjectId}
                      onChange={(e) =>
                        setEditQuestion((prev) => ({
                          ...prev,
                          subjectId: e.target.value,
                        }))
                      }
                      className="rounded-md border-gray-300"
                      disabled={!editQuestion.classId}
                      required
                    >
                      <option value="">
                        {!editQuestion.classId
                          ? "Select class first"
                          : "Select Subject"}
                      </option>
                      {subjects
                        .filter(
                          (s) =>
                            editQuestion.classId &&
                            (s.classId === editQuestion.classId ||
                              s.class?._id === editQuestion.classId ||
                              s.class === editQuestion.classId)
                        )
                        .map((s) => (
                          <option key={s._id || s.id} value={s._id || s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editQuestion.questionText}
                    onChange={(e) =>
                      setEditQuestion((prev) => ({
                        ...prev,
                        questionText: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border-gray-300"
                    rows={3}
                    placeholder="Enter your question..."
                    required
                  />
                </div>

                {/* Options */}
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Options
                  </label>
                  <div className="space-y-2">
                    {(editQuestion.options || []).map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="font-medium text-gray-700 w-6">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [
                              ...(editQuestion.options || []),
                            ];
                            newOptions[index] = e.target.value;
                            setEditQuestion((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          className="flex-1 rounded-md border-gray-300"
                          placeholder={`Option ${String.fromCharCode(
                            65 + index
                          )}`}
                        />
                        <button
                          onClick={() => {
                            const newOptions = (
                              editQuestion.options || []
                            ).filter((_, i) => i !== index);
                            setEditQuestion((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newOptions = [
                          ...(editQuestion.options || []),
                          "",
                        ];
                        setEditQuestion((prev) => ({
                          ...prev,
                          options: newOptions,
                        }));
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>

                {/* Correct Answer */}
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Correct Answer
                  </label>
                  <input
                    type="text"
                    value={editQuestion.correctAnswer || ""}
                    onChange={(e) =>
                      setEditQuestion((prev) => ({
                        ...prev,
                        correctAnswer: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border-gray-300"
                    placeholder="Enter the correct answer..."
                  />
                </div>

                {/* Difficulty and Marks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Difficulty <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editQuestion.difficulty}
                      onChange={(e) =>
                        setEditQuestion((prev) => ({
                          ...prev,
                          difficulty: e.target.value,
                        }))
                      }
                      className="rounded-md border-gray-300"
                      required
                    >
                      <option value="">Select Difficulty</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Marks <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={editQuestion.marks}
                      onChange={(e) =>
                        setEditQuestion((prev) => ({
                          ...prev,
                          marks: Number(e.target.value),
                        }))
                      }
                      className="rounded-md border-gray-300"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  onClick={closeEdit}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && (
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {saving ? "Updating..." : "Update Question"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewId && previewQuestion && (
        <div className="fixed inset-0 z-40">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
              previewEnter ? "opacity-100" : "opacity-0"
            }`}
            onClick={closePreview}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-4xl rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${
                previewEnter
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-2"
              }`}
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Question Preview
                </h3>
                <button
                  onClick={closePreview}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="px-5 py-5 space-y-6">
                {/* Question metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-xs uppercase text-gray-500">Board</p>
                    <p className="text-base font-semibold text-gray-900">
                      {previewQuestion.board?.name || "Unknown"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-xs uppercase text-gray-500">Class</p>
                    <p className="text-base font-semibold text-gray-900">
                      {previewQuestion.class?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-xs uppercase text-gray-500">Subject</p>
                    <p className="text-base font-semibold text-gray-900">
                      {previewQuestion.subject?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-xs uppercase text-gray-500">
                      Difficulty
                    </p>
                    <p
                      className={`text-base font-semibold ${getDifficultyColor(
                        previewQuestion.difficulty
                      )}`}
                    >
                      {previewQuestion.difficulty}
                    </p>
                  </div>
                </div>

                {/* Question text */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">
                    Question:
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-800">
                      {previewQuestion.questionText}
                    </p>
                  </div>
                </div>

                {/* Options */}
                {(() => {
                  // Check if we have options
                  const hasOptions =
                    previewQuestion.options &&
                    previewQuestion.options.length > 0;

                  // Check if this is a true/false question (empty options but correct answer exists)
                  const isTrueFalse =
                    !hasOptions &&
                    previewQuestion.correctAnswer &&
                    (previewQuestion.correctAnswer.toLowerCase() === "true" ||
                      previewQuestion.correctAnswer.toLowerCase() === "false");

                  if (hasOptions) {
                    // Regular MCQ or stored true/false with options
                    return (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">
                          {previewQuestion.options.length === 2 &&
                          ((previewQuestion.options[0]?.toLowerCase() ===
                            "true" &&
                            previewQuestion.options[1]?.toLowerCase() ===
                              "false") ||
                            (previewQuestion.options[0]?.toLowerCase() ===
                              "false" &&
                              previewQuestion.options[1]?.toLowerCase() ===
                                "true"))
                            ? "True/False Options:"
                            : "Options:"}
                        </h4>
                        {renderOptions(previewQuestion)}
                      </div>
                    );
                  } else if (isTrueFalse) {
                    // True/False question without stored options - generate them
                    const trueFalseOptions = ["True", "False"];
                    const questionWithOptions = {
                      ...previewQuestion,
                      options: trueFalseOptions,
                    };

                    return (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">
                          True/False Options:
                        </h4>
                        {renderOptions(questionWithOptions)}
                      </div>
                    );
                  } else if (previewQuestion.correctAnswer) {
                    // Other question types with direct answer
                    return (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">
                          Correct Answer:
                        </h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-800 font-medium">
                            {previewQuestion.correctAnswer}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Question details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-xs uppercase text-gray-500">Marks</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {previewQuestion.marks}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-xs uppercase text-gray-500">Status</p>
                    <p
                      className={`text-base font-semibold ${getStatusColor(
                        previewQuestion.status
                      )}`}
                    >
                      {previewQuestion.status === 1
                        ? "Approved"
                        : previewQuestion.status === 0
                        ? "Pending"
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-4 md:col-span-2">
                    <p className="text-xs uppercase text-gray-500">Created</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(previewQuestion.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end">
                <button
                  onClick={closePreview}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && deleteQuestion && (
        <div className="fixed inset-0 z-40">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
              deleteEnter ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeDelete}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${
                deleteEnter
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-2"
              }`}
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Question
                </h3>
                <button
                  onClick={closeDelete}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Are you sure you want to delete this question?
                    </h4>
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {deleteQuestion.questionText}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Subject: {deleteQuestion.subject?.name || "Unknown"} •
                      Difficulty: {deleteQuestion.difficulty} • Marks:{" "}
                      {deleteQuestion.marks}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  onClick={closeDelete}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting && (
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllQuestions;
