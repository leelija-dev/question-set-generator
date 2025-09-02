import React from 'react';

const PaperTemp2 = ({ previewData, subjects, handleEditQuestion }) => {
  return (
    <div className="p-8 space-y-6 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            {previewData.examName}
          </h1>
          <p className="text-lg">
            {subjects.find(s => s._id === previewData.subjectId)?.name || 'Subject'}
          </p>
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-blue-400">
          <div className="bg-white bg-opacity-20 px-4 py-2 rounded">
            <span className="font-semibold">Duration: {previewData.examDuration} Hours</span>
          </div>
          <div className="bg-white bg-opacity-20 px-4 py-2 rounded">
            <span className="font-semibold">Total Marks: {previewData.totalMarks}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Instructions:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="space-y-2">
            <p>• All questions are compulsory</p>
            <p>• Read all questions carefully</p>
            <p>• Manage your time effectively</p>
          </div>
          <div className="space-y-2">
            <p>• Write clearly and legibly</p>
            <p>• Numbers indicate marks</p>
            <p>• Show all working steps</p>
          </div>
        </div>
      </div>

      {/* Question Groups */}
      {previewData.questionGroups.map((group, groupIndex) => {
        if (group.questions.length === 0) return null;

        return (
          <div key={group.id} className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Section Header */}
            <div className="bg-blue-50 px-6 py-4 border-b border-gray-300">
              <h3 className="text-xl font-bold text-blue-800">
                Section {String.fromCharCode(65 + groupIndex)}: {group.name}
              </h3>
            </div>

            {/* Questions */}
            <div className="p-6 space-y-6">
              {group.questions.map((questionData, qIndex) => {
                const questionNumber = `${groupIndex + 1}.${qIndex + 1}`;
                const isMultiPart = questionData.options && questionData.options.length > 0;
                
                return (
                  <div key={questionData.id} className="border-l-4 border-blue-500 pl-6 py-4 bg-gray-50 rounded-r-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Question {questionNumber}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditQuestion(questionData)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          title="Edit Question"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {questionData.marks} marks
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-800 text-base leading-relaxed mb-4">
                      {questionData.questionText}
                    </p>
                    
                    {/* Options for MCQ */}
                    {isMultiPart && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {questionData.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-start bg-white p-3 rounded border">
                            <span className="font-semibold text-blue-600 mr-3 min-w-[24px]">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="text-gray-800">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm border-t border-gray-300 pt-6">
        <p className="font-semibold">Best of Luck!</p>
        <p className="mt-1">Generated on: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default PaperTemp2;
