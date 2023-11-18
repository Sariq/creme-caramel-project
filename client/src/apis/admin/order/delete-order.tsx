import axios from "axios";
import { BASE_URL } from "consts/api";

export const deleteOrderApi = (id: string) => {
    return axios
      .get(`${BASE_URL}admin/order/delete/${id}`)
      .then(function (response) {
          console.log("Order successfully deleted", response);
          return response;
      });
  };

  export default deleteOrderApi;