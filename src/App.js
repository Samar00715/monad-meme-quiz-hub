import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push } from "firebase/database";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC7vOLrqM3G6JFGica-YbSIj9e3NF6VXFo",
  authDomain: "monad-meme-quizhub.firebaseapp.com",
  databaseURL: "https://monad-meme-quizhub-default-rtdb.firebaseio.com",
  projectId: "monad-meme-quizhub",
  storageBucket: "monad-meme-quizhub.appspot.com",
  messagingSenderId: "233873155237",
  appId: "1:233873155237:web:50dfd7652c9c1a2f59d94c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function App() {
  const audioRef = useRef(null);
  const [page, setPage] = useState("memes");
  const [memes, setMemes] = useState([]);
  const [xp, setXpRaw] = useState(() => {
    const saved = localStorage.getItem("xp");
    return saved ? Number(saved) : 0;
  });
  const [popup, setPopup] = useState(null);
  const [quizState, setQuizState] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [captionInput, setCaptionInput] = useState("");
  const [userId, setUserId] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [playPhonk, setPlayPhonk] = useState(false);

  // Quiz Data (all 18-19 questions)
  const quizQuestionsData = [
    { q: "Who is Keonehon?", correct: "All of the above… and maybe more 🤯", wrong: ["Human CEO 😎", "Meme overlord of Monad 🖼️", "Secret alien strategist 👽"] },
    { q: "Who is BillMonday?", correct: "Human who hates Mondays 😅", wrong: ["Secretly a coffee-powered AI ☕🤖", "Alien visiting Earth only on Mondays 👽", "The guy who makes every Monday feel like Friday… eventually 😎"] },
    { q: "Who is Mikeweb?", correct: "AI in disguise 🤖", wrong: ["Human", "Alien from another server 👽", "The one who actually runs Discord while we sleep 😎"] },
    { q: "What is Monad primarily known for?", correct: "Layer 1 blockchain", wrong: ["Smart contracts", "Gaming engine", "AI framework"] },
    { q: "Monad focuses on which key feature?", correct: "Parallel execution", wrong: ["Privacy coins", "Cross-chain swaps", "NFTs"] },
    { q: "Transaction finality in Monad is?", correct: "Seconds", wrong: ["Minutes", "Hours", "Instant"] },
    { q: "Monad is built for?", correct: "Scalability", wrong: ["Mining", "Stablecoins", "Private payments"] },
    { q: "What is Monad’s consensus mechanism?", correct: "Proof of Stake", wrong: ["Proof of Work", "Hybrid", "Delegated Proof"] },
    { q: "Monad is compatible with?", correct: "EVM", wrong: ["Bitcoin scripts", "Cosmos SDK", "Rust only"] },
    { q: "Which year was Monad announced?", correct: "2023", wrong: ["2021", "2020", "2022"] },
    { q: "Monad aims to handle how many TPS?", correct: "50,000+", wrong: ["10,000+", "500", "1,000"] },
    { q: "Monad team mainly from?", correct: "Jump Trading", wrong: ["Coinbase", "Binance", "Polygon"] },
    { q: "Monad uses what to speed up?", correct: "Parallel execution", wrong: ["Shard chains", "Sidechains", "Rollups"] },
    { q: "Monad primarily focuses on?", correct: "High throughput", wrong: ["Privacy tokens", "Stablecoins", "Yield farming"] },
    { q: "Which programming language is mainly used in Monad?", correct: "Rust", wrong: ["Python", "Solidity", "C++"] },
    { q: "Monad supports which kind of smart contracts?", correct: "EVM-compatible", wrong: ["Bitcoin Script", "Move", "Scilla"] },
    { q: "Monad’s parallel execution helps in?", correct: "Faster transactions", wrong: ["Lower fees", "Higher mining rewards", "NFT minting"] },
    { q: "Monad ecosystem mainly targets?", correct: "DeFi and Web3 apps", wrong: ["Only gaming", "Only NFTs", "Centralized apps"] },
  ];

  const modifyXp = (delta) =>
    setXpRaw((prev) => Math.max(0, Math.min(200, prev + delta)));

  function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  useEffect(() => {
    let uid = localStorage.getItem("userId");
    if (!uid) {
      uid = Date.now() + "_" + Math.floor(Math.random() * 1000);
      localStorage.setItem("userId", uid);
    }
    setUserId(uid);
  }, []);

  // XP save
  useEffect(() => { localStorage.setItem("xp", xp); }, [xp]);

  // Load quiz questions
  useEffect(() => {
    if (page !== "quiz") return;
    const prepared = quizQuestionsData.map((q) => {
      const options = shuffleArray([q.correct, ...q.wrong]);
      const answer = options.indexOf(q.correct);
      return { ...q, options, answer };
    });
    setQuizQuestions(prepared);
  }, [page]);

  // Load memes from Firebase
  useEffect(() => {
    const memesRef = ref(db, "memes");
    onValue(memesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.values(data).sort((a,b)=>b.id-a.id);
      setMemes(list);
    });
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };
  const handleDragOver = (e) => e.preventDefault();

  const handlePostMeme = () => {
    if (!selectedImage) return;
    const newMeme = {
      id: Date.now(),
      ownerId: userId,
      image: selectedImage,
      caption: captionInput.trim() || "",
      likes: 0,
      reactions: { "😂": 0, "🔥": 0, "🤣": 0, "❤️": 0 },
      comments: [],
    };
    const memesRef = ref(db, "memes");
    push(memesRef, newMeme);
    setSelectedImage(null);
    setCaptionInput("");
  };

  const toggleLike = (meme) => {
    const updated = { ...meme };
    updated.likes = (updated.likes || 0) + (meme.liked ? -1 : 1);
    updated.liked = !meme.liked;
    set(ref(db, `memes/${meme.id}`), updated);
  };

  const addReaction = (meme, emoji) => {
    const updated = { ...meme };
    if (!updated.reactions) updated.reactions = {};
    updated.reactions[emoji] = (updated.reactions[emoji] || 0) + 1;
    set(ref(db, `memes/${meme.id}`), updated);
  };

  const addComment = (meme, text) => {
    if (!text.trim()) return;
    const updated = { ...meme };
    updated.comments = [...(updated.comments || []), text.trim()];
    set(ref(db, `memes/${meme.id}`), updated);
  };

  const handleAnswer = (qIndex, clickedIdx) => {
    if (quizState[qIndex]?.answered) return;
    const correctIndex = quizQuestions[qIndex].answer;
    const isCorrect = clickedIdx === correctIndex;
    setQuizState((prev) => ({
      ...prev,
      [qIndex]: { answered: true, clicked: clickedIdx, correctIndex },
    }));
    modifyXp(isCorrect ? 10 : -10);
    showPopup(isCorrect ? "Good! +10 XP 🟢" : "Whooops! -10 XP 🔴", isCorrect ? "green" : "red");
  };

  const showPopup = (text, color) => {
    setPopup({ text, color });
    setTimeout(() => setPopup(null), 1500);
  };

  const togglePhonk = () => {
    if (audioRef.current) {
      if (playPhonk) audioRef.current.pause();
      else audioRef.current.play();
    }
    setPlayPhonk(!playPhonk);
  };

  return (
    <div className="app-container">
      <h1>{page === "memes" ? "Monad Meme Hub 🎉" : "Monad Quiz Hub 🧠"}</h1>

      <div className="nav-buttons">
        <button onClick={() => setPage("memes")} className={page==="memes"?"active-btn":""}>Memes</button>
        <button onClick={() => setPage("quiz")} className={page==="quiz"?"active-btn":""}>Quiz</button>
        <button onClick={togglePhonk} style={{ background: "#ff4d6d", color: "white", padding: "5px 10px", borderRadius: "8px", fontWeight: "bold" }}>
          {playPhonk ? "Pause Phonk ⏸" : "Play Phonk 🎵"}
        </button>
      </div>

      <audio ref={audioRef} src="/ACELERADA.mp3" loop />

      {popup && <div className={`popup ${popup.color}`}>{popup.text}</div>}

      {page==="memes" && (
        <div className="memes-container">
          <div className="meme-post" onDrop={handleDrop} onDragOver={handleDragOver}>
            {selectedImage && <img src={selectedImage} className="meme-preview" alt="preview" />}
            <input type="text" placeholder="Type your legendary meme caption here 😂" value={captionInput} onChange={e=>setCaptionInput(e.target.value)} className="caption-input"/>
            <div className="file-buttons">
              <label htmlFor="fileUpload" className="file-label">Select Image</label>
              <input id="fileUpload" type="file" accept="image/*" onChange={handleFileSelect} style={{display:"none"}}/>
              {selectedImage && <button onClick={handlePostMeme} className="post-btn">Post Meme</button>}
            </div>
          </div>

          {memes.map((m)=><MemeCard key={m.id} meme={m} userId={userId} toggleLike={toggleLike} addReaction={addReaction} addComment={addComment}/>)}
        </div>
      )}

      {page==="quiz" && (
        <div className="quiz-container">
          <h3 className="xp-display">XP: {xp}</h3>
          {quizQuestions.map((q,i)=>(
            <div key={i} className="quiz-card">
              <p className="quiz-question">{q.q}</p>
              {q.options.map((opt, idx)=>{
                let className="quiz-btn";
                const answered=quizState[i]?.answered;
                const clicked=quizState[i]?.clicked;
                const correctIdx=q.answer;
                if(answered){
                  if(idx===correctIdx) className+=" correct-glow";
                  if(clicked===idx && clicked!==correctIdx) className+=" wrong-glow";
                }
                return <button key={idx} className={className} disabled={answered} onClick={()=>handleAnswer(i,idx)}>{opt}</button>
              })}
            </div>
          ))}
        </div>
      )}

      <footer className="app-footer">
        Created by <a href="https://discord.com/users/saiff_btx" target="_blank" rel="noopener noreferrer">Saif 🚀 | Discord: saiff_btx</a> | <a href="https://x.com/Saif_btx" target="_blank" rel="noopener noreferrer">X: saif-btx</a> <br/>
        Memes included for free
      </footer>
    </div>
  );
}

function MemeCard({meme, userId, toggleLike, addReaction, addComment}){
  const [show,setShow]=useState(false);
  const [input,setInput]=useState("");

  const handleSend=()=>{ if(input.trim()!==""){ addComment(meme,input); setInput(""); } }

  return (
    <div className="meme-card">
      <img src={meme.image} className="meme-img" alt="meme"/>
      {meme.caption && <p className="meme-caption">{meme.caption}</p>}
      <div className="meme-actions">
        <button onClick={()=>toggleLike(meme)} className={`like-btn ${meme.liked?"reaction-highlight":""}`}>
          {meme.liked?"❤️":"🤍"} <span className="count-text">{meme.likes||0}</span>
        </button>
        {Object.keys(meme.reactions||{}).map(e=>
          <button key={e} onClick={()=>addReaction(meme,e)} className={`reaction-btn`}>{e} <span className="count-text">{meme.reactions[e]}</span></button>
        )}
      </div>
      <div className="comment-section">
        <button onClick={()=>setShow(!show)} className="show-comments-btn">{show?`Hide Comments`:`View Comments (${(meme.comments||[]).length})`}</button>
        {show && <div className="comments-container">
          {(meme.comments||[]).map((c,i)=><p key={i} className="comment-text">{c}</p>)}
          <div style={{display:"flex",gap:"5px",alignItems:"center",marginTop:"5px"}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") handleSend()}} placeholder="Add a comment..." className="comment-input"/>
            <button onClick={handleSend} className="send-btn">Send</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

export default App;
