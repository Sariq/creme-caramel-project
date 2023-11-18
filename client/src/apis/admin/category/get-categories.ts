import axios from "axios";
import { BASE_URL } from "consts/api";

export const getCategoriesListApi = (page: number = 1) => {
    return axios
      .get(`${BASE_URL}admin/categories/${page}`)
      .then(function (response) {
        //   console.log("get orders list success", response);
          return response.data;
      });
  };

  export default getCategoriesListApi;