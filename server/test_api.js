const testApi = async () => {
  const BASE_URL = "http://localhost:5000/api";
  
  try {
    console.log("Checking sports...");
    const sportsRes = await fetch(`${BASE_URL}/sports`);
    const sports = await sportsRes.json();
    console.log("Sports found:", sports);
    
    if (sports.length === 0) {
      throw new Error("No sports found. Initialize DB first.");
    }
    
    const sportId = sports[0].id;
    
    console.log(`Creating event for sport ID ${sportId}...`);
    const eventData = {
      sport_id: sportId,
      date_time: "2026-04-10T18:00:00Z",
      location: "Star Badminton Arena",
      max_players: 8
    };
    
    const eventRes = await fetch(`${BASE_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData)
    });
    
    if (!eventRes.ok) {
        const errorText = await eventRes.text();
        throw new Error(`API Error: ${eventRes.status} ${errorText}`);
    }
    
    const event = await eventRes.json();
    console.log("Event created successfully:", event);
    
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err.message);
    process.exit(1);
  }
};

testApi();
