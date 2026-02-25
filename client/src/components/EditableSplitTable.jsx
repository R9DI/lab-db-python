import { useState, useMemo, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import axios from "axios";

ModuleRegistry.registerModules([AllCommunityModule]);

const SPLIT_COLORS = {
  base: { row: "#EFF6FF", cell: "#BFDBFE", text: "#1E40AF" },  // 파랑 — 최고 채도
  s1:   { row: "#EEF2FF", cell: "#C7D2FE", text: "#3730A3" },  // 인디고
  s2:   { row: "#F5F3FF", cell: "#DDD6FE", text: "#5B21B6" },  // 바이올렛
  s3:   { row: "#FFF1F2", cell: "#FFE4E6", text: "#9F1239" },  // 로즈
  s4:   { row: "#FFFBEB", cell: "#FDE68A", text: "#92400E" },  // 앰버
  s5:   { row: "#F0FDF4", cell: "#BBF7D0", text: "#14532D" },  // 그린
  s6:   { row: "#F0F9FF", cell: "#BAE6FD", text: "#0369A1" },  // 스카이
  s7:   { row: "#F8FAFC", cell: "#CBD5E1", text: "#334155" },  // 슬레이트 — 저채도
  s8:   { row: "#F9FAFB", cell: "#E5E7EB", text: "#374151" },  // 회색 — 최저 채도
};
const DEFAULT_SPLIT = { row: "#F9FAFB", cell: "#F3F4F6", text: "#374151" };

const getSplitColor = (val) =>
  SPLIT_COLORS[val?.toLowerCase()] || DEFAULT_SPLIT;

function EditableSplitTable({ splits, planId, experimentId, onSaved }) {
  const [rows, setRows] = useState(() =>
    [...splits].sort((a, b) => {
      if (a.sno == null && b.sno == null) return 0;
      if (a.sno == null) return 1;
      if (b.sno == null) return -1;
      return a.sno - b.sno;
    })
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const gridRef = useRef(null);

  const handleDeleteRow = useCallback((rowIndex) => {
    setRows(prev => prev.filter((_, i) => i !== rowIndex));
    setDirty(true);
    setSaved(false);
  }, []);

  const wfCols = useMemo(() => {
    const cols = [];
    for (let i = 1; i <= 25; i++) {
      cols.push({
        headerName: `${i}`,
        field: `user_def_val_${i}`,
        width: 55,
        editable: true,
        cellStyle: (params) => {
          if (params.value != null && params.value !== "")
            return { color: "#059669", fontWeight: "bold", textAlign: "center" };
          return { textAlign: "center" };
        },
      });
    }
    return cols;
  }, []);

  const columnDefs = useMemo(() => [
    {
      headerName: "",
      field: "_del",
      width: 40,
      sortable: false,
      resizable: false,
      suppressMovable: true,
      cellRenderer: (params) => (
        <button
          onClick={() => handleDeleteRow(params.node.rowIndex)}
          className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-500 transition rounded"
          title="행 삭제"
        >
          ✕
        </button>
      ),
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center", padding: "0" },
    },
    { headerName: "SNO",     field: "sno",             width: 60,  editable: true, cellStyle: { textAlign: "center" } },
    { headerName: "FAC",     field: "fac_id",           width: 65,  editable: true },
    { headerName: "OPER_ID", field: "oper_id",          width: 110, editable: true },
    { headerName: "OPER_NM", field: "oper_nm",          width: 120, editable: true },
    {
      headerName: "Split",
      field: "eps_lot_gbn_cd",
      width: 75,
      editable: true,
      cellStyle: (params) => {
        const c = SPLIT_COLORS[params.value?.toLowerCase()];
        return c ? { backgroundColor: c.cell, color: c.text, fontWeight: "600" } : {};
      },
    },
    { headerName: "Note",   field: "note",            minWidth: 120, flex: 1, editable: true },
    { headerName: "조건",   field: "work_cond_desc",  minWidth: 180, flex: 1, editable: true },
    { headerName: "장비",   field: "eqp_id",          width: 90,  editable: true },
    { headerName: "Recipe", field: "recipe_id",        width: 140, editable: true },
    ...wfCols,
  ], [wfCols, handleDeleteRow]);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    suppressMovable: true,
  }), []);

  const handleCellValueChanged = useCallback((e) => {
    const updated = [];
    e.api.forEachNode(n => updated.push(n.data));
    setRows(updated);
    setDirty(true);
    setSaved(false);
  }, []);

  const getRowStyle = useCallback((params) => {
    const prev = params.api.getDisplayedRowAtIndex(params.rowIndex - 1);
    const borderTop =
      prev && prev.data.oper_id !== params.data.oper_id
        ? "2px solid #64748B"
        : undefined;
    const c = getSplitColor(params.data.eps_lot_gbn_cd);
    return { backgroundColor: c.row, borderTop };
  }, []);

  const handleAddRow = () => {
    const wfEmpty = Object.fromEntries(
      Array.from({ length: 25 }, (_, i) => [`user_def_val_${i + 1}`, null])
    );
    setRows(prev => [
      ...prev,
      { sno: prev.length + 1, plan_id: planId, fac_id: "", oper_id: "", oper_nm: "",
        eps_lot_gbn_cd: "base", work_cond_desc: "", eqp_id: "", recipe_id: "", note: "",
        ...wfEmpty },
    ]);
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/splits/${planId}`, { splits: rows });
      setDirty(false);
      setSaved(true);
      if (onSaved) onSaved();
    } catch (err) {
      console.error("Split 저장 실패:", err);
      alert(`저장에 실패했습니다: ${err.response?.data?.details || err.message}`);
    }
    setSaving(false);
  };

  const handleFinalize = async () => {
    if (!experimentId) return;
    setFinalizing(true);
    try {
      // 미저장 내용이 있으면 먼저 저장
      if (dirty) {
        await axios.put(`/api/splits/${planId}`, { splits: rows });
        setDirty(false);
        setSaved(true);
      }
      await axios.patch(`/api/experiments/${experimentId}/complete`, {
        field: "split_completed",
        value: true,
      });
      setFinalized(true);
    } catch (err) {
      console.error("최종 등록 실패:", err);
      alert(`최종 등록에 실패했습니다: ${err.response?.data?.error || err.message}`);
    }
    setFinalizing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handleAddRow}
          className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
        >
          + 행 추가
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition ${
              saving ? "bg-gray-300 text-gray-500 cursor-wait"
              : dirty ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : saved ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? "저장 중..." : dirty ? "저장" : saved ? "✓ 저장됨" : "저장됨"}
          </button>
          {experimentId && (
            <button
              onClick={handleFinalize}
              disabled={finalizing || finalized}
              className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition ${
                finalized
                  ? "bg-emerald-500 text-white cursor-default"
                  : finalizing
                  ? "bg-gray-300 text-gray-500 cursor-wait"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              }`}
              title="Split Table 작성 완료 처리 — Lot Assign 진행 현황에 반영됩니다"
            >
              {finalized ? "✅ 최종 등록 완료" : finalizing ? "처리 중..." : "최종 등록"}
            </button>
          )}
        </div>
      </div>
      <div style={{ width: "100%", ...(rows.length > 9 && { height: Math.min(rows.length * 36 + 44, 420) }) }}>
        <AgGridReact
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowStyle={getRowStyle}
          headerHeight={36}
          rowHeight={36}
          domLayout={rows.length <= 9 ? "autoHeight" : undefined}
          suppressCellFocus={false}
          stopEditingWhenCellsLoseFocus
          onCellValueChanged={handleCellValueChanged}
        />
      </div>
    </div>
  );
}

export default EditableSplitTable;
