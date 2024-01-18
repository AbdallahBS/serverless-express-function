const Pool = require("pg").Pool;

const pool = new Pool({
    user:"postgres",
    password:"Azmidou",
    host:"localhost",
    port:"5432",
    database :"test"
});
pool.connect((err)=>{
    if(err){
    console.log(err)
    }
    else{
       console.log("data base connected");
    }
})
module.exports=pool;
