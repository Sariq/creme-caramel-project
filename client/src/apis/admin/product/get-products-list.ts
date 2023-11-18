import axios from "axios";
import { BASE_URL } from "consts/api";

export const getProductsListApi = (page: number = 1) => {
    return axios
      .get(`${BASE_URL}admin/products/${page}`)
      .then(function (response) {
        //   console.log("get orders list success", response);
          return response.data;
      });
  };

  export default getProductsListApi;