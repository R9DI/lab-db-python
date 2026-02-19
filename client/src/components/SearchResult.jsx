import { useState } from 'react';
import SplitTable from './SplitTable';

function SearchResult({ result, rank }) {
  const { score, experiment, project, splits } = result;
  const [showSplits, setShowSplits] = useState(false);
  const [showProject, setShowProject] = useState(false);

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b bg-gray-50">
        <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm truncate">{experiment.eval_item}</h4>
          <p className="text-xs text-gray-500 truncate">{experiment.project_name}</p>
        </div>
        <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full shrink-0">
          유사도 {(score * 100).toFixed(1)}%
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* 실험 정보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-gray-400">plan_id</span>
            <p className="font-medium text-gray-700">{experiment.plan_id}</p>
          </div>
          <div>
            <span className="text-gray-400">모듈</span>
            <p className="font-medium text-gray-700">{experiment.module}</p>
          </div>
          <div>
            <span className="text-gray-400">요청자</span>
            <p className="font-medium text-gray-700">{experiment.requester}</p>
          </div>
          <div>
            <span className="text-gray-400">LOT</span>
            <p className="font-medium text-gray-700">{experiment.lot_code}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">평가 공정</span>
            <p className="font-medium text-gray-700">{experiment.eval_process}</p>
          </div>
          <div>
            <span className="text-gray-400">평가항목</span>
            <p className="font-medium text-gray-700">{experiment.eval_category}</p>
          </div>
          <div>
            <span className="text-gray-400">WF</span>
            <p className="font-medium text-gray-700">{experiment.assign_wf}</p>
          </div>
        </div>

        {/* 과제 상세 정보 */}
        {project && (
          <div className="mt-3">
            <div className="p-2 bg-indigo-50 rounded text-xs">
              <div className="flex gap-4 flex-wrap mb-1">
                <span>Tech: <b>{project.iacpj_tech_n}</b></span>
                <span>PM: <b>{project.iacpj_ch_n}</b></span>
                <span>등급: <b>{project.ia_ta_grd_n}</b></span>
                <span>검증LV: <b>{project.iacpj_level}</b></span>
                <span>모듈: <b>{project.iacpj_mod_n}</b></span>
                <span className={`px-1.5 py-0.5 rounded ${
                  project.ia_tgt_htr_n === 'Red' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {project.ia_tgt_htr_n}
                </span>
              </div>
              <button
                onClick={() => setShowProject(!showProject)}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showProject ? '과제 상세 접기' : '과제 목적/목표/현황 보기'}
              </button>
            </div>

            {showProject && (
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs space-y-2 border">
                <div>
                  <span className="text-gray-400 font-medium block mb-0.5">프로젝트 목적</span>
                  <p className="text-gray-700 whitespace-pre-wrap">{project.project_purpose || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block mb-0.5">프로젝트 목표</span>
                  <p className="text-gray-700 whitespace-pre-wrap">{project.iacpj_ta_goa || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block mb-0.5">현 상황</span>
                  <p className="text-gray-700 whitespace-pre-wrap">{project.iacpj_cur_stt || '-'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Split Table Toggle */}
        {splits && splits.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowSplits(!showSplits)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {showSplits ? 'Split Table 접기' : `Split Table 보기 (${splits.length}건)`}
            </button>
            {showSplits && (
              <div className="mt-2">
                <SplitTable splits={splits} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResult;
