import { useState, useEffect } from "react";
import axios from "axios";
import { AutoComplete, Input } from "antd"; // Ant Design imports
import ProjectCard from "../components/ProjectCard";
import ExperimentCard from "../components/ExperimentCard";
import SplitTable from "../components/SplitTable";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [splits, setSplits] = useState([]);

  // Project search state
  const [projectOptions, setProjectOptions] = useState([]);
  // Experiment search state
  const [experimentOptions, setExperimentOptions] = useState([]);
  const [experimentSearchText, setExperimentSearchText] = useState("");

  useEffect(() => {
    axios
      .get("/api/projects")
      .then((res) => {
        setProjects(res.data);
        // Initialize options for autocomplete
        setProjectOptions(
          res.data.map((p) => ({
            value: p.project_name,
            label: p.project_name,
            project: p,
          })),
        );
      })
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

  const selectProject = async (project) => {
    setSelectedProject(project);
    setSelectedExperiment(null);
    setSplits([]);
    setExperimentSearchText("");
    try {
      const res = await axios.get(
        `/api/experiments?project_name=${encodeURIComponent(project.project_name)}`,
      );
      setExperiments(res.data);
      // Initialize experiment autocomplete options
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
          value: p.project_name,
          label: p.project_name,
          project: p,
        })),
      );
      return;
    }
    const filtered = projects
      .filter((p) => p.project_name.toLowerCase().includes(value.toLowerCase()))
      .map((p) => ({
        value: p.project_name,
        label: p.project_name,
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

  // Filter displayed experiment cards based on search text
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
      {/* 과제 검색 및 목록 */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            과제 목록
            <span className="text-sm text-gray-400 font-normal">
              ({projects.length}건)
            </span>
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
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              selected={selectedProject?.id === p.id}
              onClick={() => selectProject(p)}
            />
          ))}
        </div>
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
                {selectedProject.project_name})
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
            {filteredExperiments.map((e) => (
              <ExperimentCard
                key={e.id}
                experiment={e}
                selected={selectedExperiment?.id === e.id}
                onClick={() => selectExperiment(e)}
              />
            ))}
          </div>
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
    </div>
  );
}

export default Dashboard;
