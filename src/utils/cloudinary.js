// import cloudinary from "cloudinary";
import {v2 as cloudinary} from 'cloudinary';
// import { response } from "express";
import fs from "fs";

          
cloudinary.config({ 
    cloud_name: 'youtube-demo', 
    api_key: '152116887883791', 
    api_secret: '8-GmyEATqnQ6v2adBjNLTx7xKqY' 
  });


const cloudinaryFileUpload = async (filePath) => {
    try {
        if(!filePath) return null
        const response = await cloudinary.uploader.upload(filePath,{
            resource_type: "auto"
        })
        // console.log("File uploaded Successfully!!",response.url)
        fs.unlinkSync(filePath)
        return response; //optional
    } catch (error) {
        fs.unlinkSync(filePath)
        return null;
    }
}

const userAvatarOrCoverRemover = async (cloudinaryUrl) => {
    console.log(cloudinaryUrl)
    const urlSplit = cloudinaryUrl.split('/')
    const urlName = urlSplit[urlSplit.length-1].split('.')[0]
    await cloudinary.uploader.destroy(urlName,{
        resource_type: "image"
    }).then((error , result)=>{
        if (error) {
            console.log(error);
        }
        else {
            console.log(result);
        }
    })

    // console.log("User avatar or coverimage removing Results: \n",response)
    // console.log("File Deleted SuccessFully from cloud")
}


export { cloudinaryFileUpload , userAvatarOrCoverRemover};