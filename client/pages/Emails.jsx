import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Reply, Trash2, Archive, Send } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNotifications } from "@/hooks/use-notifications";

export default function Emails() {
  const { emails, setEmails } = useNotifications();
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState(null);

  const selectedEmail = useMemo(
    () => emails.find((email) => email.id === selectedEmailId) ?? null,
    [emails, selectedEmailId],
  );

  const sendActionToN8n = async (email, action, body = null) => {
    // In standalone mode we simulate success
    console.log('Simulated n8n call for', action, email.id, body);
    return Promise.resolve({ ok: true });
  };

  const handleSelectEmail = (email) => {
    setSelectedEmailId(email.id);
    setIsReplying(false);
    setReplyText("");
    setMessage(null);

    // Mark as read in local state
    if (!email.is_read) {
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, is_read: true } : e)));
    }
  };

  const handleArchive = async (email) => {
    if (!email.resume_url) {
      setMessage({ type: "error", text: "Cannot archive: No resume URL available" });
      return;
    }

    try {
      await sendActionToN8n(email, 'archive');
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, is_archived: true } : e)));
      setSelectedEmailId(null);
      setMessage({ type: "success", text: "Email archived successfully" });
    } catch (error) {
      console.error("Failed to archive:", error);
      setMessage({ type: "error", text: `Failed to archive email: ${error.message}.` });
    }
  };

  const handleDelete = async (email) => {
    if (!email.resume_url) {
      setMessage({ type: "error", text: "Cannot delete: No resume URL available" });
      return;
    }

    if (!window.confirm("Are you sure you want to delete this email?")) {
      return;
    }

    try {
      await sendActionToN8n(email, 'delete');
      setEmails((prev) => prev.filter((e) => e.id !== email.id));
      setSelectedEmailId(null);
      setMessage({ type: "success", text: "Email deleted" });
    } catch (error) {
      console.error("Failed to delete:", error);
      setMessage({ type: "error", text: `Failed to delete email: ${error.message}.` });
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedEmail) return;

    if (!selectedEmail.resume_url) {
      setMessage({ type: "error", text: "Cannot reply: No resume URL available" });
      return;
    }

    setIsSending(true);
    setMessage(null);

    try {
      await sendActionToN8n(selectedEmail, 'reply', replyText);
      setReplyText("");
      setIsReplying(false);
      setMessage({ type: "success", text: "Reply sent successfully!" });
    } catch (error) {
      console.error("Failed to send reply:", error);
      setMessage({ type: "error", text: `Failed to send reply: ${error.message}.` });
    }

    setIsSending(false);
  };

  const activeEmails = useMemo(() => emails.filter((e) => !e.is_archived), [emails]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Emails</h2>
        <p className="text-sm text-slate-500 mb-6">Manage your business communications (mocked).</p>
      </div>

      {message && (
        <Alert className={`${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Email List */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Inbox ({activeEmails.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {activeEmails.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p>No emails yet</p>
                  </div>
                ) : (
                  activeEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                        } ${!email.is_read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-slate-900 truncate ${!email.is_read ? 'font-bold' : 'font-medium'}`}>
                          {email.from_name || email.from_email}
                        </p>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {format(new Date(email.received_date), 'MMM d')}
                        </span>
                      </div>
                      <p className={`text-sm truncate mb-1 ${!email.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {email.subject}
                      </p>
                      <p className={`text-sm text-slate-500 truncate ${!email.is_read ? 'font-medium' : ''}`}>
                        {email.body.substring(0, 80)}...
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
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEmailId(null)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Inbox
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsReplying(!isReplying)}
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(selectedEmail)}
                    >
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

                <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedEmail.subject}</h2>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{selectedEmail.from_name || selectedEmail.from_email}</p>
                    <p className="text-sm text-slate-500">{selectedEmail.from_email}</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {format(new Date(selectedEmail.received_date), 'MMMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="prose max-w-none mb-6">
                  <div className="whitespace-pre-wrap text-slate-700">
                    {selectedEmail.body}
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
