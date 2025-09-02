import React from 'react';

const PaperTemp3 = ({ previewData, subjects, handleEditQuestion }) => {
  return (
    <div className="p-10 space-y-8 bg-white" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Minimalist Header */}
      <div className="text-center space-y-4">
        <div className="border-b-4 border-gray-800 pb-6">
          <h1 className="text-3xl font-light text-gray-800 mb-2">
            {previewData.examName}
          </h1>
          <p className="text-lg text-gray-600 font-light">
            {subjects.find(s => s._id === previewData.subjectId)?.name || 'Subject'}
          </p>
        </div>
        
        <div className="flex justify-center items-center space-x-12 text-sm text-gray-700">
          <div className="text-center">
            <p className="font-medium">DURATION</p>
            <p className="text-2xl font-light">{previewData.examDuration}h</p>
          </div>
          <div className="w-px h-12 bg-gray-300"></div>
          <div className="text-center">
            <p className="font-medium">MARKS</p>
            <p className="text-2xl font-light">{previewData.totalMarks}</p>
          </div>
        </div>
      </div>

      {/* Simple Instructions */}
      <div className="text-center text-sm text-gray-600 space-y-2">
        <p>Read all questions carefully • Answer all questions • Show your work</p>
      </div>

      {/* Question Groups */}
      {previewData.questionGroups.map((group, groupIndex) => {
        if (group.questions.length === 0) return null;

        return (
          <div key={group.id} className="space-y-8">
            {/* Section Header */}
            <div className="text-center">
              <h2 className="text-xl font-light text-gray-800 tracking-wide">
                {group.name.toUpperCase()}
              </h2>
              <div className="w-24 h-px bg-gray-400 mx-auto mt-2"></div>
            </div>

            {/* Questions */}
            <div className="space-y-10">
              {group.questions.map((questionData, qIndex) => {
                const questionNumber = qIndex + 1;
                const isMultiPart = questionData.options && questionData.options.length > 0;
                
                return (
                  <div key={questionData.id} className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-baseline space-x-4 mb-4">
                          <span className="text-2xl font-light text-gray-800">
                            {questionNumber}.
                          </span>
                          <p className="text-base text-gray-800 leading-relaxed flex-1">
                            {questionData.questionText}
                          </p>
                        </div>
                        
                        {/* Options for MCQ */}
                        {isMultiPart && (
                          <div className="ml-12 space-y-3">
                            {questionData.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-start space-x-4">
                                <span className="text-gray-600 font-medium min-w-[24px]">
                                  ({String.fromCharCode(97 + optIndex)})
                                </span>
                                <span className="text-gray-800">{option}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6 flex items-center space-x-3">
                        <button
                          onClick={() => handleEditQuestion(questionData)}
                          className="text-gray-500 hover:text-gray-700 p-1"
                          title="Edit Question"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <div className="text-center">
                          <div className="w-12 h-12 border border-gray-400 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {questionData.marks}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Answer space indicator */}
                    <div className="ml-12 mt-6">
                      <div className="border-b border-gray-200 w-full"></div>
                      <div className="border-b border-gray-200 w-full mt-4"></div>
                      <div className="border-b border-gray-200 w-3/4 mt-4"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 mt-16 pt-8 border-t border-gray-200">
        <p>Generated on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default PaperTemp3;
