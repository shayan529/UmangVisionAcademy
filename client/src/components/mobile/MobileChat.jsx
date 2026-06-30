import { useState } from "react";
import { Send, User, MessageSquare, ShieldAlert } from "lucide-react";
import { useSelector } from "react-redux";

export default function MobileChat() {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "Instructor",
      text: "Welcome to Umang Vision Academy! How can I help you today?",
      time: "10:00 AM",
      isAdmin: true,
    },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      sender: user?.name || "You",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isAdmin: false,
    };

    setMessages([...messages, newMsg]);
    setInputText("");

    // Mock auto-reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "System",
          text: "An instructor will respond to your message shortly. Thank you for your patience!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isAdmin: true,
        },
      ]);
    }, 1000);
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-indigo-400 mb-4 animate-bounce" />
        <h3 className="text-lg font-extrabold text-white">Authentication Required</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-xs">
          Please log in to access student-instructor chat services.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-md mx-auto bg-slate-950/30 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/30">
          <MessageSquare size={20} />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-white">Support & Mentorship</h3>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Online Support Team
          </p>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = !msg.isAdmin;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] flex items-start gap-2.5`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-[10px] font-bold flex-shrink-0">
                    <User size={14} />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-900/80 text-slate-200 rounded-tl-none border border-slate-800"
                  }`}
                >
                  <p className="font-bold text-[10px] opacity-75 mb-1">{msg.sender}</p>
                  <p className="break-words">{msg.text}</p>
                  <span className="block text-[9px] text-right opacity-60 mt-1.5">{msg.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/80 backdrop-blur flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500"
        />
        <button
          type="submit"
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
