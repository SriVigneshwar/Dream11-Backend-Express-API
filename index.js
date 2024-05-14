const express = require('express');
const app = express();
const port = 3000;
const zod =require('zod');
app.use(express.json());
// Database Details
const { Player, UserTeam, Match } = require('./db');

//zod body types
const PlayerType = zod.enum(["ALL-ROUNDER", "BATTER", "BOWLER", "WICKETKEEPER"]);

const addTeamBody = zod.object({
  teamName: zod.string(),
  players: zod.array(zod.object({
    Player: zod.string(),
    Team: zod.string(),
    Role: PlayerType
  })).length(11).refine((arr) => {
    const countMap = {};
    for (const item of arr) {
      countMap[item.Role] = (countMap[item.Role] || 0) + 1;
      countMap[item.Team] = (countMap[item.Team] || 0) + 1;
    }

    return (
      countMap["WICKETKEEPER"] >= 1 &&
      countMap["WICKETKEEPER"] <= 8 &&
      countMap["BATTER"] >= 1 &&
      countMap["BATTER"] <= 8 &&
      countMap["BOWLER"] >= 1 &&
      countMap["BOWLER"] <= 8 &&
      countMap["ALL-ROUNDER"] >= 1 &&
      countMap["ALL-ROUNDER"] <= 8 &&
      countMap["Rajasthan Royals"] >= 1 &&
      countMap["Rajasthan Royals"] <= 10 &&
      countMap["Chennai Super Kings"] >= 1 &&
      countMap["Chennai Super Kings"] <= 10
    )
  }, {message: "Player list must contain atleast 1 and atmost 8 of each role and each team of max 10 players"}),
  captain: zod.object({
    Player: zod.string(),
    Team: zod.string(),
    Role: zod.string()
  }),
  viceCaptain: zod.object({
    Player: zod.string(),
    Team: zod.string(),
    Role: zod.string()
  })
}).refine(data => data.players.some(player => player.Player === data.captain.Player), {message: "Captain should be in players list"}).refine(data => data.players.some(player => player.Player === data.viceCaptain.Player), {message: "Vice Captain should be in players list"});

// Endpoints

//add-team endpoint
app.post('/add-team', async (req, res) => {
  try{
    const parseRes = addTeamBody.safeParse(req.body);

    if(!parseRes.success){
      return res.status(411).json({
        msg: "Invalid input parameters!"
      });
    }

    const user_team = await UserTeam.findOne({
      teamName: req.body.teamName
    });

    const allPlayers = await Player.find();
    const reqPlayers = req.body.players;
    let playerflg =0;

    //adding only valid players in the team
    reqPlayers.forEach(pl =>{
      if(!allPlayers.find(item => item.Player == pl.Player) ? true: false){
        playerflg =1;
      }
    })

    if(playerflg == 0){
      if(user_team){
        return res.status(411).json({
          msg: "Team already exists!"
        });
      }
      
      const userTeam = await UserTeam.create({
        teamName: req.body.teamName,
        players: req.body.players,
        captain: req.body.captain,
        viceCaptain: req.body.viceCaptain
      });
  
      if(userTeam){
        return res.json({
          success: "Your team created successfully!"
        });
      }
      else{
        return res.status(411).json({
          msg: "sorry! something went wrong with the team creation"
        });
      }
    }
    else{
      return res.status(411).json({
        msg: "Invalid players in the list"
      });
    }
  }catch(e){
    return res.status(411).json({
      msg: "Error while creating team ",
      error: e
    });
  }
});

// Processing user team's results
app.get('/process-result', async (req, res) => {
  try{
    const matchDetails = await Match.findOne({
      fixture: "Chennai Super Kings vs Rajasthan Royals"
    });
  
    const match = matchDetails.match;
  
    var players = [{
      player: "",
      points: 0,
      runs : 0,
      wickets: 0,
      catches: 0,
      run30flg: 0,
      halfcentflg: 0,
      centuryflg: 0
    }];
    let len = players.length;
    var ballnum =0;
    var runsPerover =0;
  
    match.forEach(ball => {
      ballnum = ball.ballnumber;
      runsPerover += ball.total_run;

      if(len == 1){
        players[0] = {
          player: ball.batter,
          points: 0,
          runs : 0,
          wickets: 0,
          catches: 0,
          run30flg: 0,
          halfcentflg: 0,
          centuryflg: 0
        };
        len++;
      }
      else{
        if(!players.find(item => item.player == ball.batter) ? true : false){
          players.push({
            player: ball.batter,
            points: 0,
            runs : 0,
            wickets: 0,
            catches: 0,
            run30flg: 0,
            halfcentflg: 0,
            centuryflg: 0
          })
        }
    
        if(!players.find(item => item.player == ball.non_striker) ? true : false){
          players.push({
            player: ball.non_striker,
            points: 0,
            runs : 0,
            wickets: 0,
            catches: 0,
            run30flg: 0,
            halfcentflg: 0,
            centuryflg: 0
          })
        }
    
        if(!players.find(item => item.player == ball.bowler) ? true : false){
          players.push({
            player: ball.bowler,
            points: 0,
            runs : 0,
            wickets: 0,
            catches: 0,
            run30flg: 0,
            halfcentflg: 0,
            centuryflg: 0
          })
        }
  
        if(!players.find(item => item.player == ball.fielders_involved) ? true : false){
          if(ball.fielders_involved != "NA"){
            players.push({
              player: ball.fielders_involved,
              points: 0,
              runs : 0,
              wickets: 0,
              catches: 0,
              run30flg: 0,
              halfcentflg: 0,
              centuryflg: 0
            })
          }
        }
      }
  
      //Batter points
      if(ball.batsman_run != 0){
        for (let obj of players) {
          if (obj.player == ball.batter) {
            
            obj.points += ball.batsman_run;
            obj.runs += ball.batsman_run;
  
            //boundary bonus
            if(ball.batsman_run == 6 && ball.non_boundary == 0){
              obj.points += 2;
            }
            else if(ball.batsman_run == 4 && ball.non_boundary == 0){
              obj.points += 1;
            }
            //Runs milestone bonus
            if(obj.runs >=30 && obj.run30flg == 0){
              obj.run30flg = 1;
              obj.points += 4;
            }
            else if(obj.runs >=50 && obj.halfcentflg == 0){
              obj.halfcentflg =1;
              obj.points += 8;
            }
            else if(obj.runs >=100 && obj.centuryflg ==0){
              obj.centuryflg =1;
              obj.points += 16;
            }
          }
        }
      }
  
      //Bowler points
      if(ball.isWicketDelivery == 1){
        if(ball.kind != "run out"){
          for (let obj of players) {
            if (obj.player === ball.bowler) {
              obj.points += 25;
              obj.wickets +=1;
              if(ball.kind === "bowled" || ball.kind === "lbw" || ball.kind === "caught and bowled"){
                obj.points += 8;
                obj.catches +=1;
              }
              if(obj.wickets == 3){
                obj.points +=4;
              }
              else if(obj.wickets == 4){
                obj.points +=8;
              }
              else if(obj.wickets == 5){
                obj.points +=16;
              }
            }
          }
        }
      }
  
      //Fielder points
      if(ball.isWicketDelivery == 1){
        if(ball.kind != "bowled" || ball.kind != "lbw" || ball.kind != "caught and bowled"){
          for (let obj of players) {
            if (obj.player === ball.fielders_involved) {
              if(ball.kind === "caught"){
                obj.catches +=1;
                obj.points +=8;
                if(obj.catches === 3){
                  obj.points +=4;
                }
              }
              else if(ball.kind === "stumping"){
                obj.points +=12;
              }
              else if(ball.kind === "run out"){
                obj.points +=6;
              }
            }
          }
        }
      }
  
      //maiden over points
      if(ballnum == 6 && ball.extra_type != "wides" && ball.extra_type != "no ball" ){
        if(runsPerover == 0){
          for (let obj of players) {
            if (obj.player === ball.bowler) {
              obj.points += 12;
            }
          }
        }
        runsPerover = 0;
      }
    });
    //Processing team results
    let teamEntries = await UserTeam.find();
  
    for(let teamentry of teamEntries){
      teamPlayers = teamentry.players;
      teamentry.points =0;
      for (let teamPlayer of teamPlayers) {
        
        for (let obj of players) {
          if (obj.player == teamPlayer.Player) {
            if(obj.player == teamentry.captain.Player){
              teamentry.points += (obj.points * 2);
            }
            else if(obj.player == teamentry.viceCaptain.Player){
              teamentry.points += (obj.points * 1.5);
            }
            else{
              teamentry.points += obj.points;
            }
          }
        }
        
      }
      await UserTeam.updateOne({
        teamName: teamentry.teamName
      }, teamentry);
    }
  
    return res.json({
      success: "Team results processed successfully!"
    });
  }
  catch(e){
    return res.status(411).json({
      msg: "Error while processing results",
      error: e
    });
  }
});

//get-winner teams
app.get('/team-result', async (req, res) =>{
  try{
    const allteams = await UserTeam.find().sort({ points: -1 });

    if(allteams.length != 0){
      const highestpoint = allteams[0].points;
      const winnerTeams = allteams.filter(team => team.points === highestpoint);

      return res.json({
        winners: winnerTeams
      });
    }
    else{
      return res.status(411).json({
        msg: "No Teams found"
      });
    }
  }
  catch(e){
    return res.status(411).json({
      msg: "Error while getting results",
      error: e
    })
  }
})

//port
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

