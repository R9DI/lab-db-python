import { useState, useMemo, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

/* ── 색상 유틸 (EditableSplitTable 과 동일) ── */
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

/* ── 탭 정의 ── */
const EPS_TABS = [
  { key: "split", label: "① Split Table" },
  { key: "eps", label: "② EPS만들기" },
  { key: "cover", label: "③ 표지정보" },
  { key: "write", label: "④ 작성" },
  { key: "inspect", label: "⑤ 검사" },
];

/* ── WF 컬럼 공통 생성 ── */
function buildWfCols(editable = false) {
  return Array.from({ length: 25 }, (_, i) => ({
    headerName: `${i + 1}`,
    field: `user_def_val_${i + 1}`,
    width: 55,
    editable,
    cellStyle: (params) =>
      params.value != null && params.value !== ""
        ? { color: "#059669", fontWeight: "bold", textAlign: "center" }
        : { textAlign: "center" },
  }));
}

/* ── Tab1: Split 선택 ── */
function Tab1SplitSelect({ rows, checkedIds, onToggleGroup, onNext }) {
  const gridRef = useRef(null);

  // oper_id 별 그룹 인덱스 계산 (색상용)
  const operGroupMap = useMemo(() => {
    const map = {};
    let idx = 0;
    let prev = null;
    rows.forEach((r) => {
      if (r.oper_id !== prev) {
        idx++;
        prev = r.oper_id;
      }
      map[r._rowKey] = idx;
    });
    return map;
  }, [rows]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "",
        field: "_check",
        width: 46,
        pinned: "left",
        sortable: false,
        resizable: false,
        suppressMovable: true,
        cellRenderer: (params) => {
          const checked = checkedIds.has(params.data._rowKey);
          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleGroup(params.data.oper_id)}
                style={{
                  width: 15,
                  height: 15,
                  cursor: "pointer",
                  accentColor: "#6366F1",
                }}
              />
            </div>
          );
        },
        cellStyle: { padding: 0 },
      },
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
          const gIdx = operGroupMap[params.data._rowKey] ?? 0;
          const c = getSplitColor(params.value, gIdx % 2 === 0);
          return { backgroundColor: c.cell, color: c.text, fontWeight: "600" };
        },
      },
      { headerName: "Note", field: "note", minWidth: 120, flex: 1 },
      { headerName: "조건", field: "work_cond_desc", minWidth: 180, flex: 1 },
      { headerName: "장비", field: "eqp_id", width: 90 },
      { headerName: "Recipe", field: "recipe_id", width: 140 },
      ...buildWfCols(false),
    ],
    [checkedIds, onToggleGroup, operGroupMap],
  );

  const getRowStyle = useCallback(
    (params) => {
      const gIdx = operGroupMap[params.data._rowKey] ?? 0;
      const prev = params.api.getDisplayedRowAtIndex(params.rowIndex - 1);
      const borderTop =
        prev && prev.data.oper_id !== params.data.oper_id
          ? "2px solid #64748B"
          : undefined;
      const c = getSplitColor(params.data.eps_lot_gbn_cd, gIdx % 2 === 0);
      return {
        backgroundColor: checkedIds.has(params.data._rowKey)
          ? "#EEF2FF"
          : c.row,
        borderTop,
      };
    },
    [checkedIds, operGroupMap],
  );

  const selectedCount = checkedIds.size;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          className="ag-theme-alpine"
          style={{ height: "100%", width: "100%" }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: false,
              suppressMovable: true,
            }}
            getRowStyle={getRowStyle}
            headerHeight={36}
            rowHeight={36}
            suppressCellFocus
          />
        </div>
      </div>
      {/* 하단 액션 바 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderTop: "1px solid #E5E7EB",
          background: "#FAFAFA",
        }}
      >
        <span style={{ fontSize: 12, color: "#6B7280" }}>
          {selectedCount > 0
            ? `${selectedCount}행 선택됨`
            : "행을 체크하여 EPS에 포함할 Step을 선택하세요"}
        </span>
        <button
          onClick={onNext}
          disabled={selectedCount === 0}
          style={{
            padding: "7px 20px",
            borderRadius: 8,
            border: "none",
            background: selectedCount > 0 ? "#6366F1" : "#E5E7EB",
            color: selectedCount > 0 ? "#fff" : "#9CA3AF",
            fontWeight: 600,
            fontSize: 13,
            cursor: selectedCount > 0 ? "pointer" : "not-allowed",
            transition: "background 0.15s",
          }}
        >
          EPS만들기 →
        </button>
      </div>
    </div>
  );
}

/* ── Tab2: EPS만들기 ── */
function Tab2EpsGrid({ selectedRows, onNext }) {
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
          const c = getSplitColor(params.value, true);
          return { backgroundColor: c.cell, color: c.text, fontWeight: "600" };
        },
      },
      { headerName: "Note", field: "note", minWidth: 120, flex: 1 },
      { headerName: "조건", field: "work_cond_desc", minWidth: 180, flex: 1 },
      { headerName: "장비", field: "eqp_id", width: 90 },
      { headerName: "Recipe", field: "recipe_id", width: 140 },
      ...buildWfCols(false),
    ],
    [],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 안내 */}
      <div
        style={{
          padding: "10px 20px 0",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            background: "#EEF2FF",
            color: "#4F46E5",
            borderRadius: 6,
            padding: "3px 10px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {selectedRows.length}개 Step 선택됨
        </span>
        <span style={{ color: "#9CA3AF", fontSize: 12 }}>
          EPS에 포함될 공정 목록입니다
        </span>
      </div>

      <div style={{ flex: 1, overflow: "hidden", padding: "10px 0 0" }}>
        <div
          className="ag-theme-alpine"
          style={{ height: "100%", width: "100%" }}
        >
          <AgGridReact
            rowData={selectedRows}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: false,
              suppressMovable: true,
            }}
            headerHeight={36}
            rowHeight={36}
            suppressCellFocus
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "12px 20px",
          borderTop: "1px solid #E5E7EB",
          background: "#FAFAFA",
        }}
      >
        <button
          onClick={onNext}
          style={{
            padding: "7px 20px",
            borderRadius: 8,
            border: "none",
            background: "#6366F1",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

/* ── Tab3~5: 빈 탭 ── */
function EmptyTab({ label, onNext, isLast }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 48 }}>🚧</span>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#9CA3AF" }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: "#D1D5DB" }}>
          준비 중인 기능입니다
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "12px 20px",
          borderTop: "1px solid #E5E7EB",
          background: "#FAFAFA",
        }}
      >
        {!isLast && (
          <button
            onClick={onNext}
            style={{
              padding: "7px 20px",
              borderRadius: 8,
              border: "none",
              background: "#6366F1",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            다음 →
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 메인 모달 ── */
function EpsIssueModal({ splits, onClose }) {
  const [activeTab, setActiveTab] = useState("split");
  const [checkedIds, setCheckedIds] = useState(new Set());

  // splits 정렬 + rowKey 부여
  const rows = useMemo(() => {
    const sorted = [...splits].sort((a, b) => {
      if (a.sno == null && b.sno == null) return 0;
      if (a.sno == null) return 1;
      if (b.sno == null) return -1;
      return a.sno - b.sno;
    });
    return sorted.map((r, i) => ({ ...r, _rowKey: `row_${i}` }));
  }, [splits]);

  // oper_id 별 rowKey 그룹 맵
  const operIdGroupMap = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      if (!map[r.oper_id]) map[r.oper_id] = [];
      map[r.oper_id].push(r._rowKey);
    });
    return map;
  }, [rows]);

  // 그룹 단위 체크 토글
  const handleToggleGroup = useCallback(
    (operId) => {
      const groupKeys = operIdGroupMap[operId] || [];
      setCheckedIds((prev) => {
        const next = new Set(prev);
        const allChecked = groupKeys.every((k) => prev.has(k));
        if (allChecked) {
          groupKeys.forEach((k) => next.delete(k));
        } else {
          groupKeys.forEach((k) => next.add(k));
        }
        return next;
      });
    },
    [operIdGroupMap],
  );

  const selectedRows = useMemo(
    () => rows.filter((r) => checkedIds.has(r._rowKey)),
    [rows, checkedIds],
  );

  const goNext = (current) => {
    const idx = EPS_TABS.findIndex((t) => t.key === current);
    if (idx < EPS_TABS.length - 1) setActiveTab(EPS_TABS[idx + 1].key);
  };

  return (
    /* 오버레이 */
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
      }}
    >
      {/* 모달 패널 */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          width: "min(1200px, 96vw)",
          height: "min(800px, 92vh)",
          overflow: "hidden",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid #E5E7EB",
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📄</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
              EPS 발행
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              width: 30,
              height: 30,
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* 탭 바 */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #E5E7EB",
            background: "#F9FAFB",
          }}
        >
          {EPS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? "#6366F1" : "#6B7280",
                borderBottom:
                  activeTab === tab.key
                    ? "2px solid #6366F1"
                    : "2px solid transparent",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === tab.key
                    ? "2px solid #6366F1"
                    : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {activeTab === "split" && (
            <Tab1SplitSelect
              rows={rows}
              checkedIds={checkedIds}
              onToggleGroup={handleToggleGroup}
              onNext={() => goNext("split")}
            />
          )}
          {activeTab === "eps" && (
            <Tab2EpsGrid
              selectedRows={selectedRows}
              onNext={() => goNext("eps")}
            />
          )}
          {activeTab === "cover" && (
            <EmptyTab label="표지정보" onNext={() => goNext("cover")} />
          )}
          {activeTab === "write" && (
            <EmptyTab label="작성" onNext={() => goNext("write")} />
          )}
          {activeTab === "inspect" && <EmptyTab label="검사" isLast />}
        </div>
      </div>
    </div>
  );
}

export default EpsIssueModal;
