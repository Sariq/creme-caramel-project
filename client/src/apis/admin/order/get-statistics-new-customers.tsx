import axios from "axios";
import { BASE_URL } from "consts/api";

export const getStatisticsNewOrdersApi = (page: number = 1) => {
    return axios
      .post(`${BASE_URL}order/statistics/new-orders/${page}`)
      .then(function (response) {
        //   console.log("get orders list success", response);
          return response.data;
      });
  };

  export default getStatisticsNewOrdersApi;