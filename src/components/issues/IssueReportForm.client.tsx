"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import "./issue-report-form.css";

interface IssueReportFormProps {
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function IssueReportForm({ userId, onClose, onSuccess }: IssueReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [viewingIssues, setViewingIssues] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
  });

  const supabase = createClient();

  // Fetch user's issues
  const fetchMyIssues = async () => {
    try {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyIssues(data || []);
    } catch (err) {
      console.error("Error fetching issues:", err);
    }
  };

  // Fetch issue replies
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
    } catch (err) {
      console.error("Error fetching replies:", err);
    }
  };

  // Subscribe to new replies
  useEffect(() => {
    if (!selectedIssue) return;

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

  useEffect(() => {
    fetchMyIssues();

    // Subscribe to issue updates
    const channel = supabase
      .channel(`user-issues-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "issues",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Issue updated:", payload);
          fetchMyIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Get client_id from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", userId)
        .single();

      // Insert issue
      const { error: insertError } = await supabase.from("issues").insert({
        user_id: userId,
        client_id: profile?.client_id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: "open",
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        setFormData({
          title: "",
          description: "",
          category: "general",
          priority: "medium",
        });
        setSuccess(false);
        setViewingIssues(true);
        fetchMyIssues();
      }, 2000);
    } catch (err: any) {
      console.error("Error submitting issue:", err);
      setError(err.message || "Failed to submit issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedIssue || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const { error } = await supabase.from("issue_replies").insert({
        issue_id: selectedIssue.id,
        user_id: userId,
        message: replyMessage,
        is_internal: false,
      });

      if (error) throw error;

      setReplyMessage("");
      fetchReplies(selectedIssue.id);
    } catch (err: any) {
      console.error("Error sending reply:", err);
      setError(err.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
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

  if (selectedIssue) {
    return (
      <div className="issue-modal-overlay" onClick={onClose}>
        <div className="issue-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="issue-detail-view">
            <div className="issue-detail-header">
              <button className="back-button" onClick={() => setSelectedIssue(null)}>
                ← Back to Issues
              </button>
              <button className="close-button" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="issue-detail-content">
              <div className="issue-detail-title">
                {getCategoryIcon(selectedIssue.category)} {selectedIssue.title}
              </div>
              <div className="issue-detail-meta">
                <span className={`status-badge ${getStatusBadge(selectedIssue.status).className}`}>
                  {getStatusBadge(selectedIssue.status).text}
                </span>
                <span className={`priority-badge ${getPriorityBadge(selectedIssue.priority).className}`}>
                  {getPriorityBadge(selectedIssue.priority).text}
                </span>
                <span className="issue-date">{formatDate(selectedIssue.created_at)}</span>
              </div>
              <div className="issue-description">{selectedIssue.description}</div>

              <div className="replies-section">
                <h3>Conversation</h3>
                <div className="replies-list">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`reply-item ${reply.profiles.role === "admin" ? "admin-reply" : "user-reply"}`}
                    >
                      <div className="reply-header">
                        <span className="reply-author">
                          {reply.profiles.role === "admin" ? "🛡️ Admin" : "You"}
                        </span>
                        <span className="reply-date">{formatDate(reply.created_at)}</span>
                      </div>
                      <div className="reply-message">{reply.message}</div>
                    </div>
                  ))}
                  {replies.length === 0 && (
                    <div className="no-replies">No replies yet. Admin will respond soon.</div>
                  )}
                </div>

                <div className="reply-input-section">
                  <textarea
                    className="reply-input"
                    placeholder="Type your message..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewingIssues) {
    return (
      <div className="issue-modal-overlay" onClick={onClose}>
        <div className="issue-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="issue-list-view">
            <div className="issue-list-header">
              <h2>My Issues</h2>
              <div className="header-actions">
                <button className="new-issue-button" onClick={() => setViewingIssues(false)}>
                  + New Issue
                </button>
                <button className="close-button" onClick={onClose}>
                  ✕
                </button>
              </div>
            </div>

            <div className="issue-list">
              {myIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="issue-list-item"
                  onClick={() => {
                    setSelectedIssue(issue);
                    fetchReplies(issue.id);
                  }}
                >
                  <div className="issue-item-header">
                    <span className="issue-icon">{getCategoryIcon(issue.category)}</span>
                    <div className="issue-item-title">{issue.title}</div>
                  </div>
                  <div className="issue-item-meta">
                    <span className={`status-badge ${getStatusBadge(issue.status).className}`}>
                      {getStatusBadge(issue.status).text}
                    </span>
                    <span className={`priority-badge ${getPriorityBadge(issue.priority).className}`}>
                      {getPriorityBadge(issue.priority).text}
                    </span>
                  </div>
                  <div className="issue-item-date">{formatDate(issue.created_at)}</div>
                </div>
              ))}
              {myIssues.length === 0 && (
                <div className="no-issues">
                  <div className="no-issues-icon">📝</div>
                  <p>No issues reported yet</p>
                  <button className="create-first-issue" onClick={() => setViewingIssues(false)}>
                    Create Your First Issue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="issue-modal-overlay" onClick={onClose}>
      <div className="issue-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="issue-form">
          <div className="issue-form-header">
            <h2>Report an Issue</h2>
            <div className="header-actions">
              {myIssues.length > 0 && (
                <button className="view-issues-button" onClick={() => setViewingIssues(true)}>
                  View My Issues ({myIssues.length})
                </button>
              )}
              <button className="close-button" onClick={onClose}>
                ✕
              </button>
            </div>
          </div>

          {success && (
            <div className="success-message">
              ✓ Issue submitted successfully! Admin will respond soon.
            </div>
          )}

          {error && <div className="error-message">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">
                Issue Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
                required
                maxLength={200}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="general">📝 General</option>
                  <option value="shipment">🚚 Shipment</option>
                  <option value="billing">💳 Billing</option>
                  <option value="technical">⚙️ Technical</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">
                  Priority <span className="required">*</span>
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please provide detailed information about the issue..."
                required
                rows={6}
                maxLength={2000}
              />
              <div className="char-count">
                {formData.description.length} / 2000 characters
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-button" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Issue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
