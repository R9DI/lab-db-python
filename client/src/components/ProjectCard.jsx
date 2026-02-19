import { useState } from "react";

function ProjectCard({ project, selected, onClick, onDelete }) {
  const p = project;
  const [expanded, setExpanded] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (
      window.confirm(
        `"${p.iacpj_nm}" 과제를 삭제하시겠습니까?\n관련 실험과 Split 데이터도 모두 삭제됩니다.`,
      )
    ) {
      onDelete(p);
    }
  };

  const htrsBadgeClass =
    p.ia_tgt_htr_n === "Red"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-600";

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all group ${
        selected
          ? "border-indigo-500 bg-indigo-50 shadow-md"
          : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
      }`}
    >
      {/* 상단: 제목(좌) + PM(우) */}
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
          {p.iacpj_nm}{" "}
          <span className="font-normal text-gray-400">{p.iacpj_itf_uno}</span>
        </h3>

        <div className="flex items-baseline gap-2 shrink-0">
          <h3 className="text-sm font-semibold text-gray-800">{p.iacpj_ch_n}</h3>
          <button
            onClick={handleDelete}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all text-xs"
            title="과제 삭제"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 속성 */}
      <div className="grid grid-cols-3 gap-1 text-xs text-gray-500 mb-2">
        <span>
          Tech: <b className="text-gray-700">{p.iacpj_tech_n}</b>
        </span>
        <span>
          Module: <b className="text-gray-700">{p.iacpj_mod_n}</b>
        </span>
        <span>
          등급: <b className="text-gray-700">{p.ia_ta_grd_n}</b>
        </span>

        <span>
          검증LV: <b className="text-gray-700">{p.iacpj_level}</b>
        </span>
        <span>
          시작일: <b className="text-gray-700">{p.iacpj_bgn_dy}</b>
        </span>

        {/* HTRS 색상 */}
        <span className="flex items-center gap-1">
          HTRS:
          <b className={`px-2 py-0.5 rounded-full ${htrsBadgeClass}`}>
            {p.ia_tgt_htr_n}
          </b>
        </span>

        {/* NUDD */}
        <span className="flex items-center gap-1">
          NUDD:
          <b className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {p.iacpj_nud_n}
          </b>
        </span>
      </div>

      {/* 상세 토글 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
      >
        {expanded ? "상세 접기" : "과제 상세 보기"}
      </button>

      {expanded && (
        <div
          className="mt-2 space-y-2 text-xs border-t pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <span className="text-gray-400 block">프로젝트 목적</span>
            <p className="text-gray-700 whitespace-pre-wrap">
              {p.project_purpose || "-"}
            </p>
          </div>
          <div>
            <span className="text-gray-400 block">프로젝트 목표</span>
            <p className="text-gray-700 whitespace-pre-wrap">
              {p.iacpj_ta_goa || "-"}
            </p>
          </div>
          <div>
            <span className="text-gray-400 block">현 상황</span>
            <p className="text-gray-700 whitespace-pre-wrap">
              {p.iacpj_cur_stt || "-"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectCard;
