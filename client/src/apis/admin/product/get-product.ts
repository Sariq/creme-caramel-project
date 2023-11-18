import axios from "axios";
import { BASE_URL } from "consts/api";

export const getProductApi = (id: string) => {
    return axios
      .get(`${BASE_URL}admin/product/${id}`)
      .then(function (response) {
          console.log("get product success", response);
          return response.data;
      });
  };

  export default getProductApi;