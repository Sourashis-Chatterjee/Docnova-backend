import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay'


//API to register user

const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body

        if (!name || !password || !email) {
            return res.json({ success: false, message: "missing details" })
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Enter a valid email' })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: 'Enter a strong password' })
        }

        //hash the password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


//controller for user login

const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: 'User does not exist' })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid Credentials' })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//api to get user data
const getprofile = async (req, res) => {
    try {

        const  userId  = req.userId
       // console.log(userId)
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//api to update user profile

const updateProfile = async (req, res) => {

    try {

         const userId = req.userId; // get from auth middleware
        const { name, phone, address, dob, gender } = req.body;
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: 'Data missing' })
        }
         console.log(userId)
        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {
            //upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'})

            const imageUrl = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId,{image:imageUrl})

           
        }
           console.log('I am here')
         res.json({success:true,message:'Profile updated'})


    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

///route to book appointment
const bookAppointment = async (req,res) => {

    try {

         const userId = req.userId; // get from auth middleware
        const { docId, slotDate, slotTime} = req.body ; 
        //get doctor;s data from the collection using the docid
        const docData = await doctorModel.findById(docId).select('-password')

        if(!docData.available){
            return res.json({success:false, message:'Doctor not available right now'})
        }

        let slots_booked = docData.slots_booked

        //check slot availability
        if (slots_booked[slotDate]) {
            if(slots_booked[slotDate].includes(slotTime)){
                return res.json({success:false, message:'Slot not available '})
            }else{
                slots_booked[slotDate].push(slotTime)
            }
        }else{
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password')

        delete docData.slots_booked //delte it as we will store the new slots booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date:Date.now(),
        }
        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save();

        //save the new slots in docdata
        await doctorModel.findByIdAndUpdate(docId,{slots_booked})
        res.json({success:true, message:'Appointment scheduled'})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//api to get user appointments for frontend
const listAppointment = async (req,res) => {
     
    try {
        const userId = req.userId
        const appointments = await appointmentModel.find({userId})

        res.json({success:true, appointments})
    } catch (error) {
         console.log(error);
        res.json({ success: false, message: error.message })
    }
}

//api to cancel login

const cancelAppointment = async (req,res) => {
    try {

        const userId = req.userId
        const {appointmentId} = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        //verify appointment user

        if(appointmentData.userId!==userId){
            return res.json({success:false, message:"Unauthorized Action"})
        }

        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

        //release doctor's slot

        const {docId,slotDate,slotTime} = appointmentData
        const doctordata = await doctorModel.findById(docId)
        let slots_booked = doctordata.slots_booked
          slots_booked[slotDate] = slots_booked[slotDate].filter(e => e!==slotTime)

          await doctorModel.findByIdAndUpdate(docId,{slots_booked})
          res.json({success:true, message:'Appointment cancelled'})
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const razorpayInstance = new razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
})


//api to get payment for the appointment
// const paymentRazorpay = async (req,res) => {

//     try {
        
//         const { appointmentId } = req.body
//     const appointmentData = await appointmentModel.findById(appointmentId)

//     if (!appointmentData || appointmentData.cancelled) {
//         return res.json({success:false, message:"Appointment Cancelled or not found"})
//     }

//     //Creating options for razorpay
//     const options = {
//         amount: appointmentData.amount * 100,
//         currency: process.env.CURRENCY,
//         reciept: appointmentId,
//     }

//     //creation of an order

//     const order = await razorpayInstance.orders.create(options)
//     res.json({success:true, order})
//     } catch (error) {
//          console.log(error);
//         res.json({ success: false, message: error.message })
//     }
    

// }

const payment = async (req,res) => {

    try {
         const { appoId } = req.body
        // console.log(appoId)
     await appointmentModel.findByIdAndUpdate(appoId, {payment:true})
      res.json({ success: true, message:'Payment done' })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}



export { registerUser, loginUser, getprofile , updateProfile, bookAppointment,listAppointment,cancelAppointment,payment }