import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut
} from 'firebase/auth';
import {
  collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, deleteDoc
} from 'firebase/firestore';
import {
  Send, LogOut, MessageSquare, ShieldCheck, Search, MoreVertical, Sun, Moon, ChevronLeft, Paperclip, Trash2
} from 'lucide-react';

// --- HELPER: Get Initials for Avatars ---
const getInitials = (email) => email?.charAt(0).toUpperCase() || '?';

// --- COMPONENT: Animated Typing Dots ---
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none w-fit animate-pulse">
      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  // Theme Toggle Logic
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const isAdmin = u.email === "admin@test.com"; // Set your admin email here
        setRole(isAdmin ? "admin" : "user");

        // Sync user presence to Firestore
        await setDoc(doc(db, "users", isAdmin ? "ADMIN_ID" : u.uid), {
          email: u.email,
          lastActive: serverTimestamp(),
          isTyping: false
        }, { merge: true });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-950 text-indigo-600">
      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="font-black tracking-widest uppercase text-xs">SupportFlow</p>
    </div>
  );

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Universal Theme Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-6 right-6 z-[999] p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
      >
        {darkMode ? <Sun className="text-yellow-400" size={20} /> : <Moon className="text-indigo-600" size={20} />}
      </button>

      {user ? (
        role === 'admin' ? <AdminDashboard user={user} /> : <UserDashboard user={user} />
      ) : (
        <Login />
      )}
    </div>
  );
}

// --- LOGIN COMPONENT ---
function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, pw);
      else await createUserWithEmailAndPassword(auth, email, pw);
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors relative overflow-hidden font-['Plus_Jakarta_Sans']">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none mb-4 rotate-3">
            <MessageSquare className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">SupportFlow</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-semibold italic">Real-time Terminal</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input className="w-full bg-slate-100 dark:bg-slate-800 border-none p-4 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Email Address" onChange={e => setEmail(e.target.value)} />
          <input className="w-full bg-slate-100 dark:bg-slate-800 border-none p-4 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" type="password" placeholder="Password" onChange={e => setPw(e.target.value)} />
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 uppercase tracking-widest text-sm">
            {isLogin ? "Login to Dashboard" : "Create Support ID"}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-8 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest hover:underline">
          {isLogin ? "New user? Register here" : "Return to Login"}
        </button>
      </div>
    </div>
  );
}

// --- ADMIN DASHBOARD ---
function AdminDashboard({ user }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("lastActive", "desc"));
    return onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.id !== "ADMIN_ID"));
    });
  }, []);

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 md:p-4 gap-4 transition-colors">
      <aside className={`${selectedUser ? 'hidden' : 'flex'} md:flex w-full md:w-[350px] flex-col bg-white dark:bg-slate-900 md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><ShieldCheck size={20} /></div>
            <h1 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter">Queue</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full bg-slate-100 dark:bg-slate-800 p-3 pl-10 rounded-xl text-sm outline-none border-none dark:text-white transition-all focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {filteredUsers.map(u => (
            <div
              key={u.id} onClick={() => setSelectedUser(u)}
              className={`p-4 rounded-[1.8rem] cursor-pointer flex items-center gap-4 transition-all ${selectedUser?.id === u.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${selectedUser?.id === u.id ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600'}`}>{getInitials(u.email)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-sm">{u.email}</p>
                {u.isTyping ? <p className="text-[10px] animate-pulse font-black uppercase tracking-widest text-indigo-300">Typing...</p> : <p className="text-[10px] opacity-50 uppercase tracking-widest font-bold">Customer</p>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => signOut(auth)} className="m-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:text-red-500 transition-all">
          <LogOut size={16} /> LOGOUT TERMINAL
        </button>
      </aside>

      <main className={`${!selectedUser ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-white dark:bg-slate-900 md:rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden`}>
        {selectedUser ? (
          <>
            <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
              <button className="md:hidden p-2 text-indigo-600" onClick={() => setSelectedUser(null)}><ChevronLeft /></button>
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">{getInitials(selectedUser.email)}</div>
              <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">{selectedUser.email}</h2>
            </header>
            <ChatWindow chatId={selectedUser.id} currentUser={user} isChattingWithAdmin={false} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-200 dark:text-slate-800 p-12 text-center">
            <MessageSquare size={120} strokeWidth={1} className="opacity-20 mb-4" />
            <p className="font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700">Select Conversation</p>
          </div>
        )}
      </main>
    </div>
  );
}

// --- USER DASHBOARD ---
function UserDashboard({ user }) {
  return (
    <div className="h-screen md:p-12 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-4xl h-full md:h-[800px] flex flex-col bg-white dark:bg-slate-900 md:rounded-[3.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <header className="p-8 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><MessageSquare size={24} /></div>
            <h1 className="font-black uppercase text-sm tracking-[0.2em]">Customer Support</h1>
          </div>
          <button onClick={() => signOut(auth)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><LogOut size={20} /></button>
        </header>
        <ChatWindow chatId={user.uid} currentUser={user} isChattingWithAdmin={true} />
      </div>
    </div>
  );
}

// --- CORE CHAT WINDOW COMPONENT ---
function ChatWindow({ chatId, currentUser, isChattingWithAdmin }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Listen for Messages
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsubMsgs = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // Listen for Typing Indicator
    const targetId = isChattingWithAdmin ? "ADMIN_ID" : chatId;
    const unsubTyping = onSnapshot(doc(db, "users", targetId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setRemoteIsTyping(data.isTyping && data.typingTo === currentUser.uid);
      }
    });

    return () => { unsubMsgs(); unsubTyping(); };
  }, [chatId]);

  const handleTyping = (val) => {
    setNewMessage(val);
    const myId = isChattingWithAdmin ? currentUser.uid : "ADMIN_ID";
    updateDoc(doc(db, "users", myId), {
      isTyping: val.length > 0,
      typingTo: isChattingWithAdmin ? "ADMIN_ID" : chatId
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateDoc(doc(db, "users", myId), { isTyping: false });
    }, 2000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const myId = isChattingWithAdmin ? currentUser.uid : "ADMIN_ID";
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    updateDoc(doc(db, "users", myId), { isTyping: false });

    const msg = newMessage;
    setNewMessage("");

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: msg,
      senderId: currentUser.uid,
      createdAt: serverTimestamp()
    });

    // Update the sidebar metadata
    await setDoc(doc(db, "users", chatId), {
      lastActive: serverTimestamp()
    }, { merge: true });
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteDoc(doc(db, "chats", chatId, "messages", msgId));
    } catch (err) {
      console.error("Error deleting message:", err);
      alert("Failed to delete message");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group items-end gap-2`}>
              {currentUser.email === "admin@test.com" && !isMe && (
                <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all">
                  <Trash2 size={14} />
                </button>
              )}
              <div className={`max-w-[85%] md:max-w-[70%] p-4 px-6 rounded-[2rem] text-[13px] font-medium leading-relaxed shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}>
                {msg.text}
              </div>
              {currentUser.email === "admin@test.com" && isMe && (
                <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
        {remoteIsTyping && <div className="flex justify-start"><TypingIndicator /></div>}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="p-8 pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-4 bg-white dark:bg-slate-900">
        <div className="flex-1 flex gap-3 bg-slate-100 dark:bg-slate-800 p-2 px-4 rounded-[2rem] border border-transparent focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <button type="button" className="text-slate-400 hover:text-indigo-600 transition-colors"><Paperclip size={20} /></button>
          <input
            value={newMessage} onChange={(e) => handleTyping(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 bg-transparent p-3 outline-none dark:text-white text-slate-900 font-medium text-sm placeholder:text-slate-400"
          />
          <button type="submit" className="bg-indigo-600 text-white p-3 px-5 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-90 flex items-center justify-center">
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}