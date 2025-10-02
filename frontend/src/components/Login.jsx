import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const url = import.meta.env.VITE_API_BACKEND_URL + "/v2";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async(e) => {
    e.preventDefault();
    const res=await axios.post(url+"/user-logIn",formData,{withCredentials:true});
    if(res.data) navigate("/control");
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
        <p className="back-link" onClick={() => navigate("/")}>
          ← Back to Home
        </p>
      </form>
    </div>
  );
};

export default Login;
