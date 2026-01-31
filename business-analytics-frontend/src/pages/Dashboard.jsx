import { useEffect, useState } from "react";
import { uploadCSV, getDatasets, askQuestion } from "../services/api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [file, setFile] = useState(null);

  const [question, setQuestion] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (!userEmail) navigate("/");
  }, [userEmail, navigate]);

  useEffect(() => {
    if (userEmail) {
      getDatasets(userEmail).then(res => setDatasets(res.data));
    }
  }, [userEmail]);

  const handleUpload = async () => {
    if (!file) return alert("Select CSV file");
    const res = await uploadCSV(userEmail, file);
    setDatasets(prev => [res.data, ...prev]);
  };

  const handleAsk = async () => {
    setGeneratedSQL("");
    setTableData([]);

    const res = await askQuestion({
      dataset_id: selectedDataset,
      query: question
    });

    setGeneratedSQL(res.data.generated_sql);
    setTableData(res.data.data || []);
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>📊 Business Analytics Dashboard</h2>

      <h3>Upload CSV</h3>
      <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>

      <hr />

      <h3>Your Datasets</h3>
      <select onChange={e => setSelectedDataset(e.target.value)}>
        <option value="">-- Select Dataset --</option>
        {datasets.map(ds => (
          <option key={ds.dataset_id} value={ds.dataset_id}>
            {ds.dataset_name}
          </option>
        ))}
      </select>

      <hr />

      <h3>Ask Question</h3>
      <input
        style={{ width: "420px" }}
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Ask in natural language"
      />
      <button onClick={handleAsk}>Ask</button>

      <hr />

      {generatedSQL && (
        <>
          <h3>Generated SQL</h3>
          <pre style={{
            background: "#111",
            color: "#00ff9c",
            padding: "12px",
            borderRadius: "6px"
          }}>
            {generatedSQL}
          </pre>
        </>
      )}

      {Array.isArray(tableData) &&
        tableData.length > 0 &&
        typeof tableData[0] === "object" && (
        <>
          <h3>Results</h3>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                {Object.keys(tableData[0]).map(col => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData
                .filter(row => typeof row === "object")
                .map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j}>{v}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}

      {generatedSQL && tableData.length === 0 && (
        <p>No results found for this query.</p>
      )}

      {tableData.length === 200 && (
        <p>⚠ Showing first 200 rows only</p>
      )}
    </div>
  );
}

export default Dashboard;
