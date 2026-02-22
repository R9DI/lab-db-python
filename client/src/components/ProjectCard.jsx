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
          {p.experiment_count > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              실험 {p.experiment_count}건{p.split_count > 0 && ` / Split ${p.split_count}건`}
            </span>
          )}
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
      <div className="space-y-1 text-xs text-gray-500 mb-2">
        {/* 2번째 줄: Tech / Module / 등급 */}
        <div className="grid grid-cols-3 gap-1">
          <span>Tech: <b className="text-gray-700">{p.iacpj_tech_n}</b></span>
          <span>Module: <b className="text-gray-700">{p.iacpj_mod_n}</b></span>
          <span>등급: <b className="text-gray-700">{p.ia_ta_grd_n}</b></span>
        </div>
        {/* 3번째 줄: 검증LV / 시작일 */}
        <div className="grid grid-cols-3 gap-1">
          <span>검증LV: <b className="text-gray-700">{p.iacpj_level}</b></span>
          <span>시작일: <b className="text-gray-700">{p.iacpj_bgn_dy}</b></span>
        </div>
        {/* 4번째 줄: HTRS / NUDD */}
        <div className="grid grid-cols-3 gap-1">
          <span className="flex items-center gap-1">
            HTRS:
            <b className={`px-2 py-0.5 rounded-full ${htrsBadgeClass}`}>
              {p.ia_tgt_htr_n}
            </b>
          </span>
          <span className="flex items-center gap-1">
            NUDD:
            <b className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {p.iacpj_nud_n}
            </b>
          </span>
        </div>
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
          {[
            { label: "개발 분류", value: p.iacpj_tgt_n },
            { label: "종료일", value: p.iacpj_end_dy },
            { label: "현재 상태", value: p.iacpj_cur_stt },
            { label: "프로젝트 목적", value: p.project_purpose },
            { label: "프로젝트 목표", value: p.iacpj_ta_goa },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="text-gray-400 block">{label}</span>
              <p className="text-gray-700 whitespace-pre-wrap">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectCard;
