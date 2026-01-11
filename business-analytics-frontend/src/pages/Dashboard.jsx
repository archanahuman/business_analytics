import { useEffect, useState } from "react";
import { uploadCSV, getDatasets, askQuestion } from "../services/api";
import { useNavigate } from "react-router-dom";

// 🔹 Recharts imports
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

// 🔹 Colors for Pie chart
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
  const [chart, setChart] = useState(null);

  // 🔹 Redirect if user refreshes without login
  useEffect(() => {
    if (!userEmail) {
      navigate("/");
    }
  }, [userEmail, navigate]);

  // 🔹 Load old datasets
  useEffect(() => {
    if (userEmail) {
      getDatasets(userEmail).then(res => {
        setDatasets(res.data);
      });
    }
  }, [userEmail]);

  // 🔹 Upload CSV
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    const res = await uploadCSV(userEmail, file);
    alert("CSV uploaded successfully");

    setDatasets(prev => [res.data, ...prev]);
  };

  // 🔹 Ask question
  const handleAsk = async () => {
    if (!selectedDataset) {
      alert("Please select a dataset");
      return;
    }
    if (!question) {
      alert("Please enter a question");
      return;
    }

    const res = await askQuestion({
      dataset_id: selectedDataset,
      query: question
    });

    setAnswer(res.data.answer_text);
    setTableData(res.data.data);
    setChart(res.data.chart);
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
            {ds.dataset_id} ({ds.rows} rows)
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

      {/* Table */}
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

      {/* 🔹 ACTUAL CHART RENDERING */}
      {chart && tableData.length > 0 && (
        <>
          <h3>Visualization</h3>

          {/* BAR CHART */}
          {chart.type === "bar" && (
            <BarChart width={500} height={300} data={tableData}>
              <XAxis dataKey={chart.x} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={chart.y} fill="#8884d8" />
            </BarChart>
          )}

          {/* PIE CHART */}
          {chart.type === "pie" && (
            <PieChart width={400} height={300}>
              <Pie
                data={tableData}
                dataKey={chart.y}
                nameKey={chart.x}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {tableData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
