import { useState, useEffect } from 'react';
import axios from 'axios';
import { AutoComplete, Input } from 'antd'; // Ant Design imports
import ProjectCard from '../components/ProjectCard';
import ExperimentCard from '../components/ExperimentCard';
import SplitTable from '../components/SplitTable';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [splits, setSplits] = useState([]);
  
  // Search state
  const [options, setOptions] = useState([]);

  useEffect(() => {
    axios.get('/api/projects')
      .then(res => {
        setProjects(res.data);
        // Initialize options for autocomplete
        setOptions(res.data.map(p => ({ value: p.project_name, label: p.project_name, project: p })));
      })
      .catch(err => console.error('Error fetching projects:', err));
  }, []);

  const selectProject = async (project) => {
    setSelectedProject(project);
    setSelectedExperiment(null);
    setSplits([]);
    try {
      const res = await axios.get(`/api/experiments?project_name=${encodeURIComponent(project.project_name)}`);
      setExperiments(res.data);
    } catch (err) {
      console.error('Error fetching experiments:', err);
    }
  };

  const handleSearch = (value) => {
    if (!value) {
      setOptions(projects.map(p => ({ value: p.project_name, label: p.project_name, project: p })));
      return;
    }
    const filtered = projects
      .filter(p => p.project_name.toLowerCase().includes(value.toLowerCase()))
      .map(p => ({ value: p.project_name, label: p.project_name, project: p }));
    setOptions(filtered);
  };

  const onSelect = (value, option) => {
    selectProject(option.project);
  };

  const selectExperiment = async (experiment) => {
    setSelectedExperiment(experiment);
    try {
      const res = await axios.get(`/api/splits?plan_id=${encodeURIComponent(experiment.plan_id)}`);
      setSplits(res.data);
    } catch (err) {
      console.error('Error fetching splits:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 과제 검색 및 목록 */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            과제 목록
            <span className="text-sm text-gray-400 font-normal">({projects.length}건)</span>
          </h2>
          <div className="w-64">
            <AutoComplete
              options={options}
              style={{ width: '250px' }}
              onSelect={onSelect}
              onSearch={handleSearch}
              placeholder="과제명 검색..."
              allowClear
            />
          </div>
        </div>
        
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
