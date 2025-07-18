import express from 'express'
import { doctorList,loginDoctor,appointmentsDoctor,complete,cancel,dashboard ,getprofile,updateProfile} from '../controllers/doctorController.js'
import authDoctor from '../middlewares/authDoctor.js'
const doctorRouter = express.Router()

doctorRouter.get('/list', doctorList)
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor )
doctorRouter.post('/cancel-appointment',authDoctor,cancel)
doctorRouter.post('/complete-appointment',authDoctor,complete)
doctorRouter.get('/dashboard',authDoctor,dashboard)
doctorRouter.get('/profile',authDoctor,getprofile)
doctorRouter.post('/update-profile',authDoctor,updateProfile)

export default doctorRouter