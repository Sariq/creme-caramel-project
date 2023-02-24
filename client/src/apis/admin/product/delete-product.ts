import axios from "axios";

export const deleteProductApi = (idsList: string[]) => {
   
    return axios
      .post(process.env.REACT_APP_API+"admin/product/delete", {
        productsIdsList: idsList,
      })
      .then(function (response) {
          console.log("delete product success", response);
          return response.data;
      });
  };

  export default deleteProductApi;