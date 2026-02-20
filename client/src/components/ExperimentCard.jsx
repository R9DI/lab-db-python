import { useState } from "react";

function ExperimentCard({ experiment, selected, onClick }) {
  const e = experiment;
  const isEmpty = e.split_count === 0;
  const [expanded, setExpanded] = useState(false);

  const cardClass = selected
    ? "border-emerald-500 bg-emerald-50 shadow-md"
    : isEmpty
      ? "border-pink-300 bg-pink-50 hover:border-pink-400 hover:shadow-sm"
      : "border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm";

  const detailFields = [
    { label: "과제명", value: e.iacpj_nm },
    { label: "WF 방향", value: e.wf_direction },
    { label: "배정 WF", value: e.assign_wf },
    { label: "상태", value: e.status },
    { label: "FAB 상태", value: e.fab_status },
    { label: "이전 평가", value: e.prev_eval },
    { label: "교차 실험", value: e.cross_experiment },
    { label: "LOT 요청", value: e.lot_request },
    { label: "Volume Split", value: e.volume_split },
    { label: "참고", value: e.reference },
    { label: "참조 데이터", value: e.refdata },
    { label: "요청일", value: e.request_date },
  ].filter((f) => f.value);

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${cardClass}`}
    >
      {/* 제목 */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-tight">
          {e.eval_item}
        </h4>
        {isEmpty && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-200 text-pink-700 font-medium whitespace-nowrap">
            Split 없음
          </span>
        )}
      </div>

      {/* 기본 정보 */}
      <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-2">
        <span>LOT CODE: <b className="text-gray-700">{e.lot_code}</b></span>
        <span>LOT ID: <b className="text-gray-700">{e.plan_id}</b></span>
        <span className="col-span-2">
          요청자: <b className="text-gray-700">{e.requester}</b>{e.team ? ` (${e.team})` : ""}
        </span>
        <span>평가항목: <b className="text-gray-700">{e.eval_category}</b></span>
        <span>모듈: <b className="text-gray-700">{e.module}</b></span>
        <span className="col-span-2">평가공정: <b className="text-gray-700">{e.eval_process}</b></span>
      </div>

      {/* 상세 보기 버튼 */}
      <button
        onClick={(ev) => { ev.stopPropagation(); setExpanded(!expanded); }}
        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
      >
        {expanded ? "상세 접기" : "실험 상세 보기"}
      </button>

      {/* 상세 내용 */}
      {expanded && (
        <div
          className="mt-2 pt-2 border-t space-y-1 text-xs"
          onClick={(ev) => ev.stopPropagation()}
        >
          {detailFields.map(({ label, value }) => (
            <div key={label}>
              <span className="text-gray-400">{label}: </span>
              <b className="text-gray-700">{value}</b>
            </div>
          ))}
          {e.refdata_url && (
            <div>
              <span className="text-gray-400">참조 URL: </span>
              <a
                href={e.refdata_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(ev) => ev.stopPropagation()}
                className="text-sky-600 hover:text-sky-800 underline break-all"
              >
                {e.refdata_url}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExperimentCard;
