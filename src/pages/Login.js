import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function LoginPage() {
  // State variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Password validation function
  const validatePassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      setPasswordError(
        "❌ Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character."
      );
      return;
    }

    setPasswordError(""); // Clear error if valid

    // Display success toast notification
    toast.success("🦄 Login successful!", {
      position: "top-center",
      autoClose: 1000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

    // Simulate login process
    setTimeout(() => {
      localStorage.setItem("isAuthenticated", "true"); // Store login state
      navigate("/dashboard");
    }, 1000); // Delay navigation to allow the toast to be visible
  };

  // Password visibility toggle handler
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Navigate to forgot password page
  const handleForgetPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Login</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input password-input"
            />
            <span
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {passwordError && <p className="error-text">{passwordError}</p>}
        </div>
        <button type="submit" className="submit-btn">
          Log in
        </button>
      </form>
      <button onClick={handleForgetPassword} className="forgot-password-btn">
        Forget Password
      </button>
      <p className="signup-link">
        Don't have an account? <Link to="/register">Sign-Up</Link>
      </p>
      {/* ToastContainer renders toast notifications */}
      <ToastContainer />
    </div>
  );
}
