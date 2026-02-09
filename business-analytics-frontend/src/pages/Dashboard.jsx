import { useEffect, useState } from "react";
import { uploadCSV, getDatasets, askQuestion } from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ---------- Small Skeleton Component ---------- */
const Skeleton = ({ height = 20 }) => (
  <div
    className="animate-pulse bg-white/10 rounded-md"
    style={{ height }}
  />
);

function Dashboard() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [file, setFile] = useState(null);

  const [question, setQuestion] = useState("");
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userEmail) navigate("/");
  }, [userEmail, navigate]);

  useEffect(() => {
    if (userEmail) {
      getDatasets(userEmail).then((res) => setDatasets(res.data));
    }
  }, [userEmail]);

  const handleUpload = async () => {
    if (!file) return alert("Select a CSV file");
    const res = await uploadCSV(userEmail, file);
    setDatasets((prev) => [res.data, ...prev]);
    setFile(null);
  };

  const handleAsk = async () => {
    if (!selectedDataset) return alert("Select a dataset first");
    if (!question.trim()) return alert("Enter a question");

    setLoading(true);
    setTableData([]);

    const res = await askQuestion({
      dataset_id: selectedDataset,
      query: question,
    });

    setTableData(Array.isArray(res.data.data) ? res.data.data : []);
    setLoading(false);
  };

  /* ---------- AI INSIGHT ---------- */
  const getInsightText = () => {
    if (loading) return "Analyzing patterns and metrics…";
    if (!tableData.length)
      return "Ask a question to generate insights and visualizations.";

    const columns = Object.keys(tableData[0]);
    const numericCols = columns.filter(
      (c) => typeof tableData[0][c] === "number"
    );

    return `This query returned ${tableData.length} rows and ${
      columns.length
    } columns.
${
  numericCols.length
    ? "Numeric metrics detected — trends and comparisons are visible."
    : "Categorical data detected — grouping and distribution insights are useful."
}`;
  };

  /* ---------- CHART LOGIC ---------- */
  const columns = tableData.length ? Object.keys(tableData[0]) : [];
  const numericColumns = columns.filter(
    (c) => tableData.length && typeof tableData[0][c] === "number"
  );
  const categoryColumns = columns.filter(
    (c) => tableData.length && typeof tableData[0][c] !== "number"
  );

  const canPlot =
    tableData.length && numericColumns.length && categoryColumns.length;

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-gray-200">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0f1325] border-r border-white/10 p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          📊 Analytics AI
        </h2>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="text-sm text-gray-400"
        />

        <button
          onClick={handleUpload}
          className="mt-2 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600
                     py-2 text-white font-semibold transition-all
                     hover:scale-[1.02] active:scale-[0.98]"
        >
          Upload CSV
        </button>

        <h3 className="text-sm text-gray-400 mt-6 mb-2">Your Datasets</h3>
        <select
          className="w-full rounded-lg bg-[#0b0f1a] border border-white/10 p-2"
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value)}
        >
          <option value="">Select dataset</option>
          {datasets.map((ds) => (
            <option key={ds.dataset_id} value={ds.dataset_id}>
              {ds.dataset_name}
            </option>
          ))}
        </select>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8 overflow-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Business Analytics Dashboard
          </h1>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            className="text-sm text-red-400 hover:underline"
          >
            Logout
          </button>
        </div>

        {/* ASK AI */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-2">Ask AI</h3>

          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              selectedDataset
                ? "Ask a business question…"
                : "Select a dataset first"
            }
            disabled={!selectedDataset || loading}
            className="w-full rounded-lg bg-[#0b0f1a] border border-white/10
                       px-4 py-3 mb-4 disabled:opacity-50"
          />

          <button
            onClick={handleAsk}
            disabled={loading || !selectedDataset}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600
                       px-6 py-2 text-white font-semibold
                       disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Ask AI"}
          </button>
        </div>

        {/* AI INSIGHT */}
        <div className="mb-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/10
                        border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-2">🧠 AI Insight</h3>
          <p className="text-gray-300 whitespace-pre-line">
            {getInsightText()}
          </p>
        </div>

        {/* VISUAL INSIGHTS */}
        {loading && (
          <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6">
            <Skeleton height={260} />
          </div>
        )}

        {canPlot && !loading && (
          <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Visual Insights</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tableData}>
                <XAxis dataKey={categoryColumns[0]} stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Bar dataKey={numericColumns[0]} fill="#7c7cff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RESULTS TABLE */}
        {loading && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <Skeleton height={180} />
          </div>
        )}

        {!loading && tableData.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">
              Results ({tableData.length} rows)
            </h3>

            <div className="overflow-auto max-h-[420px] border border-white/10 rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-[#0f1325] sticky top-0">
                  <tr>
                    {Object.keys(tableData[0]).map((col) => (
                      <th key={col} className="px-3 py-2 text-left">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-2">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;