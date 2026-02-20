import { useState, useEffect } from "react";
import axios from "axios";
import { AutoComplete } from "antd";
import ProjectCard from "../components/ProjectCard";
import ExperimentCard from "../components/ExperimentCard";
import SplitTable from "../components/SplitTable";
import SchemaOverview from "../components/SchemaOverview";

const EMPTY_PROJECT_FORM = {
  iacpj_nm: "",
  iacpj_mod_n: "",
  iacpj_ch_n: "",
  iacpj_itf_uno: "",
  iacpj_tgt_n: "",
  iacpj_level: "",
  iacpj_tech_n: "",
  ia_ta_grd_n: "",
  project_purpose: "",
  iacpj_ta_goa: "",
};

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [splits, setSplits] = useState([]);

  // Add project modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState(EMPTY_PROJECT_FORM);

  // 더보기 제한
  const [projectLimit, setProjectLimit] = useState(4);
  const [experimentLimit, setExperimentLimit] = useState(4);

  // Project search state
  const [projectOptions, setProjectOptions] = useState([]);
  // Experiment search state
  const [experimentOptions, setExperimentOptions] = useState([]);
  const [experimentSearchText, setExperimentSearchText] = useState("");

  const fetchProjects = () => {
    axios
      .get("/api/projects")
      .then((res) => {
        setProjects(res.data);
        setProjectOptions(
          res.data.map((p) => ({
            value: p.iacpj_nm,
            label: p.iacpj_nm,
            project: p,
          })),
        );
      })
      .catch((err) => console.error("Error fetching projects:", err));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 과제 추가
  const addProject = async () => {
    if (!newProject.iacpj_nm.trim()) {
      alert("과제명은 필수입니다.");
      return;
    }
    try {
      await axios.post("/api/projects", newProject);
      setShowAddModal(false);
      setNewProject(EMPTY_PROJECT_FORM);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || "과제 추가 실패");
    }
  };

  // 과제 삭제
  const deleteProject = async (project) => {
    try {
      await axios.delete(`/api/projects/${project.id}`);
      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
        setExperiments([]);
        setSelectedExperiment(null);
        setSplits([]);
      }
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || "과제 삭제 실패");
    }
  };

  const selectProject = async (project) => {
    setSelectedProject(project);
    setSelectedExperiment(null);
    setSplits([]);
    setExperimentSearchText("");
    setExperimentLimit(4);
    try {
      const res = await axios.get(
        `/api/experiments?iacpj_nm=${encodeURIComponent(project.iacpj_nm)}`,
      );
      setExperiments(res.data);
      setExperimentOptions(
        res.data.map((e) => ({
          value: e.eval_item,
          label: `${e.eval_item} (${e.plan_id})`,
          experiment: e,
        })),
      );
    } catch (err) {
      console.error("Error fetching experiments:", err);
    }
  };

  const handleProjectSearch = (value) => {
    if (!value) {
      setProjectOptions(
        projects.map((p) => ({
          value: p.iacpj_nm,
          label: p.iacpj_nm,
          project: p,
        })),
      );
      return;
    }
    const filtered = projects
      .filter((p) => p.iacpj_nm.toLowerCase().includes(value.toLowerCase()))
      .map((p) => ({
        value: p.iacpj_nm,
        label: p.iacpj_nm,
        project: p,
      }));
    setProjectOptions(filtered);
  };

  const handleExperimentSearch = (value) => {
    setExperimentSearchText(value);
    if (!value) {
      setExperimentOptions(
        experiments.map((e) => ({
          value: e.eval_item,
          label: `${e.eval_item} (${e.plan_id})`,
          experiment: e,
        })),
      );
      return;
    }
    const lowerValue = value.toLowerCase();
    const filtered = experiments
      .filter(
        (e) =>
          e.eval_item?.toLowerCase().includes(lowerValue) ||
          e.plan_id?.toLowerCase().includes(lowerValue) ||
          e.eval_process?.toLowerCase().includes(lowerValue),
      )
      .map((e) => ({
        value: e.eval_item,
        label: `${e.eval_item} (${e.plan_id})`,
        experiment: e,
      }));
    setExperimentOptions(filtered);
  };

  const onProjectSelect = (value, option) => {
    selectProject(option.project);
  };

  const onExperimentSelect = (value, option) => {
    selectExperiment(option.experiment);
    setExperimentSearchText("");
  };

  const selectExperiment = async (experiment) => {
    setSelectedExperiment(experiment);
    try {
      const res = await axios.get(
        `/api/splits?plan_id=${encodeURIComponent(experiment.plan_id)}`,
      );
      setSplits(res.data);
    } catch (err) {
      console.error("Error fetching splits:", err);
    }
  };

  const filteredExperiments = experimentSearchText
    ? experiments.filter((e) => {
        const lowerSearch = experimentSearchText.toLowerCase();
        return (
          e.eval_item?.toLowerCase().includes(lowerSearch) ||
          e.plan_id?.toLowerCase().includes(lowerSearch) ||
          e.eval_process?.toLowerCase().includes(lowerSearch)
        );
      })
    : experiments;

  return (
    <div className="space-y-6">
      {/* 데이터 구조 다이어그램 */}
      <SchemaOverview />

      {/* 과제 검색 및 목록 */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            과제 목록
            <span className="text-sm text-gray-400 font-normal">
              ({projects.length}건)
            </span>
            <button
              onClick={() => setShowAddModal(true)}
              className="ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition text-sm font-bold"
              title="과제 추가"
            >
              +
            </button>
          </h2>
          <div className="w-64">
            <AutoComplete
              options={projectOptions}
              style={{ width: "250px" }}
              onSelect={onProjectSelect}
              onSearch={handleProjectSearch}
              placeholder="과제명 검색..."
              allowClear
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.slice(0, projectLimit).map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              selected={selectedProject?.id === p.id}
              onClick={() => selectProject(p)}
              onDelete={deleteProject}
            />
          ))}
        </div>
        {projects.length > projectLimit && (
          <button
            onClick={() => setProjectLimit((prev) => prev + 10)}
            className="mt-3 w-full py-2 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-lg transition"
          >
            10개 더보기 ({projects.length - projectLimit}건 남음)
          </button>
        )}
      </section>

      {/* 실험 목록 */}
      {selectedProject && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              실험 목록
              <span className="text-sm text-gray-400 font-normal">
                ({filteredExperiments.length}/{experiments.length}건 |{" "}
                {selectedProject.iacpj_nm})
              </span>
            </h2>
            <div className="w-72">
              <AutoComplete
                options={experimentOptions}
                style={{ width: "100%" }}
                onSelect={onExperimentSelect}
                onSearch={handleExperimentSearch}
                placeholder="실험명, plan_id, 평가공정으로 검색..."
                allowClear
                onClear={() => setExperimentSearchText("")}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredExperiments.slice(0, experimentLimit).map((e) => (
              <ExperimentCard
                key={e.id}
                experiment={e}
                selected={selectedExperiment?.id === e.id}
                onClick={() => selectExperiment(e)}
              />
            ))}
          </div>
          {filteredExperiments.length > experimentLimit && (
            <button
              onClick={() => setExperimentLimit((prev) => prev + 10)}
              className="mt-3 w-full py-2 text-sm text-emerald-600 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-400 rounded-lg transition"
            >
              10개 더보기 ({filteredExperiments.length - experimentLimit}건 남음)
            </button>
          )}
        </section>
      )}

      {/* Split Table */}
      {selectedExperiment && splits.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Split Table
            <span className="text-sm text-gray-400 font-normal">
              (plan_id: {selectedExperiment.plan_id})
            </span>
          </h2>
          <SplitTable splits={splits} />
        </section>
      )}
      {/* 과제 추가 모달 */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">새 과제 추가</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[
                { key: "iacpj_nm", label: "과제명 *", placeholder: "과제명 입력 (필수)" },
                { key: "iacpj_mod_n", label: "모듈", placeholder: "Cell, Peri 등" },
                { key: "iacpj_ch_n", label: "PM", placeholder: "담당자 이름" },
                { key: "iacpj_itf_uno", label: "과제 코드", placeholder: "PRJ-2025-001" },
                { key: "iacpj_tgt_n", label: "개발 분류", placeholder: "DRAM, NAND 등" },
                { key: "iacpj_level", label: "검증 레벨", placeholder: "Lv1, Lv2 등" },
                { key: "iacpj_tech_n", label: "1차 대상 기술", placeholder: "1a DRAM 등" },
                { key: "ia_ta_grd_n", label: "과제 등급", placeholder: "S, A, B 등" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={newProject[key]}
                    onChange={(e) =>
                      setNewProject({ ...newProject, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  과제 목적
                </label>
                <textarea
                  value={newProject.project_purpose}
                  onChange={(e) =>
                    setNewProject({ ...newProject, project_purpose: e.target.value })
                  }
                  placeholder="과제의 주요 목적을 입력하세요"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  과제 목표
                </label>
                <textarea
                  value={newProject.iacpj_ta_goa}
                  onChange={(e) =>
                    setNewProject({ ...newProject, iacpj_ta_goa: e.target.value })
                  }
                  placeholder="달성 목표를 입력하세요"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                취소
              </button>
              <button
                onClick={addProject}
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition font-medium"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
