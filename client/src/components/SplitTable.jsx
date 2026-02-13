function SplitTable({ splits }) {
  if (!splits || splits.length === 0) return null;

  const wfCols = [];
  for (let i = 1; i <= 15; i++) {
    const key = `user_def_val_${i}`;
    const hasData = splits.some(s => s[key] && s[key].trim());
    if (hasData) wfCols.push({ key, label: `WF${i}` });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1.5 text-left font-medium text-gray-600">FAC</th>
            <th className="border px-2 py-1.5 text-left font-medium text-gray-600">OPER_ID</th>
            <th className="border px-2 py-1.5 text-left font-medium text-gray-600">OPER_NM</th>
            <th className="border px-2 py-1.5 text-left font-medium text-gray-600">Split</th>
            <th className="border px-2 py-1.5 text-left font-medium text-gray-600">조건</th>
            <th className="border px-2 py-1.5 text-left font-medium text-gray-600">장비</th>
            <th className="border px-2 py-1.5 text-left font-medium text-gray-600">Recipe</th>
            {wfCols.map(c => (
              <th key={c.key} className="border px-2 py-1.5 text-center font-medium text-gray-600">{c.label}</th>
            ))}
            <th className="border px-2 py-1.5 text-left font-medium text-gray-600">Note</th>
          </tr>
        </thead>
        <tbody>
          {splits.map((s, i) => (
            <tr key={s.id || i} className={`${s.eps_lot_gbn_cd === 'base' ? 'bg-blue-50' : 'bg-amber-50'} hover:bg-gray-50`}>
              <td className="border px-2 py-1">{s.fac_id}</td>
              <td className="border px-2 py-1">{s.oper_id}</td>
              <td className="border px-2 py-1">{s.oper_nm}</td>
              <td className="border px-2 py-1">
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  s.eps_lot_gbn_cd === 'base' ? 'bg-blue-200 text-blue-800' : 'bg-amber-200 text-amber-800'
                }`}>
                  {s.eps_lot_gbn_cd}
                </span>
              </td>
              <td className="border px-2 py-1">{s.work_cond_desc || '-'}</td>
              <td className="border px-2 py-1">{s.eqp_id}</td>
              <td className="border px-2 py-1 font-mono">{s.recipe_id}</td>
              {wfCols.map(c => (
                <td key={c.key} className="border px-2 py-1 text-center">
                  {s[c.key] === 'O' ? (
                    <span className="text-emerald-600 font-bold">O</span>
                  ) : s[c.key] || ''}
                </td>
              ))}
              <td className="border px-2 py-1 text-gray-500">{s.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SplitTable;
