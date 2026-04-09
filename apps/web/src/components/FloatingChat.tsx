import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MessageCircle, X, Send, Paperclip, Maximize2, Minimize2, User, Mail, MessageSquare } from 'lucide-react';
import { useCurrentUser } from '../hooks/useApi';

const FloatingChat: React.FC = () => {
  const { data: authData } = useCurrentUser();
  const isAuthenticated = !!authData?.user;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [leadData, setLeadData] = useState({ name: '', email: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there! 👋 How can we help you today?", sender: 'admin', time: '10:00 AM' }
  ]);
  
  const dragControls = useDragControls();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: message,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setMessage('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: "Thanks for your message! Our team will get back to you shortly. 📩",
        sender: 'admin',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call an API
    console.log('Lead submitted:', leadData);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsOpen(false);
      setLeadData({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <div className="relative w-full h-full">
        <motion.div
          drag
          dragMomentum={false}
          className="absolute pointer-events-auto"
          initial={{ right: 32, bottom: 32 }}
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
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
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
                  width: '380px'
                }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div 
                  className="p-4 bg-blue-600 text-white flex items-center justify-between cursor-move shrink-0"
                  onPointerDown={(e) => !isOpen && dragControls.start(e)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                        QT
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-blue-600 rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Support Team</h3>
                      <p className="text-[10px] text-blue-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
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
                        {messages.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                msg.sender === 'user' 
                                  ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
                              }`}
                            >
                              <p>{msg.text}</p>
                              <span className={`text-[10px] mt-1 block ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                                {msg.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                          <button type="button" className="text-gray-400 hover:text-blue-600 transition-colors">
                            <Paperclip size={20} />
                          </button>
                          <input 
                            type="text" 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 outline-none"
                          />
                          <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg shadow-lg">
                            <Send size={18} />
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    /* Lead Capture Form */
                    <div className="flex-1 flex flex-col p-6 bg-white">
                      {isSubmitted ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                            <Send size={30} />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900">Message Sent!</h2>
                          <p className="text-gray-500 text-sm">Thank you for reaching out. Our team will get back to you at {leadData.email} soon.</p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">How can we help?</h2>
                            <p className="text-gray-500 text-sm mt-1">Please fill out the form below and we'll reply as soon as possible.</p>
                          </div>
                          
                          <form onSubmit={handleLeadSubmit} className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                  required
                                  type="text" 
                                  value={leadData.name}
                                  onChange={(e) => setLeadData({...leadData, name: e.target.value})}
                                  placeholder="John Doe"
                                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                  required
                                  type="email" 
                                  value={leadData.email}
                                  onChange={(e) => setLeadData({...leadData, email: e.target.value})}
                                  placeholder="john@example.com"
                                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Your Message</label>
                              <div className="relative">
                                <MessageSquare className="absolute left-3 top-4 text-gray-400" size={18} />
                                <textarea 
                                  required
                                  rows={4}
                                  value={leadData.message}
                                  onChange={(e) => setLeadData({...leadData, message: e.target.value})}
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

