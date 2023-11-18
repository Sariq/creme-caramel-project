import axios from "axios";
import { BASE_URL } from "consts/api";

export const getOrdersListApi = (page: number = 1) => {
    return axios
      .post(`${BASE_URL}order/admin/orders/${page}`)
      .then(function (response) {
        //   console.log("get orders list success", response);
          return response.data.orders;
      });
  };

  export default getOrdersListApi;