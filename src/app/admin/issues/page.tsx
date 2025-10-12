"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ThemeToggle from "../../../components/ThemeToggle.client";
import "./admin-issues.css";

interface Issue {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
  };
}

interface Reply {
  id: string;
  issue_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  profiles: {
    email: string;
    role: string;
  };
}

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const supabase = createClient();

  // Fetch all issues
  const fetchIssues = async () => {
    try {
      setLoading(true);
      const query = supabase
        .from("issues")
        .select(`
          *,
          profiles:user_id (
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIssues(data || []);
    } catch (err: any) {
      console.error("Error fetching issues:", err);
      setError(err.message || "Failed to fetch issues");
    } finally {
      setLoading(false);
    }
  };

  // Fetch replies for selected issue
  const fetchReplies = async (issueId: string) => {
    try {
      const { data, error } = await supabase
        .from("issue_replies")
        .select(`
          *,
          profiles:user_id (
            email,
            role
          )
        `)
        .eq("issue_id", issueId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (err: any) {
      console.error("Error fetching replies:", err);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchIssues();

    const channel = supabase
      .channel("admin-issues-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "issues",
        },
        (payload) => {
          console.log("Issue updated:", payload);
          fetchIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  // Subscribe to replies for selected issue
  useEffect(() => {
    if (!selectedIssue) return;

    fetchReplies(selectedIssue.id);

    const channel = supabase
      .channel(`issue-replies-${selectedIssue.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "issue_replies",
          filter: `issue_id=eq.${selectedIssue.id}`,
        },
        (payload) => {
          console.log("New reply:", payload);
          fetchReplies(selectedIssue.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedIssue]);

  // Send reply
  const handleSendReply = async () => {
    if (!selectedIssue || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("issue_replies").insert({
        issue_id: selectedIssue.id,
        user_id: user?.id,
        message: replyMessage,
        is_internal: isInternal,
      });

      if (error) throw error;

      setReplyMessage("");
      setIsInternal(false);
      fetchReplies(selectedIssue.id);
    } catch (err: any) {
      console.error("Error sending reply:", err);
      alert("Failed to send reply: " + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  // Update issue status
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedIssue) return;

    setUpdatingStatus(true);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "resolved") {
        updateData.resolved_at = new Date().toISOString();
      } else if (newStatus === "closed") {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("issues")
        .update(updateData)
        .eq("id", selectedIssue.id);

      if (error) throw error;

      setSelectedIssue({ ...selectedIssue, status: newStatus });
      fetchIssues();
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "shipment":
        return "🚚";
      case "billing":
        return "💳";
      case "technical":
        return "⚙️";
      case "urgent":
        return "🚨";
      default:
        return "📝";
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      open: { text: "Open", className: "status-open" },
      in_progress: { text: "In Progress", className: "status-progress" },
      resolved: { text: "Resolved", className: "status-resolved" },
      closed: { text: "Closed", className: "status-closed" },
    };
    return badges[status] || badges.open;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      low: { text: "Low", className: "priority-low" },
      medium: { text: "Medium", className: "priority-medium" },
      high: { text: "High", className: "priority-high" },
      urgent: { text: "Urgent", className: "priority-urgent" },
    };
    return badges[priority] || badges.medium;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      searchTerm === "" ||
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="admin-issues-container">
      <ThemeToggle />
      <div className="admin-issues-header">
        <h1>Issue Management</h1>
        <div className="header-stats">
          <div className="stat-card stat-open">
            <div className="stat-value">{issues.filter((i) => i.status === "open").length}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-card stat-progress">
            <div className="stat-value">
              {issues.filter((i) => i.status === "in_progress").length}
            </div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card stat-resolved">
            <div className="stat-value">{issues.filter((i) => i.status === "resolved").length}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
      </div>

      <div className="admin-issues-layout">
        {/* Issues List */}
        <div className="issues-sidebar">
          <div className="sidebar-controls">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="filter-tabs">
              <button
                className={`filter-tab ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All ({issues.length})
              </button>
              <button
                className={`filter-tab ${statusFilter === "open" ? "active" : ""}`}
                onClick={() => setStatusFilter("open")}
              >
                Open ({issues.filter((i) => i.status === "open").length})
              </button>
              <button
                className={`filter-tab ${statusFilter === "in_progress" ? "active" : ""}`}
                onClick={() => setStatusFilter("in_progress")}
              >
                In Progress ({issues.filter((i) => i.status === "in_progress").length})
              </button>
              <button
                className={`filter-tab ${statusFilter === "resolved" ? "active" : ""}`}
                onClick={() => setStatusFilter("resolved")}
              >
                Resolved ({issues.filter((i) => i.status === "resolved").length})
              </button>
            </div>
          </div>

          <div className="issues-list">
            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading issues...</p>
              </div>
            )}

            {!loading && filteredIssues.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No issues found</p>
              </div>
            )}

            {!loading &&
              filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`issue-card ${selectedIssue?.id === issue.id ? "selected" : ""}`}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div className="issue-card-header">
                    <span className="issue-icon">{getCategoryIcon(issue.category)}</span>
                    <div className="issue-card-title">{issue.title}</div>
                  </div>
                  <div className="issue-card-meta">
                    <span className={`status-badge ${getStatusBadge(issue.status).className}`}>
                      {getStatusBadge(issue.status).text}
                    </span>
                    <span className={`priority-badge ${getPriorityBadge(issue.priority).className}`}>
                      {getPriorityBadge(issue.priority).text}
                    </span>
                  </div>
                  <div className="issue-card-footer">
                    <span className="issue-user">👤 {issue.profiles?.email || "Unknown"}</span>
                    <span className="issue-date">{formatDate(issue.created_at)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Issue Detail */}
        <div className="issue-detail">
          {!selectedIssue ? (
            <div className="no-selection">
              <div className="no-selection-icon">📋</div>
              <h3>Select an issue to view details</h3>
              <p>Choose an issue from the list to see its details and respond</p>
            </div>
          ) : (
            <>
              <div className="issue-detail-header">
                <div>
                  <div className="issue-detail-title">
                    {getCategoryIcon(selectedIssue.category)} {selectedIssue.title}
                  </div>
                  <div className="issue-detail-meta">
                    <span className="issue-user">
                      👤 {selectedIssue.profiles?.email || "Unknown"}
                    </span>
                    <span className="issue-date">{formatDate(selectedIssue.created_at)}</span>
                  </div>
                </div>
                <div className="issue-detail-badges">
                  <span
                    className={`status-badge ${getStatusBadge(selectedIssue.status).className}`}
                  >
                    {getStatusBadge(selectedIssue.status).text}
                  </span>
                  <span
                    className={`priority-badge ${
                      getPriorityBadge(selectedIssue.priority).className
                    }`}
                  >
                    {getPriorityBadge(selectedIssue.priority).text}
                  </span>
                </div>
              </div>

              <div className="status-actions">
                <span>Update Status:</span>
                <button
                  className="status-btn status-open"
                  onClick={() => handleUpdateStatus("open")}
                  disabled={updatingStatus || selectedIssue.status === "open"}
                >
                  Open
                </button>
                <button
                  className="status-btn status-progress"
                  onClick={() => handleUpdateStatus("in_progress")}
                  disabled={updatingStatus || selectedIssue.status === "in_progress"}
                >
                  In Progress
                </button>
                <button
                  className="status-btn status-resolved"
                  onClick={() => handleUpdateStatus("resolved")}
                  disabled={updatingStatus || selectedIssue.status === "resolved"}
                >
                  Resolved
                </button>
                <button
                  className="status-btn status-closed"
                  onClick={() => handleUpdateStatus("closed")}
                  disabled={updatingStatus || selectedIssue.status === "closed"}
                >
                  Closed
                </button>
              </div>

              <div className="issue-description-section">
                <h3>Description</h3>
                <div className="issue-description">{selectedIssue.description}</div>
              </div>

              <div className="replies-section">
                <h3>Conversation ({replies.length})</h3>
                <div className="replies-list">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`reply-item ${
                        reply.profiles.role === "admin" ? "admin-reply" : "user-reply"
                      } ${reply.is_internal ? "internal-reply" : ""}`}
                    >
                      <div className="reply-header">
                        <span className="reply-author">
                          {reply.profiles.role === "admin" ? "🛡️ Admin" : "👤 Client"}
                          {reply.is_internal && " (Internal Note)"}
                        </span>
                        <span className="reply-date">{formatDate(reply.created_at)}</span>
                      </div>
                      <div className="reply-message">{reply.message}</div>
                    </div>
                  ))}
                  {replies.length === 0 && (
                    <div className="no-replies">No replies yet. Be the first to respond!</div>
                  )}
                </div>

                <div className="reply-input-section">
                  <div className="internal-toggle">
                    <label>
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                      />
                      <span>Internal Note (visible only to admins)</span>
                    </label>
                  </div>
                  <textarea
                    className="reply-input"
                    placeholder="Type your response..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                  />
                  <button
                    className="send-reply-button"
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyMessage.trim()}
                  >
                    {sendingReply ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
