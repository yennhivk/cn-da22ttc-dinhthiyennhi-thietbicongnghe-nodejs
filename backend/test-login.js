fetch("http://localhost:3000/api/auth/login", { 
  method: "POST", 
  headers: { "Content-Type": "application/json" }, 
  body: JSON.stringify({ email: "test@test.com", mat_khau: "123" }) 
}).then(r=>console.log("STATUS: ", r.status)).catch(e=>console.error(e));