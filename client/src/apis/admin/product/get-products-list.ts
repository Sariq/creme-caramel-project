import axios from "axios";

export const getProductsListApi = (page: number = 1) => {
    return axios
      .get(`${process.env.REACT_APP_API}admin/products/${page}`)
      .then(function (response) {
        //   console.log("get orders list success", response);
          return response.data;
      });
  };

  export default getProductsListApi;