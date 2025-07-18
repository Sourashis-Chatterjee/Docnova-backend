import jwt from 'jsonwebtoken';

//authenticate  doctor

const authDoctor = async (req,res,next) => {
    try{
  const {dtoken} = req.headers
  //console.log(token)
  if(!dtoken){
    return res.json({success:false, message:'Not authorized'})
  }

  const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)

  req.docId = token_decode.id

  //console.log(req.userId)

  next();

    }catch(error){
        console.log('error in catch')
        console.log(error);
        res.json({success:false,message:error.message})
    }
}
export default authDoctor;