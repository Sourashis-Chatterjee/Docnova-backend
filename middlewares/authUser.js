import jwt from 'jsonwebtoken';

//authenticate  user

const authUser = async (req,res,next) => {
    try{
  const {token} = req.headers
  //console.log(token)
  if(!token){
    return res.json({success:false, message:'Not authorized'})
  }

  const token_decode = jwt.verify(token, process.env.JWT_SECRET)

  req.userId = token_decode.id

  //console.log(req.userId)

  next();

    }catch(error){
        console.log('error in catch')
        console.log(error);
        res.json({success:false,message:error.message})
    }
}
export default authUser;