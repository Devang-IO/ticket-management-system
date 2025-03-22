import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TicketSubmissionModal from "../components/TicketSubmissionModal";
import RatingModal from "../components/RatingModal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/global.css";
import { supabase } from "../utils/supabase";
// Import React Icons
import { FiPlusCircle, FiList, FiClock, FiCheckCircle, FiAlertTriangle, FiRefreshCw, FiHelpCircle } from "react-icons/fi";

// Define our color palette
const COLORS = {
  primary: "#113946",    // Dark blue
  secondary: "#BCA37F",  // Medium brown
  accent: "#EAD7BB",     // Light brown
  light: "#FFF2D8"       // Cream
};

// Ticket closure confirmation modal component
const TicketCloseConfirmModal = ({ ticket, onClose, onConfirm }) => {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl transform transition-all">
        <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.primary }}>
          Ticket Closure Request
        </h2>
        <p className="mb-4" style={{ color: COLORS.primary }}>
          Support has requested to close your ticket: <strong>{ticket.title}</strong>
        </p>
        <p className="mb-6" style={{ color: COLORS.primary }}>
          Are you satisfied with the solution? Confirming will close this ticket.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md transition-colors duration-300"
            style={{ backgroundColor: COLORS.accent, color: COLORS.primary }}
          >
            Not Yet
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md transition-colors duration-300"
            style={{ backgroundColor: COLORS.primary, color: COLORS.light }}
          >
            Yes, Close Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [ratingTicket, setRatingTicket] = useState(null);
  const [closureTicket, setClosureTicket] = useState(null);
  const navigate = useNavigate();

  // Fetch current user's tickets from the backend
  useEffect(() => {
    const fetchTickets = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("tickets").select("*").eq("user_id", user.id);
      if (error) {
        console.error("Error fetching tickets:", error);
      } else {
        setTickets(data);
      }
    };

    fetchTickets();
  }, []);

  // Check for any tickets with closure requested that need confirmation
  useEffect(() => {
    const closureRequests = tickets.filter(ticket => ticket.status === "requested");
    setClosureTicket(closureRequests.length > 0 ? closureRequests[0] : null);
  }, [tickets]);

  // Check for any closed ticket that has not been rated (only if no closure request is pending)
  useEffect(() => {
    const checkForUnratedTickets = async () => {
      if (closureTicket) {
        setRatingTicket(null);
        return;
      }
      const closedTickets = tickets.filter(ticket => ticket.status === "closed");
      if (closedTickets.length === 0) {
        setRatingTicket(null);
        return;
      }
      const closedTicketIds = closedTickets.map(ticket => ticket.id);
      const { data: ratingsData, error } = await supabase
        .from("employee_ratings")
        .select("ticket_id")
        .in("ticket_id", closedTicketIds);
      if (error) {
        console.error("Error fetching ratings:", error);
        return;
      }
      const ratedTicketIds = ratingsData.map(r => r.ticket_id);
      const unratedTickets = closedTickets.filter(ticket => !ratedTicketIds.includes(ticket.id));
      setRatingTicket(unratedTickets.length > 0 ? unratedTickets[0] : null);
    };

    if (tickets.length > 0) {
      checkForUnratedTickets();
    }
  }, [tickets, closureTicket]);

  // Handle confirmation of ticket closure
  const handleConfirmClosure = async () => {
    if (!closureTicket) return;
    try {
      const { error } = await supabase.from("tickets").update({ status: "closed" }).eq("id", closureTicket.id);
      if (error) {
        console.error("Error closing ticket:", error);
        toast.error("Failed to close ticket. Please try again.");
        return;
      }
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.id === closureTicket.id ? { ...ticket, status: "closed" } : ticket
        )
      );
      toast.success("Ticket closed successfully");
      setClosureTicket(null);
    } catch (error) {
      console.error("Error in handleConfirmClosure:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Callback when the rating modal is closed (after successful rating submission)
  const handleRatingModalClose = () => {
    setRatingTicket(null);
  };

  // Compute counts for each ticket category based on status and priority
  const pendingCount = tickets.filter(ticket => ticket.status === "open").length;
  const resolvedCount = tickets.filter(ticket => ticket.status === "closed").length;
  const inProgressCount = tickets.filter(ticket => ticket.status === "answered").length;
  const urgentCount = tickets.filter(ticket => ticket.priority && ticket.priority.toLowerCase() === "high").length;

  // Create data for overview cards and the bar chart with our color palette
  const ticketData = [
    { name: "Pending", value: pendingCount, color: COLORS.primary, icon: <FiClock size={24} /> },
    { name: "Resolved", value: resolvedCount, color: COLORS.primary, icon: <FiCheckCircle size={24} /> },
    { name: "In Progress", value: inProgressCount, color: COLORS.primary, icon: <FiRefreshCw size={24} /> },
    { name: "Urgent", value: urgentCount, color: COLORS.primary, icon: <FiAlertTriangle size={24} /> },
  ];

  // Function to handle ticket submission
  const handleTicketSubmit = () => {
    toast.success("Ticket submitted successfully!", {
      position: "top-center",
      autoClose: 2000,
    });
    setTimeout(() => {
      setIsModalOpen(false);
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen mt-10" style={{ backgroundColor: COLORS.light }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header with gradient underline */}
        <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.primary }}>
          My Dashboard
        </h1>
       <br></br>
        
        {/* Overview Cards - Grid layout with dark cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {ticketData.map((ticket, index) => (
            <div
              key={index}
              className="rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: COLORS.primary }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold" style={{ color: COLORS.light }}>{ticket.name}</h2>
                  <div style={{ color: COLORS.light }}>{ticket.icon}</div>
                </div>
                <div className="flex items-end">
                  <p className="text-3xl font-bold" style={{ color: COLORS.accent }}>{ticket.value}</p>
                  <p className="ml-2 text-sm" style={{ color: COLORS.light }}>tickets</p>
                </div>
              </div>
              <div className="h-1 w-full" style={{ backgroundColor: COLORS.secondary }}></div>
            </div>
          ))}
        </div>

        {/* Chart and Help Card - 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart with custom styling */}
          <div className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl" style={{ backgroundColor: "white" }}>
            <h2 className="text-xl font-semibold mb-6 flex items-center" style={{ color: COLORS.primary }}>
              <FiList className="mr-2" size={20} />
              Ticket Status Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ticketData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" stroke={COLORS.primary} />
                <YAxis stroke={COLORS.primary} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.95)", 
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: "none",
                    color: COLORS.primary
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {ticketData.map((entry, index) => {
                    // Alternating colors for bars
                    const barColors = [COLORS.primary, COLORS.secondary];
                    return <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Help Card with custom styling */}
          <div className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl flex flex-col justify-center" 
               style={{ backgroundColor: "white" }}>
            <div className="flex items-center mb-5">
              <div className="h-10 w-2 rounded-full mr-3" style={{ backgroundColor: COLORS.secondary }}></div>
              <h2 className="text-2xl font-semibold flex items-center" style={{ color: COLORS.primary }}>
                <FiHelpCircle className="mr-2" size={24} />
                Need Help?
              </h2>
            </div>
            
            <p className="mb-4" style={{ color: COLORS.primary }}>
              If you're facing any issues or need assistance, our support team is here to help!
              Submitting a ticket is quick and easy.
            </p>
            
            <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: COLORS.light }}>
              <ul className="space-y-3" style={{ color: COLORS.primary }}>
                <li className="flex items-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full text-xs mr-3" 
                        style={{ backgroundColor: COLORS.primary, color: COLORS.light }}>1</span>
                  Click the <strong>"Create Ticket"</strong> button below
                </li>
                <li className="flex items-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full text-xs mr-3"
                        style={{ backgroundColor: COLORS.primary, color: COLORS.light }}>2</span>
                  Provide detailed information about your issue
                </li>
                <li className="flex items-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full text-xs mr-3"
                        style={{ backgroundColor: COLORS.primary, color: COLORS.light }}>3</span>
                  Track your request in the <strong>"My Tickets"</strong> section
                </li>
                <li className="flex items-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full text-xs mr-3"
                        style={{ backgroundColor: COLORS.primary, color: COLORS.light }}>4</span>
                  Receive and review responses from our support team
                </li>
              </ul>
            </div>
            
            <p className="text-sm italic" style={{ color: COLORS.secondary }}>
              Providing detailed information helps us resolve your issue faster.
              We strive to respond to all tickets promptly.
            </p>
          </div>
        </div>

        {/* Quick Actions - Centered, improved buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-6 py-3 rounded-lg font-semibold shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{ backgroundColor: COLORS.primary, color: COLORS.light }}
          >
            <FiPlusCircle className="mr-2" size={20} /> Create New Ticket
          </button>
          
          <Link
            to="/tickets"
            className="flex items-center justify-center px-6 py-3 rounded-lg font-semibold shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{ backgroundColor: COLORS.secondary, color: COLORS.light }}
          >
            <FiList className="mr-2" size={20} /> View My Tickets
          </Link>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <TicketSubmissionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleTicketSubmit}
        />
      )}
      
      {closureTicket && (
        <TicketCloseConfirmModal
          ticket={closureTicket}
          onClose={() => setClosureTicket(null)}
          onConfirm={handleConfirmClosure}
        />
      )}
      
      {ratingTicket && !closureTicket && (
        <RatingModal
          show={true}
          onClose={handleRatingModalClose}
          employeeId={ratingTicket.closed_by}
          ticketId={ratingTicket.id}
        />
      )}
    </div>
  );
};

export default Dashboard;