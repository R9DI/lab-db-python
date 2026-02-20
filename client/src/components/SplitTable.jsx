import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

const SPLIT_COLORS = {
  base: { row: "#EFF6FF", cell: "#DBEAFE", text: "#1E40AF" },
  s1:   { row: "#FFFBEB", cell: "#FEF3C7", text: "#92400E" },
  s2:   { row: "#F0FDF4", cell: "#D1FAE5", text: "#065F46" },
  s3:   { row: "#F5F3FF", cell: "#EDE9FE", text: "#5B21B6" },
  s4:   { row: "#FFF1F2", cell: "#FFE4E6", text: "#9F1239" },
};
const DEFAULT_SPLIT = { row: "#F9FAFB", cell: "#F3F4F6", text: "#374151" };

const getSplitColor = (val) => SPLIT_COLORS[val] || DEFAULT_SPLIT;

function SplitTable({ splits }) {
  if (!splits || splits.length === 0) return null;

  // 데이터가 있는 WF 컬럼만 표시
  const wfCols = useMemo(() => {
    const cols = [];
    for (let i = 1; i <= 25; i++) {
      const key = `user_def_val_${i}`;
      const hasData = splits.some((s) => s[key] && s[key].trim());
      if (hasData) {
        cols.push({
          headerName: `${i}`,
          field: key,
          width: 55,
          cellStyle: (params) => {
            if (params.value === "O")
              return { color: "#059669", fontWeight: "bold", textAlign: "center" };
            return { textAlign: "center" };
          },
        });
      }
    }
    return cols;
  }, [splits]);

  const columnDefs = useMemo(
    () => [
      { headerName: "SNO", field: "sno", width: 60, cellStyle: { textAlign: "center" } },
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
      style={{ width: "100%", height: Math.min(splits.length * 42 + 50, 400) }}
    >
      <AgGridReact
        rowData={sortedSplits}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowStyle={getRowStyle}
        headerHeight={36}
        rowHeight={36}
        domLayout={splits.length <= 8 ? "autoHeight" : undefined}
        suppressCellFocus={true}
      />
    </div>
  );
}

export default SplitTable;
