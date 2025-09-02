import React from 'react';

const PaperTemp1 = ({ previewData, subjects, handleEditQuestion }) => {
  return (
    <div className="p-8 space-y-6 bg-white" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Exam Paper Header */}
      <div className="text-center border-b-2 border-black pb-4">
        <h1 className="text-xl font-bold text-black mb-4">
          Format of question paper for {subjects.find(s => s._id === previewData.subjectId)?.name || 'Subject'}
        </h1>
        
        <div className="flex justify-between items-center text-sm font-medium">
          <div>
            <strong>Duration: {previewData.examDuration} Hours</strong>
          </div>
          <div>
            <strong>Marks: {previewData.totalMarks}</strong>
          </div>
        </div>
        
        <h2 className="text-lg font-bold text-black mt-4 uppercase tracking-wider">
          {previewData.examName}
        </h2>
      </div>

      {/* Instructions Table */}
      <div className="border-2 border-black">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left p-3 font-bold border-r-2 border-black" style={{ width: '15%' }}>Q. No.</th>
              <th className="text-left p-3 font-bold border-r-2 border-black" style={{ width: '70%' }}>Nature of questions</th>
              <th className="text-left p-3 font-bold" style={{ width: '15%' }}>Marks</th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Question Groups by Subject/Topic */}
      {previewData.questionGroups.map((group, groupIndex) => {
        if (group.questions.length === 0) return null;
        
        // Group questions by marks for better organization
        const questionsByMarks = {};
        group.questions.forEach(q => {
          if (!questionsByMarks[q.marks]) {
            questionsByMarks[q.marks] = [];
          }
          questionsByMarks[q.marks].push(q);
        });

        return (
          <div key={group.id} className="space-y-4">
            {/* Section Header */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-black uppercase tracking-wider border-b border-black pb-2">
                {group.name}
              </h3>
            </div>

            {/* Instructions for this section */}
            <div className="ml-4">
              <p className="font-bold text-black mb-2">Note:</p>
              <div className="ml-4 space-y-1 text-sm">
                <p>(1) All questions are compulsory.</p>
                <p>(2) Figures to the right indicate full marks.</p>
                <p>(3) Use the outline map for geographical questions.</p>
                <p>(4) The use of stencil is allowed for drawing maps.</p>
                <p>(5) Use graph paper for statistical questions.</p>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {Object.entries(questionsByMarks)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([marks, questions], markGroupIndex) => (
                  <div key={marks} className="space-y-4">
                    {questions.map((questionData, qIndex) => {
                      const questionNumber = `Q.${groupIndex + 1}.${qIndex + 1}`;
                      const isMultiPart = questionData.options && questionData.options.length > 0;
                      
                      return (
                        <div key={questionData.id} className="flex">
                          {/* Question Number and Content */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-bold text-black mb-2">
                                  {questionNumber} {questionData.questionText}
                                </p>
                                
                                {/* Options for MCQ */}
                                {isMultiPart && (
                                  <div className="ml-8 space-y-2">
                                    {questionData.options.map((option, optIndex) => (
                                      <div key={optIndex} className="flex items-start">
                                        <span className="font-medium mr-2 min-w-[20px]">
                                          ({String.fromCharCode(97 + optIndex)})
                                        </span>
                                        <span>{option}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Sub-parts or additional instructions */}
                                {parseInt(marks) > 2 && (
                                  <div className="ml-8 mt-2 text-sm italic">
                                    <p>(Any {Math.ceil(parseInt(marks) / 2)} out of {Math.ceil(parseInt(marks) * 1.5)})</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Marks and Edit Button */}
                              <div className="ml-4 text-right">
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
                                  <span className="border border-black px-2 py-1 text-sm font-bold">
                                    [{marks}]
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 border-t-2 border-black pt-4 mt-8">
        <p>--- End of Question Paper ---</p>
        <p className="mt-2">Generated on: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default PaperTemp1;
