const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

const DB_USER = process.env['DB_USER'];
const DB_PWD = process.env['DB_PWD'];
const DB_URL = process.env['DB_URL'];
const DB_NAME = "task-jeff";

const connString = 'mongodb+srv://'+ DB_USER + ':' + DB_PWD + '@' + DB_URL +'.mongodb.net/'+ DB_NAME;

mongoose.connect(connString);

const playerSchema = new mongoose.Schema({
    Player: {
        type: String,
        required: true
    },
    Team: {
        type:String,
        required: true
    },
    Role:{
        type: String,
        required: true
    }
});


const userTeamSchema = new mongoose.Schema({
    teamName: {
        type:String,
        required: true,
        unique: true
    },
    players: {
        type: [playerSchema],
        required: true
    },
    captain: {
        type: playerSchema,
        required: true
    },
    viceCaptain: {
        type: playerSchema,
        required: true
    },
    points: {
        type:Number,
        default: 0
    }
});

const teamSchema = new mongoose.Schema({
    teamName: {
        type:String,
        required: true,
        unique: true
    },
    players: {
        type: [playerSchema],
        required: true
    }
});

const matchSchema = new mongoose.Schema({
    fixture: {
        type: String,
        required: true
    },
    match: [{
        ID:{
            type:Number,
            required:true
        },
        innings:{
            type:Number,
            required:true
        },
        overs:{
            type:Number,
            required:true
        },
        ballnumber:{
            type:Number,
            required:true
        },
        batter:{
            type:String,
            required:true
        },
        bowler:{
            type:String,
            required:true
        },
        non_striker:{
            type:String,
            required:true 
        } ,
        extra_type:{
            type:String,
            required:true
        } ,
        batsman_run:{
            type:Number,
            required:true
        } ,
        extras_run:{
            type:Number,
            required:true
        } ,
        total_run:{
            type:Number,
            required:true
        } ,
        non_boundary:{
            type:Number,
            required:true
        } ,
        isWicketDelivery:{
            type:Number,
            required:true
        } ,
        player_out:{
            type:String,
            required:true
        } ,
        kind:{
            type:String,
            required:true
        } ,
        fielders_involved:{
            type:String,
            required:true
        },
        BattingTeam:{
            type:String,
            required:true
        }
    }
    ]
});


const Player = mongoose.model('Player', playerSchema);
const UserTeam = mongoose.model('UserTeam', userTeamSchema);
const Team = mongoose.model('Team', teamSchema);
const Match = mongoose.model('Match', matchSchema);


module.exports = {
    Player,
    UserTeam,
    Team,
    Match
};