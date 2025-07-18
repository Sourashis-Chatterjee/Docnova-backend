import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import userRouter from './routes/userRoute.js';


//app config
const app = express();
const port = process.env.PORT || 4000;
//database config
connectDB();
connectCloudinary();

//middlewares
app.use(express.json());
app.use(cors());
// app.use(cors({
//   origin: [
//     'https://docnova.vercel.app',       // user frontend
//      'https://docnova-admin.vercel.app/' // admin panel
//   ],
//   credentials: true
// }));


//api endpoints

app.use('/api/admin', adminRouter);// all apis rrelated to admin ant other parts
app.use('/api/doctor', doctorRouter);// all apis related tho frontend part of doctors
app.use('/api/user', userRouter);// apis for user related activities

app.get('/', (req,res)=>{
    res.send('API working');
})

app.listen(port,()=>{
    console.log(`server running at port ${port}`);
});

