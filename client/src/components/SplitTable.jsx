import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

function SplitTable({ splits }) {
  if (!splits || splits.length === 0) return null;

  // 데이터가 있는 WF 컬럼만 표시
  const wfCols = useMemo(() => {
    const cols = [];
    for (let i = 1; i <= 15; i++) {
      const key = `user_def_val_${i}`;
      const hasData = splits.some((s) => s[key] && s[key].trim());
      if (hasData) {
        cols.push({
          headerName: `WF${i}`,
          field: key,
          width: 55,
          cellStyle: (params) => {
            if (params.value === "O")
              return {
                color: "#059669",
                fontWeight: "bold",
                textAlign: "center",
              };
            return { textAlign: "center" };
          },
        });
      }
    }
    return cols;
  }, [splits]);

  const columnDefs = useMemo(
    () => [
      { headerName: "FAC", field: "fac_id", width: 65 },
      { headerName: "OPER_ID", field: "oper_id", width: 110 },
      { headerName: "OPER_NM", field: "oper_nm", width: 120 },
      {
        headerName: "Split",
        field: "eps_lot_gbn_cd",
        width: 75,
        cellStyle: (params) => {
          if (params.value === "base")
            return {
              backgroundColor: "#DBEAFE",
              color: "#1E40AF",
              fontWeight: "600",
            };
          return {
            backgroundColor: "#FEF3C7",
            color: "#92400E",
            fontWeight: "600",
          };
        },
      },
      { headerName: "조건", field: "work_cond_desc", minWidth: 180, flex: 1 },
      { headerName: "장비", field: "eqp_id", width: 90 },
      { headerName: "Recipe", field: "recipe_id", width: 140 },
      ...wfCols,
      { headerName: "Note", field: "note", minWidth: 120, flex: 1 },
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
    if (params.data.eps_lot_gbn_cd === "base") {
      return { backgroundColor: "#EFF6FF" };
    }
    return { backgroundColor: "#FFFBEB" };
  };

  return (
    <div
      style={{ width: "100%", height: Math.min(splits.length * 42 + 50, 400) }}
    >
      <AgGridReact
        rowData={splits}
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
