import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../utils/supabase'; // Import Supabase client

export default function LoginPage() {
  // State variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
    minLength: false,
  });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false); // State for password input focus
  const navigate = useNavigate();

  // Password validation function
  const validatePassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    // Update password validation checks
    setPasswordChecks({
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /\d/.test(value),
      specialChar: /[@$!%*?&]/.test(value),
      minLength: value.length >= 8,
    });
  };

  // Handle email input change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      setPasswordError(
        "❌ Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character."
      );
      return;
    }

    setPasswordError(""); // Clear error if valid

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("Logged in user:", data.user);

      // Fetch user profile data from the `users` table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, role, profile_picture')
        .eq('id', data.user.id)
        .single();

      console.log("Fetched user data:", userData);

      // If user data does not exist in the `users` table, insert it
      if (!userData) {
        console.log("User does not exist in `users` table. Inserting new user...");

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              name: data.user.email.split('@')[0], // Default name
              role: 'user', // Default role
              profile_picture: null, // Default profile picture
            },
          ])
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }

        console.log("New user inserted:", newUser);

        // Store user profile data in localStorage
        localStorage.setItem("username", newUser.name);
        localStorage.setItem("role", newUser.role);
        localStorage.setItem("profilePicture", newUser.profile_picture);
      } else {
        console.log("User already exists in `users` table.");

        // Store user profile data in localStorage
        localStorage.setItem("username", userData.name);
        localStorage.setItem("role", userData.role);
        localStorage.setItem("profilePicture", userData.profile_picture);
      }

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

      // Redirect based on role
      setTimeout(() => {
        localStorage.setItem("isAuthenticated", "true"); // Store login state

        switch (userData?.role || 'user') {
          case 'admin':
            navigate("/admindashboard");
            break;
          case 'employee':
            navigate("/csrdashboard");
            break;
          default:
            navigate("/dashboard");
        }
      }, 1000); // Delay navigation to allow the toast to be visible
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message); // Display error toast
    }
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
    <div className="login-container min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/bg.png')" }}>
      <h1 className="login-title">Login</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={handleEmailChange}
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
              onChange={handlePasswordChange}
              onFocus={() => setIsPasswordFocused(true)} // Show checkboxes on focus
              onBlur={() => setIsPasswordFocused(false)} // Hide checkboxes on blur
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
          {/* Password validation checkboxes */}
          {isPasswordFocused && (
            <div className="password-checks space-y-2 mt-2">
              <div className={`flex items-center gap-2 transition-all duration-300 ${passwordChecks.uppercase ? 'text-yellow-500 animate-wobble' : 'text-gray-400'}`}>
                <input type="checkbox" checked={passwordChecks.uppercase} readOnly className="form-checkbox" />
                <span>Uppercase letter</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${passwordChecks.lowercase ? 'text-yellow-500 animate-wobble' : 'text-gray-400'}`}>
                <input type="checkbox" checked={passwordChecks.lowercase} readOnly className="form-checkbox" />
                <span>Lowercase letter</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${passwordChecks.number ? 'text-yellow-500 animate-wobble' : 'text-gray-400'}`}>
                <input type="checkbox" checked={passwordChecks.number} readOnly className="form-checkbox" />
                <span>Number</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${passwordChecks.specialChar ? 'text-yellow-500 animate-wobble' : 'text-gray-400'}`}>
                <input type="checkbox" checked={passwordChecks.specialChar} readOnly className="form-checkbox" />
                <span>Special character</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${passwordChecks.minLength ? 'text-yellow-500 animate-wobble' : 'text-gray-400'}`}>
                <input type="checkbox" checked={passwordChecks.minLength} readOnly className="form-checkbox" />
                <span>8 characters or more</span>
              </div>
            </div>
          )}
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