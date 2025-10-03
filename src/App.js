import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Firebase imports
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set } from "firebase/database";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC7vOLrqM3G6JFGica-YbSIj9e3NF6VXFo",
  authDomain: "monad-meme-quizhub.firebaseapp.com",
  databaseURL: "https://monad-meme-quizhub-default-rtdb.firebaseio.com",
  projectId: "monad-meme-quizhub",
  storageBucket: "monad-meme-quizhub.firebasestorage.app",
  messagingSenderId: "233873155237",
  appId: "1:233873155237:web:50dfd7652c9c1a2f59d94c",
  measurementId: "G-R9X8N1T04D"
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

  const modifyXp = (delta) =>
    setXpRaw((prev) => Math.max(0, Math.min(200, prev + delta)));

  // Generate unique user ID
  useEffect(() => {
    let uid = localStorage.getItem("userId");
    if (!uid) {
      uid = Date.now() + "_" + Math.floor(Math.random() * 1000);
      localStorage.setItem("userId", uid);
    }
    setUserId(uid);
  }, []);

  // Save XP locally
  useEffect(() => { localStorage.setItem("xp", xp); }, [xp]);

  // Real-time listener for memes
  useEffect(() => {
    const memesRef = ref(db, "memes");
    onValue(memesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const memeArr = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setMemes(memeArr.sort((a, b) => b.id - a.id)); // newest first
      } else setMemes([]);
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
    const newMemeRef = push(ref(db, "memes"));
    set(newMemeRef, {
      ownerId: userId,
      image: selectedImage,
      caption: captionInput.trim() || "",
      likes: 0,
      likedBy: {},
      comments: [],
      reactions: { "😂": 0, "🔥": 0, "🤣": 0, "❤️": 0 }
    });
    setSelectedImage(null);
    setCaptionInput("");
  };

  const toggleLike = (meme) => {
    const memeRef = ref(db, `memes/${meme.id}/likedBy`);
    const updatedLikedBy = { ...(meme.likedBy || {}) };
    if (updatedLikedBy[userId]) delete updatedLikedBy[userId];
    else updatedLikedBy[userId] = true;
    set(memeRef, updatedLikedBy);

    // Update total likes count
    const likesRef = ref(db, `memes/${meme.id}/likes`);
    const totalLikes = Object.keys(updatedLikedBy).length;
    set(likesRef, totalLikes);
  };

  const addReaction = (meme, emoji) => {
    const reactionRef = ref(db, `memes/${meme.id}/reactions/${emoji}`);
    set(reactionRef, (meme.reactions[emoji] || 0) + 1);
  };

  const addComment = (id, text) => {
    if (!text.trim()) return;
    const commentRef = ref(db, `memes/${id}/comments`);
    const updated = [...(memes.find((m) => m.id === id)?.comments || []), text.trim()];
    set(commentRef, updated);
  };

  const deleteMeme = (id, ownerId) => {
    if (ownerId !== userId) return;
    if (window.confirm("Are you sure you want to delete this meme? 😭")) {
      const memeRef = ref(db, `memes/${id}`);
      set(memeRef, null);
    }
  };

  const handleAnswer = (qIndex, clickedIdx) => {
    if (quizState[qIndex]?.answered) return;
    const correctIndex = quizQuestions[qIndex].answer;
    const isCorrect = clickedIdx === correctIndex;

    setQuizState((prev) => ({
      ...prev,
      [qIndex]: { answered: true, clicked: clickedIdx, correctIndex },
    }));

    if (isCorrect) modifyXp(10);
    else modifyXp(-10);

    showPopup(
      isCorrect ? "Good! +10 XP 🟢" : "Whooops! -10 XP 🔴",
      isCorrect ? "green" : "red"
    );
  };

  const showPopup = (text, color) => {
    setPopup({ text, color });
    setTimeout(() => setPopup(null), 1500);
  };

  const handleMemesClick = () => setPage("memes");
  const handleQuizClick = () => {
    localStorage.removeItem("quizQuestions");
    setQuizState({});
    setPage("quiz");
  };

  const togglePhonk = () => {
    if (audioRef.current) {
      if (playPhonk) audioRef.current.pause();
      else audioRef.current.play();
    }
    setPlayPhonk(!playPhonk);
  };

  // Quiz questions remain same as your original code
  const quizQuestionsData = [
    { q: "Who is Keonehon?", correct: "All of the above… and maybe more 🤯", wrong: ["Human CEO 😎", "Meme overlord of Monad 🖼️", "Secret alien strategist 👽"] },
    { q: "Who is BillMonday?", correct: "Human who hates Mondays 😅", wrong: ["Secretly a coffee-powered AI ☕🤖", "Alien visiting Earth only on Mondays 👽", "The guy who makes every Monday feel like Friday… eventually 😎"] },
    { q: "Who is Mikeweb?", correct: "AI in disguise 🤖", wrong: ["Human", "Alien from another server 👽", "The one who actually runs Discord while we sleep 😎"] },
    { q: "What is Monad primarily known for?", correct: "Layer 1 blockchain", wrong: ["Smart contracts", "Gaming engine", "AI framework"] },
    // ... rest of quiz questions
  ];

  useEffect(() => {
    if (page !== "quiz") return;
    const savedQuestions = localStorage.getItem("quizQuestions");
    if (savedQuestions) setQuizQuestions(JSON.parse(savedQuestions));
    else {
      const prepared = quizQuestionsData.map((q) => {
        const options = [...q.wrong, q.correct].sort(() => Math.random() - 0.5);
        const answer = options.indexOf(q.correct);
        return { ...q, options, answer };
      });
      setQuizQuestions(prepared);
      localStorage.setItem("quizQuestions", JSON.stringify(prepared));
    }
  }, [page]);

  return (
    <div className="app-container">
      <h1>{page === "memes" ? "Monad Meme Hub 🎉" : "Monad Quiz Hub 🧠"}</h1>

      <div className="nav-buttons">
        <button onClick={handleMemesClick} className={page === "memes" ? "active-btn" : ""}>Memes</button>
        <button onClick={handleQuizClick} className={page === "quiz" ? "active-btn" : ""}>Quiz</button>
        <button
          onClick={togglePhonk}
          style={{ background: "#ff4d6d", color: "white", padding: "5px 10px", borderRadius: "8px", fontWeight: "bold" }}
        >
          {playPhonk ? "Pause Phonk ⏸" : "Play Phonk 🎵"}
        </button>
      </div>

      <audio ref={audioRef} src="/ACELERADA.mp3" loop />

      {popup && <div className={`popup ${popup.color}`}>{popup.text}</div>}

      {page === "memes" && (
        <div className="memes-container">
          <div className="meme-post" onDrop={handleDrop} onDragOver={handleDragOver}>
            {selectedImage && <img src={selectedImage} className="meme-preview" alt="preview" />}
            <input
              type="text"
              placeholder="Type your legendary meme caption here 😂"
              value={captionInput}
              onChange={(e) => setCaptionInput(e.target.value)}
              className="caption-input"
            />
            <div className="file-buttons">
              <label htmlFor="fileUpload" className="file-label">Select Image</label>
              <input id="fileUpload" type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
              {selectedImage && <button onClick={handlePostMeme} className="post-btn">Post Meme</button>}
            </div>
          </div>

          {memes.map((m) => (
            <div key={m.id} className="meme-card">
              <img src={m.image} className="meme-img" alt="meme" />
              {m.caption && <p className="meme-caption">{m.caption}</p>}
              <div className="meme-actions">
                <button onClick={() => toggleLike(m)} className="like-btn">
                  {m.likedBy && m.likedBy[userId] ? "❤️" : "🤍"} <span className="count-text">{m.likes || 0}</span>
                </button>
                {Object.keys(m.reactions || {}).map((e) => (
                  <button key={e} onClick={() => addReaction(m, e)} className="reaction-btn">
                    {e} <span className="count-text">{m.reactions[e] || 0}</span>
                  </button>
                ))}
                {m.ownerId === userId && (
                  <button onClick={() => deleteMeme(m.id, m.ownerId)} className="delete-btn">
                    Delete
                  </button>
                )}
              </div>
              <CommentSection meme={m} addComment={addComment} />
            </div>
          ))}
        </div>
      )}

      {page === "quiz" && (
        <div className="quiz-container">
          <h3 className="xp-display">XP: {xp}</h3>
          {quizQuestions.map((q, i) => (
            <div key={i} className="quiz-card">
              <p className="quiz-question">{q.q}</p>
              {q.options.map((opt, idx) => {
                let className = "quiz-btn";
                const answered = quizState[i]?.answered;
                const clicked = quizState[i]?.clicked;
                const correctIdx = q.answer;

                if (answered) {
                  if (idx === correctIdx) className += " correct-glow";
                  if (clicked === idx && clicked !== correctIdx) className += " wrong-glow";
                }

                return <button key={idx} className={className} disabled={answered} onClick={() => handleAnswer(i, idx)}>{opt}</button>;
              })}
            </div>
          ))}
        </div>
      )}

      <footer className="app-footer">
        Created by <a href="https://discord.com/users/saiff_btx" target="_blank" rel="noopener noreferrer">Saif 🚀 | Discord: saiff_btx</a> | <a href="https://x.com/Saif_btx?t=Q-ONqoHPrnL6aNXAZrvlDg&s=09" target="_blank" rel="noopener noreferrer">X: saif-btx</a> <br />
        Memes included for free
      </footer>
    </div>
  );
}

function CommentSection({ meme, addComment }) {
  const [show, setShow] = useState(false);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() !== "") {
      addComment(meme.id, input);
      setInput("");
    }
  };

  return (
    <div className="comment-section">
      <button onClick={() => setShow(!show)} className="show-comments-btn">
        {show ? "Hide Comments" : `View Comments (${(meme.comments || []).length})`}
      </button>
      {show && (
        <div className="comments-container">
          {(meme.comments || []).map((c, i) => <p key={i} className="comment-text">{c}</p>)}
          <div style={{ display: "flex", gap: "5px", alignItems: "center", marginTop: "5px" }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} placeholder="Add a comment..." className="comment-input"/>
            <button onClick={handleSend} className="send-btn">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
