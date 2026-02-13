import { useState } from 'react';

function ProjectCard({ project, selected, onClick }) {
  const p = project;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        selected
          ? 'border-indigo-500 bg-indigo-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
          {p.project_name}
        </h3>
        <div className="flex gap-1 shrink-0 ml-2">
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            p.htrs_color === 'Red' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {p.htrs_color}
          </span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">
            {p.nudd}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 text-xs text-gray-500 mb-2">
        <span>모듈: <b className="text-gray-700">{p.module}</b></span>
        <span>PM: <b className="text-gray-700">{p.pm}</b></span>
        <span>Tech: <b className="text-gray-700">{p.first_target_tech}</b></span>
        <span>등급: <b className="text-gray-700">{p.project_grade}</b></span>
        <span>검증LV: <b className="text-gray-700">{p.verification_lv}</b></span>
        <span>시작일: <b className="text-gray-700">{p.start_date}</b></span>
        <span>코드: <b className="text-gray-700">{p.project_code}</b></span>
        <span>Device: <b className="text-gray-700">{p.target_device}</b></span>
        <span>선행: <b className="text-gray-700">{p.preceding_type}</b></span>
      </div>

      {/* 상세 토글 */}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
      >
        {expanded ? '상세 접기' : '과제 상세 보기'}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 text-xs border-t pt-2" onClick={(e) => e.stopPropagation()}>
          <div>
            <span className="text-gray-400 block">프로젝트 목적</span>
            <p className="text-gray-700 whitespace-pre-wrap">{p.project_purpose || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400 block">프로젝트 목표</span>
            <p className="text-gray-700 whitespace-pre-wrap">{p.project_goal || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400 block">현 상황</span>
            <p className="text-gray-700 whitespace-pre-wrap">{p.current_status || '-'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectCard;
