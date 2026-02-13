import React, { useState } from 'react';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('project'); // 'project', 'experiment', 'split'
  const [status, setStatus] = useState('');
  const [details, setDetails] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setDetails(null);
  };

  const handleTypeChange = (e) => {
    setUploadType(e.target.value);
    setStatus('');
    setDetails(null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);

    setStatus('업로드 중...');
    
    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        setStatus('업로드 성공!');
        setDetails(result.details);
      } else {
        setStatus(`업로드 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload Error:', error);
      setStatus('서버 오류 발생');
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    let templateName = 'template.csv';
    
    switch(uploadType) {
      case 'project': templateName = 'template_project.csv'; break;
      case 'experiment': templateName = 'template_experiment.csv'; break;
      case 'split': templateName = 'template_split.csv'; break;
    }
    
    link.href = '/' + templateName;
    link.setAttribute('download', templateName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">데이터 업로드 (CSV)</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
        
        {/* Type Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. 데이터 유형 선택</h2>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="uploadType" 
                value="project" 
                checked={uploadType === 'project'} 
                onChange={handleTypeChange}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-gray-700">과제 (Projects)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="uploadType" 
                value="experiment" 
                checked={uploadType === 'experiment'} 
                onChange={handleTypeChange}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-gray-700">실험 (Experiments)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="uploadType" 
                value="split" 
                checked={uploadType === 'split'} 
                onChange={handleTypeChange}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-gray-700">조건 (Split Tables)</span>
            </label>
          </div>
        </div>

        <div className="mb-6 border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold mb-2">2. 템플릿 다운로드</h2>
          <p className="text-gray-600 mb-4">
             선택한 <strong>{uploadType === 'project' ? '과제' : uploadType === 'experiment' ? '실험' : '조건'}</strong> 데이터 양식을 다운로드하세요.
          </p>
          <button 
            onClick={downloadTemplate}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors"
          >
            {uploadType === 'project' ? '과제' : uploadType === 'experiment' ? '실험' : '조건'} CSV 템플릿 받기
          </button>
        </div>

        <div className="border-t border-gray-200 my-6 pt-6">
          <h2 className="text-xl font-semibold mb-2">3. 파일 선택 및 업로드</h2>
          <div className="flex items-center gap-4 mb-4">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
            <button 
              onClick={handleUpload}
              disabled={!file}
              className={`px-6 py-2 rounded-md font-medium text-white transition-colors ${
                file ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              업로드
            </button>
          </div>

          {status && (
            <div className={`mt-4 p-4 rounded-md ${status.includes('성공') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="font-medium">{status}</p>
              {details && (
                <ul className="mt-2 ml-4 list-disc text-sm">
                  {uploadType === 'project' && <li>과제(Projects) 추가/업데이트: {details.projectCount} 건</li>}
                  {uploadType === 'experiment' && <li>실험(Experiments) 추가: {details.experimentCount} 건</li>}
                  {uploadType === 'split' && <li>조건(Splits) 추가: {details.splitCount} 건</li>}
                </ul>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-blue-50 p-4 rounded-md text-sm text-blue-800">
          <h3 className="font-bold mb-1">💡 도움말</h3>
          <ul className="list-disc ml-4 space-y-1">
            <li><strong>순서 준수</strong>: 과제 → 실험 → 조건 순서로 업로드해야 오류가 없습니다.</li>
            <li><strong>Project Name</strong>: 모든 데이터의 기준이 되므로 정확해야 합니다.</li>
            <li>파일 내용은 <strong>덮어쓰기(Create or Update)</strong> 되거나 <strong>무시(Ignore)</strong> 됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
