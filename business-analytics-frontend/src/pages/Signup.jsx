import { useState } from "react";
import { signup } from "../services/api";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await signup({ email, password });
      alert("Signup successful. Please login.");
      navigate("/");
    } catch (err) {
      alert("User already exists or error occurred");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Signup Page</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}

export default Signup;
