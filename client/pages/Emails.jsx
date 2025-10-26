import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Reply, Trash2, Archive, Send, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Emails() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [emails, setEmails] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const formatDate = (value, dateFormat) => {
    if (!value) return "Unknown";
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown";
    }

    try {
      return format(parsedDate, dateFormat);
    } catch (error) {
      console.error("Failed to format date", error);
      return "Unknown";
    }
  };

  const getPreviewText = (text) => {
    if (!text) return "No preview available";
    const trimmed = text.slice(0, 80);
    return text.length > 80 ? `${trimmed}...` : trimmed;
  };

  const fetchEmails = useCallback(async () => {
    setIsFetching(true);

    try {
      const response = await fetch("/api/emails");
      const responseText = await response.text();
      let parsedPayload = {};

      if (responseText) {
        try {
          parsedPayload = JSON.parse(responseText);
        } catch (error) {
          throw new Error("Unable to parse server response when loading emails.");
        }
      }

      if (!response.ok) {
        const errorMessage =
          (parsedPayload && typeof parsedPayload === "object" ? parsedPayload.message : undefined) ||
          responseText ||
          `Failed to load emails (${response.status}).`;
        throw new Error(errorMessage);
      }

      const payload = parsedPayload;
      const fetchedEmails = Array.isArray(payload)
        ? payload
        : payload && typeof payload === "object" && Array.isArray(payload.emails)
        ? payload.emails
        : payload && typeof payload === "object" && Array.isArray(payload.data)
        ? payload.data
        : [];
      const normalized = fetchedEmails.map((email) => ({
        ...email,
        id: String(email.id),
        message_id: email.message_id != null ? String(email.message_id) : undefined,
        received_date: email.received_date ?? new Date().toISOString(),
        body: email.body ?? "",
        is_read: email.is_read ?? false,
        is_archived: email.is_archived ?? false,
      }));

      setEmails(normalized);
      setSelectedEmail((prev) => {
        if (!prev) return null;
        return normalized.find((email) => email.id === prev.id) ?? null;
      });
      setMessage((prev) => (prev?.type === "error" ? null : prev));
    } catch (error) {
      console.error("Failed to load emails:", error);
      setMessage({ type: "error", text: error.message || "Failed to load emails." });
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const sendActionToN8n = async (email, action, replyBody = null) => {
    const response = await fetch(`/api/emails/${encodeURIComponent(email.id)}/actions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        ...(action === "reply" && replyBody ? { replyBody } : {}),
        email,
      }),
    });

    const responseText = await response.text();
    let payload = {};

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch (error) {
        if (!response.ok) {
          throw new Error(responseText);
        }

        payload = { message: responseText };
      }
    }

    if (!response.ok) {
      throw new Error(payload?.message || responseText || `Action failed with status ${response.status}.`);
    }

    return payload;
  };

  const handleSelectEmail = (email) => {
    const nextSelected = email.is_read ? email : { ...email, is_read: true };
    setSelectedEmail(nextSelected);
    setIsReplying(false);
    setReplyText("");
    setMessage(null);

    if (!email.is_read) {
      setEmails((prev) => prev.map((e) => (e.id === email.id ? nextSelected : e)));
    }
  };

  const handleArchive = async (email) => {
    try {
      const result = await sendActionToN8n(email, "archive");
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, is_archived: true } : e)));
      setSelectedEmail(null);
      setMessage({ type: "success", text: result?.message || "Email archived successfully" });
    } catch (error) {
      console.error("Failed to archive:", error);
      setMessage({ type: "error", text: `Failed to archive email: ${error.message}.` });
    }
  };

  const handleDelete = async (email) => {
    if (!window.confirm("Are you sure you want to delete this email?")) {
      return;
    }

    try {
      const result = await sendActionToN8n(email, "delete");
      setEmails((prev) => prev.filter((e) => e.id !== email.id));
      setSelectedEmail(null);
      setMessage({ type: "success", text: result?.message || "Email deleted" });
    } catch (error) {
      console.error("Failed to delete:", error);
      setMessage({ type: "error", text: `Failed to delete email: ${error.message}.` });
    }
  };

  const handleSendReply = async () => {
    const trimmedReply = replyText.trim();
    if (!trimmedReply || !selectedEmail) return;

    setIsSending(true);
    setMessage(null);

    try {
      const result = await sendActionToN8n(selectedEmail, "reply", trimmedReply);
      setReplyText("");
      setIsReplying(false);
      setMessage({ type: "success", text: result?.message || "Reply sent successfully!" });
    } catch (error) {
      console.error("Failed to send reply:", error);
      setMessage({ type: "error", text: `Failed to send reply: ${error.message}.` });
    } finally {
      setIsSending(false);
    }
  };

  const activeEmails = emails.filter((e) => !e.is_archived);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Emails</h2>
        <p className="text-sm text-slate-500 mb-6">Manage your business communications (mocked).</p>
      </div>

      {message && (
        <Alert className={`${message.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Email List */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle>Inbox ({activeEmails.length})</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchEmails}
                  disabled={isFetching}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {isFetching && activeEmails.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p>Loading emails...</p>
                  </div>
                ) : activeEmails.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p>No emails yet</p>
                  </div>
                ) : (
                  activeEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${
                        selectedEmail?.id === email.id ? "bg-blue-50" : ""
                      } ${!email.is_read ? "bg-blue-50/30" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-slate-900 truncate ${!email.is_read ? "font-bold" : "font-medium"}`}>
                          {email.from_name || email.from_email || "Unknown sender"}
                        </p>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(email.received_date, "MMM d")}
                        </span>
                      </div>
                      <p className={`text-sm truncate mb-1 ${!email.is_read ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                        {email.subject || "(No subject)"}
                      </p>
                      <p className={`text-sm text-slate-500 truncate ${!email.is_read ? "font-medium" : ""}`}>
                        {getPreviewText(email.body)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Detail */}
        <div className="lg:col-span-3">
          {!selectedEmail ? (
            <Card className="shadow-xl border-0 flex items-center justify-center h-96">
              <p className="text-slate-500">Select an email to read</p>
            </Card>
          ) : (
            <Card className="shadow-xl border-0">
              <CardHeader className="border-b border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Inbox
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsReplying(!isReplying)}>
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleArchive(selectedEmail)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(selectedEmail)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedEmail.subject || "(No subject)"}</h2>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{selectedEmail.from_name || selectedEmail.from_email || "Unknown sender"}</p>
                    <p className="text-sm text-slate-500">{selectedEmail.from_email || "No email available"}</p>
                  </div>
                  <p className="text-sm text-slate-500">{formatDate(selectedEmail.received_date, "MMMM d, yyyy • h:mm a")}</p>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="prose max-w-none mb-6">
                  <div className="whitespace-pre-wrap text-slate-700">
                    {selectedEmail.body || "No content available for this email."}
                  </div>
                </div>

                {isReplying && (
                  <div className="border-t border-slate-200 pt-6 space-y-4">
                    <h3 className="font-semibold text-slate-900">Reply</h3>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={6}
                    />
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsReplying(false);
                          setReplyText("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendReply}
                        disabled={isSending || !replyText.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSending ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Reply
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
