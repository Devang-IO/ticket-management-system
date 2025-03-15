import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase"; // Import Supabase client
import { X, Eye, EyeOff } from "lucide-react"; // Import eye icons for password visibility

export default function ProfileModal({ onClose, onProfileUpdate }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [ticketStats, setTicketStats] = useState({ open: 0, closed: 0, assigned: 0, recent: [] });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    profile_picture: "",
    phone: "",
    oldPassword: "", // Add old password field
    newPassword: "", // Rename password to newPassword
  });
  const [newProfilePic, setNewProfilePic] = useState(null); // For file upload
  const [uploadLoading, setUploadLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false); // Toggle old password visibility
  const [showNewPassword, setShowNewPassword] = useState(false); // Toggle new password visibility

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      setLoading(true);
      const { data: userData, error: authError } = await supabase.auth.getUser();

      if (authError || !userData?.user?.id) {
        console.error("Auth error:", authError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, profile_picture, phone")
        .eq("id", userData.user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
      } else if (data) {
        setUser(data);
        setFormData(data);
        fetchTicketStats(data);
      }
      setLoading(false);
    }

    fetchUserProfile();
  }, []);

  // Fetch ticket statistics
  async function fetchTicketStats(userInfo) {
    // ... (keep existing ticket stats logic unchanged)
  }

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.match("image.*")) {
        setErrorMessage("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size must be less than 5MB.");
        return;
      }
      setNewProfilePic(file);
      setErrorMessage("");
    }
  };

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      return data.secure_url; // Return the Cloudinary URL
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      throw error;
    }
  };

  // Handle saving profile changes
  const handleSave = async () => {
    setUploadLoading(true);
    setErrorMessage("");

    try {
      let updatedData = { ...formData };

      // Upload new profile picture to Cloudinary if selected
      if (newProfilePic) {
        const imageUrl = await uploadImageToCloudinary(newProfilePic);
        updatedData.profile_picture = imageUrl;
      }

      // Update user data in Supabase
      const { error: profileError } = await supabase
        .from("users")
        .update({
          name: updatedData.name,
          email: updatedData.email,
          phone: updatedData.phone,
          profile_picture: updatedData.profile_picture,
        })
        .eq("id", user.id);

      if (profileError) {
        setErrorMessage("Failed to update profile: " + profileError.message);
      } else {
        // Update password if a new password is provided
        if (updatedData.newPassword) {
          // Validate old password
          if (!updatedData.oldPassword) {
            setErrorMessage("Please enter your old password.");
            return;
          }

          // Reauthenticate user with old password
          const { error: reauthError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: updatedData.oldPassword,
          });

          if (reauthError) {
            setErrorMessage("Old password is incorrect.");
            return;
          }

          // Update password
          const { error: passwordError } = await supabase.auth.updateUser({
            password: updatedData.newPassword,
          });

          if (passwordError) {
            setErrorMessage("Failed to update password: " + passwordError.message);
            return;
          }
        }

        setUser(updatedData);
        localStorage.setItem("username", updatedData.name); // Update username in localStorage
        localStorage.setItem("profilePicture", updatedData.profile_picture); // Update profile picture in localStorage
        setEditing(false);
        onProfileUpdate(); // Notify Navbar to re-fetch profile data
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred");
    } finally {
      setUploadLoading(false);
      setNewProfilePic(null);
      setFormData({ ...formData, oldPassword: "", newPassword: "" }); // Clear password fields
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="p-8 w-full max-w-2xl bg-white rounded-xl shadow-lg text-center">
          <div className="text-center py-10 text-gray-600">Loading profile data...</div>
        </div>
      </div>
    );
  }

  // Error state if user not found
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="p-8 w-full max-w-2xl bg-white rounded-xl shadow-lg text-center">
          <div className="text-center py-10 text-red-600">User profile not found</div>
          <button onClick={onClose} className="mt-3 bg-gray-600 text-white px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="p-8 w-full max-w-2xl bg-white rounded-xl shadow-lg text-center relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-800">
          <X size={24} />
        </button>

        {/* Profile header */}
        <div className="h-24 bg-gradient-to-r from-yellow-500 to-blue-700 rounded-t-lg flex justify-center items-center" />
        <div className="-mt-12 flex flex-col items-center">
          {/* Profile picture */}
          <div className="relative">
            <label htmlFor="profilePicInput" className="cursor-pointer">
              <img
                src={
                  newProfilePic
                    ? URL.createObjectURL(newProfilePic)
                    : formData.profile_picture || "/images/default-avatar.png"
                }
                alt="Profile"
                className="w-28 h-28 rounded-full border-4 border-white shadow-md object-cover"
              />
              {editing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-full border-4 border-white">
                  <span className="text-black text-sm font-medium">Change</span>
                </div>
              )}
            </label>
            {editing && (
              <input
                type="file"
                id="profilePicInput"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploadLoading}
              />
            )}
          </div>

          {/* Error messages */}
          {errorMessage && <div className="mt-2 text-red-500 text-sm">{errorMessage}</div>}

          {/* User information */}
          {editing ? (
            <div className="w-full mt-4 space-y-3">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-left">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md text-black shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-left">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md text-black shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 text-left">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md text-black shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 text-left">
                  Old Password
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    id="oldPassword"
                    name="oldPassword"
                    value={formData.oldPassword || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md text-black shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter old password"
                  />
                  <button
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 text-left">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md text-black shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password"
                  />
                  <button
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex space-x-2 pt-3">
                <button
                  onClick={handleSave}
                  disabled={uploadLoading}
                  className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    uploadLoading ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                >
                  {uploadLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData(user);
                    setNewProfilePic(null);
                    setErrorMessage("");
                  }}
                  disabled={uploadLoading}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">{user.role}</span>
              <div className="text-gray-600">
                <p>📧 {user.email}</p>
                {user.phone && <p>📱 {user.phone}</p>}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Ticket statistics */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Ticket Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            {user.role.toLowerCase() === "admin" || user.role.toLowerCase() === "user" ? (
              <>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{ticketStats.open}</p>
                  <p className="text-sm text-gray-600">Open Tickets</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{ticketStats.closed}</p>
                  <p className="text-sm text-gray-600">Closed Tickets</p>
                </div>
              </>
            ) : null}

            {user.role.toLowerCase() === "employee" && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{ticketStats.assigned}</p>
                  <p className="text-sm text-gray-600">Assigned Tickets</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{ticketStats.closed}</p>
                  <p className="text-sm text-gray-600">Closed Tickets</p>
                </div>
              </>
            )}

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{ticketStats.recent.length}</p>
              <p className="text-sm text-gray-600">Recent Activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}