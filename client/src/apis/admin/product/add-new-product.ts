import axios from "axios";
import { BASE_URL } from "consts/api";
import { TProduct } from "shared/types/product";


export const addNewProductApi = (product: TProduct) => {
    let formData = new FormData()
    product.name && formData.append('name', product.name)
    product.img && formData.append('img', product.img)
    product.categoryId && formData.append('categoryId', product.categoryId)
    product.description && formData.append('description', product.description)
    product.price && formData.append('price', product.price.toString())
    console.log("IMMMAGE", product.img)
    return axios
      .post(BASE_URL+"admin/product/insert",formData,{})
      .then(function (response) {
          console.log("added success", response);
          return response.data;
      });
  };

  export default addNewProductApi;

  // JSON.stringify({
  //   name: product.name,
  //   img: product.img,
  //   categoryId: product.categoryId,
  //   description: product.description,
  //   price: product.price
  // }