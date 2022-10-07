import axios from "axios";
import { TProduct } from "shared/types/product";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import storage from "config/firebase-config";

export const uploadImage = (img: File) => {
    return new Promise((resolve, rejeqt)=>{
        const storageRef = ref(storage, `/products/${img?.name}`);
 
        // progress can be paused and resumed. It also exposes progress updates.
        // Receives the storage reference and the file to upload.
        const uploadTask = uploadBytesResumable(storageRef, img);
    
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const percent = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
    
                // update progress
                // setPercent(percent);
            },
            (err) => console.log(err),
            () => {
                // download url
                getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                    console.log(url)
                    resolve(url);
                });
            }
        );
    })

  };

  export default uploadImage;