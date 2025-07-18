import express from 'express'
import { registerUser, loginUser, getprofile, updateProfile, bookAppointment, listAppointment, cancelAppointment,  payment } from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'

const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/get-profile',authUser,getprofile)
userRouter.post('/update-profile', upload.single('image'),authUser, updateProfile)
userRouter.post('/book-appointment',authUser,bookAppointment)
userRouter.get('/appointments',authUser, listAppointment)
userRouter.post('/cancel-appointment',authUser,cancelAppointment)
//userRouter.post('payment-razorpay', authUser, paymentRazorpay)
userRouter.post('/payment', authUser,payment)


export default userRouter