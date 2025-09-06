// 🔐 List of phone numbers that have paid
const paidCoaches = [
  "0812345678", // John paid
  "0855567890", // Mary paid
  "0833445566", // Alex paid
];

const socket = io();
let localStream;
let peerConnection;
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function startCamera(isCoach, roomId) {
  socket.emit("join-room", roomId, isCoach ? "coach" : "viewer");

  if (isCoach) {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        localStream = stream;
        document.getElementById("localVideo").srcObject = stream;
        setupConnection(isCoach);
      });
  } else {
    setupConnection(isCoach);
  }
}

function setupConnection(isCoach) {
  peerConnection = new RTCPeerConnection(config);

  if (isCoach && localStream) {
    localStream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStream));
  }

  peerConnection.ontrack = (event) => {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate);
    }
  };

  if (isCoach) {
    peerConnection.createOffer().then((offer) => {
      peerConnection.setLocalDescription(offer);
      socket.emit("offer", offer);
    });
  }

  socket.on("offer", (offer) => {
    if (!isCoach) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      peerConnection.createAnswer().then((answer) => {
        peerConnection.setLocalDescription(answer);
        socket.emit("answer", answer);
      });
    }
  });

  socket.on("answer", (answer) => {
    if (isCoach) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  });

  socket.on("candidate", (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  });
}

function sendMessage() {
  const input = document.getElementById("chat-input");
  const msg = input.value.trim();
  if (msg === "") return;
  socket.emit("chat-message", msg);
  input.value = "";
}

socket.on("chat-message", (data) => {
  const chatBox = document.getElementById("chat-box");
  const role = data.role === "coach" ? "Coach" : "Viewer";
  const message = `<p><strong>${role}:</strong> ${data.message}</p>`;
  chatBox.innerHTML += message;
  chatBox.scrollTop = chatBox.scrollHeight;
});

// ✅ CREATE PROFILE FUNCTION with blocking
function createProfile() {
  const username = document.getElementById("username").value.trim();
  const skill = document.getElementById("skill").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const services = document.getElementById("services").value.trim();

  if (!username || !skill || !phone) {
    alert("Please fill in all fields.");
    return;
  }

  // 🚫 BLOCK if not paid
  if (!paidCoaches.includes(phone)) {
    alert(
      "⛔ You have not paid N$150 this week.\nPlease pay before creating your profile."
    );
    return; // Stop here
  }

  const profile = {
    username,
    skill,
    phone,
    services,
    timestamp: new Date().toISOString(),
  };

  let coaches = JSON.parse(localStorage.getItem("coaches") || "[]");
  coaches.push(profile);
  localStorage.setItem("coaches", JSON.stringify(coaches));

  displayCoaches();
  alert("✅ Profile created!");
}

// ✅ DISPLAY COACHES FUNCTION
function displayCoaches() {
  const coachList = document.getElementById("coach-list");
  if (!coachList) return;

  coachList.innerHTML = "";
  const coaches = JSON.parse(localStorage.getItem("coaches") || "[]");

  coaches.forEach((coach) => {
    const card = document.createElement("div");
    card.style.border = "1px solid #ccc";
    card.style.padding = "10px";
    card.style.marginBottom = "10px";
    card.innerHTML = `
      <p><strong>Username:</strong> ${coach.username}</p>
      <p><strong>Skill:</strong> ${coach.skill}</p>
      <p><strong>Phone:</strong> ${coach.phone}</p>
      <p><strong>Tips & Services:</strong><br>${coach.services.replaceAll(
        ",",
        "<br>"
      )}</p>
    `;
    coachList.appendChild(card);
  });
}

// ✅ Show coaches on page load
window.addEventListener("DOMContentLoaded", () => {
  displayCoaches();
});
