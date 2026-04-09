import React, { useState } from 'react';
import { 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  Send, 
  ImageIcon, 
  File, 
  User,
  CheckCheck,
  Filter
} from 'lucide-react';

const AdminChat: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [message, setMessage] = useState('');

  const chats = [
    { id: 1, name: "John Doe", lastMessage: "How do I create a dynamic QR?", time: "2m ago", unread: 2, status: 'online', avatar: 'JD' },
    { id: 2, name: "Sarah Smith", lastMessage: "The payment was successful.", time: "15m ago", unread: 0, status: 'offline', avatar: 'SS' },
    { id: 3, name: "Mike Johnson", lastMessage: "Can you help with my logo?", time: "1h ago", unread: 0, status: 'online', avatar: 'MJ' },
    { id: 4, name: "Digital Solutions Ltd", lastMessage: "We need an enterprise plan.", time: "3h ago", unread: 0, status: 'offline', avatar: 'DS' },
  ];

  const currentMessages = [
    { id: 1, text: "Hello! I'm interested in the premium plan.", sender: 'user', time: '10:30 AM' },
    { id: 2, text: "Hi John! That's great to hear. I can help you with that.", sender: 'admin', time: '10:31 AM' },
    { id: 3, text: "How do I create a dynamic QR code after upgrading?", sender: 'user', time: '10:32 AM' },
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      {/* Sidebar - Chat List */}
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <Filter size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-gray-50 ${
                selectedChat === chat.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-sm">
                  {chat.avatar}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-4 border-white rounded-full ${
                  chat.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-gray-900 truncate">{chat.name}</h3>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{chat.time}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-gray-50/30">
          {/* Top Bar */}
          <div className="p-4 bg-white border-bottom border-gray-100 flex items-center justify-between px-8 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
                {chats.find(c => c.id === selectedChat)?.avatar}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{chats.find(c => c.id === selectedChat)?.name}</h2>
                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                <Phone size={20} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                <Video size={20} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                <Info size={20} />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-2"></div>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex justify-center">
              <span className="bg-white border border-gray-100 px-4 py-1 rounded-full text-[10px] text-gray-400 font-medium">
                TODAY, APRIL 9
              </span>
            </div>
            
            {currentMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[70%] ${msg.sender === 'admin' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                    msg.sender === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {msg.sender === 'admin' ? 'AD' : 'JD'}
                  </div>
                  <div>
                    <div className={`p-4 rounded-2xl shadow-sm ${
                      msg.sender === 'admin' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-2 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-gray-400 font-medium">{msg.time}</span>
                      {msg.sender === 'admin' && <CheckCheck size={14} className="text-blue-500" />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="flex items-center gap-4 bg-gray-50 p-2 pl-4 rounded-2xl border border-gray-100 focus-within:border-blue-500/30 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-blue-600">
                  <ImageIcon size={20} />
                </button>
                <button className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-blue-600">
                  <File size={20} />
                </button>
              </div>
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
              />
              <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                Send <Send size={16} />
              </button>
            </div>
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
      {selectedChat && (
        <div className="w-72 border-l border-gray-100 bg-white flex flex-col p-6 overflow-y-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 rounded-3xl flex items-center justify-center font-bold text-2xl mx-auto mb-4">
              JD
            </div>
            <h2 className="text-lg font-bold text-gray-900">John Doe</h2>
            <p className="text-xs text-gray-500 mt-1">Free Tier User • Lagos, NG</p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Customer Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900">john@example.com</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Joined</span>
                  <span className="font-medium text-gray-900">2 months ago</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Total Scans</span>
                  <span className="font-medium text-gray-900">1,234</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Shared Files</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  <ImageIcon size={20} />
                </div>
                <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  <ImageIcon size={20} />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <button className="w-full py-3 border border-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all">
                Block User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChat;
