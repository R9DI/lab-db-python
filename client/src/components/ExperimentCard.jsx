function ExperimentCard({ experiment, selected, onClick }) {
  const e = experiment;
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        selected
          ? 'border-emerald-500 bg-emerald-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm'
      }`}
    >
      <h4 className="font-medium text-gray-900 text-sm mb-2 leading-tight">
        {e.eval_item}
      </h4>
      <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
        <span>plan_id: <b className="text-gray-700">{e.plan_id}</b></span>
        <span>LOT: <b className="text-gray-700">{e.lot_code}</b></span>
        <span>모듈: <b className="text-gray-700">{e.module}</b></span>
        <span>요청자: <b className="text-gray-700">{e.requester}</b></span>
        <span className="col-span-2">평가공정: <b className="text-gray-700">{e.eval_process}</b></span>
        <span>WF: <b className="text-gray-700">{e.assign_wf}</b></span>
        <span>평가항목: <b className="text-gray-700">{e.eval_category}</b></span>
      </div>
    </div>
  );
}

export default ExperimentCard;
