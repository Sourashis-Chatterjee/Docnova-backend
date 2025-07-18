import doctorModel from "../models/doctorModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js";
const changeAvailability = async (req , res) => {
    try {
        
        const {docId} = req.body
         //find the doctor of this id from the collection doctormodel
        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, {available: !docData.available})//if its available, make it no
        res.json({success:true, message:'availability changed'})
    } catch (error) {
         console.log(error);
        res.json({success:false,message:error.message})
        
    }
}

const doctorList = async (req,res) => {

    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email'])

        res.json({success:true, doctors})
    } catch (error) {
         console.log(error);
        res.json({success:false,message:error.message})
    }
}

//api for doctor login
const loginDoctor = async (req,res) => {

    try {

        const {email,password} = req.body
        const doctor = await doctorModel.findOne({email})

        if(!doctor){
            return res.json({success:false, message:"Innvalid credentials"})
        }

        const isMatch = await bcrypt.compare(password,doctor.password)
        if(isMatch){
            const token = jwt.sign({id:doctor._id},process.env.JWT_SECRET) 
            res.json({success:true, token})
        }else{
            res.json({success:false, message:"Invalid credentials"})
        }
        
        
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//api to get a doctors all appointments for thwe doctor panel

const appointmentsDoctor = async (req,res) => {

    try {
        const docId = req.docId
        //console.log(docId)
        const appointments = await appointmentModel.find({docId})

        res.json({success:true, appointments})
        
    } catch (error) {
         console.log(error);
        res.json({success:false,message:error.message})
    }
}

//for appointment completion
const complete  = async (req,res) => {
    try {
        const docId = req.docId
        const { appointmentId} = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if(appointmentData && appointmentData.docId===docId){
            await appointmentModel.findByIdAndUpdate(appointmentId, {isCompleted:true})
            return res.json({success:true, message:'Appointment Completed'})
        }else{
            return res.json({success:false, message:'Mark Failed'})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//for appointment cancellation
const cancel  = async (req,res) => {
    try {
        const docId = req.docId
        const { appointmentId} = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if(appointmentData && appointmentData.docId===docId){
            await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled:true})
            return res.json({success:true, message:'Appointment Cancelled'})
        }else{
            return res.json({success:false, message:'Mark Failed'})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//dashboard data

const dashboard  = async (req,res) => {
    try {
        const docId = req.docId
        
        const appointments = await appointmentModel.find({docId})

        let earnings = 0
        appointments.map((item)=>{
            if(item.isCompleted){
                earnings+=item.amount
            }
        })

        let patients = [];
        appointments.map((item)=>{
            if(!patients.includes(item.userId)){
                patients.push(item.userId)
            }
        })

        const dashData = {
            earnings,
            appointments:appointments.length,
            patients:patients.length,
            latestAppos:appointments.reverse().slice(0,5)
        }

        res.json({success:true, dashData})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//api to get doctor profile
const getprofile = async (req, res) => {
    try {

        const  docId  = req.docId
       // console.log(userId)
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//api to update doctor profile

const updateProfile = async (req, res) => {

    try {

         const docId = req.docId; // get from auth middleware
        const { fees,address,available } = req.body;
        const imageFile = req.file

        // if (!name || !phone || !dob || !gender) {
        //     return res.json({ success: false, message: 'Data missing' })
        // }
         console.log(docId)
        await doctorModel.findByIdAndUpdate(docId, { fees,address,available })

        // if (imageFile) {
        //     //upload image to cloudinary
        //     const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'})

        //     const imageUrl = imageUpload.secure_url

        //     await userModel.findByIdAndUpdate(docId,{image:imageUrl})

           
        // }
           console.log('I am here')
         res.json({success:true,message:'Profile updated'})


    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}




export {changeAvailability, doctorList,loginDoctor, appointmentsDoctor, complete, cancel, dashboard, getprofile,updateProfile }