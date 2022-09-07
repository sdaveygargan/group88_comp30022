const mongoose = require("mongoose");

const connectDB = async () =>{
    try{
        //Attempt to connect to database
        const con = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        mongoose.connection.on('connected', () => console.log('Connected'));
        console.log(`MongoDB connected : ${con.connection.host}\n`);

    }catch(err){
        console.log(err);
        process.exit(1);
    }
}

module.exports = connectDB;