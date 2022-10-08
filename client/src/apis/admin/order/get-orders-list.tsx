import axios from "axios";

export const getOrdersListApi = (page: number = 1) => {
    return axios
      .get(`${process.env.REACT_APP_API}admin/orders/${page}`)
      .then(function (response) {
          console.log("get orders list success", response);
          return response.data.orders;
      });
  };

  export default getOrdersListApi;