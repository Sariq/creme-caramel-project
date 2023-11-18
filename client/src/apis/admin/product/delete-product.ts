import axios from "axios";
import { BASE_URL } from "consts/api";

export const deleteProductApi = (idsList: string[]) => {
   
    return axios
      .post(BASE_URL+"admin/product/delete", {
        productsIdsList: idsList,
      })
      .then(function (response) {
          console.log("delete product success", response);
          return response.data;
      });
  };

  export default deleteProductApi;