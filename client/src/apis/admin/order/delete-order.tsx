import axios from "axios";

export const deleteOrderApi = (id: string) => {
    return axios
      .get(`${process.env.REACT_APP_API}admin/order/delete/${id}`)
      .then(function (response) {
          console.log("Order successfully deleted", response);
          return response;
      });
  };

  export default deleteOrderApi;