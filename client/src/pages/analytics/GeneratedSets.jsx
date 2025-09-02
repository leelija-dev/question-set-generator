import React, { useEffect, useMemo, useState } from "react";
import { BoardsAPI, ClassesAPI, SubjectsAPI, QuestionsAPI, QuestionSetsAPI } from "../../api/ah";
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



const GeneratedSets = () => {
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [marksFilter, setMarksFilter] = useState("");
  const [search, setSearch] = useState("");

  // Generated sets data
  const [generatedSets, setGeneratedSets] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("newest");

  // Generate modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // View modal
  const [viewId, setViewId] = useState(null);
  const [viewSet, setViewSet] = useState(null);
  const [viewQuestions, setViewQuestions] = useState([]);
  const [loadingView, setLoadingView] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);
  const [deleteSet, setDeleteSet] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const openDelete = (set) => {
    setDeleteId(set._id || set.id);
    setDeleteSet(set);
  };
  const closeDelete = () => {
    setDeleteId(null);
    setDeleteSet(null);
  };

  // Generate form data
  const [generateForm, setGenerateForm] = useState({
    boardId: "",
    classId: "",
    subjectId: "",
    examName: "",
    examDate: "",
    examTime: "",
    questionGroups: [],
  });

  // Available questions by marks
  const [availableQuestions, setAvailableQuestions] = useState([]);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewModalEnter, setPreviewModalEnter] = useState(false);

  // Load boards on mount
  useEffect(() => {
    const loadBoards = async () => {
      try {
        const list = await BoardsAPI.list();
        setBoards(Array.isArray(list) ? list : []);
      } catch (e) {
        setBoards([]);
      }
    };
    loadBoards();
  }, []);

  // Load classes when board changes
  useEffect(() => {
    if (!selectedBoardId) {
      setClasses([]);
      setSelectedClassId("");
      return;
    }
    const load = async () => {
      try {
        const list = await ClassesAPI.list({ boardId: selectedBoardId });
        setClasses(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length)
          setSelectedClassId(list[0]._id || list[0].id);
        else setSelectedClassId("");
      } catch (e) {
        setClasses([]);
        setSelectedClassId("");
      }
    };
    load();
  }, [selectedBoardId]);

  // Load subjects when class changes
  useEffect(() => {
    if (!selectedBoardId || !selectedClassId) {
      setSubjects([]);
      setSelectedSubjectId("");
      return;
    }
    const load = async () => {
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
      }
    };
    load();
  }, [selectedBoardId, selectedClassId]);

  // Load generated sets from API
  useEffect(() => {
    const loadGeneratedSets = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedBoardId) params.boardId = selectedBoardId;
        if (selectedClassId) params.classId = selectedClassId;
        if (selectedSubjectId) params.subjectId = selectedSubjectId;
        if (search) params.q = search;

        const list = await QuestionSetsAPI.list(params);
        setGeneratedSets(Array.isArray(list) ? list : []);
      } catch (e) {
        setGeneratedSets([]);
        toast.error("Failed to load question sets");
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(loadGeneratedSets, 300);
    return () => clearTimeout(debounceTimer);
  }, [selectedBoardId, selectedClassId, selectedSubjectId, search]);

  // Initialize generate form when modal opens
  useEffect(() => {
    if (showGenerateModal) {
      // Initialize form with current filter selections
      setGenerateForm({
        boardId: selectedBoardId || "",
        classId: selectedClassId || "",
        subjectId: selectedSubjectId || "",
        examName: "",
        examDate: "",
        examTime: "",
        questionGroups: [{
          id: 'A',
          name: 'Group A',
          totalMarks: 20, // Default total marks for the group
          questions: [], // Array to store selected questions with their marks
        }],
      });
    }
  }, [showGenerateModal, selectedBoardId, selectedClassId, selectedSubjectId]);

  // Load available questions when generating
  useEffect(() => {
    if (
      !showGenerateModal ||
      !generateForm.boardId ||
      !generateForm.classId ||
      !generateForm.subjectId
    ) {
      setAvailableQuestions([]);
      return;
    }

    const loadAvailableQuestions = async () => {
      try {
        const params = {
          boardId: generateForm.boardId,
          classId: generateForm.classId,
          subjectId: generateForm.subjectId,
          status: 1, // Only approved questions
        };

        console.log("Loading questions with params:", params);
        const questions = await QuestionsAPI.list(params);
        console.log("Questions received:", questions);

        if (!Array.isArray(questions)) {
          console.error("Questions is not an array:", questions);
          setAvailableQuestions([]);
          return;
        }

        if (questions.length === 0) {
          console.log("No questions found for the selected criteria");
          setAvailableQuestions([]);
          return;
        }

        // Group questions by marks with proper initial value
        const grouped = questions.reduce((acc, q) => {
          // Ensure acc is initialized
          if (!acc) {
            acc = {};
          }

          const marks = q.marks || 0;
          const difficulty = q.difficulty || 'medium';

          if (!acc[marks]) {
            acc[marks] = {
              marks,
              total: 0,
              byDifficulty: { easy: 0, medium: 0, hard: 0 },
            };
          }
          acc[marks].total++;

          // Ensure difficulty is lowercase and valid
          const normalizedDifficulty = difficulty.toLowerCase();
          if (['easy', 'medium', 'hard'].includes(normalizedDifficulty)) {
            acc[marks].byDifficulty[normalizedDifficulty]++;
          } else {
            // Default to medium if difficulty is not recognized
            acc[marks].byDifficulty.medium++;
          }

          return acc; // Explicitly return acc
        }, {}); // Provide empty object as initial value

        const sortedGroups = Object.values(grouped).sort(
          (a, b) => a.marks - b.marks
        );

        console.log("Grouped questions:", grouped);
        console.log("Sorted groups:", sortedGroups);

        setAvailableQuestions(sortedGroups);

        // Initialize question groups in form with default groups
        const initialGroups = [
          {
            id: 'A',
            name: 'Group A',
            totalMarks: 20, // Default total marks for the group
            questions: [], // Array to store selected questions with their marks
          }
        ];

        setGenerateForm((prev) => ({
          ...prev,
          questionGroups: initialGroups,
        }));
      } catch (e) {
        console.error("Error loading available questions:", e);
        setAvailableQuestions([]);
        toast.error("Failed to load available questions");
      }
    };

    loadAvailableQuestions();
  }, [
    showGenerateModal,
    generateForm.boardId,
    generateForm.classId,
    generateForm.subjectId,
  ]);

  // Add new question group
  const addQuestionGroup = () => {
    const newGroupId = String.fromCharCode(65 + generateForm.questionGroups.length); // A, B, C, etc.
    const newGroup = {
      id: newGroupId,
      name: `Group ${newGroupId}`,
      totalMarks: 20, // Default total marks for the group
      questions: [], // Array to store selected questions with their marks
    };

    setGenerateForm((prev) => ({
      ...prev,
      questionGroups: [...prev.questionGroups, newGroup],
    }));
  };

  // Remove question group
  const removeQuestionGroup = (index) => {
    if (generateForm.questionGroups.length <= 1) {
      toast.error("At least one group is required");
      return;
    }

    setGenerateForm((prev) => ({
      ...prev,
      questionGroups: prev.questionGroups.filter((_, i) => i !== index),
    }));
  };

  // Update question group
  const updateQuestionGroup = (index, field, value) => {
    const updatedGroups = [...generateForm.questionGroups];

    if (field === 'totalMarks') {
      updatedGroups[index].totalMarks = parseInt(value) || 0;
    }

    setGenerateForm((prev) => ({
      ...prev,
      questionGroups: updatedGroups,
    }));
  };

  // Add question to group
  const addQuestionToGroup = async (groupIndex, marks, difficulty) => {
    const updatedGroups = [...generateForm.questionGroups];
    const group = updatedGroups[groupIndex];

    // Check if we can add more questions
    const currentTotal = group.questions.reduce((sum, q) => sum + q.marks, 0);
    if (currentTotal + marks > group.totalMarks) {
      toast.error(`Cannot add ${marks} mark question. Group total would exceed ${group.totalMarks} marks.`);
      return;
    }

    // Find available questions for this mark and difficulty
    const availableGroup = availableQuestions.find(ag => ag.marks === marks);
    if (!availableGroup || availableGroup.byDifficulty[difficulty] <= 0) {
      toast.error(`No ${difficulty} ${marks}-mark questions available.`);
      return;
    }

    try {
      // Fetch actual questions from backend
      const params = {
        boardId: generateForm.boardId,
        classId: generateForm.classId,
        subjectId: generateForm.subjectId,
        difficulty: difficulty,
        marks: marks,
        status: 1, // Only approved questions
      };

      const questions = await QuestionsAPI.list(params);
      const filteredQuestions = questions.filter(q =>
        q.marks === marks &&
        q.difficulty === difficulty &&
        !group.questions.some(existing => existing.questionId === q._id)
      );

      if (filteredQuestions.length === 0) {
        toast.error(`No available ${difficulty} ${marks}-mark questions found.`);
        return;
      }

      // Randomly select one question
      const randomQuestion = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];

      // Add question to group with full question data
      const newQuestion = {
        id: Date.now() + Math.random(), // Temporary ID for UI
        questionId: randomQuestion._id,
        marks: randomQuestion.marks,
        difficulty: randomQuestion.difficulty,
        questionText: randomQuestion.questionText,
        options: randomQuestion.options || [],
        correctAnswer: randomQuestion.correctAnswer,
        type: 'selected', // Mark as selected
      };

      group.questions.push(newQuestion);

      // Update available questions count
      availableGroup.byDifficulty[difficulty]--;
      availableGroup.total--;

      setGenerateForm((prev) => ({
        ...prev,
        questionGroups: updatedGroups,
      }));

      // Update available questions state
      setAvailableQuestions([...availableQuestions]);

      toast.success(`Added ${difficulty} ${marks}-mark question to ${group.name}`);
    } catch (error) {
      console.error('Error fetching question:', error);
      toast.error('Failed to fetch question details');
    }
  };

  // Remove question from group
  const removeQuestionFromGroup = (groupIndex, questionIndex) => {
    const updatedGroups = [...generateForm.questionGroups];
    const group = updatedGroups[groupIndex];
    const question = group.questions[questionIndex];

    // Remove question from group
    group.questions.splice(questionIndex, 1);

    // Restore available questions count
    const availableGroup = availableQuestions.find(ag => ag.marks === question.marks);
    if (availableGroup) {
      availableGroup.byDifficulty[question.difficulty]++;
      availableGroup.total++;
    }

    setGenerateForm((prev) => ({
      ...prev,
      questionGroups: updatedGroups,
    }));

    // Update available questions state
    setAvailableQuestions([...availableQuestions]);
  };

  // Update group name
  const updateGroupName = (index, name) => {
    const updatedGroups = [...generateForm.questionGroups];
    updatedGroups[index].name = name;

    setGenerateForm((prev) => ({
      ...prev,
      questionGroups: updatedGroups,
    }));
  };

  // Preview question set
  const handlePreview = () => {
    // Calculate total marks and questions for preview
    const totalMarks = generateForm.questionGroups.reduce((sum, group) => {
      return sum + group.questions.reduce((groupSum, q) => groupSum + q.marks, 0);
    }, 0);

    const totalQuestions = generateForm.questionGroups.reduce((sum, group) => {
      return sum + group.questions.length;
    }, 0);

    // Create preview data with all necessary information
    const previewData = {
      ...generateForm,
      totalMarks,
      totalQuestions,
      availableQuestions: availableQuestions // Pass the questions data
    };

    setPreviewData(previewData);
    setShowPreview(true);
    setPreviewModalEnter(true);
  };

  // Close preview modal
  const closePreview = () => {
    setShowPreview(false);
    setPreviewModalEnter(false);
    setPreviewData(null);
  };

  // Handle final generation
  const handleGenerateFinal = async () => {
    setGenerating(true);
    try {
      // Transform questionGroups to match backend expected format
      const transformedQuestionGroups = [];

      // Group questions by marks to create backend-compatible structure
      const questionsByMarks = {};

      generateForm.questionGroups.forEach(group => {
        group.questions.forEach(question => {
          const key = question.marks;
          if (!questionsByMarks[key]) {
            questionsByMarks[key] = {
              marks: question.marks,
              totalQuestions: 0,
              difficulty: { easy: 0, medium: 0, hard: 0 }
            };
          }
          questionsByMarks[key].totalQuestions++;
          questionsByMarks[key].difficulty[question.difficulty]++;
        });
      });

      // Convert to array format expected by backend
      transformedQuestionGroups.push(...Object.values(questionsByMarks));

      // Prepare the data for the backend
      const questionSetData = {
        examName: generateForm.examName,
        boardId: generateForm.boardId,
        classId: generateForm.classId,
        subjectId: generateForm.subjectId,
        examDate: generateForm.examDate,
        examTime: generateForm.examTime,
        questionGroups: transformedQuestionGroups, // Use transformed structure
        totalQuestions: generateForm.questionGroups.reduce(
          (sum, group) => sum + group.questions.length,
          0
        ),
      };

      // Validate that we have questions to generate
      if (transformedQuestionGroups.length === 0) {
        toast.error("Please select at least one question before generating the set");
        return;
      }

      // Save to database
      const savedSet = await QuestionSetsAPI.create(questionSetData);

      // Add to the list
      setGeneratedSets((prev) => [savedSet, ...prev]);

      toast.success(
        `Question set "${generateForm.examName}" generated and saved successfully!`
      );

      // Reset form and close modals
      setGenerateForm({
        boardId: "",
        classId: "",
        subjectId: "",
        examName: "",
        examDate: "",
        examTime: "",
        questionGroups: [],
      });
      setShowGenerateModal(false);
      setShowPreview(false);
      setPreviewData(null);
    } catch (error) {
      console.error("Question set generation error:", error);
      toast.error(error.message || "Failed to generate question set");
    } finally {
      setGenerating(false);
    }
  };

  // Close view modal
  const closeView = () => {
    setViewId(null);
    setViewSet(null);
    setViewQuestions([]);
  };

  // Handle view
  const handleView = async (set) => {
    setViewId(set._id || set.id);
    setViewSet(set);
    setLoadingView(true);
    try {
      const detailedSet = await QuestionSetsAPI.get(set._id || set.id);
      setViewQuestions(detailedSet.questions || []);
    } catch (error) {
      toast.error("Failed to load question set details");
      setViewQuestions([]);
    } finally {
      setLoadingView(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      await QuestionSetsAPI.remove(deleteId);
      setGeneratedSets((prev) =>
        prev.filter((set) => (set._id || set.id) !== deleteId)
      );
      toast.success("Question set deleted successfully");
      closeDelete();
    } catch (error) {
      toast.error("Failed to delete question set");
    } finally {
      setDeleting(false);
    }
  };

  // Reset generate form
  const resetGenerateForm = () => {
    setGenerateForm({
      boardId: "",
      classId: "",
      subjectId: "",
      examName: "",
      examDate: "",
      examTime: "",
      questionGroups: [{ id: 'A', name: 'Group A', totalMarks: 20, questions: [] }],
    });
    setShowPreview(false);
    setPreviewData(null);
    setAvailableQuestions([]);
  };

  // Filtered and sorted sets
  const filteredSets = useMemo(() => {
    let filtered = [...generatedSets];

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);
      return a.examName.localeCompare(b.examName);
    });

    return filtered;
  }, [generatedSets, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredSets.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const pageItems = filteredSets.slice(startIndex, startIndex + pageSize);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // Animations
  const modalEnter = useEnterAnimation(showGenerateModal);
  const viewModalEnter = useEnterAnimation(!!viewId);
  const deleteModalEnter = useEnterAnimation(!!deleteId);

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
              className={`p-3 rounded-lg border-2 transition-all ${isCorrect
                  ? "border-green-500 bg-green-50 shadow-sm"
                  : isTrueFalse
                    ? "border-blue-200 bg-blue-50 hover:border-blue-300"
                    : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center">
                <span
                  className={`font-medium text-lg mr-3 ${isCorrect
                      ? "text-green-700"
                      : isTrueFalse
                        ? "text-blue-700"
                        : "text-gray-700"
                    }`}
                >
                  {String.fromCharCode(65 + index)}.
                </span>
                <span
                  className={`text-base ${isCorrect
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
        <h1 className="text-2xl font-semibold text-gray-800">
          Generated Question Sets
        </h1>
        <div className="text-sm text-gray-600">
          Total Sets:{" "}
          <span className="font-semibold text-blue-600">
            {generatedSets.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Board</label>
          <select
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
            className="rounded-md border-gray-300"
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
            disabled={!selectedBoardId}
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
            disabled={!selectedClassId}
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
          <label className="text-sm text-gray-600 mb-1">Marks</label>
          <select
            value={marksFilter}
            onChange={(e) => setMarksFilter(e.target.value)}
            className="rounded-md border-gray-300"
          >
            <option value="">All Marks</option>
            <option value="1">1 Mark</option>
            <option value="2">2 Marks</option>
            <option value="5">5 Marks</option>
            <option value="10">10 Marks</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sets..."
            className="rounded-md border-gray-300"
          />
        </div>
      </div>

      {/* Generate Button */}
      <div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Generate New Set
        </button>
      </div>

      {/* Stats and controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Showing {pageItems.length} of {filteredSets.length} question sets
          {selectedBoardId &&
            ` • Board: ${boards.find((b) => (b._id || b.id) === selectedBoardId)?.name ||
            "—"
            }`}
          {selectedClassId &&
            ` • Class: ${classes.find((c) => (c._id || c.id) === selectedClassId)?.name ||
            "—"
            }`}
          {selectedSubjectId &&
            ` • Subject: ${subjects.find((s) => (s._id || s.id) === selectedSubjectId)
              ?.name || "—"
            }`}
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
                Exam Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Board
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Questions
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exam Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-16">
                  <div className="flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin" />
                  </div>
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {generatedSets.length === 0
                    ? "No question sets generated yet"
                    : "No question sets match your filters"}
                </td>
              </tr>
            ) : (
              pageItems.map((set) => (
                <tr key={set._id || set.id}>
                  <td className="px-4 py-3">
                    <div
                      className="max-w-xs truncate text-gray-900"
                      title={set.examName}
                    >
                      {set.examName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {set.board?.name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {set.class?.name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {set.subject?.name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {set.totalQuestions}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {set.examDate} at {set.examTime}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(set.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(set)}
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
                        View
                      </button>
                      <button
                        onClick={() => openDelete(set)}
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

      {/* View Question Set Modal */}
      {viewId && viewSet && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${viewModalEnter ? "opacity-100" : "opacity-0"
              }`}
            onClick={closeView}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${viewModalEnter ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
                }`}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Question Set Preview
                </h3>
                <button
                  onClick={closeView}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="px-6 py-6">
                {loadingView ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Exam Header */}
                    <div className="text-center border-b-2 border-gray-300 pb-6">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {viewSet.examName}
                      </h1>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <div className="text-left">
                          <p><strong>Board:</strong> {viewSet.board?.name || "Unknown"}</p>
                          <p><strong>Class:</strong> {viewSet.class?.name || "Unknown"}</p>
                          <p><strong>Subject:</strong> {viewSet.subject?.name || "Unknown"}</p>
                        </div>
                        <div className="text-right">
                          <p><strong>Time:</strong> {viewSet.examTime}</p>
                          <p><strong>Date:</strong> {viewSet.examDate}</p>
                          <p><strong>Total Marks:</strong> {viewSet.totalQuestions}</p>
                        </div>
                      </div>
                    </div>

                    {/* Question Groups Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Question Distribution</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {viewSet.questionGroups?.map((group, index) => (
                          <div key={index} className="bg-white rounded-md p-3 border">
                            <p className="text-sm text-gray-600">Group {index + 1}</p>
                            <p className="text-lg font-bold text-blue-600">{group.marks} Mark{group.marks !== 1 ? 's' : ''}</p>
                            <p className="text-sm text-gray-700">{group.totalQuestions} Questions</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-8">
                      <h3 className="text-xl font-bold text-gray-900 text-center">Questions</h3>

                      {viewQuestions.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No questions found in this set
                        </div>
                      ) : (
                        viewQuestions.map((question, index) => (
                          <div key={question._id || question.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                            {/* Question Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <span className="bg-blue-600 text-white text-lg font-bold px-4 py-2 rounded-full">
                                  {index + 1}
                                </span>
                                <div className="flex gap-4 text-sm text-gray-600">
                                  <span className="bg-gray-100 px-3 py-1 rounded">
                                    {question.difficulty}
                                  </span>
                                  <span className="bg-green-100 px-3 py-1 rounded">
                                    {question.marks} Mark{question.marks !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Question Text */}
                            <div className="mb-6">
                              <p className="text-lg text-gray-900 leading-relaxed">
                                {question.questionText}
                              </p>
                            </div>

                            {/* Options */}
                            {(() => {
                              // Check if we have options
                              const hasOptions = question.options && question.options.length > 0;

                              // Check if this is a true/false question (empty options but correct answer exists)
                              const isTrueFalse = !hasOptions && question.correctAnswer &&
                                (question.correctAnswer.toLowerCase() === "true" ||
                                  question.correctAnswer.toLowerCase() === "false");

                              if (hasOptions) {
                                // Regular MCQ or stored true/false with options
                                return (
                                  <div className="grid grid-cols-2 gap-4">
                                    {question.options.map((option, optIndex) => (
                                      <div
                                        key={optIndex}
                                        className={`p-4 rounded-lg border-2 transition-all ${question.correctAnswer &&
                                            question.correctAnswer.toLowerCase() === option.toLowerCase()
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 hover:border-gray-300"
                                          }`}
                                      >
                                        <div className="flex items-center">
                                          <span className={`font-bold text-lg mr-3 ${question.correctAnswer &&
                                              question.correctAnswer.toLowerCase() === option.toLowerCase()
                                              ? "text-green-700"
                                              : "text-gray-700"
                                            }`}>
                                            {String.fromCharCode(97 + optIndex)}.
                                          </span>
                                          <span className={`text-base ${question.correctAnswer &&
                                              question.correctAnswer.toLowerCase() === option.toLowerCase()
                                              ? "text-green-800 font-semibold"
                                              : "text-gray-800"
                                            }`}>
                                            {option}
                                          </span>
                                          {question.correctAnswer &&
                                            question.correctAnswer.toLowerCase() === option.toLowerCase() && (
                                              <span className="ml-auto">
                                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              </span>
                                            )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              } else if (isTrueFalse) {
                                // True/False question without stored options - generate them
                                const trueFalseOptions = ["True", "False"];
                                return (
                                  <div className="grid grid-cols-2 gap-4">
                                    {trueFalseOptions.map((option, optIndex) => (
                                      <div
                                        key={optIndex}
                                        className={`p-4 rounded-lg border-2 transition-all ${question.correctAnswer &&
                                            question.correctAnswer.toLowerCase() === option.toLowerCase()
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 hover:border-gray-300"
                                          }`}
                                      >
                                        <div className="flex items-center">
                                          <span className={`font-bold text-lg mr-3 ${question.correctAnswer &&
                                              question.correctAnswer.toLowerCase() === option.toLowerCase()
                                              ? "text-green-700"
                                              : "text-gray-700"
                                            }`}>
                                            {String.fromCharCode(97 + optIndex)}.
                                          </span>
                                          <span className={`text-base ${question.correctAnswer &&
                                              question.correctAnswer.toLowerCase() === option.toLowerCase()
                                              ? "text-green-800 font-semibold"
                                              : "text-gray-800"
                                            }`}>
                                            {option}
                                          </span>
                                          {question.correctAnswer &&
                                            question.correctAnswer.toLowerCase() === option.toLowerCase() && (
                                              <span className="ml-auto">
                                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              </span>
                                            )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              } else if (question.correctAnswer) {
                                // Other question types with direct answer
                                return (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-green-800 mb-2">Correct Answer:</p>
                                    <p className="text-green-900 font-semibold">{question.correctAnswer}</p>
                                  </div>
                                );
                              }

                              return null;
                            })()}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="text-center text-gray-500 text-sm pt-6 border-t border-gray-200">
                      <p>Generated on {new Date(viewSet.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end">
                <button
                  onClick={closeView}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${modalEnter ? "opacity-100" : "opacity-0"
              }`}
            onClick={() => setShowGenerateModal(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${modalEnter
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-2"
                }`}
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Generate Question Set
                </h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="px-5 py-5 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Board <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={generateForm.boardId}
                      onChange={(e) => {
                        const newBoardId = e.target.value;
                        setGenerateForm((prev) => ({
                          ...prev,
                          boardId: newBoardId,
                          classId: "", // Reset dependent fields
                          subjectId: "",
                          questionGroups: [],
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
                      value={generateForm.classId}
                      onChange={(e) => {
                        const newClassId = e.target.value;
                        setGenerateForm((prev) => ({
                          ...prev,
                          classId: newClassId,
                          subjectId: "", // Reset dependent fields
                          questionGroups: [],
                        }));
                      }}
                      className="rounded-md border-gray-300"
                      disabled={!generateForm.boardId}
                      required
                    >
                      <option value="">
                        {!generateForm.boardId
                          ? "Select board first"
                          : "Select Class"}
                      </option>
                      {classes
                        .filter(
                          (c) =>
                            generateForm.boardId &&
                            (c.boardId === generateForm.boardId ||
                              c.board?._id === generateForm.boardId ||
                              c.board === generateForm.boardId)
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
                      value={generateForm.subjectId}
                      onChange={(e) => {
                        const newSubjectId = e.target.value;
                        setGenerateForm((prev) => ({
                          ...prev,
                          subjectId: newSubjectId,
                          questionGroups: [], // Reset groups when subject changes
                        }));
                      }}
                      className="rounded-md border-gray-300"
                      disabled={!generateForm.classId}
                      required
                    >
                      <option value="">
                        {!generateForm.classId
                          ? "Select class first"
                          : "Select Subject"}
                      </option>
                      {subjects
                        .filter(
                          (s) =>
                            generateForm.classId &&
                            (s.classId === generateForm.classId ||
                              s.class?._id === generateForm.classId ||
                              s.class === generateForm.classId)
                        )
                        .map((s) => (
                          <option key={s._id || s.id} value={s._id || s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Exam Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={generateForm.examName}
                      onChange={(e) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          examName: e.target.value,
                        }))
                      }
                      className="rounded-md border-gray-300"
                      placeholder="e.g., Mathematics Mid-term Exam"
                      required
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Exam Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={generateForm.examDate}
                      onChange={(e) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          examDate: e.target.value,
                        }))
                      }
                      className="rounded-md border-gray-300"
                      required
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Exam Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={generateForm.examTime}
                      onChange={(e) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          examTime: e.target.value,
                        }))
                      }
                      className="rounded-md border-gray-300"
                      required
                    />
                  </div>
                </div>

                {/* Question Pattern */}
                {generateForm.boardId &&
                  generateForm.classId &&
                  generateForm.subjectId && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          Question Pattern
                        </h4>
                        <button
                          type="button"
                          onClick={addQuestionGroup}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Group
                        </button>
                      </div>

                      {availableQuestions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Loading available questions...
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Available Questions Summary */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h5 className="font-medium text-blue-900 mb-3">Available Questions Summary</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {availableQuestions.map((group) => (
                                <div key={group.marks} className="bg-white rounded-md p-3 border border-blue-200">
                                  <p className="text-sm font-medium text-blue-800">
                                    {group.marks} Mark Questions
                                  </p>
                                  <p className="text-lg font-bold text-blue-600">{group.total} Available</p>
                                  <div className="text-xs text-blue-700 space-y-1 mt-2">
                                    <p>Easy: {group.byDifficulty.easy}</p>
                                    <p>Medium: {group.byDifficulty.medium}</p>
                                    <p>Hard: {group.byDifficulty.hard}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {generateForm.questionGroups.map((group, groupIndex) => (
                            <div
                              key={group.id}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="text"
                                    value={group.name}
                                    onChange={(e) => updateGroupName(groupIndex, e.target.value)}
                                    className="text-lg font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                                  />
                                  <span className="text-sm text-gray-500">({group.id})</span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">Total Marks:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={group.totalMarks}
                                      onChange={(e) => updateQuestionGroup(groupIndex, 'totalMarks', e.target.value)}
                                      className="w-20 rounded-md border-gray-300 text-center"
                                    />
                                  </div>

                                  {generateForm.questionGroups.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeQuestionGroup(groupIndex)}
                                      className="px-2 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Group Progress */}
                              <div className="bg-white rounded-md p-3 border border-gray-200 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700">Group Progress</span>
                                  <span className={`text-sm font-semibold ${group.questions.reduce((sum, q) => sum + q.marks, 0) === group.totalMarks
                                      ? 'text-green-600'
                                      : 'text-blue-600'
                                    }`}>
                                    {group.questions.reduce((sum, q) => sum + q.marks, 0)} / {group.totalMarks} marks
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${group.questions.reduce((sum, q) => sum + q.marks, 0) === group.totalMarks
                                        ? 'bg-green-600'
                                        : 'bg-blue-600'
                                      }`}
                                    style={{
                                      width: `${Math.min(100, (group.questions.reduce((sum, q) => sum + q.marks, 0) / group.totalMarks) * 100)}%`
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {/* Add Questions Section */}
                              <div className="bg-white rounded-md p-3 border border-gray-200 mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-3">Add Questions</p>
                                <div className="grid grid-cols-3 gap-4">
                                  {availableQuestions.map((availableGroup) => (
                                    <div key={availableGroup.marks} className="space-y-2">
                                      <p className="text-xs font-medium text-gray-600">{availableGroup.marks} Mark Questions</p>
                                      {['easy', 'medium', 'hard'].map((difficulty) => (
                                        <button
                                          key={difficulty}
                                          onClick={() => addQuestionToGroup(groupIndex, availableGroup.marks, difficulty)}
                                          disabled={
                                            availableGroup.byDifficulty[difficulty] <= 0 ||
                                            group.questions.reduce((sum, q) => sum + q.marks, 0) + availableGroup.marks > group.totalMarks
                                          }
                                          className={`w-full px-2 py-1 text-xs rounded ${availableGroup.byDifficulty[difficulty] > 0 &&
                                              group.questions.reduce((sum, q) => sum + q.marks, 0) + availableGroup.marks <= group.totalMarks
                                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} ({availableGroup.byDifficulty[difficulty]})
                                        </button>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Selected Questions */}
                              {group.questions.length > 0 && (
                                <div className="bg-white rounded-md p-3 border border-gray-200">
                                  <p className="text-sm font-medium text-gray-700 mb-3">Selected Questions</p>
                                  <div className="space-y-2">
                                    {group.questions.map((question, questionIndex) => (
                                      <div key={question.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span className="text-sm">
                                          {question.marks} mark - {question.difficulty} question
                                        </span>
                                        <button
                                          onClick={() => removeQuestionFromGroup(groupIndex, questionIndex)}
                                          className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Summary */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-blue-800">
                                  Total Questions: <span className="font-semibold">
                                    {generateForm.questionGroups.reduce((sum, group) => sum + group.questions.length, 0)}
                                  </span>
                                </p>
                                <p className="text-sm text-blue-800">
                                  Total Marks: <span className="font-semibold">
                                    {generateForm.questionGroups.reduce((sum, group) =>
                                      sum + group.questions.reduce((gSum, q) => gSum + q.marks, 0), 0
                                    )}
                                  </span>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handlePreview}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              >
                                Preview Question Set
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    resetGenerateForm();
                  }}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePreview}
                  disabled={generating}
                  className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Preview Question Set
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${previewModalEnter ? "opacity-100" : "opacity-0"
              }`}
            onClick={closePreview}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-all duration-200 ${previewModalEnter ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
            >
              {/* Preview Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Preview Question Set
                  </h3>
                  <button
                    onClick={closePreview}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-6 space-y-6">
                {/* Exam Header */}
                <div className="text-center border-b-2 border-gray-300 pb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {previewData.examName}
                  </h1>
                  <div className="text-gray-600 space-y-1">
                    <p>Board: {boards.find(b => b._id === previewData.boardId)?.name}</p>
                    <p>Class: {classes.find(c => c._id === previewData.classId)?.name}</p>
                    <p>Subject: {subjects.find(s => s._id === previewData.subjectId)?.name}</p>
                    <p>Date: {previewData.examDate} | Time: {previewData.examTime}</p>
                    <p>Total Questions: {previewData.totalQuestions} | Total Marks: {previewData.totalMarks}</p>
                  </div>
                </div>

                {/* Question Groups */}
                {previewData.questionGroups.map((group, groupIndex) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {group.name} - Total Marks: {group.totalMarks}
                    </h3>

                    {group.questions.length === 0 ? (
                      <p className="text-gray-500 italic">No questions selected for this group</p>
                    ) : (
                      <div className="space-y-4">
                        {group.questions.map((questionData, qIndex) => (
                          <div key={questionData.id || qIndex} className="border-l-4 border-blue-500 pl-4 bg-gray-50 p-4 rounded-r-lg">
                            {/* Question Header */}
                            <div className="flex items-start justify-between mb-3">
                              <span className="font-medium text-gray-900 text-lg">
                                Q{groupIndex + 1}.{qIndex + 1} ({questionData.marks} marks)
                              </span>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-500 capitalize bg-gray-200 px-2 py-1 rounded">
                                  {questionData.difficulty}
                                </span>
                                <span className="text-sm text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Selected Question
                                </span>
                              </div>
                            </div>

                            {/* Question Text */}
                            <div className="mb-4">
                              <p className="text-lg text-gray-900 leading-relaxed">
                                {questionData.questionText}
                              </p>
                            </div>

                            {/* Options */}
                            {(() => {
                              // Check if we have options
                              const hasOptions = questionData.options && questionData.options.length > 0;

                              // Check if this is a true/false question (empty options but correct answer exists)
                              const isTrueFalse = !hasOptions && questionData.correctAnswer &&
                                (questionData.correctAnswer.toLowerCase() === "true" ||
                                  questionData.correctAnswer.toLowerCase() === "false");

                              if (hasOptions) {
                                // Regular MCQ or stored true/false with options
                                return (
                                  <div className="grid grid-cols-2 gap-4">
                                    {questionData.options.map((option, optIndex) => (
                                      <div
                                        key={optIndex}
                                        className={`p-4 rounded-lg border-2 transition-all ${questionData.correctAnswer &&
                                            questionData.correctAnswer.toLowerCase() === option.toLowerCase()
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 hover:border-gray-300"
                                          }`}
                                      >
                                        <div className="flex items-center">
                                          <span className={`font-bold text-lg mr-3 ${questionData.correctAnswer &&
                                              questionData.correctAnswer.toLowerCase() === option.toLowerCase()
                                              ? "text-green-700"
                                              : "text-gray-700"
                                            }`}>
                                            {String.fromCharCode(97 + optIndex)}.
                                          </span>
                                          <span className={`text-base ${questionData.correctAnswer &&
                                              questionData.correctAnswer.toLowerCase() === option.toLowerCase()
                                              ? "text-green-800 font-semibold"
                                              : "text-gray-800"
                                            }`}>
                                            {option}
                                          </span>
                                          {questionData.correctAnswer &&
                                            questionData.correctAnswer.toLowerCase() === option.toLowerCase() && (
                                              <span className="ml-auto">
                                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              </span>
                                            )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              } else if (isTrueFalse) {
                                // True/False question without stored options - generate them
                                const trueFalseOptions = ["True", "False"];
                                return (
                                  <div className="grid grid-cols-2 gap-4">
                                    {trueFalseOptions.map((option, optIndex) => (
                                      <div
                                        key={optIndex}
                                        className={`p-4 rounded-lg border-2 transition-all ${questionData.correctAnswer &&
                                            questionData.correctAnswer.toLowerCase() === option.toLowerCase()
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 hover:border-gray-300"
                                          }`}
                                      >
                                        <div className="flex items-center">
                                          <span className={`font-bold text-lg mr-3 ${questionData.correctAnswer &&
                                              questionData.correctAnswer.toLowerCase() === option.toLowerCase()
                                              ? "text-green-700"
                                              : "text-gray-700"
                                            }`}>
                                            {String.fromCharCode(97 + optIndex)}.
                                          </span>
                                          <span className={`text-base ${questionData.correctAnswer &&
                                              questionData.correctAnswer.toLowerCase() === option.toLowerCase()
                                              ? "text-green-800 font-semibold"
                                              : "text-gray-800"
                                            }`}>
                                            {option}
                                          </span>
                                          {questionData.correctAnswer &&
                                            questionData.correctAnswer.toLowerCase() === option.toLowerCase() && (
                                              <span className="ml-auto">
                                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              </span>
                                            )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              } else if (questionData.correctAnswer) {
                                // Other question types with direct answer
                                return (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-green-800 mb-2">Correct Answer:</p>
                                    <p className="text-green-900 font-semibold">{questionData.correctAnswer}</p>
                                  </div>
                                );
                              }

                              return null;
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Question Set Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">Total Groups:</span>
                      <span className="ml-2 text-blue-700">{previewData.questionGroups.length}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Total Questions:</span>
                      <span className="ml-2 text-blue-700">{previewData.totalQuestions}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Total Marks:</span>
                      <span className="ml-2 text-blue-700">{previewData.totalMarks}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Exam Duration:</span>
                      <span className="ml-2 text-blue-700">{previewData.examTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closePreview}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={() => {
                      closePreview();
                      handleGenerateFinal();
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Generate Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && deleteSet && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${deleteModalEnter ? "opacity-100" : "opacity-0"
              }`}
            onClick={closeDelete}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${deleteModalEnter
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-2"
                }`}
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Question Set
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
                      Are you sure you want to delete this question set?
                    </h4>
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="text-sm text-gray-700 font-medium">
                        {deleteSet.examName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {deleteSet.totalQuestions} questions •{" "}
                        {deleteSet.board?.name} • {deleteSet.class?.name} •{" "}
                        {deleteSet.subject?.name}
                      </p>
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      This action cannot be undone. The question set will be
                      permanently deleted.
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

export default GeneratedSets;
