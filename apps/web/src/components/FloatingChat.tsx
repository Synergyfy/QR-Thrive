import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Paperclip, Maximize2, Minimize2,
  User, Mail, MessageSquare, Check, CheckCheck
} from 'lucide-react';
import { useCurrentUser } from '../hooks/useApi';
import { useSupport } from '../hooks/useSupport';
import { format } from 'date-fns';

const FloatingChat: React.FC = () => {
  const { data: authData } = useCurrentUser();
  const isAuthenticated = !!authData?.user;

  const { useMyTicket, createTicketAsync, sendMessageAsync, socket } = useSupport();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [leadData, setLeadData] = useState({ name: '', email: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOtherSideTyping, setIsOtherSideTyping] = useState(false);

  const { data, refetch } = useMyTicket(isOpen && isAuthenticated);
  const ticketData = data as any;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTypingEmit = useRef<number>(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // ── Scroll to bottom ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticketData?.messages, isOpen, isMinimized, isOtherSideTyping]);

  // ── WS: listen for admin typing ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data: { ticketId: string; sender: string; isTyping: boolean }) => {
      if (data.sender !== 'ADMIN') return;
      setIsOtherSideTyping(data.isTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (data.isTyping) {
        typingTimeoutRef.current = setTimeout(() => setIsOtherSideTyping(false), 4000);
      }
    };

    socket.on('typing', handleTyping);
    return () => {
      socket.off('typing', handleTyping);
    };
  }, [socket]);

  // ── Emit typing to admin ──────────────────────────────────────────────────────
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessage(val);

    const ticketId = ticketData?.ticket?.id;
    if (!socket || !ticketId) return;

    const now = Date.now();
    if (val && now - lastTypingEmit.current > 2000) {
      socket.emit('typing', { ticketId, isTyping: true });
      lastTypingEmit.current = now;
      isTypingRef.current = true;
    } else if (!val && isTypingRef.current) {
      socket.emit('typing', { ticketId, isTyping: false });
      isTypingRef.current = false;
    }
  }, [socket, ticketData?.ticket?.id]);

  // ── Send ──────────────────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated) return;

    const currentText = message;
    setMessage('');

    // Stop typing indicator
    const ticketId = ticketData?.ticket?.id;
    if (socket && ticketId) {
      socket.emit('typing', { ticketId, isTyping: false });
      isTypingRef.current = false;
    }

    try {
      let tid = ticketId;
      if (!tid) {
        const newTicket = await createTicketAsync({ subject: 'Support Request' });
        tid = newTicket.id;
      }
      await sendMessageAsync({ ticketId: tid, text: currentText });
      refetch();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTicketAsync({
        guestName: leadData.name,
        guestEmail: leadData.email,
        subject: leadData.message,
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setIsOpen(false);
        setLeadData({ name: '', email: '', message: '' });
      }, 3000);
    } catch (err) {
      console.error('Failed to submit lead:', err);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <div className="relative w-full h-full">
        <motion.div
          drag
          dragMomentum={false}
          className="absolute pointer-events-auto bottom-[90px] lg:bottom-8 right-6 lg:right-8"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ cursor: isOpen ? 'default' : 'grab' }}
          dragListener={!isOpen}
        >
          <AnimatePresence mode="wait">
            {!isOpen ? (
              <motion.button
                key="fab"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-blue-700 transition-colors relative group"
              >
                <MessageCircle size={30} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                <div className="absolute right-full mr-4 bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium">
                  {isAuthenticated ? 'Chat with us!' : 'Leave a message'}
                </div>
              </motion.button>
            ) : (
              <motion.div
                key="chat-window"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  height: isMinimized ? '60px' : (isAuthenticated ? '500px' : '550px'),
                  width: '380px',
                }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 bg-blue-600 text-white flex items-center justify-between cursor-move shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                        QT
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-blue-600 rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Support Team</h3>
                      <p className="text-[10px] text-blue-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        {isAuthenticated ? 'Live Support' : 'Offline Message'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {!isMinimized && (
                  isAuthenticated ? (
                    <>
                      {/* Live Chat View */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {ticketData?.messages?.length === 0 && (
                          <div className="text-center text-gray-400 text-sm mt-4">
                            Send a message to start a conversation.
                          </div>
                        )}

                        {ticketData?.messages?.map((msg: any) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                msg.sender === 'USER'
                                  ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
                              }`}
                            >
                              <p>{msg.text}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === 'USER' ? 'text-blue-200' : 'text-gray-400'}`}>
                                <span className="text-[10px]">
                                  {format(new Date(msg.createdAt), 'hh:mm a')}
                                </span>
                                {msg.sender === 'USER' && (
                                  msg.readAt
                                    ? <CheckCheck size={14} className="text-blue-300" />
                                    : <Check size={14} />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {isOtherSideTyping && (
                          <div className="flex justify-start">
                            <div className="bg-white text-gray-500 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm p-3 text-xs flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                          <button type="button" className="text-gray-400 hover:text-blue-600 transition-colors">
                            <Paperclip size={20} />
                          </button>
                          <input
                            type="text"
                            value={message}
                            onChange={handleMessageChange}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!message.trim()}
                            className="p-2 bg-blue-600 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    /* Lead Capture Form */
                    <div className="flex-1 flex flex-col p-6 bg-white overflow-y-auto">
                      {isSubmitted ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                            <Send size={30} />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900">Message Sent!</h2>
                          <p className="text-gray-500 text-sm">
                            Thank you for reaching out. Our team will get back to you at {leadData.email} soon.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">How can we help?</h2>
                            <p className="text-gray-500 text-sm mt-1">
                              Please fill out the form below and we'll reply as soon as possible.
                            </p>
                          </div>

                          <form onSubmit={handleLeadSubmit} className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                                Full Name
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                  required
                                  type="text"
                                  value={leadData.name}
                                  onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                                  placeholder="John Doe"
                                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                                Email Address
                              </label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                  required
                                  type="email"
                                  value={leadData.email}
                                  onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                                  placeholder="john@example.com"
                                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                                Your Message
                              </label>
                              <div className="relative">
                                <MessageSquare className="absolute left-3 top-4 text-gray-400" size={18} />
                                <textarea
                                  required
                                  rows={4}
                                  value={leadData.message}
                                  onChange={(e) => setLeadData({ ...leadData, message: e.target.value })}
                                  placeholder="Tell us what you need help with..."
                                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 group"
                            >
                              Send Message
                              <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  )
                )}

                <div className="bg-white p-2 text-center shrink-0 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400">Powered by QR-Thrive Support</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default FloatingChat;
