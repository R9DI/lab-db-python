import { useState, useEffect } from 'react';
import ProjectCard from '../components/ProjectCard';
import ExperimentCard from '../components/ExperimentCard';
import SplitTable from '../components/SplitTable';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [splits, setSplits] = useState([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(setProjects);
  }, []);

  const selectProject = async (project) => {
    setSelectedProject(project);
    setSelectedExperiment(null);
    setSplits([]);
    const res = await fetch(`/api/experiments?project_name=${encodeURIComponent(project.project_name)}`);
    setExperiments(await res.json());
  };

  const selectExperiment = async (experiment) => {
    setSelectedExperiment(experiment);
    const res = await fetch(`/api/splits?plan_id=${encodeURIComponent(experiment.plan_id)}`);
    setSplits(await res.json());
  };

  return (
    <div className="space-y-6">
      {/* 과제 목록 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          과제 목록
          <span className="text-sm text-gray-400 font-normal">({projects.length}건)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map(p => (
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
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            실험 목록
            <span className="text-sm text-gray-400 font-normal">
              ({experiments.length}건 | {selectedProject.project_name})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {experiments.map(e => (
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
