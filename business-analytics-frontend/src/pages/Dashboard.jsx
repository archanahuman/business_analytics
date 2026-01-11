import { useEffect, useState, useRef } from "react";
import { uploadCSV, getDatasets, askQuestion } from "../services/api";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";

// Recharts
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
  LineChart, Line
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

function Dashboard() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [file, setFile] = useState(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tableData, setTableData] = useState([]);

  const [chartMeta, setChartMeta] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState("");

  const chartRef = useRef(null);

  // 🔐 Redirect if not logged in
  useEffect(() => {
    if (!userEmail) {
      navigate("/");
    }
  }, [userEmail, navigate]);

  // 📂 Load existing datasets
  useEffect(() => {
    if (userEmail) {
      getDatasets(userEmail).then(res => {
        setDatasets(res.data);
      });
    }
  }, [userEmail]);

  // ⬆️ Upload CSV
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    const res = await uploadCSV(userEmail, file);
    alert("CSV uploaded successfully");
    setDatasets(prev => [res.data, ...prev]);
  };

  // ❓ Ask question
  const handleAsk = async () => {
    if (!selectedDataset || !question) {
      alert("Select dataset and enter a question");
      return;
    }

    const res = await askQuestion({
      dataset_id: selectedDataset,
      query: question
    });

    setAnswer(res.data.answer_text);
    setTableData(res.data.data);
    setChartMeta(res.data.chart);
    setSelectedChartType("");
  };

  // 💾 Download chart
  const downloadChart = async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement("a");
    link.download = "chart.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>📊 Business Analytics Dashboard</h2>
      <p><b>Logged in as:</b> {userEmail}</p>

      <hr />

      {/* Upload CSV */}
      <h3>Upload CSV</h3>
      <input
        type="file"
        accept=".csv"
        onChange={e => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload</button>

      <hr />

      {/* Dataset Selection */}
      <h3>Your Datasets</h3>
      <select onChange={e => setSelectedDataset(e.target.value)}>
        <option value="">-- Select Dataset --</option>
        {datasets.map(ds => (
          <option key={ds.dataset_id} value={ds.dataset_id}>
            {ds.dataset_name} ({ds.rows} rows)
          </option>
        ))}
      </select>

      <hr />

      {/* Ask Question */}
      <h3>Ask a Question</h3>
      <input
        style={{ width: "400px" }}
        placeholder="Ask in natural language"
        value={question}
        onChange={e => setQuestion(e.target.value)}
      />
      <button onClick={handleAsk}>Ask</button>

      <hr />

      {/* Answer */}
      {answer && (
        <>
          <h3>Answer</h3>
          <p>{answer}</p>
        </>
      )}

      {/* Result Table */}
      {tableData.length > 0 && (
        <>
          <h3>Result Table</h3>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                {Object.keys(tableData[0]).map(col => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Chart Selection */}
      {chartMeta && tableData.length > 0 && (
        <>
          <h3>Select Visualization</h3>
          <select
            value={selectedChartType}
            onChange={e => setSelectedChartType(e.target.value)}
          >
            <option value="">-- Select Chart --</option>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="line">Line Chart</option>
          </select>
        </>
      )}

      {/* Chart Rendering */}
      {selectedChartType && chartMeta && (
        <>
          <h3>Visualization</h3>

          <div ref={chartRef} style={{ background: "#fff", padding: "10px" }}>
            {/* Bar */}
            {selectedChartType === "bar" && (
              <BarChart width={800} height={350} data={tableData}>
                <XAxis
                  dataKey={chartMeta.x}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey={chartMeta.y} fill="#4f46e5" />
              </BarChart>
            )}

            {/* Pie */}
            {selectedChartType === "pie" && (
              <PieChart width={500} height={350}>
                <Pie
                  data={tableData}
                  dataKey={chartMeta.y}
                  nameKey={chartMeta.x}
                  outerRadius={120}
                >
                  {tableData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            )}

            {/* Line */}
            {selectedChartType === "line" && (
              <LineChart width={800} height={350} data={tableData}>
                <XAxis
                  dataKey={chartMeta.x}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey={chartMeta.y}
                  stroke="#16a34a"
                  strokeWidth={2}
                />
              </LineChart>
            )}
          </div>

          <button onClick={downloadChart} style={{ marginTop: "10px" }}>
            Download Chart
          </button>
        </>
      )}
    </div>
  );
}

export default Dashboard;
