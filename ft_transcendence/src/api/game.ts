

export interface UserStats {
	wins: number
	losses: number
	rank: number
	elo: number
}

export interface MatchRecord {
	id: number
	opponentName: string
	result: 'win' | 'loss' | 'draw'
	date: string
	duration: string
}

export interface Achievement {
	id: number
	name: string
	description: string
	unlocked: boolean
}

export async function getUserStats(_userId: number): Promise<UserStats> {
    return { wins: 12, losses: 4, rank: 3, elo: 1547 }
  }                                                                                                                                                             
   
  export async function getMatchHistory(_userId: number): Promise<MatchRecord[]> {                                                                              
    return [      
      { id: 1, opponentName: "alice", result: "win",  date: "2026-03-27", duration: "8 min" },
      { id: 2, opponentName: "bob",   result: "loss", date: "2026-03-26", duration: "12 min" },                                                                 
      { id: 3, opponentName: "carol", result: "win",  date: "2026-03-25", duration: "5 min" },                                                                  
      { id: 4, opponentName: "dave",  result: "draw", date: "2026-03-24", duration: "10 min" },                                                                 
    ]                                                                                                                                                           
  }               
                                                                                                                                                                
  export async function getAchievements(_userId: number): Promise<Achievement[]> {
    return [
      { id: 1, name: "First Win",     description: "Win your first game",       unlocked: true },                                                               
      { id: 2, name: "On a Roll",     description: "Win 3 games in a row",       unlocked: true },                                                              
      { id: 3, name: "Veteran",       description: "Play 10 games",             unlocked: true },                                                               
      { id: 4, name: "Grandmaster",   description: "Reach 2000 elo",            unlocked: false },                                                              
      { id: 5, name: "Untouchable",   description: "Win 5 games without a loss", unlocked: false },                                                             
    ]                                                                                                                                                           
  }                                                                                                                                                             
                                                                                                                                                                
  export async function getLeaderboard(): Promise<{ id: number; username: string; wins: number; losses: number; elo: number; rank: number }[]> {              
    return [
      { id: 1, username: "alice", wins: 42, losses: 5,  elo: 1254, rank: 1 },                                                                                   
      { id: 2, username: "bob",   wins: 35, losses: 12, elo: 1054, rank: 2 },                                                                                   
      { id: 3, username: "carol", wins: 28, losses: 8,  elo: 1854,  rank: 3 },                                                                                   
      { id: 4, username: "dave",  wins: 21, losses: 20, elo: 1654,  rank: 4 },                                                                                   
      { id: 5, username: "eve",   wins: 15, losses: 30, elo: 1254,  rank: 5 },                                                                                   
    ]                                                                                                                                                           
  } 