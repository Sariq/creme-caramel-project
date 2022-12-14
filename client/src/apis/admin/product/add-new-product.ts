import axios from "axios";
import { TProduct } from "shared/types/product";


export const addNewProductApi = (product: TProduct) => {
    let formData = new FormData()
    product.name && formData.append('name', product.name)
    product.img && formData.append('img', product.img)
    product.categoryId && formData.append('categoryId', product.categoryId)
    product.description && formData.append('description', product.description)
    product.price && formData.append('price', product.price.toString())
    return axios
      .post(process.env.REACT_APP_API+"admin/product/insert", {
        name: product.name,
        img: product.img,
        categoryId: product.categoryId,
        description: product.description,
        price: product.price
      })
      .then(function (response) {
          console.log("added success", response);
          return response.data;
      });
  };

  export default addNewProductApi;