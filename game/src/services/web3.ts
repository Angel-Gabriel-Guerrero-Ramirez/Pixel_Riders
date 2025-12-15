
// --- Mock Data & Types ---

export interface Web3State {
  isConnected: boolean;
  address: string | null;
  balance: number; // ETH
  tries: number;
  prizePool: number; // ETH
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number;
  combo: number;
  timestamp: number;
}

// Simulated delay for "Async" blockchain feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock State (Persisted in memory for session)
let mockState: Web3State = {
  isConnected: false,
  address: null,
  balance: 1.5, // Start with some fake ETH
  tries: 0,
  prizePool: 4.82 // Fake prize pool
};

// Generate some fake leaderboard data
// We create enough entries to demonstrate scrolling and the "Fixed Position" feature
const mockLeaderboard: LeaderboardEntry[] = Array.from({ length: 60 }).map((_, i) => ({
  rank: i + 1,
  address: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
  score: Math.floor(150000 - (i * 2000) + Math.random() * 1000),
  combo: Math.floor(100 - (i * 0.5)),
  timestamp: Date.now() - Math.floor(Math.random() * 10000000)
}));

// INJECT MOCK USER AT RANK 42 FOR DEMO
const DEMO_USER_ADDRESS = "0x71C...9A23";
if (mockLeaderboard.length > 42) {
    mockLeaderboard[41] = {
        rank: 42,
        address: DEMO_USER_ADDRESS,
        score: 45230,
        combo: 28,
        timestamp: Date.now() - 3600000
    };
}

export const Web3Service = {
  
  // 1. Connect Wallet
  connectWallet: async (): Promise<Web3State> => {
    await delay(800); // Simulate Metamask popup
    mockState.isConnected = true;
    mockState.address = DEMO_USER_ADDRESS;
    return { ...mockState };
  },

  // 2. Get Current State
  getState: (): Web3State => {
    return { ...mockState };
  },

  // Helper to get current address without full state
  getCurrentAddress: (): string | null => {
      return mockState.address;
  },

  // 3. Buy Tries
  buyTries: async (): Promise<Web3State> => {
    await delay(1500); // Simulate transaction confirmation
    if (mockState.balance < 0.001) {
      throw new Error("Insufficient ETH Balance");
    }
    
    mockState.balance -= 0.001;
    mockState.tries += 3;
    mockState.prizePool += 0.001; // 100% goes to pool
    
    return { ...mockState };
  },

  // 4. Submit Score (Requires 1 try)
  submitScore: async (score: number, combo: number): Promise<{ success: boolean, newRank: number }> => {
    await delay(2000); // Simulate block time
    
    if (mockState.tries <= 0) {
      throw new Error("No tries remaining");
    }

    mockState.tries -= 1;

    // Simulate ranking logic
    const newEntry: LeaderboardEntry = {
      rank: 0, // calc below
      address: mockState.address!,
      score: score,
      combo: combo,
      timestamp: Date.now()
    };

    // Insert into mock leaderboard
    mockLeaderboard.push(newEntry);
    mockLeaderboard.sort((a, b) => b.score - a.score);
    
    // Update ranks
    mockLeaderboard.forEach((entry, idx) => entry.rank = idx + 1);

    const myRank = mockLeaderboard.findIndex(e => e === newEntry) + 1;

    return { success: true, newRank: myRank };
  },

  // 5. Get Leaderboard
  getLeaderboard: async (type: 'FREE' | 'COMPETITIVE'): Promise<LeaderboardEntry[]> => {
    await delay(500);
    if (type === 'FREE') {
      // Return a static "local" leaderboard for demo
      // Also inject current user for demo consistency
      const localData = [
        { rank: 1, address: "PlayerOne", score: 50000, combo: 45, timestamp: Date.now() },
        { rank: 2, address: "NeonRider", score: 42000, combo: 30, timestamp: Date.now() },
        { rank: 3, address: "VoidWalker", score: 38000, combo: 25, timestamp: Date.now() },
        ...Array.from({length: 10}).map((_, i) => ({
             rank: i + 4, 
             address: `Guest_${i+4}`, 
             score: 30000 - i*1000, 
             combo: 10, 
             timestamp: Date.now() 
        }))
      ];
      
      // If connected, add user at #5 just for demo
      if (mockState.isConnected) {
          localData.push({
              rank: 5,
              address: DEMO_USER_ADDRESS,
              score: 29500,
              combo: 12,
              timestamp: Date.now()
          });
          localData.sort((a,b) => b.score - a.score);
          localData.forEach((e, i) => e.rank = i+1);
      }
      
      return localData;
    }
    return [...mockLeaderboard]; // Return full list for scrolling demo
  },

  // 6. Time until distribution
  getNextDistributionTime: (): string => {
    return "2d 14h 30m";
  }
};