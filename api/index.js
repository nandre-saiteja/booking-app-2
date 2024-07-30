require('dotenv').config()
const express=require('express');
const cors=require('cors');
 const User=require('./models/User.js');
const mongoose=require("mongoose");
const imageDownloader=require('image-downloader');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const app=express();
const Booking=require('./models/Booking.js')
 const cookieParser=require('cookie-parser');
const bcryptSalt=bcrypt.genSaltSync(10);
const jwtSecret="fsywgugucuhcihgdsigusgucg"
const multer=require('multer')
const fs=require('fs');
const Place=require('./models/Place.js');
// const { default: Perks } = require('../client/src/Perks.jsx');

app.use(express.json());
 app.use(cookieParser());
 app.use('/uploads',express.static(__dirname +'/uploads'));
app.use(cors({
    credentials:true,
    origin:'http://localhost:5173',
}));

//  mongoose.connect(process.env.MONGO_URL).then(()=>{console.log("connected")}).catch((err) => console.log("not connected"));
mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB', err);
});

 function getUserDataFromToken(req){
    return new Promise((resolve,reject)=>{
        // const {token}=req.cookies;
        jwt.verify(req.cookies.token,jwtSecret,{},async(err,userData)=>{
            if(err)throw err;
            resolve(userData)
    })
    
    })
}
app.get('/test',(req,res)=>{
    res.json('test.ok');
});
app.post('/register',async (req,res)=>{
    const {name,email,password}=req.body;
    try{
    const userDoc=await User.create({
       name,
       email,
       password:bcrypt.hashSync(password,bcryptSalt),
    });
    res.json(userDoc);
}catch(e){
    res.status(422).json(e);
}
});
app.post('/login',async (req,res)=>{
    console.log("Successful");
    const {email,password}=req.body;
  
    const userDoc=await User.findOne({email});
    if(userDoc){
        // res.json('found');
        const passOk=bcrypt.compare(password,userDoc.password)
        if(passOk){
            jwt.sign({
                email:userDoc.email,
                id:userDoc._id,
                name:userDoc.name,
                },
                jwtSecret,{},(err,token)=>{
                if(err)throw err;
                res.cookie('token',token).json(userDoc);
            })
           
        }else{
            res.status(422).json(userDoc);
        }
    }else{
        res.json('not found');
    }
});

app.get('/profile',(req,res)=>{
     const {token}=req.cookies;
     if(token){
        jwt.verify(token,jwtSecret,{},(err,user)=>{
            if(err) throw err;
            //   const {name,email,_id}=await User.findById(userData._id);
            
            res.json(user);
        });
     }else{
        res.json('not found');
     }
   
    //  res.json('user info');
});

app.post('/logout',(req,res)=>{
    res.cookie('token','').json(true);
});

app.post('/upload-by-link', async (req, res) => {
    const { link } = req.body;
    const newName = 'photo' + Date.now() + '.jpg';

    // Validate the URL
    if (!/^https?:\/\/.+/.test(link)) {
        return res.status(400).json({ error: 'Invalid URL. Only http and https protocols are supported.' });
    }

    try {
        console.log('Downloading image from URL:', link);
        await imageDownloader.image({
            url: link,
            dest: __dirname + '/uploads/' + newName,
        });
        res.json(newName);
    } catch (error) {
        console.error('Error downloading image:', error);
        res.status(500).json({ error: 'Failed to download image.' });
    }
});

const photosMiddleware=multer({dest:'uploads/'});
app.post('/upload',photosMiddleware.array('photos',100),(req,res)=>{
    const uploadedFiles=[];
    for(let i=0;i<req.files.length;i++){
        const {path,originalname}=req.files[i];
        const parts=originalname.split('.');
        const ext=parts[parts.length-1];
        const newPath=path+'.'+ext;
        fs.renameSync(path,newPath)
        uploadedFiles.push(newPath.replace('uploads\\',''));
        // console.log(newPath);
        // console.log(newPath.replace('uploads\\',''))
    }
    res.json(uploadedFiles);
});
app.post('/places',(req,res)=>{
    const {token}=req.cookies;
    const {title,address,addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,price
    }=req.body;
    jwt.verify(token,jwtSecret,{},async(err,userData)=>{
        if(err) throw err;
       const placeDoc= await Place.create({
            owner:userData.id,
            title,address,photos:addedPhotos,description,
            perks,extraInfo,checkIn,checkOut,maxGuests,price
          });
          res.json(placeDoc);
    });  
});
app.get('/user-places',(req,res)=>{
    const {token}=req.cookies;
    jwt.verify(token,jwtSecret,{},async(err,userData)=>{
        const {id}=userData;
        res.json(await Place.find({owner:id}))
    })
})
// app.get('places/:id',(res,req)=>{
//     res.json(req.params)
// })
app.get('/places/:id',async (req,res)=>{
   
   const {id}=req.params;
  
 res.json(await Place.findById(id));
    
})
app.put('/places',async(req,res)=>{
    // const {id}=req.params;
    const {token}=req.cookies;
    const {id,title,address,addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,price,
    }=req.body;
   
    jwt.verify(token,jwtSecret,{},async(err,userData)=>{
        if(err) throw err;
        // console.log(userData.id);
        const placeDoc=await Place.findById(id);
        if(userData.id === placeDoc.owner.toString()){
           placeDoc.set({
            
             
                title,address,photos:addedPhotos,description,
                perks,extraInfo,checkIn,checkOut,maxGuests,price
              
           })
           await placeDoc.save();
            res.json('ok');
        }
    })
})
app.get('/places',async(req,res)=>{
    res.json(await Place.find() );
})
 app.post('/bookings',async(req,res)=>{
    const userData=await getUserDataFromToken(req);
    const {place,checkIn,checkOut,numberOfGuests,name,phone,price}=req.body;
     Booking.create({
        place,checkIn,checkOut,numberOfGuests,name,phone,price,
        user:userData.id,
    }).then((doc)=>{
        
        res.json(doc)
    }).catch((err)=>{
       throw err;
    })
})

app.get('/bookings',async(req,res)=>{
   const userData= await getUserDataFromToken(req);
   res.json(await Booking.find({user:userData.id }).populate('place'))

})
app.listen(4000,()=>{
    console.log('runnnningg');
});