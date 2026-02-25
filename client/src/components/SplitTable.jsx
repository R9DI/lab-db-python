import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

// Family A: 파랑 계열 (짝수 oper_id 그룹)
const FAMILY_A = {
  base: { row: "#EFF6FF", cell: "#BFDBFE", text: "#1E3A8A" },
  s1:   { row: "#EEF2FF", cell: "#C7D2FE", text: "#1E3A8A" },
  s2:   { row: "#F0F2FD", cell: "#D0D8F8", text: "#1E3A8A" },
  s3:   { row: "#F1F2FB", cell: "#D8DCF3", text: "#1E3A8A" },
  s4:   { row: "#F2F3FA", cell: "#DDDFF0", text: "#1E3A8A" },
  s5:   { row: "#F3F3F8", cell: "#E1E2EC", text: "#1E3A8A" },
  s6:   { row: "#F3F4F7", cell: "#E3E4E9", text: "#1E3A8A" },
  s7:   { row: "#F4F4F6", cell: "#E5E5E6", text: "#1E3A8A" },
  s8:   { row: "#F4F4F5", cell: "#E6E6E6", text: "#1E3A8A" },
};
// Family B: 청록 계열 (홀수 oper_id 그룹)
const FAMILY_B = {
  base: { row: "#ECFDF5", cell: "#6EE7B7", text: "#064E3B" },
  s1:   { row: "#EDFBF2", cell: "#86E5BE", text: "#064E3B" },
  s2:   { row: "#EEF8EF", cell: "#9EDCBE", text: "#064E3B" },
  s3:   { row: "#EFF5EE", cell: "#B0D5BA", text: "#064E3B" },
  s4:   { row: "#EFF3ED", cell: "#BECEB6", text: "#064E3B" },
  s5:   { row: "#F0F2EC", cell: "#C5C9B2", text: "#064E3B" },
  s6:   { row: "#F0F2EB", cell: "#C7C8B0", text: "#064E3B" },
  s7:   { row: "#F1F2EB", cell: "#C8C8AF", text: "#064E3B" },
  s8:   { row: "#F1F1EA", cell: "#C9C9AE", text: "#064E3B" },
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

function SplitTable({ splits, maxHeight = 400 }) {
  if (!splits || splits.length === 0) return null;

  // WF 컬럼 1~25 항상 표시ㄹ
  const wfCols = useMemo(() => {
    const cols = [];
    for (let i = 1; i <= 25; i++) {
      const key = `user_def_val_${i}`;
      cols.push({
        headerName: `${i}`,
        field: key,
        width: 55,
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
        headerName: "SNO",
        field: "sno",
        width: 60,
        cellStyle: { textAlign: "center" },
      },
      { headerName: "FAC", field: "fac_id", width: 65 },
      { headerName: "OPER_ID", field: "oper_id", width: 110 },
      { headerName: "OPER_NM", field: "oper_nm", width: 120 },
      {
        headerName: "Split",
        field: "eps_lot_gbn_cd",
        width: 75,
        cellStyle: (params) => {
          const groupIdx = getRowGroupIdx(params.api, params.node.rowIndex);
          const c = getSplitColor(params.value, groupIdx % 2 === 0);
          return { backgroundColor: c.cell, color: c.text, fontWeight: "600" };
        },
      },
      { headerName: "Note", field: "note", minWidth: 120, flex: 1 },
      { headerName: "조건", field: "work_cond_desc", minWidth: 180, flex: 1 },
      { headerName: "장비", field: "eqp_id", width: 90 },
      { headerName: "Recipe", field: "recipe_id", width: 140 },
      ...wfCols,
    ],
    [wfCols],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      suppressMovable: true,
    }),
    [],
  );

  const getRowStyle = (params) => {
    const groupIdx = getRowGroupIdx(params.api, params.rowIndex);
    const prev = params.api.getDisplayedRowAtIndex(params.rowIndex - 1);
    const borderTop =
      prev && prev.data.oper_id !== params.data.oper_id
        ? "2px solid #64748B"
        : undefined;
    const c = getSplitColor(params.data.eps_lot_gbn_cd, groupIdx % 2 === 0);
    return { backgroundColor: c.row, borderTop };
  };

  const sortedSplits = useMemo(() => {
    return [...splits].sort((a, b) => {
      if (a.sno == null && b.sno == null) return 0;
      if (a.sno == null) return 1;
      if (b.sno == null) return -1;
      return a.sno - b.sno;
    });
  }, [splits]);

  return (
    <div
      style={{ width: "100%", height: Math.min(splits.length * 42 + 50, maxHeight) }}
    >
      <AgGridReact
        rowData={sortedSplits}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowStyle={getRowStyle}
        headerHeight={36}
        rowHeight={36}
        domLayout={splits.length * 42 + 50 <= maxHeight ? "autoHeight" : undefined}
        suppressCellFocus={true}
      />
    </div>
  );
}

export default SplitTable;
