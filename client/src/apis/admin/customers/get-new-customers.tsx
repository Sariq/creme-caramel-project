import axios from "axios";
import { BASE_URL } from "consts/api";

export const getNewCustomersApi = (page: number = 1) => {
    return axios
      .post(`${BASE_URL}customer/new-customers/${page}`)
      .then(function (response) {
        //   console.log("get orders list success", response);
          return response.data;
      });
  };

  export default getNewCustomersApi;