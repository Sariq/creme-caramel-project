import axios from "axios";
import { BASE_URL } from "consts/api";

export const getProductsByCategoryIdApi = (id: string, page: number) => {
    return axios
      .get(`${BASE_URL}admin/products/category/${id}/${page}`)
      .then(function (response) {
          console.log("get product by id success", response);
          return response.data;
      });
  };

  export default getProductsByCategoryIdApi;