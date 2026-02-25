import { useState, useMemo, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import axios from "axios";
import EpsIssueModal from "./EpsIssueModal";

ModuleRegistry.registerModules([AllCommunityModule]);

// Family A: 파랑 계열 (짝수 oper_id 그룹)
const FAMILY_A = {
  base: { row: "#EFF6FF", cell: "#BFDBFE", text: "#1E3A8A" },
  s1: { row: "#EEF2FF", cell: "#C7D2FE", text: "#1E3A8A" },
  s2: { row: "#F0F2FD", cell: "#D0D8F8", text: "#1E3A8A" },
  s3: { row: "#F1F2FB", cell: "#D8DCF3", text: "#1E3A8A" },
  s4: { row: "#F2F3FA", cell: "#DDDFF0", text: "#1E3A8A" },
  s5: { row: "#F3F3F8", cell: "#E1E2EC", text: "#1E3A8A" },
  s6: { row: "#F3F4F7", cell: "#E3E4E9", text: "#1E3A8A" },
  s7: { row: "#F4F4F6", cell: "#E5E5E6", text: "#1E3A8A" },
  s8: { row: "#F4F4F5", cell: "#E6E6E6", text: "#1E3A8A" },
};
// Family B: 청록 계열 (홀수 oper_id 그룹)
const FAMILY_B = {
  base: { row: "#ECFDF5", cell: "#6EE7B7", text: "#064E3B" },
  s1: { row: "#EDFBF2", cell: "#86E5BE", text: "#064E3B" },
  s2: { row: "#EEF8EF", cell: "#9EDCBE", text: "#064E3B" },
  s3: { row: "#EFF5EE", cell: "#B0D5BA", text: "#064E3B" },
  s4: { row: "#EFF3ED", cell: "#BECEB6", text: "#064E3B" },
  s5: { row: "#F0F2EC", cell: "#C5C9B2", text: "#064E3B" },
  s6: { row: "#F0F2EB", cell: "#C7C8B0", text: "#064E3B" },
  s7: { row: "#F1F2EB", cell: "#C8C8AF", text: "#064E3B" },
  s8: { row: "#F1F1EA", cell: "#C9C9AE", text: "#064E3B" },
};
const DEFAULT_SPLIT = { row: "#F9FAFB", cell: "#F3F4F6", text: "#374151" };

function getRowGroupIdx(api, rowIndex) {
  let groupIdx = 0;
  let prevOperId = null;
  for (let i = 0; i <= rowIndex; i++) {
    const row = api.getDisplayedRowAtIndex(i);
    if (!row) break;
    if (prevOperId !== null && row.data.oper_id !== prevOperId) groupIdx++;
    prevOperId = row.data.oper_id;
  }
  return groupIdx;
}

const getSplitColor = (val, isEvenGroup) => {
  const family = isEvenGroup ? FAMILY_A : FAMILY_B;
  return family[val?.toLowerCase()] || DEFAULT_SPLIT;
};

function UnderConstructionModal({ title, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-[480px] h-[320px]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
          <span className="text-5xl">🚧</span>
          <span className="text-lg font-semibold tracking-wide">공사중</span>
          <span className="text-xs">준비 중인 기능입니다</span>
        </div>
      </div>
    </div>
  );
}

function EditableSplitTable({ splits, planId, experimentId, onSaved }) {
  const [rows, setRows] = useState(() =>
    [...splits].sort((a, b) => {
      if (a.sno == null && b.sno == null) return 0;
      if (a.sno == null) return 1;
      if (b.sno == null) return -1;
      return a.sno - b.sno;
    }),
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [showEpsModal, setShowEpsModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const gridRef = useRef(null);

  const handleDeleteRow = useCallback((rowIndex) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
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
            return {
              color: "#059669",
              fontWeight: "bold",
              textAlign: "center",
            };
          return { textAlign: "center" };
        },
      });
    }
    return cols;
  }, []);

  const columnDefs = useMemo(
    () => [
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
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0",
        },
      },
      {
        headerName: "SNO",
        field: "sno",
        width: 60,
        editable: true,
        cellStyle: { textAlign: "center" },
      },
      { headerName: "FAC", field: "fac_id", width: 65, editable: true },
      { headerName: "OPER_ID", field: "oper_id", width: 110, editable: true },
      { headerName: "OPER_NM", field: "oper_nm", width: 120, editable: true },
      {
        headerName: "Split",
        field: "eps_lot_gbn_cd",
        width: 75,
        editable: true,
        cellStyle: (params) => {
          const groupIdx = getRowGroupIdx(params.api, params.node.rowIndex);
          const c = getSplitColor(params.value, groupIdx % 2 === 0);
          return { backgroundColor: c.cell, color: c.text, fontWeight: "600" };
        },
      },
      {
        headerName: "Note",
        field: "note",
        minWidth: 120,
        flex: 1,
        editable: true,
      },
      {
        headerName: "조건",
        field: "work_cond_desc",
        minWidth: 180,
        flex: 1,
        editable: true,
      },
      { headerName: "장비", field: "eqp_id", width: 90, editable: true },
      { headerName: "Recipe", field: "recipe_id", width: 140, editable: true },
      ...wfCols,
    ],
    [wfCols, handleDeleteRow],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      suppressMovable: true,
    }),
    [],
  );

  const handleCellValueChanged = useCallback((e) => {
    const updated = [];
    e.api.forEachNode((n) => updated.push(n.data));
    setRows(updated);
    setDirty(true);
    setSaved(false);
  }, []);

  const getRowStyle = useCallback((params) => {
    const groupIdx = getRowGroupIdx(params.api, params.rowIndex);
    const prev = params.api.getDisplayedRowAtIndex(params.rowIndex - 1);
    const borderTop =
      prev && prev.data.oper_id !== params.data.oper_id
        ? "2px solid #64748B"
        : undefined;
    const c = getSplitColor(params.data.eps_lot_gbn_cd, groupIdx % 2 === 0);
    return { backgroundColor: c.row, borderTop };
  }, []);

  const handleAddRow = () => {
    const wfEmpty = Object.fromEntries(
      Array.from({ length: 25 }, (_, i) => [`user_def_val_${i + 1}`, null]),
    );
    setRows((prev) => [
      ...prev,
      {
        sno: prev.length + 1,
        plan_id: planId,
        fac_id: "",
        oper_id: "",
        oper_nm: "",
        eps_lot_gbn_cd: "base",
        work_cond_desc: "",
        eqp_id: "",
        recipe_id: "",
        note: "",
        ...wfEmpty,
      },
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
      alert(
        `저장에 실패했습니다: ${err.response?.data?.details || err.message}`,
      );
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
      alert(
        `최종 등록에 실패했습니다: ${err.response?.data?.error || err.message}`,
      );
    }
    setFinalizing(false);
  };

  return (
    <div>
      {showEpsModal && (
        <EpsIssueModal splits={rows} onClose={() => setShowEpsModal(false)} />
      )}
      {showCompareModal && (
        <UnderConstructionModal
          title="EPS/BASE 비교"
          onClose={() => setShowCompareModal(false)}
        />
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRow}
            className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
          >
            + 행 추가
          </button>
          <button
            onClick={() => setShowEpsModal(true)}
            className="text-xs px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg transition font-medium"
          >
            EPS 발행
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCompareModal(true)}
            className="text-xs px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg transition font-medium"
          >
            EPS/BASE 비교
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition ${
              saving
                ? "bg-gray-300 text-gray-500 cursor-wait"
                : dirty
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : saved
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving
              ? "저장 중..."
              : dirty
                ? "저장"
                : saved
                  ? "✓ 저장됨"
                  : "저장됨"}
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
              {finalized
                ? "✅ 최종 등록 완료"
                : finalizing
                  ? "처리 중..."
                  : "최종 등록"}
            </button>
          )}
        </div>
      </div>
      <div
        style={{
          width: "100%",
          ...(rows.length > 9 && {
            height: Math.min(rows.length * 36 + 44, 420),
          }),
        }}
      >
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
