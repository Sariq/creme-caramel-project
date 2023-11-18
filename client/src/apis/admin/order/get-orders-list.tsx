import axios from "axios";

export const getOrdersListApi = (page: number = 1) => {
    return axios
      .post(`${process.env.REACT_APP_API}order/admin/orders/${page}`)
      .then(function (response) {
        //   console.log("get orders list success", response);
          return response.data.orders;
      });
  };

  export default getOrdersListApi;