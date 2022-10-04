import axios from "axios";
// components
import CardSettings from "components/Cards/CardSettings.js";
import { useEffect } from "react";

export default function ProductItem() {
  const onAddProduct = () => {
    axios
      .post(process.env.REACT_APP_API+"admin/product/insert", {
        firstName: "Fred",
        lastName: "Flintstone",
      })
      .then(function (response) {
        console.log(response);
      });
    // axios
    //   .post("http://localhost:1111/admin/login_action", {
    //     email: 'sari.proj@gmail.com',
    //     password: 'London2020!'
    //   })
    //   .then(function (response) {
    //     console.log(response);
    //   });
  };
  useEffect(()=>{axios
    .get(process.env.REACT_APP_API+"admin/products/1")
    .then(function (response) {
      console.log(response);
    });
    
  }, []);
  return (
    <>
      <div onClick={onAddProduct} className="flex flex-wrap justify-center">
      add product 
      </div>
    </>
  );
}
