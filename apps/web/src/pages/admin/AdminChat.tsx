import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  MoreVertical,
  Send,
  User,
  CheckCheck,
  Check,
  Paperclip,
} from 'lucide-react';
import { useSupport } from '../../hooks/useSupport';
import { format } from 'date-fns';
import type { TicketStatus } from '../../types/api';

const AdminChat: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isOtherSideTyping, setIsOtherSideTyping] = useState(false);

  const {
    useAdminTickets,
    useAdminTicketMessages,
    sendMessageAsync,
    socket,
    updateTicketStatus,
  } = useSupport();

  const { data: ticketsData } = useAdminTickets({ status: statusFilter });
  const tickets = ticketsData?.data || [];

  const { data: currentChatData, refetch: refetchMessages } = useAdminTicketMessages(selectedChat);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastTypingEmit = useRef<number>(0);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Scroll to bottom ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatData?.messages, isOtherSideTyping]);

  // ── Reset typing when switching tickets ───────────────────────────────────────
  useEffect(() => {
    setIsOtherSideTyping(false);
    isTypingRef.current = false;
    lastTypingEmit.current = 0;
  }, [selectedChat]);

  // ── WS: listen for user typing ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !selectedChat) return;

    const handleTyping = (data: { ticketId: string; sender: string; isTyping: boolean }) => {
      if (data.sender !== 'USER' || data.ticketId !== selectedChat) return;
      setIsOtherSideTyping(data.isTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (data.isTyping) {
        typingTimeoutRef.current = setTimeout(() => setIsOtherSideTyping(false), 4000);
      }
    };

    socket.on('typing', handleTyping);
    return () => {
      socket.off('typing', handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, selectedChat]);

  // ── Emit typing signal ────────────────────────────────────────────────────────
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessage(val);

    if (!socket || !selectedChat) return;

    const now = Date.now();
    if (val && now - lastTypingEmit.current > 2000) {
      socket.emit('typing', { ticketId: selectedChat, isTyping: true });
      lastTypingEmit.current = now;
      isTypingRef.current = true;
    } else if (!val && isTypingRef.current) {
      socket.emit('typing', { ticketId: selectedChat, isTyping: false });
      isTypingRef.current = false;
    }
  }, [socket, selectedChat]);

  // ── Send ──────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!message.trim() || !selectedChat) return;

    const currentText = message;
    setMessage('');

    // Stop typing indicator
    if (socket && isTypingRef.current) {
      socket.emit('typing', { ticketId: selectedChat, isTyping: false });
      isTypingRef.current = false;
    }

    try {
      await sendMessageAsync({ ticketId: selectedChat, text: currentText });
      refetchMessages();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const getInitials = (ticket: any) => {
    if (ticket.user) {
      return `${ticket.user.firstName?.[0] || ''}${ticket.user.lastName?.[0] || ''}`.toUpperCase() || 'U';
    }
    return ticket.guestName ? ticket.guestName[0].toUpperCase() : 'G';
  };

  const getName = (ticket: any) => {
    if (ticket.user) {
      return `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email;
    }
    return ticket.guestName || 'Guest User';
  };

  const currentTicket = currentChatData?.ticket;

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      {/* Sidebar - Chat List */}
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1 text-sm border-none bg-gray-50 rounded-lg text-gray-600 focus:ring-0 outline-none"
            >
              <option value="">All</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No conversations found.</div>
          ) : (
            tickets.map((ticket: any) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedChat(ticket.id)}
                className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-gray-50 ${
                  selectedChat === ticket.id
                    ? 'bg-blue-50/50 border-l-4 border-blue-600'
                    : 'border-l-4 border-transparent'
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-sm">
                    {ticket.user?.avatar ? (
                      <img src={ticket.user.avatar} alt="avatar" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      getInitials(ticket)
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 border-4 border-white rounded-full ${
                      ticket.status === 'OPEN'
                        ? 'bg-red-500'
                        : ticket.status === 'IN_PROGRESS'
                        ? 'bg-yellow-500'
                        : 'bg-gray-300'
                    }`}
                  />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-gray-900 truncate">{getName(ticket)}</h3>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {format(new Date(ticket.updatedAt), 'MMM d')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {ticket.lastMessage?.text || ticket.subject || 'No messages'}
                  </p>
                </div>
                {ticket.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                    {ticket.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedChat && currentTicket ? (
        <div className="flex-1 flex flex-col bg-gray-50/30">
          {/* Top Bar */}
          <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between px-8 py-4 shadow-sm shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
                {currentTicket.user?.avatar ? (
                  <img src={currentTicket.user.avatar} alt="avatar" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  getInitials(currentTicket)
                )}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{getName(currentTicket)}</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={currentTicket.status}
                    onChange={(e) =>
                      updateTicketStatus({ ticketId: currentTicket.id, status: e.target.value as TicketStatus })
                    }
                    className={`text-xs font-medium border-none bg-transparent p-0 outline-none cursor-pointer ${
                      currentTicket.status === 'OPEN'
                        ? 'text-red-500'
                        : currentTicket.status === 'IN_PROGRESS'
                        ? 'text-yellow-500'
                        : currentTicket.status === 'RESOLVED'
                        ? 'text-green-500'
                        : 'text-gray-500'
                    }`}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex justify-center">
              <span className="bg-white border border-gray-100 px-4 py-1 rounded-full text-[10px] text-gray-400 font-medium">
                {format(new Date(currentTicket.createdAt), 'MMMM d, yyyy')}
              </span>
            </div>

            {currentChatData?.messages?.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[70%] ${msg.sender === 'ADMIN' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                      msg.sender === 'ADMIN' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {msg.sender === 'ADMIN' ? 'AD' : getInitials(currentTicket)}
                  </div>
                  <div>
                    <div
                      className={`p-4 rounded-2xl shadow-sm ${
                        msg.sender === 'ADMIN'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-2 ${msg.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {format(new Date(msg.createdAt), 'hh:mm a')}
                      </span>
                      {msg.sender === 'ADMIN' && (
                        msg.readAt
                          ? <CheckCheck size={14} className="text-blue-500" />
                          : <Check size={14} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isOtherSideTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[70%]">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                    {getInitials(currentTicket)}
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm p-4 text-xs flex items-center gap-1 h-10">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 bg-white border-t border-gray-100 shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-4 bg-gray-50 p-2 pl-4 rounded-2xl border border-gray-100 focus-within:border-blue-500/30 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all"
            >
              <div className="flex items-center gap-1">
                <button type="button" className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-blue-600">
                  <Paperclip size={20} />
                </button>
              </div>
              <input
                type="text"
                value={message}
                onChange={handleMessageChange}
                placeholder="Type your response..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 outline-none"
                disabled={currentTicket.status === 'CLOSED'}
              />
              <button
                type="submit"
                disabled={!message.trim() || currentTicket.status === 'CLOSED'}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/20">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6">
            <User size={40} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Select a conversation</h2>
          <p className="text-gray-500 max-w-xs">
            Choose a customer from the left to view their profile and start chatting with them.
          </p>
        </div>
      )}

      {/* Right Sidebar - Info Panel */}
      {selectedChat && currentTicket && (
        <div className="w-72 border-l border-gray-100 bg-white flex flex-col p-6 overflow-y-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 rounded-3xl flex items-center justify-center font-bold text-2xl mx-auto mb-4 overflow-hidden">
              {currentTicket.user?.avatar ? (
                <img src={currentTicket.user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(currentTicket)
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{getName(currentTicket)}</h2>
            {currentTicket.user ? (
              <p className="text-xs text-gray-500 mt-1">Authenticated User</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Guest User</p>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Customer Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900 truncate ml-2">
                    {currentTicket.user?.email || currentTicket.guestEmail || 'N/A'}
                  </span>
                </div>
                {currentTicket.user && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Joined</span>
                    <span className="font-medium text-gray-900">
                      {format(new Date(currentTicket.user.createdAt), 'MMM yyyy')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Subject</span>
                  <span className="font-medium text-gray-900 truncate ml-2">{currentTicket.subject}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <button
                onClick={() => updateTicketStatus({ ticketId: currentTicket.id, status: 'CLOSED' })}
                disabled={currentTicket.status === 'CLOSED'}
                className="w-full py-3 border border-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChat;
