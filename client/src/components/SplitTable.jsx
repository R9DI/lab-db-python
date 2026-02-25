import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

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
          const c = getSplitColor(params.value);
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
    const prev = params.api.getDisplayedRowAtIndex(params.rowIndex - 1);
    const borderTop =
      prev && prev.data.oper_id !== params.data.oper_id
        ? "2px solid #64748B"
        : undefined;
    const c = getSplitColor(params.data.eps_lot_gbn_cd);
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
