import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiChevronDown, FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import TicketSubmissionModal from "../components/TicketSubmissionModal";

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const mockTickets = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      title: `Issue ${i + 1}`,
      status: ["Open", "Closed", "Pending", "Resolved"][i % 4],
      priority: ["High", "Medium", "Low"][i % 3],
      createdBy: ["John", "Emma", "Liam", "Sophia"][i % 4],
      date: `2025-02-${24 - i}`,
    }));
    setTickets(mockTickets);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActionDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) &&
      (statusFilter === "All" || ticket.status === statusFilter) &&
      (priorityFilter === "All" || ticket.priority === priorityFilter)
  );
  

  const indexOfLastTicket = currentPage * entriesPerPage;
  const indexOfFirstTicket = indexOfLastTicket - entriesPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <h2>Ticket List</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <FiPlus /> New Ticket
        </button>
      </div>

      <div className="tickets-controls">
        <div className="filter-group">
          <label>Show:</label>
          <select value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Priority:</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created By</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td>
                  <Link to={`/ticket/${ticket.id}`} className="ticket-link">
                    {ticket.title}
                  </Link>
                </td>
                <td>{ticket.status}</td>
                <td>{ticket.priority}</td>
                <td>{ticket.createdBy}</td>
                <td>{ticket.date}</td>
                <td className="action-cell">
                  <div className="dropdown-wrapper" ref={dropdownRef}>
                    <button
                      onClick={() =>
                        setActionDropdown(ticket.id === actionDropdown ? null : ticket.id)
                      }
                      className="action-btn"
                    >
                      Actions <FiChevronDown />
                    </button>
                    {actionDropdown === ticket.id && (
                      <div className="dropdown">
                        <Link to={`/ticket/${ticket.id}`} className="dropdown-item">
                          <FiEye /> View
                        </Link>
                        <Link to={`/ticket/edit/${ticket.id}`} className="dropdown-item">
                          <FiEdit /> Edit
                        </Link>
                        <button className="delete-btn">
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ticket Submission Modal */}
      {isModalOpen && <TicketSubmissionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default TicketList;
